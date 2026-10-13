"""Importa documentos e gabaritos aceitos pelo usuário, preservando recortes originais.

Pré-requisitos: imports/<id>.draft.json e .rendered.json, gerados a partir
DOS MESMOS PDFs registrados no manifesto sources.json.
"""
import hashlib
import json
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
sources_path = root / 'imports/sources.json'
sources = json.loads(sources_path.read_text())
updates = []
for exam_path in sorted((root / 'src/data').glob('*/*.json')):
    exam = json.loads(exam_path.read_text())
    exam_id = exam['id']
    draft = json.loads((root / f'imports/{exam_id}.draft.json').read_text())
    rendered = json.loads((root / f'imports/{exam_id}.rendered.json').read_text())
    source = next(s for s in sources if s['file'] == f"public/{exam['pdf']}")
    digest = hashlib.sha256((root / source['file']).read_bytes()).hexdigest()
    if digest != source['sha256']:
        raise ValueError(f'PDF alterado desde a extração: {exam_id}')
    numbers = [q['number'] for q in draft]
    keys = {k['number']: k for k in rendered['keys']}
    visuals = {q['number']: q['assets'] for q in rendered['questions']}
    if len(set(numbers)) != len(numbers) or len(keys) != len(rendered['keys']):
        raise ValueError(f'Números ou gabaritos duplicados: {exam_id}')
    if set(numbers) != set(keys) or set(numbers) != set(visuals):
        raise ValueError(f'Questões, recortes e gabarito não correspondem: {exam_id}')
    answer_text = '\n'.join(p['text'] for p in json.loads((root / f'imports/{exam_id}.pages.json').read_text()) if p['text'].startswith('RESPOSTAS'))
    for number, value in re.findall(r'(\d+)\.\s*(ANULADA|[A-E])\b', answer_text):
        if keys[int(number)]['answer'] != value:
            raise ValueError(f'Gabarito visual e texto divergentes: {exam_id}, questão {number}')
    for q in draft:
        key = keys[q['number']]
        assets = visuals[q['number']]
        if not assets:
            raise ValueError(f'Questão sem original preservado: {q["id"]}')
        for asset in assets:
            image = root / 'public' / asset['src']
            if not image.exists() or image.read_bytes()[:8] != b'\x89PNG\r\n\x1a\n':
                raise ValueError(f'Recorte ausente ou inválido: {image}')
            # Nome por conteúdo mantém os recortes de tentativas antigas imutáveis.
            data = image.read_bytes()
            asset_hash = hashlib.sha256(data).hexdigest()[:12]
            base_name = re.sub(r'^[a-f0-9]{12}-', '', image.name)
            versioned = image.with_name(f'{asset_hash}-{base_name}')
            if versioned != image:
                if versioned.exists():
                    if versioned.read_bytes() != data:
                        raise ValueError(f'Colisão de nome de recorte: {versioned}')
                    image.unlink()
                else:
                    image.rename(versioned)
            asset['src'] = str(versioned.relative_to(root / 'public'))
        reference = f"Gabarito da seção RESPOSTAS do PDF {exam['pdf']}, página {key['page']}. Fonte de verdade aceita pelo usuário para uso pessoal."
        if key['answer'] == 'ANULADA':
            q['key'] = dict(status='annulled', source=reference, basis='user-validated-pdf')
        else:
            if key['answer'] not in [a['letter'] for a in q['alternatives']]:
                raise ValueError(f'Gabarito não existe nas alternativas: {q["id"]}')
            q['key'] = dict(status='verified', answer=key['answer'], source=reference, basis='user-validated-pdf')
        q['review'] = 'approved'
        q['originalPages'] = assets
        q['source']['pages'] = [a['page'] for a in assets]
        q['notes'] = 'PDF e gabarito aceitos pelo usuário. Os recortes originais preservam o conteúdo visual; o texto extraído é uma transcrição auxiliar.'
    exam['questions'] = draft
    exam.pop('draftCount', None)
    exam['keySource'] = dict(type='validated-pdf', pdf=exam['pdf'], page=rendered['keys'][0]['page'])
    source['source'] = 'PDF fornecido e validado pelo usuário para uso pessoal.'
    source['keyStatus'] = 'accepted-user-source-of-truth'
    source['validation'] = dict(basis='user-authorization', date='2026-10-13', questions=len(draft), keyEntries=len(keys), annulled=sorted(k['number'] for k in keys.values() if k['answer']=='ANULADA'))
    (root / f'imports/{exam_id}.rendered.json').write_text(json.dumps(rendered, ensure_ascii=False, indent=2)+'\n')
    updates.append((exam_path, exam))
    print(f"{exam_id}: {len(draft)} questões, {sum(k['answer']=='ANULADA' for k in keys.values())} anuladas")
# Só escreve o catálogo após validar todas as provas, evitando uma importação parcial.
for path, exam in updates:
    path.write_text(json.dumps(exam, ensure_ascii=False, indent=2)+'\n')
sources_path.write_text(json.dumps(sources, ensure_ascii=False, indent=2)+'\n')
