"""Po zmianie tekstu książki przenumerowuje bloki w manifeście zloz-akceptacje.py, dopasowując je po treści.
Użycie: python3 narzedzia/bloki-kodu.py --json /tmp/przed.json   (przed zmianą tekstu)
        python3 narzedzia/przenumeruj-manifest.py /tmp/przed.json (po zmianie)"""
import importlib.util, json, pathlib, re, sys
KORZEN = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('b', KORZEN / 'narzedzia' / 'bloki-kodu.py'); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
przed = {f"{b['rozdzial']}:{b['linia']}": b for b in json.load(open(sys.argv[1]))}
po = {f"{b['rozdzial']}:{b['linia']}": b for b in m.lista}
p = KORZEN / 'narzedzia' / 'zloz-akceptacje.py'; s = p.read_text()
def zapis(k):
    rozdz, linia = k.split(':')
    return f"r({int(rozdz[-2:])}, {linia})" if rozdz.startswith('rozdzial') else f"d('{rozdz[-1]}', {linia})"
mapa = {}
for k, b in przed.items():
    if k in po and po[k]['kod'] == b['kod']: continue
    rozdz = k.split(':')[0]
    kandydaci = [kk for kk, bb in po.items() if kk.startswith(rozdz + ':') and bb['kod'] == b['kod']]
    if len(kandydaci) == 1: mapa[zapis(k)] = zapis(kandydaci[0])
    elif zapis(k) in s: print('UWAGA: blok zmieniony albo niejednoznaczny', k, kandydaci)
# Zamiana jednoczesna, żeby przesunięcia nie nakładały się na siebie.
wzorzec = re.compile('|'.join(re.escape(x) for x in sorted(mapa, key=len, reverse=True)) + r'(?=[,)])') if mapa else None
if wzorzec: s = wzorzec.sub(lambda mm: mapa[mm.group(0)], s)
p.write_text(s)
for a, b in sorted(mapa.items()): print(a, '→', b)
