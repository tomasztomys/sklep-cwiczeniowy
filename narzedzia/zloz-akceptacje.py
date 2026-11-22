"""Składa akceptacja/ – projekt czytelnika z kodu w książce (etap 6 planu).

Każdy blok kodu z ksiazka/ (ts, js, json, yaml, markdown, text) musi być w MANIFEŚCIE:
użyty w pliku albo pominięty z powodem. Nowy, niesklasyfikowany blok przerywa składanie.
Uzupełnienia, których nie ma w książce, są oznaczone komentarzem „UZUPEŁNIENIE”.

Użycie: python3 narzedzia/zloz-akceptacje.py [--do-rozdzialu N]
"""
import importlib.util, json, pathlib, re, shutil, sys

KORZEN = pathlib.Path(__file__).resolve().parent.parent
CEL = KORZEN / 'akceptacja'
spec = importlib.util.spec_from_file_location('bloki', KORZEN / 'narzedzia' / 'bloki-kodu.py')
modul = importlib.util.module_from_spec(spec); spec.loader.exec_module(modul)
BLOKI = {f"{b['rozdzial']}:{b['linia']}": b for b in modul.lista}
SPRAWDZANE = {'ts', 'js', 'json', 'yaml', 'yml', 'markdown', 'text', 'sh'}

def r(n, linia): return f'rozdzial-{n:02d}:{linia}'
def d(lit, linia): return f'dodatek-{lit}:{linia}'

FIX = "import { test, expect } from './fixtures.ts';\n"
PW = "import { test, expect } from '@playwright/test';\n"
U = '// UZUPEŁNIENIE (etap 6): '

