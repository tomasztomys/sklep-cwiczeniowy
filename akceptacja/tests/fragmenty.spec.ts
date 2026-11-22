import { test, expect } from './fixtures.ts';
// UZUPEŁNIENIE (etap 6): importy dla fragmentów z dodatku A
import { ListaProduktow } from './schematy.ts';

// Fragmenty kodu z książki, które w tekście nie są osobnymi testami. Każdy owinięto minimalnie w test.

// rozdzial-07:90
test('R7 §7.2 filtr hasText', async ({ klient, page }) => {
  await page.goto('/');
  const notes = page.getByRole('listitem').filter({ hasText: 'Notes' });
  await notes.getByRole('button', { name: 'Dodaj do koszyka' }).click();
  await expect(page.getByRole('status')).toHaveText('Dodano do koszyka');
});

// rozdzial-07:102
test('R7 §7.2 filtr has', async ({ page }) => {
  await page.goto('/');
  const notes = page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: 'Notes' }),
  });
  await expect(notes).toHaveCount(1);
});

// rozdzial-07:110
test('R7 §7.2 zawężenie do banner', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Koszyk' })).toBeVisible();
});

// rozdzial-07:118
test('R7 §7.2 listy elementów', async ({ page }) => {
  await page.goto('/');
  const produkty = page.getByRole('listitem');
  await expect(produkty).toHaveCount(3);
  await expect(produkty.getByRole('heading')).toHaveText(['Kubek', 'Notes', 'Bluza']);
});

// rozdzial-07:239
test('R7 §7.5 asercje miękkie', async ({ page }) => {
  await page.goto('/produkty/kubek');
  await expect.soft(page.getByRole('heading', { level: 1 })).toHaveText('Kubek');
  await expect.soft(page.getByText('49,99 zł')).toBeVisible();
  await expect.soft(page.getByAltText('Biały kubek z logo sklepu')).toBeVisible();
});

// rozdzial-07:251
test('R7 §7.5 własny komunikat', async ({ klient, page }) => {
  await page.goto('/produkty/kubek');
  await page.getByRole('button', { name: 'Dodaj do koszyka' }).click();
  await expect(
    page.getByRole('status'),
    'po dodaniu produktu powinien pojawić się komunikat',
  ).toHaveText('Dodano do koszyka');
});

// rozdzial-07:264
test('R7 §7.5 expect.poll', async ({ klient, page }) => {
  await page.goto('/produkty/kubek');
  await page.getByRole('button', { name: 'Dodaj do koszyka' }).click();
  await expect
    .poll(
      async () => {
        const odpowiedz = await page.request.get('/api/cart');
        const koszyk = (await odpowiedz.json()) as { pozycje: unknown[] };
        return koszyk.pozycje.length;
      },
      { message: 'koszyk w API powinien mieć jedną pozycję' },
    )
    .toBe(1);
});

// rozdzial-10:115
test('R10 §10.3 czekanie na odpowiedź serwera', async ({ klient, page }) => {
  await page.goto('/produkty/kubek');
  const odpowiedz = page.waitForResponse(
    (r) => r.url().endsWith('/api/cart/items') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Dodaj do koszyka' }).click();
  expect((await odpowiedz).status()).toBe(201);
});

// dodatek-a:167
test('DA A.6 czekanie na odpowiedź', async ({ klient, page }) => {
  await page.goto('/');
  const karta = page.getByRole('listitem').filter({ hasText: 'Kubek' });
  const odpowiedz = page.waitForResponse(
    (o) => o.url().includes('/api/cart/items') && o.request().method() === 'POST',
  );
  await karta.getByRole('button', { name: 'Dodaj' }).click();
  expect((await odpowiedz).ok()).toBe(true);
});

// dodatek-a:178
test('DA A.7 podmiana odpowiedzi', async ({ page }) => {
  // pusta lista produktów
  await page.route('**/api/products', (route) => route.fulfill({ json: [] }));

  // błąd serwera
  await page.route('**/api/products', (route) =>
    route.fulfill({ status: 500, json: { blad: 'Błąd serwera' } }),
  );

  // prawdziwa odpowiedź po zmianie
  await page.route('**/api/products', async (route) => {
    const oryginal = await route.fetch();
    const lista = ListaProduktow.parse(await oryginal.json());
    await route.fulfill({ response: oryginal, json: lista.slice(0, 1) });
  });

  // tylko wybrana metoda, pozostałe żądania bez zmian
  await page.route('**/api/cart/items', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await route.fulfill({ status: 500, json: { blad: 'Błąd serwera' } });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Produkty' })).toBeVisible();
});

// dodatek-a:205
test('DA A.7 testy API', async ({ request, apiKlienta }) => {
  const odp = await request.get('/api/products');
  await expect(odp).toBeOK();
  const produkty = ListaProduktow.parse(await odp.json());
  expect(produkty).toHaveLength(3);

  const dodanie = await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 2 } });
  await expect(dodanie).toBeOK();
});
