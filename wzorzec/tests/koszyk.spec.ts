import { test, expect } from './fixtures.ts';

test.describe('koszyk', { tag: '@koszyk' }, () => {
  test('klient dodaje dwa kubki do koszyka', { tag: '@smoke' }, async ({ klient, stronaProduktu, stronaKoszyka }) => {
    await stronaProduktu.otworz('kubek');
    await stronaProduktu.dodajDoKoszyka(2);
    await stronaKoszyka.otworz();
    await expect(stronaKoszyka.wiersz('Kubek')).toContainText('99,98 zł');
  });

  test('kod JESIEN10 obniża sumę o 10%', async ({ klient, stronaProduktu, stronaKoszyka }) => {
    await stronaProduktu.otworz('kubek');
    await stronaProduktu.dodajDoKoszyka();
    await stronaKoszyka.otworz();
    await stronaKoszyka.zastosujKod('JESIEN10');
    await expect(stronaKoszyka.komunikat).toHaveText('Zastosowano kod JESIEN10');
    await expect(stronaKoszyka.suma).toHaveText('Suma: 44,99 zł');
  });

  test('koszyk na telefonie', { tag: '@mobile' }, async ({ klient, stronaProduktu, stronaKoszyka }) => {
    await stronaProduktu.otworz('kubek');
    await stronaProduktu.dodajDoKoszyka();
    await stronaKoszyka.otworz();
    await expect(stronaKoszyka.wiersz('Kubek')).toBeVisible();
  });
});
