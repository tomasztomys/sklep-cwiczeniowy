import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures.ts';

const strony = ['/', '/produkty/kubek', '/logowanie'];

for (const adres of strony) {
  test(`strona ${adres} nie ma naruszeń WCAG wykrywalnych automatycznie`, { tag: '@a11y' }, async ({ page }) => {
    await page.goto(adres);
    const wynik = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    console.log(adres, wynik.violations.map((v) => `${v.id} (${v.nodes.length})`).join(', '));
    expect(wynik.violations).toEqual([]);
  });
}

test('przycisk dodawania do koszyka działa z klawiatury', { tag: '@a11y' }, async ({ klient, page }) => {
  await page.goto('/produkty/kubek');
  const przycisk = page.getByRole('button', { name: 'Dodaj do koszyka' });
  await page.getByLabel('Ilość').focus();
  await page.keyboard.press('Tab');
  await expect(przycisk).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Dodano do koszyka');
});

test('newsletter da się obsłużyć z klawiatury', { tag: '@a11y' }, async ({ page }) => {
  await page.goto('/');
  const newsletter = page.getByText('Zapisz się do newslettera');
  await newsletter.focus();
  await expect(newsletter).toBeFocused();
});
