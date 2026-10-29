import sys, os, base64
from anki.collection import Collection, ExportAnkiPackageOptions
from anki.decks import DeckId
out=sys.argv[1]; os.makedirs(out, exist_ok=True)
col=Collection(os.path.join(out,"c.anki2"))
d1=col.decks.id("Teste::Clínica::Cardio"); d2=col.decks.id("Teste::Pediatria")
basic=col.models.by_name("Basic"); cloze=col.models.by_name("Cloze")
png=base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
p=os.path.join(out,"pixel.png"); open(p,"wb").write(png); fname=col.media.add_file(p)
n=col.new_note(basic); n["Front"]="Qual a primeira linha na IC?"; n["Back"]=f'IECA <img src="{fname}">'; n.tags=["cardio"]; col.add_note(n,d1)
n=col.new_note(basic); n["Front"]="Febre reumática: critério maior?"; n["Back"]="Cardite"; col.add_note(n,d2)
n=col.new_note(cloze); n["Text"]="A {{c1::apendicite}} é causa de {{c2::abdome agudo::tipo}}."; col.add_note(n,d2)
did=col.decks.id("Teste")
for legacy in (False, True):
  col.export_anki_package(out_path=os.path.join(out, "teste-legacy.apkg" if legacy else "teste-novo.apkg"),
    options=ExportAnkiPackageOptions(with_scheduling=False, with_deck_configs=True, with_media=True, legacy=legacy),
    limit=DeckId(did))
col.close()

# Segundo baralho: um cartão com figura embutida, um com figura de link externo
# e um com figura que falta no arquivo, para testar o descarte de imagens.
col = Collection(os.path.join(out, "imagens.anki2"))
d = col.decks.id("Imagens")
basic = col.models.by_name("Basic")
png = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
p = os.path.join(out, "figura.png"); open(p, "wb").write(png); fname = col.media.add_file(p)
for front, back in [
    ("Cartão sem imagem", "ok"),
    ("Cartão com figura embutida", f'<img src="{fname}">'),
    ("Cartão com link externo", '<img src="https://exemplo.invalid/figura.png">'),
    ("Cartão com figura que falta", '<img src="nao-existe.png">'),
]:
    n = col.new_note(basic); n["Front"] = front; n["Back"] = back; col.add_note(n, d)
col.export_anki_package(out_path=os.path.join(out, "teste-imagens.apkg"),
    options=ExportAnkiPackageOptions(with_scheduling=False, with_deck_configs=True, with_media=True, legacy=False),
    limit=DeckId(d))
col.close()