# (operacja, blok | None, argumenty...)
MANIFEST = [
    # --- rozdział 3–5: projekt, ćwiczenia z TypeScriptu i HTTP ---
    ('plik', r(3, 155), 'compose.yaml'),
    ('zamien', None, 'compose.yaml', 'image: ghcr.io/AUTOR/sklep-cwiczeniowy:1.0', 'image: ${OBRAZ_SKLEPU:-ghcr.io/tomasztomys/sklep-cwiczeniowy:1.0}'),
    ('plik', r(4, 41), 'tsconfig.json'),
    ('plik', r(4, 62), 'cwiczenia/rozdzial-04/pierwszy.ts'),
    ('plik', r(4, 82), 'cwiczenia/rozdzial-04/zmienne.ts'),
    ('plik', r(4, 101), 'cwiczenia/rozdzial-04/obiekty.ts'),
    ('plik', r(4, 124), 'cwiczenia/rozdzial-04/rabat.ts'),
    ('plik', r(4, 145), 'cwiczenia/rozdzial-04/typy.ts'),
    ('plik', r(4, 180), 'cwiczenia/rozdzial-04/opcjonalne.ts'),
    ('plik', r(4, 203), 'cwiczenia/rozdzial-04/suma-koszyka.ts'),
    ('plik', r(4, 233), 'cwiczenia/rozdzial-04/klient-api.ts'),
    ('plik', r(4, 253), 'cwiczenia/rozdzial-04/adres.ts'),
    ('wstaw_przed_ostatnia', r(4, 268), 'cwiczenia/rozdzial-04/klient-api.ts'),
    ('plik', r(4, 282), 'cwiczenia/rozdzial-04/stan-sklepu.ts'),
    ('zamien_blokiem', r(4, 304), 'cwiczenia/rozdzial-04/stan-sklepu.ts', "console.log(`Sklep: ${await api.stan()}`); // Sklep: ok"),
    ('pomin', r(4, 293), 'celowo błędny przykład: brak await'),
    ('pomin', r(4, 319), 'ćwiczenie z celowymi błędami (bledny-test.ts)'),
    ('plik', r(4, 358), 'eslint.config.mjs'),
    ('plik', r(4, 384), '.prettierrc.json'),
    ('plik', r(4, 390), '.vscode/settings.json'),
    ('pomin', r(4, 401), 'skrypty package.json; wersja końcowa w dodatku A.3'),
    ('plik', r(5, 169), 'cwiczenia/rozdzial-05/sesja.ts'),
    # --- rozdział 6 ---
    ('pomin', r(6, 47), 'konfiguracja wygenerowana; wersja końcowa w dodatku A.9'),
    ('plik', r(6, 89), 'tests/katalog.spec.ts'),
    ('plik', r(6, 115), 'tests/logowanie.spec.ts'),
    ('pomin', r(6, 190), 'szkic z Codegen bez asercji, celowo słaby'),
    ('plik', r(6, 217), 'tests/r06-dwa-kubki.spec.ts'),
    ('zamien', None, 'tests/r06-dwa-kubki.spec.ts',
     "  await expect(page.getByRole('button', { name: 'Wyloguj się' })).toBeVisible();\n",
     "  await expect(page.getByRole('button', { name: 'Wyloguj się' })).toBeVisible();\n  " + U + "obejście ze wspólnym kontem z rozdziału 7.3\n  await page.request.delete('/api/cart');\n"),
    ('zamien', None, 'tests/r06-dwa-kubki.spec.ts', PW, PW + "\n" + U + "testy na wspólnym koncie po kolei (rozdział 7.3)\ntest.describe.configure({ mode: 'serial' });\n"),
    # --- rozdział 7 ---
    ('pomin', r(5, 61), 'fragment poglądowy: trzy lokatory bez akcji (sprawdzone testami sklepu T-8)'),
    ('pomin', r(7, 35), 'fragment poglądowy: opcje lokatorów bez akcji'),
    ('pomin', r(7, 76), 'komunikat błędu, nie kod'),
    ('pomin', r(7, 69), 'celowe naruszenie trybu ścisłego (trzy przyciski)'),
    ('opakuj', r(7, 90), 'tests/fragmenty.spec.ts', "test('R7 §7.2 filtr hasText', async ({ klient, page }) => {\n  await page.goto('/');\n", "  await expect(page.getByRole('status')).toHaveText('Dodano do koszyka');\n});"),
    ('opakuj', r(7, 102), 'tests/fragmenty.spec.ts', "test('R7 §7.2 filtr has', async ({ page }) => {\n  await page.goto('/');\n", "  await expect(notes).toHaveCount(1);\n});"),
    ('opakuj', r(7, 110), 'tests/fragmenty.spec.ts', "test('R7 §7.2 zawężenie do banner', async ({ page }) => {\n  await page.goto('/');\n  await expect(", ").toBeVisible();\n});"),
    ('opakuj', r(7, 118), 'tests/fragmenty.spec.ts', "test('R7 §7.2 listy elementów', async ({ page }) => {\n  await page.goto('/');\n", "});"),
    ('pomin', r(7, 146), 'zestawienie złej i dobrej asercji; zła celowo zawodna'),
    ('pomin', r(7, 164), 'test z rozdziału 1 przed poprawą, celowo słaby'),
    ('plik', r(7, 175), 'tests/r07-kubek.spec.ts', PW + "\n" + U + "testy na wspólnym koncie po kolei (rozdział 7.3)\ntest.describe.configure({ mode: 'serial' });\n\n"),
    ('zamien', None, 'tests/r07-kubek.spec.ts',
     "  await expect(page.getByRole('button', { name: 'Wyloguj się' })).toBeVisible();\n",
     "  await expect(page.getByRole('button', { name: 'Wyloguj się' })).toBeVisible();\n  " + U + "obejście ze wspólnym kontem z rozdziału 7.3\n  await page.request.delete('/api/cart');\n"),
    ('test', r(7, 198), 'tests/r07-kubek.spec.ts'),
    ('opakuj', r(7, 239), 'tests/fragmenty.spec.ts', "test('R7 §7.5 asercje miękkie', async ({ page }) => {\n  await page.goto('/produkty/kubek');\n", "});"),
    ('opakuj', r(7, 251), 'tests/fragmenty.spec.ts', "test('R7 §7.5 własny komunikat', async ({ klient, page }) => {\n  await page.goto('/produkty/kubek');\n  await page.getByRole('button', { name: 'Dodaj do koszyka' }).click();\n", "});"),
    ('opakuj', r(7, 264), 'tests/fragmenty.spec.ts', "test('R7 §7.5 expect.poll', async ({ klient, page }) => {\n  await page.goto('/produkty/kubek');\n  await page.getByRole('button', { name: 'Dodaj do koszyka' }).click();\n", "});"),
    ('plik', r(7, 285), 'eslint.config.mjs'),
    # --- rozdział 8 ---
    ('plik', r(8, 20), 'tests/strony/strona-produktu.ts'),
    ('plik', r(8, 50), 'tests/strony/strona-koszyka.ts'),
    ('plik', r(8, 102), 'tests/fixtures.ts'),
    ('plik', r(8, 142), 'tests/koszyk.spec.ts'),
    ('zamien_blokiem', r(8, 159), 'eslint.config.mjs', "    rules: {\n      'playwright/no-wait-for-timeout': 'error',\n      'playwright/no-raw-locators': 'warn',\n    },", 6),
    ('plik', r(8, 185), 'tests/dane.ts'),
    ('plik', r(8, 218), 'tests/auth.setup.ts'),
    ('sprawdz_w', r(8, 237), 'playwright.config.ts'),
    ('plik', r(8, 248), 'tests/admin.spec.ts'),
    ('plik', r(8, 273), '.env'),
    ('sprawdz_w', r(8, 281), 'playwright.config.ts'),
    ('sprawdz_w', r(8, 296), 'playwright.config.ts'),
    ('sprawdz_w', r(8, 309), 'playwright.config.ts'),
    ('pomin', r(8, 324), 'ilustracja tagów z treścią „// ...”'),
    # --- rozdział 9 ---
    ('plik', r(9, 22), 'tests/api.spec.ts'),
    ('wstaw_po', r(9, 52), 'tests/fixtures.ts', '  },\n  klient: async', 2, 'przed'),
    ('zamien', None, 'tests/fixtures.ts', "import { test as base, expect } from '@playwright/test';", "import { test as base, expect, type APIRequestContext } from '@playwright/test';"),
    ('zamien', None, 'tests/fixtures.ts', "  klient: DaneKlienta;\n}", "  klient: DaneKlienta;\n  apiKlienta: APIRequestContext;\n}"),
    ('test', r(9, 70), 'tests/api.spec.ts'),
    ('test', r(9, 84), 'tests/api.spec.ts'),
    ('test', r(9, 116), 'tests/api.spec.ts'),
    ('plik', r(9, 142), 'tests/schematy.ts'),
    ('pomin', r(9, 170), 'fragment pokazujący użycie parse'),
    ('test', r(9, 183), 'tests/api.spec.ts'),
    ('zamien', None, 'tests/api.spec.ts', FIX, FIX + U + "importy dla testów z rozdziałów 9.3 i 13.1\nimport * as z from 'zod';\nimport { nowyKlient } from './dane.ts';\nimport { Koszyk } from './schematy.ts';\n"),
    ('plik', r(9, 205), 'tests/hybryda.spec.ts', FIX + "\n"),
    ('test', r(9, 231), 'tests/przechwytywanie.spec.ts', FIX + U + "import schematu z rozdziału 9.3\nimport { ListaProduktow } from './schematy.ts';\n\n"),
    ('test', r(9, 243), 'tests/przechwytywanie.spec.ts'),
    ('test', r(9, 259), 'tests/przechwytywanie.spec.ts'),
    # --- rozdział 10 ---
    ('plik', r(10, 46), 'tests/r10-niestabilne.spec.ts', FIX + "\n" + U + "rozdział 10.2 celowo przepuszcza pierwszy test przez bramkę\n/* eslint-disable playwright/no-wait-for-timeout, playwright/prefer-web-first-assertions */\n\n"),
    ('sprawdz_w', r(10, 79), 'playwright.config.ts'),
    ('opakuj', r(10, 115), 'tests/fragmenty.spec.ts', "test('R10 §10.3 czekanie na odpowiedź serwera', async ({ klient, page }) => {\n  await page.goto('/produkty/kubek');\n", "});"),
    ('sprawdz_w', r(10, 129), 'playwright.config.ts'),
    ('pomin', r(10, 163), 'szkielet testu w kwarantannie z treścią „// ...”'),
    # --- rozdział 11 ---
    ('plik', r(11, 20), 'tests/wizualne.spec.ts', FIX + "\n"),
    ('plik', r(11, 81), 'tests/dostepnosc.spec.ts'),
    ('test', r(11, 112), 'tests/dostepnosc.spec.ts'),
    ('test', r(11, 134), 'tests/dostepnosc.spec.ts'),
    ('plik', r(11, 173), 'tests/wydajnosc.spec.ts', FIX + "\n"),
    ('plik', r(11, 196), 'wydajnosc/katalog.ts'),
    ('plik', r(11, 237), 'tests/bezpieczenstwo.spec.ts', FIX + U + "import fabryki danych z rozdziału 8.3\nimport { nowyKlient } from './dane.ts';\n\n"),
    ('test', r(11, 256), 'tests/bezpieczenstwo.spec.ts'),
    ('test', r(11, 273), 'tests/bezpieczenstwo.spec.ts'),
    # --- rozdział 12 ---
    ('plik', r(12, 23), 'scripts/czekaj-na-sklep.ts'),
    ('sprawdz_w', r(12, 47), 'playwright.config.ts'),
    ('sprawdz_w', r(12, 56), 'package.json'),
    ('plik', r(12, 66), '.github/workflows/testy-pr.yml'),
    ('plik', r(12, 151), '.github/workflows/regresja.yml'),
    ('pomin', r(12, 247), 'fragment workflow z „# ...”'),
    ('pomin', r(12, 277), 'przykład zadania na środowisku staging'),
    ('pomin', r(12, 306), 'przykład sekcji permissions'),
    # --- rozdział 13 ---
    ('plik', r(13, 44), 'merge.config.ts'),
    ('zamien_blokiem', r(13, 59), '.github/workflows/testy-pr.yml', "      - name: Raport HTML\n        if: ${{ !cancelled() }}\n        run: npx playwright merge-reports --reporter html ./blob-report\n", 0, 'tylko_3'),
    ('dopisz', r(13, 59), '.github/workflows/testy-pr.yml', 'od_5'),
    ('pomin', r(13, 81), 'opcjonalny wariant reportera'),
    ('sprawdz_w', r(13, 91), 'playwright.config.ts'),
    ('test', r(13, 101), 'tests/api.spec.ts'),
    ('plik', r(13, 141), '.github/ISSUE_TEMPLATE/blad.yml'),
    ('pomin', r(13, 234), 'fragment adnotacji z adresem zgłoszenia'),
    ('plik', r(13, 272), 'scripts/statystyki.ts'),
    ('wstaw_po', r(13, 314), '.github/workflows/testy-pr.yml', 'run: npx playwright merge-reports --config merge.config.ts ./blob-report\n', 0, 'po'),
    ('wstaw_po', r(13, 314), '.github/workflows/regresja.yml', 'run: npx playwright merge-reports --reporter html ./all-blob-reports\n', 0, 'po'),
    # --- rozdział 14–17 ---
    ('pomin', r(14, 100), 'przykład snapshotu dostępności z logu agenta'),
    ('plik', r(14, 160), '.claude/settings.json'),
    ('plik', r(15, 52), 'tests/seed.spec.ts'),
    ('pomin', r(15, 79), 'fragment planu z plannera'),
    ('plik', r(15, 119), 'tests/r15-generator.spec.ts'),
    ('plik', r(16, 86), 'tests/mutacje.ts'),
    ('zamien_blokiem', r(16, 122), 'tests/fixtures.ts', 'export const test = base.extend<Fixtures>({\n', 0, 'naglowek_page'),
    ('zamien', None, 'tests/fixtures.ts', "import { nowyKlient, type DaneKlienta } from './dane.ts';\n", "import { nowyKlient, type DaneKlienta } from './dane.ts';\nimport { mutacje } from './mutacje.ts';\n"),
    ('plik', r(17, 22), 'CLAUDE.md'),
    ('plik', r(17, 32), 'AGENTS.md'),
    ('plik', r(17, 98), '.claude/skills/przeglad-testu/SKILL.md'),
    ('plik', r(17, 146), '.githooks/pre-push'),
    ('wstaw_po', r(17, 133), 'eslint.config.mjs', "      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],\n", 6, 'po'),
    ('scal_json', r(17, 163), '.claude/settings.json'),
    # --- rozdział 18–19 ---
    ('plik', r(18, 33), 'ewaluacje/model.ts'),
    ('plik', r(18, 71), 'ewaluacje/asystent.ts'),
    ('plik', r(18, 115), 'ewaluacje/przypadki.ts'),
    ('plik', r(18, 175), 'ewaluacje/uruchom.ts'),
    ('pomin', r(18, 227), 'przykładowy wynik ewaluacji'),
    ('plik', r(18, 250), 'ewaluacje/sedzia.ts'),
    ('wstaw_po', r(19, 57), '.github/workflows/regresja.yml', "      - uses: actions/upload-artifact@v5\n        with:\n          name: raport-regresja-", 0, 'przed'),
    ('dopisz', r(19, 65), '.github/workflows/regresja.yml', 'calosc'),
    ('pomin', r(19, 101), 'test do przeglądu na rozmowie rekrutacyjnej, celowo zły'),
    # --- dodatki ---
    ('plik', d('a', 56), 'package.json'),
    ('pomin', d('a', 108), 'metoda wiersz() jest już w strona-koszyka.ts z rozdziału 8'),
    ('opakuj', d('a', 167), 'tests/fragmenty.spec.ts', "test('DA A.6 czekanie na odpowiedź', async ({ klient, page }) => {\n  await page.goto('/');\n  " + U + "zmienna karta z przykładu\n  const karta = page.getByRole('listitem').filter({ hasText: 'Kubek' });\n", "});"),
    ('opakuj', d('a', 177), 'tests/fragmenty.spec.ts', "test('DA A.7 podmiana odpowiedzi', async ({ page }) => {\n", "  await page.goto('/');\n  await expect(page.getByRole('heading', { name: 'Produkty' })).toBeVisible();\n});"),
    ('opakuj', d('a', 204), 'tests/fragmenty.spec.ts', "test('DA A.7 testy API', async ({ request, apiKlienta }) => {\n", "});"),
    ('plik', d('a', 216), 'tests/dodatek-a-struktura.spec.ts'),
    ('sprawdz_w', d('a', 253), 'tests/fixtures.ts'),
    ('plik', d('a', 265), 'playwright.config.ts'),
    ('pomin', d('d', 7), 'szablon AGENTS.md do uzupełnienia'),
    ('pomin', d('d', 76), 'szablon notatki o agentach'),
    ('plik', d('f', 78), 'tests/dodatek-f-trzy-narzedzia.spec.ts', FIX + "\n"),
    ('pomin', d('f', 112), 'ten sam test w Cypressie'),
]

