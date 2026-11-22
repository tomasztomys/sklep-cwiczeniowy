import { test, expect } from '../fixtures.ts';

const kubek = (ilosc: number) => ({ produktId: 7, nazwa: 'Kubek', ilosc, cena: Math.round(4999 * ilosc) / 100 });

test.describe('API-4 i API-7 koszyk', () => {
  test('nowy klient ma pusty koszyk', async ({ apiKlienta }) => {
    const odpowiedz = await apiKlienta.get('/api/cart');
    expect(odpowiedz.status()).toBe(200);
    expect(await odpowiedz.json()).toEqual({ pozycje: [], suma: 0 });
  });

  test('opróżnienie zwraca 204 bez treści, potem koszyk jest pusty', async ({ apiKlienta }) => {
    await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
    const odpowiedz = await apiKlienta.delete('/api/cart');
    expect(odpowiedz.status()).toBe(204);
    expect(await odpowiedz.text()).toBe('');
    expect(await (await apiKlienta.get('/api/cart')).json()).toEqual({ pozycje: [], suma: 0 });
  });

  test('koszyki klientów są od siebie niezależne', async ({ apiKlienta, apiAdmina }) => {
    await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
    await apiAdmina.delete('/api/cart');
    expect(await (await apiAdmina.get('/api/cart')).json()).toEqual({ pozycje: [], suma: 0 });
    expect((await (await apiKlienta.get('/api/cart')).json()) as unknown).toEqual({ pozycje: [kubek(1)], suma: 49.99 });
  });
});

test.describe('API-5 POST /api/cart/items', () => {
  test('dodanie zwraca 201 i cały koszyk z wartością pozycji', async ({ apiKlienta }) => {
    const odpowiedz = await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 2 } });
    expect(odpowiedz.status()).toBe(201);
    expect(await odpowiedz.json()).toEqual({ pozycje: [kubek(2)], suma: 99.98 });
  });

  test('ponowne dodanie sumuje ilości, a pozycje mają wartość cena × ilość', async ({ apiKlienta }) => {
    await apiKlienta.post('/api/cart/items', { data: { produktId: 12, ilosc: 1 } });
    const odpowiedz = await apiKlienta.post('/api/cart/items', { data: { produktId: 12, ilosc: 2 } });
    expect(await odpowiedz.json()).toEqual({ pozycje: [{ produktId: 12, nazwa: 'Notes', ilosc: 3, cena: 46.5 }], suma: 46.5 });
  });

  const bledne = [
    { opis: 'brak produktId', data: { ilosc: 1 }, blad: 'Nieprawidłowe dane' },
    { opis: 'produktId jako tekst', data: { produktId: '7', ilosc: 1 }, blad: 'Nieprawidłowe dane' },
    { opis: 'ilość 0', data: { produktId: 7, ilosc: 0 }, blad: 'Nieprawidłowa ilość' },
    { opis: 'ilość ujemna', data: { produktId: 7, ilosc: -1 }, blad: 'Nieprawidłowa ilość' },
    { opis: 'ilość ułamkowa', data: { produktId: 7, ilosc: 1.5 }, blad: 'Nieprawidłowa ilość' },
    { opis: 'ilość jako tekst', data: { produktId: 7, ilosc: '2' }, blad: 'Nieprawidłowa ilość' },
    { opis: 'ilość 100', data: { produktId: 7, ilosc: 100 }, blad: 'Nieprawidłowa ilość' },
    { opis: 'brak ilości', data: { produktId: 7 }, blad: 'Nieprawidłowa ilość' },
  ];
  for (const { opis, data, blad } of bledne) {
    test(`${opis} daje 400`, async ({ apiKlienta }) => {
      const odpowiedz = await apiKlienta.post('/api/cart/items', { data });
      expect(odpowiedz.status()).toBe(400);
      expect(await odpowiedz.json()).toEqual({ blad });
    });
  }

  test('ilość 99 jest dozwolona, ale suma ponad 99 już nie', async ({ apiKlienta }) => {
    expect((await apiKlienta.post('/api/cart/items', { data: { produktId: 12, ilosc: 99 } })).status()).toBe(201);
    const odpowiedz = await apiKlienta.post('/api/cart/items', { data: { produktId: 12, ilosc: 1 } });
    expect(odpowiedz.status()).toBe(400);
    expect(await odpowiedz.json()).toEqual({ blad: 'Nieprawidłowa ilość' });
  });

  test('nieistniejący produkt daje 404', async ({ apiKlienta }) => {
    const odpowiedz = await apiKlienta.post('/api/cart/items', { data: { produktId: 9999, ilosc: 1 } });
    expect(odpowiedz.status()).toBe(404);
    expect(await odpowiedz.json()).toEqual({ blad: 'Nie ma takiego produktu' });
  });

  test('niepoprawny JSON daje 400, a nie 5xx (API-0.3)', async ({ apiKlienta }) => {
    const odpowiedz = await apiKlienta.post('/api/cart/items', { data: '{zly', headers: { 'Content-Type': 'application/json' } });
    expect(odpowiedz.status()).toBe(400);
    expect(await odpowiedz.json()).toEqual({ blad: 'Nieprawidłowe dane' });
  });
});

