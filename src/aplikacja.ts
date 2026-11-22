import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { utworzApi } from './api.ts';
import type { Konfiguracja } from './konfiguracja.ts';
import type { Sklep } from './stan.ts';
import { utworzStrony } from './strony/trasy.ts';

// Nagłówki bezpieczeństwa na każdej odpowiedzi (specyfikacja B-1).
const NAGLOWKI_BEZPIECZENSTWA: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export function utworzAplikacje(sklep: Sklep, konfiguracja: Konfiguracja): Hono {
  const app = new Hono();

  app.use(async (c, next) => {
    await next();
    for (const [nazwa, wartosc] of Object.entries(NAGLOWKI_BEZPIECZENSTWA)) c.header(nazwa, wartosc);
  });

  app.route('/api', utworzApi(sklep));
  app.all('/api/*', (c) => c.json({ blad: 'Nie znaleziono' }, 404));
  // Obrazy, czcionki i style z katalogu publiczne/ (K-9). Ścieżka względem katalogu roboczego.
  app.use('*', serveStatic({ root: './publiczne' }));
  app.route('/', utworzStrony(sklep, konfiguracja));

  app.onError((blad, c) => {
    console.error(blad);
    return c.json({ blad: 'Błąd serwera' }, 500);
  });

  return app;
}
