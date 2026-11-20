import { test, expect } from './fixtures.ts';
import { nowyKlient } from './dane.ts';

test('strona ustawia podstawowe nagłówki bezpieczeństwa', { tag: '@bezpieczenstwo' }, async ({ request }) => {
  const odpowiedz = await request.get('/');
  const naglowki = odpowiedz.headers();
  expect(naglowki['x-content-type-options']).toBe('nosniff');
  expect(naglowki['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(naglowki['referrer-policy']).toBe('strict-origin-when-cross-origin');
});

test('ciasteczko sesji ma atrybuty HttpOnly i SameSite', { tag: '@bezpieczenstwo' }, async ({ request }) => {
  const dane = nowyKlient();
  await request.post('/api/users', { data: dane });
  const odpowiedz = await request.post('/api/login', { data: dane });
  const ciasteczko = odpowiedz.headers()['set-cookie'] ?? '';
  expect(ciasteczko).toContain('HttpOnly');
  expect(ciasteczko).toContain('SameSite=Lax');
});

test('kod rabatowy z HTML nie wykonuje skryptu', { tag: '@bezpieczenstwo' }, async ({ klient, page, stronaKoszyka }) => {
  let okienko = false;
  page.on('dialog', async (d) => {
    okienko = true;
    await d.dismiss();
  });
  await stronaKoszyka.otworz();
  await stronaKoszyka.zastosujKod('<img src=x onerror=alert(1)>');
  await expect(stronaKoszyka.blad).toHaveText('Nieznany kod rabatowy');
  expect(okienko).toBe(false);
});

test('API produktów odpowiada w mniej niż 500 ms', { tag: '@wydajnosc' }, async ({ request }) => {
  const start = Date.now();
  await expect(await request.get('/api/products')).toBeOK();
  expect(Date.now() - start).toBeLessThan(500);
});

test('strona główna ładuje się w budżecie', { tag: '@wydajnosc' }, async ({ page }) => {
  await page.goto('/');
  const czas = await page.evaluate(() => {
    const [nawigacja] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return nawigacja ? nawigacja.loadEventEnd - nawigacja.startTime : Number.NaN;
  });
  console.log('loadEventEnd ms', czas);
  expect(czas).toBeLessThan(2000);
});
