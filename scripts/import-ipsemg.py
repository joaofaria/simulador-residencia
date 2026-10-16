"""Importa as provas de Entrada Direta do IPSEMG (Instituto ACCESS) no Linux.

Uso: python3 scripts/import-ipsemg.py 2024 2025 2026

Requer poppler (pdftotext). Lê os PDFs da prova (ipsemg-<ano>.pdf) e do
gabarito definitivo (ipsemg-<ano>-gabarito.pdf) da pasta imports/pdfs, ou da
indicada em PROVAS_PDF_DIR; eles não são publicados no site nem versionados.
Separa as questões por coluna (o caderno do ACCESS tem duas colunas) e grava
src/data/ipsemg/<ano>.json só com texto. O texto sai com as quebras de linha
do caderno: reorganize em parágrafos e refaça figuras e tabelas em
src/data/figuras.json depois, como nas provas já publicadas.

O gabarito vem do documento definitivo da banca. A área segue o bloco da
prova: as cinco disciplinas aparecem sempre na mesma ordem, 20 questões cada.
"""
import hashlib
import html
import json
import os
import pathlib
import re
import subprocess
import sys


root = pathlib.Path(__file__).resolve().parent.parent
AREAS = ['cirurgia', 'clinica', 'go', 'preventiva', 'pediatria']
HEADERS = re.compile(r'^(CIRURGIA GERAL|CLÍNICA MÉDICA|GINECOLOGIA E OBSTETRÍCIA|MEDICINA PREVENTIVA E SOCIAL( \(SAÚDE)?|PEDIATRIA|Conhecimentos [Ee]specíficos)$')
MARKER = re.compile(r'^Questão\s+0*(\d{1,3})$')
SHARED = re.compile(r'^(?:Considere|Leia|As questões).*?quest(?:ões|ão)\s+(\d+)\s+(?:e|a)\s+(\d+)')

# Cabeçalho e rodapé de cada caderno, em pontos a partir do topo da página.
EXAMS = {
    2024: dict(top=35, bottom=778,
               origin='Caderno de Entrada Direta do Processo Seletivo de Residência Médica 2024 (Edital 1/2023), prova de 8/12/2023, Instituto ACCESS. Cópia publicada pelo Estratégia MED.',
               key_origin='Gabarito definitivo da Entrada Direta, prova de 8/12/2023, Instituto ACCESS. Cópia publicada pelo QConcursos.'),
    2025: dict(top=28, bottom=800,
               origin='Caderno de Entrada Direta do Processo Seletivo de Residência Médica (Edital 1/2024), prova de dezembro de 2024, Instituto ACCESS. Cópia publicada pelo QConcursos.',
               key_origin='Gabarito definitivo das provas objetivas do Processo Seletivo 1/2024, Entrada Direta (todos os programas), Instituto ACCESS. Cópia publicada pelo QConcursos.'),
    2026: dict(top=40, bottom=798,
               origin='Caderno de Entrada Direta, tipo 1, do Processo Seletivo de Residência Médica (Edital 1/2025), prova de 7/12/2025, Instituto ACCESS. Cópia publicada pelo Estratégia MED.',
               key_origin='Gabarito definitivo da prova de 7/12/2025, Prova 1 (caderno tipo 1), igual em todos os programas de Entrada Direta, Instituto ACCESS. Cópia publicada pelo Estratégia MED.'),
}


def run(*args):
    return subprocess.run(args, capture_output=True, text=True, check=True).stdout


