// Ograniczenia, na których opiera się kod z książki (specyfikacja, rozdział 9, i ST-1, ST-5, B-1).
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures.ts';

const STRONY_PUBLICZNE = ['/', '/produkty/kubek', '/produkty/notes', '/logowanie', '/rejestracja'];

async function otworz(page: Page, adres: string) {
  await page.goto(adres);
  // Katalog dobudowuje listę po odpowiedzi API; na innych stronach elementów listy nie ma.
  await expect(page.getByRole('listitem')).toHaveCount(adres === '/' ? 3 : 0);
}

const nazwyPrzyciskow = (page: Page) =>
  page.locator('button').evaluateAll((przyciski) =>
    przyciski.map((b) => (b.getAttribute('aria-label') ?? b.textContent).replace(/\s+/g, ' ').trim()),
  );

async function sprawdzPrzyciskiIKomunikaty(page: Page, adres: string) {
  await otworz(page, adres);
  const nazwy = await nazwyPrzyciskow(page);
  for (const unikalna of ['Zaloguj się', 'Wyloguj się', 'Zastosuj', 'Załóż konto', 'Usuń wszystko', 'Koszyk']) {
    expect(nazwy.filter((n) => n === unikalna).length, unikalna).toBeLessThanOrEqual(1);
  }
  expect(nazwy.filter((n) => /koszyk/i.test(n) && n !== 'Koszyk' && n !== 'Dodaj do koszyka')).toEqual([]);
  expect(await page.getByRole('status').count()).toBeLessThanOrEqual(1);
  expect(await page.getByRole('alert').count()).toBeLessThanOrEqual(1);
  await expect(page.getByRole('link', { name: 'Zaloguj się' }).or(page.getByRole('button', { name: 'Wyloguj się' }))).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Zaloguj się' })).toHaveCount(adres === '/logowanie' ? 1 : 0);
}

test.describe('T-1 i T-2 unikalne przyciski i obszary komunikatów: gość', () => {
  for (const adres of STRONY_PUBLICZNE) {
    test(adres, async ({ page }) => {
      await sprawdzPrzyciskiIKomunikaty(page, adres);
    });
  }
});

test.describe('T-1 i T-2 unikalne przyciski i obszary komunikatów: zalogowany z produktem w koszyku', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post('/api/login', { data: { email: 'admin@sklep.test', haslo: 'Admin123!' } });
    await page.request.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
  });

  for (const adres of [...STRONY_PUBLICZNE, '/koszyk']) {
    test(adres, async ({ page }) => {
      await sprawdzPrzyciskiIKomunikaty(page, adres);
    });
  }
});

test.describe('T-3 i T-4 elementy listy i atrybuty testowe', () => {
  test('na stronie głównej są tylko trzy elementy listy, każdy z jednym nagłówkiem', async ({ page }) => {
    await otworz(page, '/');
    for (const element of await page.getByRole('listitem').all()) await expect(element.getByRole('heading')).toHaveCount(1);
  });

  for (const adres of STRONY_PUBLICZNE) {
    test(`${adres}: jedyny data-testid to dodaj-do-koszyka, bez cart-total`, async ({ page }) => {
      await otworz(page, adres);
      const wartosci = await page.locator('[data-testid]').evaluateAll((el) => el.map((e) => e.getAttribute('data-testid')));
      expect(new Set(wartosci)).toEqual(new Set(adres === '/' || adres.startsWith('/produkty/') ? ['dodaj-do-koszyka'] : []));
      await expect(page.getByTestId('cart-total')).toHaveCount(0);
    });
  }
});

test.describe('T-5 do T-8 treść HTML od serwera', () => {
  test('strona kubka ma w HTML cenę ze zwykłą spacją i tekst komunikatu (mutacje z rozdziału 16)', async ({ request }) => {
    const tresc = await (await request.get('/produkty/kubek')).text();
    expect(tresc.split('49,99 zł').length - 1).toBe(1);
    expect(tresc).toContain('Dodano do koszyka');
    expect(tresc).not.toContain(' ');
  });

  test('lista katalogu nie jest w HTML od serwera, tylko z API w przeglądarce', async ({ request }) => {
    const tresc = await (await request.get('/')).text();
    expect(tresc).not.toMatch(/<li[\s>]/);
    expect(tresc).toContain("fetch('/api/products')");
  });

  test('selektory CSS z przykładów działają na stronie produktu', async ({ page }) => {
    await page.goto('/produkty/kubek');
    await expect(page.locator('.cena')).toHaveText('49,99 zł');
    await expect(page.locator('.btn.btn-primary')).toHaveText('Dodaj do koszyka');
    await expect(page.locator('#ilosc')).toHaveValue('1');
  });
});

test.describe('ST-1, ST-5, ST-25 i B-1 wszystkie strony', () => {
  const tytuly: Record<string, string> = {
    '/': 'Sklep ćwiczeniowy',
    '/produkty/kubek': 'Kubek – Sklep ćwiczeniowy',
    '/logowanie': 'Logowanie – Sklep ćwiczeniowy',
    '/rejestracja': 'Rejestracja – Sklep ćwiczeniowy',
  };
  for (const [adres, tytul] of Object.entries(tytuly)) {
    test(`${adres}: tytuł, czysta konsola i nagłówki bezpieczeństwa`, async ({ page }) => {
      const bledy: string[] = [];
      page.on('console', (m) => { if (m.type() === 'error') bledy.push(m.text()); });
      page.on('pageerror', (e) => bledy.push(e.message));
      page.on('requestfailed', (r) => bledy.push(`${r.url()} ${r.failure()?.errorText ?? ''}`));
      const odpowiedz = await page.goto(adres);
      await expect(page).toHaveTitle(tytul);
      await page.waitForLoadState('load');
      expect(bledy).toEqual([]);
      const naglowki = odpowiedz?.headers() ?? {};
      expect(naglowki['x-content-type-options']).toBe('nosniff');
      expect(naglowki['content-security-policy']).toContain("frame-ancestors 'none'");
      expect(naglowki['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  }

  test('nieznana strona daje 404 z nagłówkiem, stopką i nagłówkami bezpieczeństwa', async ({ page }) => {
    const odpowiedz = await page.goto('/produkty/parasol');
    expect(odpowiedz?.status()).toBe(404);
    expect(odpowiedz?.headers()['x-content-type-options']).toBe('nosniff');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nie ma takiej strony');
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByText('Zapisz się do newslettera')).toBeVisible();
  });

  test('koszyk bez sesji przekierowuje na logowanie kodem 302 (ST-40)', async ({ request }) => {
    const odpowiedz = await request.get('/koszyk', { maxRedirects: 0 });
    expect(odpowiedz.status()).toBe(302);
    expect(odpowiedz.headers()['location']).toBe('/logowanie');
  });
});
