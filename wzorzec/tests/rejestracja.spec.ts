import * as z from 'zod';
import { test, expect } from './fixtures.ts';
import { nowyKlient } from './dane.ts';

const NowyUzytkownik = z.strictObject({
  email: z.string(),
  rola: z.enum(['klient', 'admin']),
});

test('rejestracja zwraca dane bez hasła', { tag: '@api' }, async ({ request }) => {
  const dane = nowyKlient();
  const odpowiedz = await request.post('/api/users', { data: dane });
  expect(odpowiedz.status()).toBe(201);
  const uzytkownik = NowyUzytkownik.parse(await odpowiedz.json());
  expect(uzytkownik.email).toBe(dane.email);
});

test('ponowna rejestracja tego samego e-maila daje 409', { tag: '@api' }, async ({ request }) => {
  const dane = nowyKlient();
  await expect(await request.post('/api/users', { data: dane })).toBeOK();
  const odpowiedz = await request.post('/api/users', { data: dane });
  expect(odpowiedz.status()).toBe(409);
});

test('schemat wykrywa wyciek hasła', () => {
  const wynik = NowyUzytkownik.safeParse({ email: 'a@b.pl', rola: 'klient', haslo: 'x' });
  expect(wynik.success).toBe(false);
});

test('schemat wykrywa cenę jako tekst', () => {
  const Produkt = z.object({ cena: z.number() });
  const wynik = Produkt.safeParse({ cena: '49,99' });
  console.log(wynik.success ? '' : wynik.error.issues[0]?.message);
  expect(wynik.success).toBe(false);
});