test.describe('API-10 i API-11 zmiana i usunięcie pozycji', () => {
  test('PATCH ustawia ilość, nie dodaje', async ({ apiKlienta }) => {
    await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 2 } });
    const odpowiedz = await apiKlienta.patch('/api/cart/items/7', { data: { ilosc: 5 } });
    expect(odpowiedz.status()).toBe(200);
    expect(await odpowiedz.json()).toEqual({ pozycje: [kubek(5)], suma: 249.95 });
  });

  test('PATCH z błędną ilością daje 400, a dla produktu spoza koszyka 404', async ({ apiKlienta }) => {
    await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
    expect(await (await apiKlienta.patch('/api/cart/items/7', { data: { ilosc: 0 } })).json()).toEqual({ blad: 'Nieprawidłowa ilość' });
    const odpowiedz = await apiKlienta.patch('/api/cart/items/12', { data: { ilosc: 1 } });
    expect(odpowiedz.status()).toBe(404);
    expect(await odpowiedz.json()).toEqual({ blad: 'Nie ma takiej pozycji w koszyku' });
  });

  test('DELETE usuwa pozycję i zwraca koszyk', async ({ apiKlienta }) => {
    await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
    await apiKlienta.post('/api/cart/items', { data: { produktId: 12, ilosc: 1 } });
    const odpowiedz = await apiKlienta.delete('/api/cart/items/12');
    expect(odpowiedz.status()).toBe(200);
    expect(await odpowiedz.json()).toEqual({ pozycje: [kubek(1)], suma: 49.99 });
    expect((await apiKlienta.delete('/api/cart/items/12')).status()).toBe(404);
  });
});

test.describe('API-6 POST /api/cart/discount', () => {
  test('JESIEN10 obniża sumę o 10% i zostaje zapamiętany w koszyku', async ({ apiKlienta }) => {
    await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
    const odpowiedz = await apiKlienta.post('/api/cart/discount', { data: { kod: 'JESIEN10' } });
    expect(odpowiedz.status()).toBe(200);
    expect(await odpowiedz.json()).toEqual({ pozycje: [kubek(1)], suma: 44.99 });
    expect(((await (await apiKlienta.get('/api/cart')).json()) as { suma: number }).suma).toBe(44.99);
  });

  test('rabat jest przeliczany po zmianie koszyka i znika po opróżnieniu', async ({ apiKlienta }) => {
    await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
    await apiKlienta.post('/api/cart/discount', { data: { kod: 'JESIEN10' } });
    // 49,99 + 15,50 = 65,49; rabat round(654,9) gr = 6,55 zł; suma 58,94 zł
    const poDodaniu = await apiKlienta.post('/api/cart/items', { data: { produktId: 12, ilosc: 1 } });
    expect(((await poDodaniu.json()) as { suma: number }).suma).toBe(58.94);
    await apiKlienta.delete('/api/cart');
    const poOproznieniu = await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
    expect(((await poOproznieniu.json()) as { suma: number }).suma).toBe(49.99);
  });

  const odrzucane = [
    { kod: 'LATO5', blad: 'Kod rabatowy jest nieaktywny' },
    { kod: 'XYZ', blad: 'Nieznany kod rabatowy' },
    { kod: 'jesien10', blad: 'Nieznany kod rabatowy' },
    { kod: '', blad: 'Nieznany kod rabatowy' },
    { kod: '<img src=x onerror=alert(1)>', blad: 'Nieznany kod rabatowy' },
    { kod: 'toString', blad: 'Nieznany kod rabatowy' },
  ];
  for (const { kod, blad } of odrzucane) {
    test(`kod "${kod}" jest odrzucany i nie zmienia sumy`, async ({ apiKlienta }) => {
      await apiKlienta.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
      const odpowiedz = await apiKlienta.post('/api/cart/discount', { data: { kod } });
      expect(odpowiedz.status()).toBe(400);
      expect(await odpowiedz.json()).toEqual({ blad });
      expect(((await (await apiKlienta.get('/api/cart')).json()) as { suma: number }).suma).toBe(49.99);
    });
  }
});
