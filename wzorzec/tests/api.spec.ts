import { test, expect } from './fixtures.ts';
import { Blad, Koszyk, ListaProduktow } from './schematy.ts';

test.describe('API', { tag: '@api' }, () => {
  test('lista produktów zawiera trzy produkty', async ({ request }) => {
    const odpowiedz = await request.get('/api/products');
    await expect(odpowiedz).toBeOK();
    const produkty = ListaProduktow.parse(await odpowiedz.json());
    expect(produkty.map((p) => p.nazwa)).toEqual(['Kubek', 'Notes', 'Bluza']);
  });

  test('koszyk bez sesji zwraca 401', async ({ request }) => {
    const odpowiedz = await request.get('/api/cart');
    expect(odpowiedz.status()).toBe(401);
  });

  test('dodanie produktu zwraca 201 i aktualny koszyk', async ({ apiKlienta }) => {
    const odpowiedz = await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 2 } });
    expect(odpowiedz.status()).toBe(201);
    const koszyk = Koszyk.parse(await odpowiedz.json());
    expect(koszyk.pozycje).toHaveLength(1);
    expect(koszyk.suma).toBe(99.98);
  });

  test('nieistniejący produkt daje 404', async ({ apiKlienta }) => {
    const odpowiedz = await apiKlienta.post('/api/cart/items', { data: { produktId: 9999, ilosc: 1 } });
    expect(odpowiedz.status()).toBe(404);
  });

  test('klient nie ma dostępu do cudzego zamówienia', async ({ apiKlienta }) => {
    const odpowiedz = await apiKlienta.get('/api/orders/1');
    expect(odpowiedz.status()).toBe(403);
  });
});

test('kod JESIEN10 obniża sumę koszyka o 10%', { tag: '@api' }, async ({ apiKlienta }) => {
  await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
  const odpowiedz = await apiKlienta.post('/api/cart/discount', { data: { kod: 'JESIEN10' } });
  await expect(odpowiedz).toBeOK();
  expect(Koszyk.parse(await odpowiedz.json()).suma).toBe(44.99);
});

const odrzucaneKody = [
  { kod: 'LATO5', blad: 'Kod rabatowy jest nieaktywny' },
  { kod: 'XYZ', blad: 'Nieznany kod rabatowy' },
  { kod: 'jesien10', blad: 'Nieznany kod rabatowy' },
  { kod: '', blad: 'Nieznany kod rabatowy' },
];

for (const { kod, blad } of odrzucaneKody) {
  test(`kod "${kod}" jest odrzucany`, { tag: '@api' }, async ({ apiKlienta }) => {
    await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
    const odpowiedz = await apiKlienta.post('/api/cart/discount', { data: { kod } });
    expect(odpowiedz.status()).toBe(400);
    expect(Blad.parse(await odpowiedz.json()).blad).toBe(blad);
  });
}
