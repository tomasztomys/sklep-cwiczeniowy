import { test, expect } from '../fixtures.ts';

test.describe('API-1 GET /api/products', () => {
  test('zwraca trzy produkty w stałej kolejności, bez innych pól i bez sesji', async ({ request }) => {
    const odpowiedz = await request.get('/api/products');
    expect(odpowiedz.status()).toBe(200);
    expect(odpowiedz.headers()['content-type']).toContain('application/json');
    expect(await odpowiedz.json()).toEqual([
      { id: 7, nazwa: 'Kubek', cena: 49.99 },
      { id: 12, nazwa: 'Notes', cena: 15.5 },
      { id: 15, nazwa: 'Bluza', cena: 120 },
    ]);
  });
});
