"""Extrai rascunhos; nunca aprova conteúdo ou infere gabaritos."""
import pathlib,json,re
for file in pathlib.Path('imports').glob('*.pages.json'):
 pages=json.loads(file.read_text());exam=next(e for e in [json.loads(p.read_text()) for p in pathlib.Path('src/data').glob('*/*.json')] if e['id']==file.name.replace('.pages.json',''))
 text='';ranges=[]
 for p in pages:
  if re.search(r'(^RESPOSTAS\b|Medway[^\n]*GABARITO)',p['text'],re.M):continue
  start=len(text);clean=re.sub(r'^Medway[^\n]*$', '',p['text'],flags=re.M);clean=re.sub(r'^.*Objetiva.*\| R1\s*$', '',clean,flags=re.M)
  text+=clean+'\n';ranges.append((start,len(text),p['number']))
 matches=list(re.finditer(r'^QUESTÃO\s+(\d+)\.',text,re.M));drafts=[]
 for i,m in enumerate(matches):
  end=matches[i+1].start() if i+1<len(matches) else len(text);body=text[m.end():end].strip();opts=list(re.finditer(r'^([A-E])\.\s+',body,re.M))
  if len(opts)<2:continue
  alternatives=[dict(letter=o.group(1),text=body[o.end():opts[j+1].start() if j+1<len(opts) else len(body)].strip()) for j,o in enumerate(opts)]
  drafts.append(dict(id=f"{exam['id']}-q{int(m.group(1)):03}",institution=exam['institution'],year=exam['year'],number=int(m.group(1)),statement=body[:opts[0].start()].strip(),alternatives=alternatives,key=dict(status='pending'),images=[],source=dict(pdf=exam['pdf'],pages=[n for a,b,n in ranges if a<end and b>m.start()]),review='required',notes='Extração automática NÃO CONFERIDA. Verificar conteúdo integral, imagens, tabelas, alternativas e fonte oficial.'))
 pathlib.Path(f"imports/{exam['id']}.draft.json").write_text(json.dumps(drafts,ensure_ascii=False,indent=2));print(exam['id'],len(drafts),'rascunhos, não publicados')
