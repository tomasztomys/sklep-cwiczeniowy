import { test, expect } from './fixtures.ts';

test.describe('koszyk', { tag: '@koszyk' }, () => {
  test(
    'klient dodaje dwa kubki do koszyka',
    { tag: '@smoke' },
    async ({ klient, stronaProduktu, stronaKoszyka }) => {
      await test.step('Dodanie do koszyka', async () => {
        await stronaProduktu.otworz('kubek');
        await stronaProduktu.dodajDoKoszyka(2);
      });

      await test.step('Sprawdzenie koszyka', async () => {
        await stronaKoszyka.otworz();
        await expect(stronaKoszyka.wiersz('Kubek')).toContainText('2');
        await expect(stronaKoszyka.suma).toHaveText('Suma: 99,98 zł');
      });
    },
  );
});
