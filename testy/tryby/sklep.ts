// Uruchamia osobny proces sklepu z wybranymi trybami SKLEP_BLEDY na wolnym porcie.
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

export interface UruchomionySklep {
  baseURL: string;
  logi: () => string;
  zatrzymaj: () => Promise<void>;
}

const wolnyPort = () =>
  new Promise<number>((ok, blad) => {
    const serwer = createServer();
    serwer.once('error', blad);
    serwer.listen(0, '127.0.0.1', () => {
      const adres = serwer.address();
      serwer.close(() => {
        if (adres && typeof adres === 'object') ok(adres.port);
        else blad(new Error('Brak wolnego portu'));
      });
    });
  });

export async function uruchomSklep(bledy: string): Promise<UruchomionySklep> {
  const port = await wolnyPort();
  const proces = spawn(process.execPath, ['src/serwer.ts'], {
    env: { ...process.env, PORT: String(port), SKLEP_BLEDY: bledy, SKLEP_DANE_STARTOWE: 'tak' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let wyjscie = '';
  proces.stdout.on('data', (d: Buffer) => (wyjscie += d.toString()));
  proces.stderr.on('data', (d: Buffer) => (wyjscie += d.toString()));
  const baseURL = `http://127.0.0.1:${String(port)}`;
  // Kontrola stanu sama może czekać do 3 s w trybie wolne-api.
  for (let proba = 0; proba < 100; proba++) {
    try {
      if ((await fetch(`${baseURL}/api/health`)).ok) break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  return {
    baseURL,
    logi: () => wyjscie,
    zatrzymaj: () =>
      new Promise<void>((ok) => {
        proces.once('exit', () => { ok(); });
        proces.kill('SIGTERM');
      }),
  };
}
