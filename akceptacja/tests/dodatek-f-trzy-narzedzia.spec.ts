import { test, expect } from './fixtures.ts';

test('klient dodaje dwa kubki do koszyka', async ({ klient, page }) => {
  await page.goto('/produkty/kubek');
  await page.getByLabel('Ilość').fill('2');
  await page.getByRole('button', { name: 'Dodaj do koszyka' }).click();
  await expect(page.getByRole('status')).toHaveText('Dodano do koszyka');
  await page.goto('/koszyk');
  await expect(page.getByText(/^Suma:/)).toHaveText('Suma: 99,98 zł');
});