NAGLOWEK_FRAGMENTOW = FIX + U + "importy dla fragmentów z dodatku A\nimport { ListaProduktow } from './schematy.ts';\n\n" + \
    '// Fragmenty kodu z książki, które w tekście nie są osobnymi testami. Każdy owinięto minimalnie w test.\n'


def blad(msg):
    sys.exit(f'BŁĄD: {msg}')


def zloz(do_rozdzialu=100):
    def numer(klucz):
        n = klucz.split(':')[0]
        return int(n[-2:]) if n.startswith('rozdzial') else 100
    znane = {m[1] for m in MANIFEST if m[1]}
    for k, b in BLOKI.items():
        if b['jezyk'] in SPRAWDZANE and k not in znane and not k.startswith(('dodatek-b', 'dodatek-c', 'dodatek-e', 'rozdzial-01:', 'rozdzial-02:', 'rozdzial-03:103', 'rozdzial-03:216')) \
                and not (b['jezyk'] == 'text' and k.split(':')[0] in ('rozdzial-03', 'rozdzial-14', 'rozdzial-16', 'rozdzial-17', 'rozdzial-18', 'rozdzial-20')):
            blad(f'niesklasyfikowany blok {k} [{b["jezyk"]}] {b["plik"]} – dopisz go do MANIFESTU')
    for k in znane:
        if k not in BLOKI: blad(f'w manifeście jest {k}, którego nie ma w książce (zmieniony tekst?)')

    if CEL.exists():
        for p in CEL.iterdir():
            if p.name not in ('node_modules', 'test-results', 'playwright-report', 'blob-report', 'playwright', 'package-lock.json'):
                shutil.rmtree(p) if p.is_dir() else p.unlink()
    CEL.mkdir(exist_ok=True)
    pliki, uwagi = {}, []
    kod = lambda k: BLOKI[k]['kod'] + '\n'

    for op in MANIFEST:
        rodzaj, k = op[0], op[1]
        if k and numer(k) > do_rozdzialu: continue
        if rodzaj == 'pomin': continue
        if rodzaj == 'plik':
            pliki[op[2]] = (op[3] if len(op) > 3 else '') + kod(k)
        elif rodzaj == 'test':
            if op[2] not in pliki: pliki[op[2]] = op[3] if len(op) > 3 else FIX + '\n'
            pliki[op[2]] = pliki[op[2]].rstrip('\n') + '\n\n' + kod(k)
        elif rodzaj == 'opakuj':
            if op[2] not in pliki: pliki[op[2]] = NAGLOWEK_FRAGMENTOW
            wciecie = '' if op[3].endswith('expect(') else '  '
            tresc = ''.join(wciecie + l if l.strip() else l for l in kod(k).splitlines(True))
            if op[3].endswith('expect('): tresc = tresc.rstrip().rstrip(';')
            pliki[op[2]] = pliki[op[2]].rstrip('\n') + f'\n\n// {k}\n' + op[3] + tresc + op[4] + '\n'
        elif rodzaj == 'zamien':
            if op[3] not in pliki.get(op[2], ''): blad(f'zamien: brak fragmentu w {op[2]}: {op[3][:60]!r}')
            pliki[op[2]] = pliki[op[2]].replace(op[3], op[4], 1)
        elif rodzaj == 'zamien_blokiem':
            tekst, stare = pliki.get(op[2], ''), op[3]
            wciecie = op[4] if len(op) > 4 and isinstance(op[4], int) else 0
            nowy = kod(k)
            if len(op) > 5 and op[5] == 'tylko_3': nowy = ''.join(nowy.splitlines(True)[:3])
            if len(op) > 5 and op[5] == 'naglowek_page':
                linie = nowy.splitlines(True)
                nowy = ''.join(l for l in linie if '// ... pozostałe' not in l and l.strip() != '});')
            nowy = ''.join(' ' * wciecie + l if l.strip() else l for l in nowy.splitlines(True))
            if stare not in tekst: blad(f'zamien_blokiem {k}: brak fragmentu w {op[2]}: {stare[:60]!r}')
            if op[2].endswith('.mjs') and stare.rstrip().endswith('},') and not nowy.rstrip().endswith(','): nowy = nowy.rstrip('\n') + ',\n'
            pliki[op[2]] = tekst.replace(stare, nowy if stare.endswith('\n') else nowy.rstrip('\n'), 1)
        elif rodzaj == 'wstaw_przed_ostatnia':
            t = pliki[op[2]].rstrip('\n'); i = t.rstrip().rfind('}')
            pliki[op[2]] = t[:i].rstrip('\n') + '\n\n' + kod(k) + t[i:] + '\n'
        elif rodzaj == 'wstaw_po':
            t, kotwica, wciecie, gdzie = pliki[op[2]], op[3], op[4], op[5]
            if kotwica not in t: blad(f'wstaw_po {k}: brak kotwicy w {op[2]}: {kotwica[:60]!r}')
            nowy = ''.join(' ' * wciecie + l if l.strip() else l for l in kod(k).splitlines(True))
            i = t.index(kotwica)
            if gdzie == 'po': i += len(kotwica)
            elif kotwica.startswith('  },\n'): i += len('  },\n')
            pliki[op[2]] = t[:i] + nowy + t[i:]
        elif rodzaj == 'dopisz':
            nowy = kod(k)
            if op[3] == 'od_5': nowy = ''.join(l for l in nowy.splitlines(True)[4:])
            pliki[op[2]] = pliki[op[2]].rstrip('\n') + '\n' + ('\n' if op[3] == 'calosc' else '') + nowy
        elif rodzaj == 'scal_json':
            baza = json.loads(pliki[op[2]]); baza.update(json.loads(kod(k)))
            pliki[op[2]] = json.dumps(baza, indent=2, ensure_ascii=False) + '\n'
        elif rodzaj == 'sprawdz_w':
            uwagi.append((k, op[2]))
        else:
            blad(f'nieznana operacja {rodzaj}')

    # package.json: skrypty z dodatku A.3, zależności z poleceń instalacji w książce (UZUPEŁNIENIE).
    if 'package.json' in pliki:
        skrypty = json.loads('{' + pliki['package.json'] + '}')['scripts']
        pliki['package.json'] = json.dumps({
            'name': 'testy-sklepu', 'version': '1.0.0', 'private': True, 'type': 'module',
            '//': 'UZUPEŁNIENIE (etap 6): skrypty z dodatku A.3, wersje przypięte według Wstępu',
            'scripts': skrypty,
            'devDependencies': json.loads((KORZEN / 'narzedzia' / 'akceptacja-zaleznosci.json').read_text()),
        }, indent=2, ensure_ascii=False) + '\n'
    pliki['README.md'] = """# Kod z książki jako testy akceptacyjne (etap 6)

Ten katalog jest GENEROWANY skryptem `narzedzia/zloz-akceptacje.py` z bloków kodu w `ksiazka/`. Nie edytuj go ręcznie:
popraw tekst książki albo manifest w skrypcie i złóż katalog ponownie.

Każdy blok kodu z książki jest w manifeście: użyty w pliku albo pominięty z podanym powodem. Uzupełnienia, których
nie ma w książce (importy, owinięcie fragmentów w testy, obejścia zalecane w rozdziale 7.3), mają komentarz
`UZUPEŁNIENIE (etap 6)`.

Uruchomienie całej macierzy (baza, mutacje z rozdziału 16, tryby SKLEP_BLEDY) na obrazie sklepu:

```bash
narzedzia/akceptacja.sh            # buduje obraz z kodu
narzedzia/akceptacja.sh <obraz>    # testuje gotowy obraz
```

Wyniki i rozbieżności z tekstem: `docs/rozbieznosci.md`, część E.
"""
    pliki['.gitignore'] = 'node_modules/\n/test-results/\n/playwright-report/\n/blob-report/\n/playwright/.cache/\n/playwright/.auth/\n/wyniki/\n.env\n'
    pliki['.env.example'] = 'BASE_URL=http://localhost:3000\nADMIN_EMAIL=\nADMIN_HASLO=\n'

    for sciezka, tresc in pliki.items():
        p = CEL / sciezka; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(tresc)

    # Zasoby wygenerowane według książki: nagranie HAR (rozdział 9.5) i wzorce wizualne z obrazu Dockera (rozdział 11.1).
    if do_rozdzialu >= 11:
        shutil.copytree(KORZEN / 'narzedzia' / 'akceptacja-zasoby', CEL, dirs_exist_ok=True)

    # Zgodność fragmentów konfiguracji z plikiem końcowym (linie bloku obecne w pliku).
    norm = lambda s: re.sub(r'\s+', ' ', s).strip().rstrip(',')
    for k, sciezka in uwagi:
        cel = norm(pliki.get(sciezka, ''))
        brak = [l for l in BLOKI[k]['kod'].splitlines() if norm(l) and norm(l) not in cel and not norm(l).startswith('//') and norm(l) not in ('{', '}', '},', '],', ']', '});')]
        if brak: print(f'UWAGA {k}: w {sciezka} brak linii: {[norm(l) for l in brak][:3]}')
    print(f'Złożono {len(pliki)} plików w {CEL.relative_to(KORZEN)}')


if __name__ == '__main__':
    n = int(sys.argv[sys.argv.index('--do-rozdzialu') + 1]) if '--do-rozdzialu' in sys.argv else 100
    zloz(n)
