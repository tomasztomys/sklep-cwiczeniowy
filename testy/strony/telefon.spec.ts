import { devices } from '@playwright/test';
import { test, expect, nowyKlient } from '../fixtures.ts';

// Emulacja Pixel 7 bez zmiany przeglądarki (projekt testów to Chromium).
const { defaultBrowserType: _przegladarka, ...pixel7 } = devices['Pixel 7'];
test.use(pixel7);

test.describe('N-4 telefon', () => {
  test('logowanie i dodanie do koszyka działają na ekranie telefonu', async ({ page }) => {
    const dane = nowyKlient();
    await page.request.post('/api/users', { data: dane });
    await page.goto('/logowanie');
    await page.getByLabel('E-mail').fill(dane.email);
    await page.getByLabel('Hasło').fill(dane.haslo);
    await page.getByRole('button', { name: 'Zaloguj się' }).click();
    await expect(page.getByRole('button', { name: 'Wyloguj się' })).toBeInViewport();
    await page.goto('/produkty/bluza');
    await page.getByRole('button', { name: 'Dodaj do koszyka' }).click();
    await expect(page.getByRole('status')).toHaveText('Dodano do koszyka');
    await page.request.delete('/api/users/me');
  });
});