def read_lines(pdf):
    """Linhas de texto com caixa delimitadora, por página."""
    out = run('pdftotext', '-bbox-layout', str(pdf), '-')
    pages = []
    for p in re.finditer(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>', out, re.S):
        lines = []
        for m in re.finditer(r'<line xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</line>', p.group(3), re.S):
            words = [html.unescape(w) for w in re.findall(r'<word[^>]*>(.*?)</word>', m.group(5))]
            x0, y0, x1, y1 = map(float, m.group(1, 2, 3, 4))
            lines.append(dict(x0=x0, y0=y0, x1=x1, y1=y1, text=' '.join(words)))
        pages.append(dict(width=float(p.group(1)), height=float(p.group(2)), lines=lines))
    return pages


def parse_key(year, pdf):
    text = run('pdftotext', '-layout', str(pdf), '-')
    if year == 2024:
        # Primeira tabela (Entrada Direta), em cinco colunas "N – X".
        section = text.split('ENTRADA COM PRÉ-REQUISITO')[0]
        pairs = re.findall(r'(\d{1,3})\s*–\s*(\*\*|[A-D])', section)
        page = 1
    elif year == 2025:
        section = text.split('* GABARITO ALTERADO')[0]
        pairs = re.findall(r'(\d{2,3}):\s*(\*\*|[A-D])', section)
        page = 1
    else:
        # Cada programa de Entrada Direta repete os quatro tipos de prova.
        blocks = re.split(r'\n\s*(A\d{3} - ENTRADA DIRETA - [^\n]+)\n', text)
        tipo1 = {}
        for name, body in zip(blocks[1::2], blocks[2::2]):
            prova1 = body.split('PROVA 1')[1].split('PROVA 2')[0]
            tipo1[name.strip()] = re.findall(r'(\d{2,3}):\s*(X|[A-D])', prova1)
        values = list(tipo1.values())
        if not values or any(v != values[0] for v in values):
            raise ValueError('Gabarito da Prova 1 difere entre programas de Entrada Direta')
        pairs = values[0]
        page = 1
    keys = {}
    for number, answer in pairs:
        number = int(number)
        if number in keys:
            raise ValueError(f'Gabarito {year}: questão {number} repetida')
        keys[number] = 'ANULADA' if answer in ('**', 'X') else answer
    if sorted(keys) != list(range(1, 101)):
        raise ValueError(f'Gabarito {year}: esperava 100 respostas, li {len(keys)}')
    return keys, page


def close(part, page, column, y0, config):
    """Fecha a parte aberta onde começa o próximo bloco ou título."""
    same = (part['page'], part['column']) == (page, column)
    part['bottom'] = y0 - 4 if same else config['bottom']


def segments(pages, config):
    """Percorre as colunas em ordem de leitura e divide o caderno por questão."""
    events = []  # (página, coluna, y0, y1, tipo, conteúdo)
    # Capa e instruções ficam antes da primeira questão.
    first = next(i for i, p in enumerate(pages) if any(MARKER.match(l['text']) for l in p['lines']))
    last = max(i for i, p in enumerate(pages) if any(MARKER.match(l['text']) for l in p['lines']))
    for index, page in enumerate(pages):
        if index < first or (index > last and len(page['lines']) <= 3):
            continue  # Contracapa.
        mid = page['width'] / 2
        for line in page['lines']:
            if line['y0'] < config['top'] or line['y1'] > config['bottom']:
                continue
            if line['x0'] < mid - 8 and line['x1'] > mid + 8:
                raise ValueError(f'Linha atravessa as colunas na página {index + 1}: {line["text"]}')
            column = 0 if line['x1'] <= mid + 8 else 1
            marker = MARKER.match(line['text'])
            kind = 'marker' if marker else 'header' if HEADERS.match(line['text']) else 'text'
            events.append((index, column, line['y0'], line['y1'], kind, int(marker.group(1)) if marker else line['text']))
    events.sort(key=lambda e: (e[0], e[1], e[2]))
    # Blocos: cada questão e cada texto comum a várias questões ("Considere o
    # trecho a seguir para as questões 18 e 19"), que vai para todas elas.
    blocks = []
    for event in events:
        page, column, y0, y1, kind, value = event
        shared = SHARED.match(value) if kind == 'text' else None
        if kind == 'marker' or shared:
            if blocks and blocks[-1]['parts'][-1]['bottom'] is None:
                close(blocks[-1]['parts'][-1], page, column, y0, config)
            block = dict(number=value, parts=[], lines=[]) if kind == 'marker' else dict(targets=range(int(shared.group(1)), int(shared.group(2)) + 1), parts=[], lines=[value])
            block['parts'].append(dict(page=page, column=column, top=y0 - 4, bottom=None))
            blocks.append(block)
            continue
        if not blocks:
            continue
        current = blocks[-1]
        last = current['parts'][-1]
        if last['bottom'] is not None:
            continue  # Depois de um título de seção, até a próxima questão.
        if kind == 'header':
            close(last, page, column, y0, config)
            continue
        if (last['page'], last['column']) != (page, column):
            last['bottom'] = config['bottom']
            last = dict(page=page, column=column, top=config['top'], bottom=None)
            current['parts'].append(last)
        current['lines'].append(value)
    if blocks[-1]['parts'][-1]['bottom'] is None:
        blocks[-1]['parts'][-1]['bottom'] = config['bottom']
    questions = [b for b in blocks if 'number' in b]
    for b in blocks:
        if 'targets' in b:
            for q in questions:
                if q['number'] in b['targets']:
                    q['shared'] = b
    numbers = [q['number'] for q in questions]
    if numbers != list(range(1, 101)):
        raise ValueError(f'Sequência de questões inesperada: {numbers}')
    return questions


def parse_text(lines):
    body = '\n'.join(lines)
    opts = list(re.finditer(r'^\(([A-D])\)\s*', body, re.M))
    letters = [o.group(1) for o in opts]
    if letters != ['A', 'B', 'C', 'D']:
        return None
    statement = body[:opts[0].start()].strip()
    alternatives = [dict(letter=o.group(1), text=body[o.end():opts[k + 1].start() if k + 1 < len(opts) else len(body)].strip()) for k, o in enumerate(opts)]
    return statement, alternatives


def import_year(year):
    config = EXAMS[year]
    exam_id = f'ipsemg-{year}'
    pdf_dir = pathlib.Path(os.environ.get('PROVAS_PDF_DIR', root / 'imports/pdfs'))
    pdf = pdf_dir / f'{exam_id}.pdf'
    key_pdf = pdf_dir / f'{exam_id}-gabarito.pdf'
    pages = read_lines(pdf)
    keys, key_page = parse_key(year, key_pdf)
    questions = segments(pages, config)
    draft = []
    key_reference = f"{config['key_origin']}"
    for q in questions:
        shared = q.get('shared')
        parsed = parse_text((shared['lines'] if shared else []) + q['lines'])
        if not parsed:
            raise ValueError(f'{exam_id} questão {q["number"]}: alternativas A a D não encontradas')
        statement, alternatives = parsed
        answer = keys[q['number']]
        if answer == 'ANULADA':
            key = dict(status='annulled', source=key_reference, basis='official')
        else:
            key = dict(status='verified', answer=answer, source=key_reference, basis='official')
        draft.append(dict(
            id=f'{exam_id}-q{q["number"]:03d}', institution='IPSEMG', year=year, number=q['number'],
            area=AREAS[(q['number'] - 1) // 20], statement=statement, alternatives=alternatives, key=key,
            images=[], source=dict(credit=config['origin'].split(' Cópia')[0].rstrip('.'), pages=[]),
            review='approved',
            notes='Texto transcrito do caderno da banca. Figuras e tabelas, quando a questão depende delas, são refeitas à mão em src/data/figuras.json.'))
    exam = dict(id=exam_id, institution='IPSEMG', year=year, title=f'IPSEMG • {year}', demo=False,
                keySource=dict(type='official-pdf'),
                questions=draft)
    data_dir = root / 'src/data/ipsemg'
    data_dir.mkdir(exist_ok=True)
    (data_dir / f'{year}.json').write_text(json.dumps(exam, ensure_ascii=False, indent=2) + '\n')
    annulled = sorted(n for n, a in keys.items() if a == 'ANULADA')
    sources_path = root / 'imports/sources.json'
    sources = [s for s in json.loads(sources_path.read_text()) if s.get('exam') != exam_id and s.get('file') != f'{exam_id}.pdf']
    sources.append(dict(
        file=f'{exam_id}.pdf', note='Arquivo conferido e não publicado no site.', sha256=hashlib.sha256(pdf.read_bytes()).hexdigest(),
        source=config['origin'], keyFile=f'{exam_id}-gabarito.pdf',
        keySha256=hashlib.sha256(key_pdf.read_bytes()).hexdigest(), keyStatus='official-definitive',
        validation=dict(basis='official-definitive-key', date='2026-10-15', questions=len(draft), keyEntries=len(keys), annulled=annulled)))
    sources_path.write_text(json.dumps(sources, ensure_ascii=False, indent=2) + '\n')
    print(f'{exam_id}: {len(draft)} questões, {len(annulled)} anuladas {annulled}')


if __name__ == '__main__':
    for arg in sys.argv[1:] or EXAMS:
        import_year(int(arg))
