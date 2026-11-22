// API sklepu (specyfikacja, rozdział 5). Błędy zawsze w postaci {"blad": "..."}.
import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import type { Konfiguracja } from './konfiguracja.ts';
import { MAKS_ILOSC, type Sklep } from './stan.ts';

const CIASTECZKO = 'sesja';

interface Zmienne {
  Variables: { email: string; token: string };
}

const blad = (c: Context, status: 400 | 401 | 403 | 404 | 409, tresc: string) => c.json({ blad: tresc }, status);

// Niepoprawny JSON traktujemy jak puste dane, żeby nigdy nie odpowiadać kodem 5xx (API-0.3).
async function cialo(c: Context): Promise<Record<string, unknown>> {
  try {
    const dane: unknown = await c.req.json();
    return typeof dane === 'object' && dane !== null && !Array.isArray(dane) ? (dane as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const czyIlosc = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= MAKS_ILOSC;
const niepustyTekst = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

// Losowa kolejność bez powtórzeń (Fisher–Yates) dla trybu losowa-kolejnosc.
function przetasuj<T>(lista: readonly T[]): T[] {
  const wynik = [...lista];
  for (let i = wynik.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wynik[i], wynik[j]] = [wynik[j] as T, wynik[i] as T];
  }
  return wynik;
}

export function utworzApi(sklep: Sklep, konfiguracja: Konfiguracja): Hono<Zmienne> {
  const api = new Hono<Zmienne>();
  const { bledy } = konfiguracja;

  // Tryb wolne-api: każda odpowiedź pod /api/ z losowym opóźnieniem 0–3 s (rozdział 7 specyfikacji).
  if (bledy.has('wolne-api')) {
    api.use(async (_c, next) => {
      await new Promise((r) => setTimeout(r, Math.random() * 3000));
      await next();
    });
  }

  api.get('/health', (c) => c.json({ status: 'ok' }));

  api.get('/products', (c) => {
    const produkty = bledy.has('losowa-kolejnosc') ? przetasuj(sklep.produkty) : sklep.produkty;
    return c.json(produkty.map((p) => ({ id: p.id, nazwa: p.nazwa, cena: p.cenaGr / 100 })));
  });

  api.post('/users', async (c) => {
    const { email, haslo } = await cialo(c);
    if (!niepustyTekst(email) || !niepustyTekst(haslo)) return blad(c, 400, 'Brak e-maila lub hasła');
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) return blad(c, 400, 'Nieprawidłowy e-mail');
    if (!(await sklep.dodajUzytkownika(email, haslo))) return blad(c, 409, 'Użytkownik już istnieje');
    return c.json({ email, rola: 'klient' }, 201);
  });

  api.post('/login', async (c) => {
    const { email, haslo } = await cialo(c);
    const token = typeof email === 'string' && typeof haslo === 'string' ? await sklep.zaloguj(email, haslo) : undefined;
    if (!token || typeof email !== 'string') return blad(c, 401, 'Nieprawidłowy e-mail lub hasło');
    setCookie(c, CIASTECZKO, token, { httpOnly: true, sameSite: 'Lax', path: '/' });
    return c.json({ email, rola: sklep.rola(email) });
  });

  // Wszystko poniżej wymaga sesji (API-0.4).
  const zSesja = new Hono<Zmienne>();
  const wymagajSesji = createMiddleware<Zmienne>(async (c, next) => {
    const token = getCookie(c, CIASTECZKO);
    const email = sklep.ktoZalogowany(token);
    if (!email || !token) return blad(c, 401, 'Brak sesji');
    c.set('email', email);
    c.set('token', token);
    await next();
  });
  // Tylko znane trasy: nieznany adres ma dać 404 także bez sesji (API-0.6).
  for (const sciezka of ['/logout', '/users/me', '/cart', '/cart/items', '/cart/items/:produktId', '/cart/discount', '/orders/:id']) {
    zSesja.use(sciezka, wymagajSesji);
  }

  zSesja.post('/logout', (c) => {
    sklep.wyloguj(c.get('token'));
    deleteCookie(c, CIASTECZKO, { path: '/' });
    return c.body(null, 204);
  });

  zSesja.delete('/users/me', (c) => {
    sklep.usunUzytkownika(c.get('email'));
    deleteCookie(c, CIASTECZKO, { path: '/' });
    return c.body(null, 204);
  });

  zSesja.get('/cart', (c) => c.json(sklep.widokKoszyka(c.get('email'))));

  zSesja.delete('/cart', (c) => {
    sklep.oproznij(c.get('email'));
    return c.body(null, 204);
  });

  zSesja.post('/cart/items', async (c) => {
    const email = c.get('email');
    const { produktId, ilosc } = await cialo(c);
    if (!Number.isInteger(produktId)) return blad(c, 400, 'Nieprawidłowe dane');
    if (!czyIlosc(ilosc)) return blad(c, 400, 'Nieprawidłowa ilość');
    const id = produktId as number;
    if (!sklep.produkt(id)) return blad(c, 404, 'Nie ma takiego produktu');
    const nowa = (sklep.ilosc(email, id) ?? 0) + ilosc;
    if (nowa > MAKS_ILOSC) return blad(c, 400, 'Nieprawidłowa ilość');
    sklep.ustawIlosc(email, id, nowa);
    return c.json(sklep.widokKoszyka(email), 201);
  });

  zSesja.patch('/cart/items/:produktId', async (c) => {
    const email = c.get('email');
    const { ilosc } = await cialo(c);
    if (!czyIlosc(ilosc)) return blad(c, 400, 'Nieprawidłowa ilość');
    const id = Number(c.req.param('produktId'));
    if (sklep.ilosc(email, id) === undefined) return blad(c, 404, 'Nie ma takiej pozycji w koszyku');
    sklep.ustawIlosc(email, id, ilosc);
    return c.json(sklep.widokKoszyka(email));
  });

  zSesja.delete('/cart/items/:produktId', (c) => {
    const email = c.get('email');
    const id = Number(c.req.param('produktId'));
    if (sklep.ilosc(email, id) === undefined) return blad(c, 404, 'Nie ma takiej pozycji w koszyku');
    sklep.usunPozycje(email, id);
    return c.json(sklep.widokKoszyka(email));
  });

  zSesja.post('/cart/discount', async (c) => {
    const email = c.get('email');
    const { kod } = await cialo(c);
    const rabat = typeof kod === 'string' ? sklep.kodRabatowy(kod) : undefined;
    if (!rabat || typeof kod !== 'string') return blad(c, 400, 'Nieznany kod rabatowy');
    if (!rabat.aktywny) return blad(c, 400, 'Kod rabatowy jest nieaktywny');
    sklep.zastosujKod(email, kod);
    return c.json(sklep.widokKoszyka(email));
  });

  zSesja.get('/orders/:id', (c) => {
    const id = c.req.param('id');
    const z = /^\d+$/.test(id) ? sklep.zamowienie(Number(id)) : undefined;
    if (!z) return blad(c, 404, 'Nie ma takiego zamówienia');
    if (z.wlasciciel !== c.get('email')) return blad(c, 403, 'Brak dostępu');
    return c.json({ id: z.id, pozycje: z.pozycje, suma: z.suma });
  });

  api.route('/', zSesja);
  return api;
}
