import { test, expect } from './fixtures.ts';

test('strona kubka pokazuje nazwę i cenę', async ({ page }) => {
  await page.goto('/produkty/kubek');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kubek');
  await expect(page.getByText('49,99 zł')).toBeVisible();
});

test('katalog pokazuje produkty (wersja od agenta)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Produkty' })).toBeVisible();
});

test('katalog pokazuje trzy produkty', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 2 })).toHaveText([
    'Kubek',
    'Notes',
    'Bluza',
  ]);
});
