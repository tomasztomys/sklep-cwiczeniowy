import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures.ts';

const TAGI = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// Każda celowa usterka: reguła axe i fragment HTML jedynego elementu, który ją narusza (UC-1).
const USTERKI = { 'button-name': 'czat', 'color-contrast': 'Darmowa dostawa od 200 zł', label: 'szukaj' };

async function sprawdzTylkoCeloweUsterki(page: Page) {
  const wynik = await new AxeBuilder({ page }).withTags(TAGI).analyze();
  expect(wynik.violations.map((v) => v.id).sort()).toEqual(Object.keys(USTERKI).sort());
  for (const naruszenie of wynik.violations) {
    expect(naruszenie.nodes, naruszenie.id).toHaveLength(1);
    expect(naruszenie.nodes[0]?.html).toContain(USTERKI[naruszenie.id as keyof typeof USTERKI]);
  }
}

test.describe('UC-1 axe wykrywa dokładnie celowe usterki', () => {
  for (const adres of ['/produkty/kubek', '/produkty/notes', '/produkty/bluza', '/logowanie', '/rejestracja', '/nie-ma-takiej-strony']) {
    test(`strona ${adres}`, async ({ page }) => {
      await page.goto(adres);
      await sprawdzTylkoCeloweUsterki(page);
    });
  }

  test('katalog po wczytaniu produktów', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('listitem')).toHaveCount(3);
    await sprawdzTylkoCeloweUsterki(page);
  });

  test('pusty koszyk i koszyk z produktem po zastosowaniu kodu', async ({ klient, page }) => {
    await page.goto('/koszyk');
    await sprawdzTylkoCeloweUsterki(page);
    await page.request.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
    await page.goto('/koszyk');
    await page.getByLabel('Kod rabatowy').fill('LATO5');
    await page.getByRole('button', { name: 'Zastosuj' }).click();
    await expect(page.getByRole('alert')).toHaveText('Kod rabatowy jest nieaktywny');
    await sprawdzTylkoCeloweUsterki(page);
  });
});

test.describe('U-4 i UC-2 newsletter', () => {
  test('nie przyjmuje fokusu, ale reaguje na kliknięcie myszą', async ({ page }) => {
    await page.goto('/');
    const newsletter = page.getByText('Zapisz się do newslettera');
    await newsletter.focus();
    await expect(newsletter).not.toBeFocused();
    await newsletter.click();
    await expect(page.getByText('Dziękujemy za zapis')).toBeVisible();
  });
});

test.describe('ST-24 klawiatura na stronie produktu', () => {
  test('Tab z pola Ilość prowadzi do przycisku, a Enter dodaje produkt', async ({ klient, page }) => {
    await page.goto('/produkty/kubek');
    await page.getByLabel('Ilość').focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Dodaj do koszyka' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toHaveText('Dodano do koszyka');
  });
});
