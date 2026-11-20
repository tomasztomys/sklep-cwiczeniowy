import { test, expect } from './fixtures.ts';

test.use({ timezoneId: 'Europe/Warsaw', locale: 'pl-PL' });

test('czekanie na odpowiedź serwera', async ({ klient, page }) => {
  await page.goto('/produkty/kubek');
  const odpowiedz = page.waitForResponse(
    (r) => r.url().endsWith('/api/cart/items') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Dodaj do koszyka' }).click();
  expect((await odpowiedz).status()).toBe(201);
});

test('zegar i strefa czasowa', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-30T23:30:00'));
  await page.goto('/');
  const teraz = await page.evaluate(() => new Date().toString());
  expect(teraz).toContain('Nov 30 2026 23:30');
});

test(
  'kwarantanna – przykład',
  { tag: '@kwarantanna', annotation: { type: 'issue', description: 'https://github.com/twoj-login/testy-sklepu/issues/12' } },
  async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Produkty' })).toBeVisible();
  },
);
