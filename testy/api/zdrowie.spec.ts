import { test, expect } from '../fixtures.ts';

test.describe('kontrola stanu (K-3)', () => {
  test('GET /api/health zwraca status ok bez sesji', async ({ request }) => {
    const odpowiedz = await request.get('/api/health');
    expect(odpowiedz.status()).toBe(200);
    expect(await odpowiedz.json()).toEqual({ status: 'ok' });
  });

  test('nieznany adres API zwraca 404 w formacie błędu (API-0.6)', async ({ request }) => {
    const odpowiedz = await request.get('/api/nie-ma-takiego');
    expect(odpowiedz.status()).toBe(404);
    expect(await odpowiedz.json()).toEqual({ blad: 'Nie znaleziono' });
  });

  test('odpowiedzi mają nagłówki bezpieczeństwa (B-1)', async ({ request }) => {
    const naglowki = (await request.get('/api/health')).headers();
    expect(naglowki['x-content-type-options']).toBe('nosniff');
    expect(naglowki['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(naglowki['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(naglowki['strict-transport-security']).toBeUndefined();
  });
});
