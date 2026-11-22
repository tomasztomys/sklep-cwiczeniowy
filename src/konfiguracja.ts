// Konfiguracja ze zmiennych środowiskowych (specyfikacja K-2, K-6, K-7).

export const ZNANE_TRYBY_BLEDOW = ['cena-kubka', 'wolne-api', 'losowa-kolejnosc', 'zmiana-stylu'] as const;
export type TrybBledu = (typeof ZNANE_TRYBY_BLEDOW)[number];

export interface Konfiguracja {
  port: number;
  daneStartowe: boolean;
  bledy: ReadonlySet<TrybBledu>;
  ostrzezenia: string[];
}

const czyTryb = (nazwa: string): nazwa is TrybBledu => (ZNANE_TRYBY_BLEDOW as readonly string[]).includes(nazwa);

export function wczytajKonfiguracje(env: NodeJS.ProcessEnv = process.env): Konfiguracja {
  const ostrzezenia: string[] = [];

  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Nieprawidłowa wartość PORT: ${env.PORT ?? ''}`);
  }

  const daneStartowe = (env.SKLEP_DANE_STARTOWE ?? 'tak').trim() === 'tak';

  const bledy = new Set<TrybBledu>();
  for (const nazwa of (env.SKLEP_BLEDY ?? '').split(',').map((n) => n.trim()).filter(Boolean)) {
    if (czyTryb(nazwa)) bledy.add(nazwa);
    else ostrzezenia.push(`Nieznany tryb SKLEP_BLEDY: "${nazwa}". Znane tryby: ${ZNANE_TRYBY_BLEDOW.join(', ')}.`);
  }

  return { port, daneStartowe, bledy, ostrzezenia };
}
