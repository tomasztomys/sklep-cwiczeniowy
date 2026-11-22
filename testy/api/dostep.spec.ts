import { test, expect } from '../fixtures.ts';

const chronione = [
  ['GET', '/api/cart'],
  ['DELETE', '/api/cart'],
  ['POST', '/api/cart/items'],
  ['PATCH', '/api/cart/items/7'],
  ['DELETE', '/api/cart/items/7'],
  ['POST', '/api/cart/discount'],
  ['GET', '/api/orders/1'],
  ['DELETE', '/api/users/me'],
  ['POST', '/api/logout'],
] as const;

test.describe('API-0.4 bez sesji', () => {
  for (const [metoda, adres] of chronione) {
    test(`${metoda} ${adres} daje 401`, async ({ request }) => {
      const odpowiedz = await request.fetch(adres, { method: metoda, data: {} });
      expect(odpowiedz.status()).toBe(401);
      expect(await odpowiedz.json()).toEqual({ blad: 'Brak sesji' });
    });
  }

  test('zmyślone ciasteczko sesji daje 401', async ({ request }) => {
    const odpowiedz = await request.get('/api/cart', { headers: { Cookie: 'sesja=zmyslona-wartosc' } });
    expect(odpowiedz.status()).toBe(401);
  });
});

test.describe('API-8 GET /api/orders/{id}', () => {
  test('klient nie ma dostępu do cudzego zamówienia', async ({ apiKlienta }) => {
    const odpowiedz = await apiKlienta.get('/api/orders/1');
    expect(odpowiedz.status()).toBe(403);
    expect(await odpowiedz.json()).toEqual({ blad: 'Brak dostępu' });
  });

  test('administrator widzi swoje zamówienie nr 1', async ({ apiAdmina }) => {
    const odpowiedz = await apiAdmina.get('/api/orders/1');
    expect(odpowiedz.status()).toBe(200);
    expect(await odpowiedz.json()).toEqual({ id: 1, pozycje: [{ produktId: 7, nazwa: 'Kubek', ilosc: 1, cena: 49.99 }], suma: 49.99 });
  });

  for (const id of ['999', 'abc']) {
    test(`zamówienie "${id}" daje 404`, async ({ apiKlienta }) => {
      const odpowiedz = await apiKlienta.get(`/api/orders/${id}`);
      expect(odpowiedz.status()).toBe(404);
      expect(await odpowiedz.json()).toEqual({ blad: 'Nie ma takiego zamówienia' });
    });
  }
});

test.describe('API-0.5 bez haseł w odpowiedziach', () => {
  test('żadna odpowiedź ścieżki klienta nie zawiera hasła', async ({ playwright, baseURL }) => {
    const api = await playwright.request.newContext({ baseURL });
    const haslo = `Tajne-${String(Date.now())}`;
    const email = `haslo-${String(Date.now())}@sklep.test`;
    const odpowiedzi = [
      await api.post('/api/users', { data: { email, haslo } }),
      await api.post('/api/login', { data: { email, haslo } }),
      await api.get('/api/cart'),
    ];
    for (const o of odpowiedzi) expect(await o.text()).not.toContain(haslo);
    await api.delete('/api/users/me');
    await api.dispose();
  });
});
