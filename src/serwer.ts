import { serve } from '@hono/node-server';
import { utworzAplikacje } from './aplikacja.ts';
import { wczytajKonfiguracje } from './konfiguracja.ts';

const konfiguracja = wczytajKonfiguracje();
for (const ostrzezenie of konfiguracja.ostrzezenia) console.warn(ostrzezenie);

const serwer = serve({ fetch: utworzAplikacje().fetch, port: konfiguracja.port, hostname: '0.0.0.0' }, (info) => {
  const bledy = [...konfiguracja.bledy].join(', ') || 'brak';
  console.log(`Sklep ćwiczeniowy działa na porcie ${String(info.port)} (dane startowe: ${konfiguracja.daneStartowe ? 'tak' : 'nie'}, tryby błędów: ${bledy})`);
});

// W kontenerze proces ma PID 1, więc sam obsługuje sygnały zatrzymania.
for (const sygnal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sygnal, () => {
    serwer.close(() => process.exit(0));
  });
}
