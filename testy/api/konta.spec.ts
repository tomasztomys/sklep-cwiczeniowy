import { test, expect, nowyKlient } from '../fixtures.ts';

test.describe('API-2 POST /api/users', () => {
  test('tworzy klienta i zwraca tylko e-mail i rolę', async ({ request }) => {
    const dane = nowyKlient();
    const odpowiedz = await request.post('/api/users', { data: dane });
    expect(odpowiedz.status()).toBe(201);
    expect(await odpowiedz.json()).toEqual({ email: dane.email, rola: 'klient' });
    expect(odpowiedz.headers()['set-cookie']).toBeUndefined();
  });

  test('zajęty e-mail daje 409', async ({ request }) => {
    const odpowiedz = await request.post('/api/users', { data: { email: 'klient@sklep.test', haslo: 'cokolwiek' } });
    expect(odpowiedz.status()).toBe(409);
    expect(await odpowiedz.json()).toEqual({ blad: 'Użytkownik już istnieje' });
  });

  const bledneDane = [
    { opis: 'brak e-maila', data: { haslo: 'x' }, blad: 'Brak e-maila lub hasła' },
    { opis: 'brak hasła', data: { email: 'a@sklep.test' }, blad: 'Brak e-maila lub hasła' },
    { opis: 'puste hasło', data: { email: 'a@sklep.test', haslo: '' }, blad: 'Brak e-maila lub hasła' },
    { opis: 'e-mail jako liczba', data: { email: 7, haslo: 'x' }, blad: 'Brak e-maila lub hasła' },
    { opis: 'e-mail bez @', data: { email: 'bez-malpy', haslo: 'x' }, blad: 'Nieprawidłowy e-mail' },
  ];
  for (const { opis, data, blad } of bledneDane) {
    test(`${opis} daje 400`, async ({ request }) => {
      const odpowiedz = await request.post('/api/users', { data });
      expect(odpowiedz.status()).toBe(400);
      expect(await odpowiedz.json()).toEqual({ blad });
    });
  }

  test('niepoprawny JSON daje 400, a nie 5xx (API-0.3)', async ({ request }) => {
    const odpowiedz = await request.post('/api/users', { data: '{zly', headers: { 'Content-Type': 'application/json' } });
    expect(odpowiedz.status()).toBe(400);
  });
});

test.describe('API-3 POST /api/login', () => {
  for (const konto of [
    { email: 'klient@sklep.test', haslo: 'Klient123!', rola: 'klient' },
    { email: 'admin@sklep.test', haslo: 'Admin123!', rola: 'admin' },
  ]) {
    test(`konto testowe ${konto.rola} loguje się i dostaje ciasteczko sesji`, async ({ request }) => {
      const odpowiedz = await request.post('/api/login', { data: { email: konto.email, haslo: konto.haslo } });
      expect(odpowiedz.status()).toBe(200);
      expect(await odpowiedz.json()).toEqual({ email: konto.email, rola: konto.rola });
      const ciasteczko = odpowiedz.headers()['set-cookie'] ?? '';
      expect(ciasteczko).toMatch(/^sesja=[^;]{20,};/);
      expect(ciasteczko).toContain('HttpOnly');
      expect(ciasteczko).toContain('SameSite=Lax');
      expect(ciasteczko).toContain('Path=/');
      expect(ciasteczko).not.toContain('Secure');
    });
  }

  for (const { opis, data } of [
    { opis: 'błędne hasło', data: { email: 'klient@sklep.test', haslo: 'zle-haslo' } },
    { opis: 'nieznany e-mail', data: { email: 'nikt@sklep.test', haslo: 'Klient123!' } },
    { opis: 'puste dane', data: {} },
  ]) {
    test(`${opis} daje 401 z tym samym komunikatem (ST-31)`, async ({ request }) => {
      const odpowiedz = await request.post('/api/login', { data });
      expect(odpowiedz.status()).toBe(401);
      expect(await odpowiedz.json()).toEqual({ blad: 'Nieprawidłowy e-mail lub hasło' });
    });
  }
});

test.describe('S-4 POST /api/logout', () => {
  test('unieważnia sesję i usuwa ciasteczko', async ({ apiKlienta }) => {
    const odpowiedz = await apiKlienta.post('/api/logout');
    expect(odpowiedz.status()).toBe(204);
    expect(odpowiedz.headers()['set-cookie']).toMatch(/sesja=;.*Max-Age=0/);
    expect((await apiKlienta.get('/api/cart')).status()).toBe(401);
  });

  test('stare ciasteczko nie działa po wylogowaniu', async ({ playwright, baseURL }) => {
    const api = await playwright.request.newContext({ baseURL });
    const dane = nowyKlient();
    await api.post('/api/users', { data: dane });
    const ciasteczko = ((await api.post('/api/login', { data: dane })).headers()['set-cookie'] ?? '').split(';')[0] ?? '';
    await api.post('/api/logout');
    const odpowiedz = await api.get('/api/cart', { headers: { Cookie: ciasteczko } });
    expect(odpowiedz.status()).toBe(401);
    await api.dispose();
  });
});

test.describe('API-9 DELETE /api/users/me', () => {
  test('usuwa konto, więc ponowne logowanie się nie udaje', async ({ playwright, baseURL }) => {
    const api = await playwright.request.newContext({ baseURL });
    const dane = nowyKlient();
    await api.post('/api/users', { data: dane });
    await api.post('/api/login', { data: dane });
    expect((await api.delete('/api/users/me')).status()).toBe(204);
    expect((await api.get('/api/cart')).status()).toBe(401);
    expect((await api.post('/api/login', { data: dane })).status()).toBe(401);
    await api.dispose();
  });
});
