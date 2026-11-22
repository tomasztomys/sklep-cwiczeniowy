// Tryby SKLEP_BLEDY (specyfikacja, rozdział 7). Każdy test uruchamia własny proces sklepu,
// więc ten plik sprawdza kod źródłowy; przy BASE_URL (testy kontenera) pomija go konfiguracja.
import type { APIRequestContext, Page } from '@playwright/test';
import { test, expect } from '../fixtures.ts';
import { uruchomSklep, type UruchomionySklep } from './sklep.ts';

test.describe.configure({ mode: 'serial' });

const PRODUKTY = ['Kubek', 'Notes', 'Bluza'];

const nazwyProduktow = async (api: APIRequestContext) =>
  ((await (await api.get('/api/products')).json()) as { nazwa: string }[]).map((p) => p.nazwa);

const tloPrzycisku = (page: Page) =>
  page.getByRole('button', { name: 'Dodaj do koszyka' }).evaluate((b) => getComputedStyle(b).backgroundColor);

interface Przypadek {
  tryby: string;
  cenaKubka: string;
  losowaKolejnosc: boolean;
  wolneApi: boolean;
  tloPrzycisku: string;
  ostrzezenie: boolean;
  wLogach: string;
}

const NORMALNIE = { cenaKubka: '49,99 zł', losowaKolejnosc: false, wolneApi: false, tloPrzycisku: 'rgb(46, 91, 186)', ostrzezenie: false };

const PRZYPADKI: Przypadek[] = [
  { ...NORMALNIE, tryby: '', wLogach: 'tryby błędów: brak' },
  { ...NORMALNIE, tryby: 'cena-kubka', cenaKubka: '59,99 zł', wLogach: 'tryby błędów: cena-kubka' },
  { ...NORMALNIE, tryby: 'wolne-api', wolneApi: true, wLogach: 'tryby błędów: wolne-api' },
  { ...NORMALNIE, tryby: 'losowa-kolejnosc', losowaKolejnosc: true, wLogach: 'tryby błędów: losowa-kolejnosc' },
  { ...NORMALNIE, tryby: 'zmiana-stylu', tloPrzycisku: 'rgb(198, 40, 40)', wLogach: 'tryby błędów: zmiana-stylu' },
  { ...NORMALNIE, tryby: 'cena-kubka,losowa-kolejnosc', cenaKubka: '59,99 zł', losowaKolejnosc: true, wLogach: 'tryby błędów: cena-kubka, losowa-kolejnosc' },
  { ...NORMALNIE, tryby: 'literowka', ostrzezenie: true, wLogach: 'tryby błędów: brak' },
];

for (const przypadek of PRZYPADKI) {
  test.describe(`SKLEP_BLEDY="${przypadek.tryby}"`, () => {
    let sklep: UruchomionySklep;
    let api: APIRequestContext;

    test.beforeAll(async ({ playwright }) => {
      sklep = await uruchomSklep(przypadek.tryby);
      api = await playwright.request.newContext({ baseURL: sklep.baseURL });
    });

    test.afterAll(async () => {
      await api.dispose();
      await sklep.zatrzymaj();
    });

    test('cena kubka na stronie produktu (cena-kubka)', async ({ page }) => {
      await page.goto(`${sklep.baseURL}/produkty/kubek`);
      await expect(page.locator('.cena')).toHaveText(przypadek.cenaKubka);
      await page.goto(`${sklep.baseURL}/produkty/notes`);
      await expect(page.locator('.cena')).toHaveText('15,50 zł');
    });

    test('API i katalog zawsze z ceną 49,99 zł', async ({ page }) => {
      const produkty = (await (await api.get('/api/products')).json()) as { nazwa: string; cena: number }[];
      expect(produkty.find((p) => p.nazwa === 'Kubek')?.cena).toBe(49.99);
      await page.goto(`${sklep.baseURL}/`);
      await expect(page.getByRole('listitem').filter({ hasText: 'Kubek' })).toContainText('49,99 zł');
    });

    test('kolejność produktów w API (losowa-kolejnosc)', async () => {
      // Równolegle, bo w trybie wolne-api każde żądanie może trwać do 3 s.
      const wyniki = await Promise.all(Array.from({ length: 25 }, () => nazwyProduktow(api)));
      for (const nazwy of wyniki) expect([...nazwy].sort()).toEqual([...PRODUKTY].sort());
      const kolejnosci = new Set(wyniki.map((nazwy) => nazwy.join(',')));
      // Przy losowej kolejności 25 identycznych wyników ma prawdopodobieństwo (1/6)^24.
      expect(kolejnosci.size > 1).toBe(przypadek.losowaKolejnosc);
      // Bez trybu każda odpowiedź ma kolejność z DS-1.
      expect(przypadek.losowaKolejnosc || [...kolejnosci].every((k) => k === PRODUKTY.join(','))).toBe(true);
    });

    test('czas odpowiedzi API (wolne-api), strony HTML bez opóźnienia', async () => {
      const czasy = await Promise.all(
        Array.from({ length: 12 }, async () => {
          const start = Date.now();
          await expect(await api.get('/api/health')).toBeOK();
          return Date.now() - start;
        }),
      );
      const najdluzszy = Math.max(...czasy);
      // 12 losowych opóźnień 0–3 s poniżej 300 ms ma prawdopodobieństwo 0,1^12.
      expect(najdluzszy > 300).toBe(przypadek.wolneApi);
      expect(najdluzszy).toBeLessThan(3500);
      const start = Date.now();
      await expect(await api.get('/logowanie')).toBeOK();
      expect(Date.now() - start).toBeLessThan(300);
    });

    test('wygląd przycisków (zmiana-stylu), treść i nazwy bez zmian', async ({ page }) => {
      await page.goto(`${sklep.baseURL}/produkty/kubek`);
      expect(await tloPrzycisku(page)).toBe(przypadek.tloPrzycisku);
      await expect(page.getByRole('main')).toMatchAriaSnapshot(`
        - heading "Kubek" [level=1]
        - img "Biały kubek z logo sklepu"
        - paragraph: /\\d+,\\d{2} zł/
        - spinbutton "Ilość"
        - button "Dodaj do koszyka"
      `);
    });

    test('logi przy starcie wymieniają włączone tryby i ostrzegają o nieznanych', () => {
      expect(sklep.logi()).toContain(przypadek.wLogach);
      expect(sklep.logi().includes('Nieznany tryb SKLEP_BLEDY: "literowka"')).toBe(przypadek.ostrzezenie);
    });
  });
}

test.describe('TB-2 zmiana-stylu zmienia zrzuty z rozdziału 11', () => {
  test('zrzut strony kubka różni się od zrzutu bez trybu', async ({ browser }) => {
    const zrzut = async (tryby: string) => {
      const sklep = await uruchomSklep(tryby);
      const page = await browser.newPage({ baseURL: sklep.baseURL });
      await page.goto(`${sklep.baseURL}/produkty/kubek`);
      const obraz = await page.screenshot({ mask: [page.getByRole('img')] });
      await page.close();
      await sklep.zatrzymaj();
      return obraz;
    };
    expect((await zrzut('zmiana-stylu')).equals(await zrzut(''))).toBe(false);
  });
});
