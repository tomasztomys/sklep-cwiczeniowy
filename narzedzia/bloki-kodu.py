"""Wyciąga bloki kodu z ksiazka/*.md razem z plikiem, który wskazuje tekst przed blokiem.
Użycie: python3 narzedzia/bloki-kodu.py [--json plik]"""
import json, pathlib, re, sys

K = pathlib.Path(__file__).resolve().parent.parent / 'ksiazka'
PLIK = re.compile(r'`((?:[\w.-]+/)*[\w.-]+\.(?:ts|mjs|js|json|yml|yaml|md|har|env|example|gitignore)|\.env(?:\.example)?|\.gitignore|compose\.yaml|package\.json)`')

def bloki():
    for p in sorted(K.glob('*.md')):
        if p.name == 'README.md': continue
        linie = p.read_text('utf-8').splitlines()
        i = 0; sekcja = ''
        while i < len(linie):
            l = linie[i]
            if l.startswith('## ') or l.startswith('### '): sekcja = l.lstrip('# ').strip()
            m = re.match(r'^```(\S*)\s*$', l)
            if m:
                jezyk = m[1]; start = i + 1; j = start
                while j < len(linie) and not linie[j].startswith('```'): j += 1
                kod = '\n'.join(linie[start:j])
                kontekst = ' '.join(x for x in linie[max(0, start - 6):start - 1] if x.strip())[-400:]
                pliki = PLIK.findall(kontekst)
                yield {'rozdzial': p.stem, 'linia': start, 'sekcja': sekcja, 'jezyk': jezyk, 'plik': pliki[-1] if pliki else '', 'kontekst': kontekst[-160:], 'kod': kod}
                i = j
            i += 1

lista = list(bloki())
if __name__ != '__main__':
    pass
elif '--json' in sys.argv:
    pathlib.Path(sys.argv[sys.argv.index('--json') + 1]).write_text(json.dumps(lista, ensure_ascii=False, indent=1))
else:
    for b in lista:
        pierwsza = b['kod'].splitlines()[0][:60] if b['kod'] else ''
        print(f"{b['rozdzial'][-2:] if b['rozdzial'].startswith('rozdzial') else b['rozdzial'][:9]}:{b['linia']:<4} {b['jezyk']:<9} {b['plik'][:38]:<38} {len(b['kod'].splitlines()):>3}l | {pierwsza}")
