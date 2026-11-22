import { Hono } from 'hono';

// Nagłówki bezpieczeństwa na każdej odpowiedzi (specyfikacja B-1).
const NAGLOWKI_BEZPIECZENSTWA: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export function utworzAplikacje(): Hono {
  const app = new Hono();

  app.use(async (c, next) => {
    await next();
    for (const [nazwa, wartosc] of Object.entries(NAGLOWKI_BEZPIECZENSTWA)) c.header(nazwa, wartosc);
  });

  app.get('/api/health', (c) => c.json({ status: 'ok' }));

  app.all('/api/*', (c) => c.json({ blad: 'Nie znaleziono' }, 404));

  app.onError((blad, c) => {
    console.error(blad);
    return c.json({ blad: 'Błąd serwera' }, 500);
  });

  return app;
}
