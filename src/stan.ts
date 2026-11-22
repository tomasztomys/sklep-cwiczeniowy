// Stan sklepu w pamięci (specyfikacja K-5, DS-1–DS-4). Kwoty liczymy w groszach.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export type Rola = 'klient' | 'admin';

export interface Produkt {
  id: number;
  nazwa: string;
  adres: string;
  cenaGr: number;
  opisObrazu: string;
}

interface Uzytkownik {
  rola: Rola;
  sol: Buffer;
  skrot: Buffer;
}

export interface KodRabatowy {
  procent: number;
  aktywny: boolean;
}

interface Koszyk {
  pozycje: Map<number, number>; // produktId → ilość
  kod?: string;
}

export interface PozycjaWidok {
  produktId: number;
  nazwa: string;
  ilosc: number;
  cena: number;
}

export interface KoszykWidok {
  pozycje: PozycjaWidok[];
  suma: number;
}

interface Zamowienie {
  id: number;
  wlasciciel: string;
  pozycje: Map<number, number>;
}

export const MAKS_ILOSC = 99;

const PRODUKTY_STARTOWE: Produkt[] = [
  { id: 7, nazwa: 'Kubek', adres: 'kubek', cenaGr: 4999, opisObrazu: 'Biały kubek z logo sklepu' },
  { id: 12, nazwa: 'Notes', adres: 'notes', cenaGr: 1550, opisObrazu: 'Notes w kratkę z gumką' },
  { id: 15, nazwa: 'Bluza', adres: 'bluza', cenaGr: 12000, opisObrazu: 'Szara bluza z kapturem i logo sklepu' },
];

const KODY_STARTOWE: Record<string, KodRabatowy> = {
  JESIEN10: { procent: 10, aktywny: true },
  LATO5: { procent: 5, aktywny: false },
};

const naZlote = (gr: number): number => gr / 100;

const skrotHasla = (haslo: string, sol: Buffer): Buffer => scryptSync(haslo, sol, 32);

export class Sklep {
  readonly produkty: readonly Produkt[];
  private readonly kody: Record<string, KodRabatowy>;
  private readonly uzytkownicy = new Map<string, Uzytkownik>();
  private readonly sesje = new Map<string, string>(); // token → e-mail
  private readonly koszyki = new Map<string, Koszyk>();
  private readonly zamowienia = new Map<number, Zamowienie>();

  constructor(daneStartowe: boolean) {
    this.produkty = daneStartowe ? PRODUKTY_STARTOWE : [];
    this.kody = daneStartowe ? KODY_STARTOWE : {};
    if (daneStartowe) {
      this.dodajUzytkownika('klient@sklep.test', 'Klient123!', 'klient');
      this.dodajUzytkownika('admin@sklep.test', 'Admin123!', 'admin');
      this.zamowienia.set(1, { id: 1, wlasciciel: 'admin@sklep.test', pozycje: new Map([[7, 1]]) });
    }
  }

  // --- konta i sesje ---

  istnieje(email: string): boolean {
    return this.uzytkownicy.has(email);
  }

  dodajUzytkownika(email: string, haslo: string, rola: Rola = 'klient'): void {
    const sol = randomBytes(16);
    this.uzytkownicy.set(email, { rola, sol, skrot: skrotHasla(haslo, sol) });
  }

  rola(email: string): Rola | undefined {
    return this.uzytkownicy.get(email)?.rola;
  }

  zaloguj(email: string, haslo: string): string | undefined {
    const u = this.uzytkownicy.get(email);
    if (!u || !timingSafeEqual(u.skrot, skrotHasla(haslo, u.sol))) return undefined;
    const token = randomBytes(32).toString('base64url');
    this.sesje.set(token, email);
    return token;
  }

  ktoZalogowany(token: string | undefined): string | undefined {
    if (!token) return undefined;
    const email = this.sesje.get(token);
    return email && this.uzytkownicy.has(email) ? email : undefined;
  }

  wyloguj(token: string): void {
    this.sesje.delete(token);
  }

  usunUzytkownika(email: string): void {
    this.uzytkownicy.delete(email);
    this.koszyki.delete(email);
    for (const [token, wlasciciel] of this.sesje) if (wlasciciel === email) this.sesje.delete(token);
  }

  // --- produkty i kody ---

  produkt(id: number): Produkt | undefined {
    return this.produkty.find((p) => p.id === id);
  }

  produktPoAdresie(adres: string): Produkt | undefined {
    return this.produkty.find((p) => p.adres === adres);
  }

  kodRabatowy(kod: string): KodRabatowy | undefined {
    return Object.hasOwn(this.kody, kod) ? this.kody[kod] : undefined;
  }

  // --- koszyk ---

  private koszyk(email: string): Koszyk {
    let k = this.koszyki.get(email);
    if (!k) {
      k = { pozycje: new Map() };
      this.koszyki.set(email, k);
    }
    return k;
  }

  ilosc(email: string, produktId: number): number | undefined {
    return this.koszyk(email).pozycje.get(produktId);
  }

  ustawIlosc(email: string, produktId: number, ilosc: number): void {
    this.koszyk(email).pozycje.set(produktId, ilosc);
  }

  usunPozycje(email: string, produktId: number): void {
    const k = this.koszyk(email);
    k.pozycje.delete(produktId);
    if (k.pozycje.size === 0) delete k.kod;
  }

  oproznij(email: string): void {
    this.koszyki.set(email, { pozycje: new Map() });
  }

  zastosujKod(email: string, kod: string): void {
    this.koszyk(email).kod = kod;
  }

  widokKoszyka(email: string): KoszykWidok {
    const k = this.koszyk(email);
    const widok = this.widokPozycji(k.pozycje);
    const procent = k.kod ? (this.kodRabatowy(k.kod)?.procent ?? 0) : 0;
    const rabatGr = Math.round((widok.sumaGr * procent) / 100);
    return { pozycje: widok.pozycje, suma: naZlote(widok.sumaGr - rabatGr) };
  }

  private widokPozycji(pozycje: Map<number, number>): { pozycje: PozycjaWidok[]; sumaGr: number } {
    let sumaGr = 0;
    const lista: PozycjaWidok[] = [];
    for (const [produktId, ilosc] of pozycje) {
      const p = this.produkt(produktId);
      if (!p) continue;
      sumaGr += p.cenaGr * ilosc;
      lista.push({ produktId, nazwa: p.nazwa, ilosc, cena: naZlote(p.cenaGr * ilosc) });
    }
    return { pozycje: lista, sumaGr };
  }

  // --- zamówienia ---

  zamowienie(id: number): (KoszykWidok & { id: number; wlasciciel: string }) | undefined {
    const z = this.zamowienia.get(id);
    if (!z) return undefined;
    const w = this.widokPozycji(z.pozycje);
    return { id: z.id, wlasciciel: z.wlasciciel, pozycje: w.pozycje, suma: naZlote(w.sumaGr) };
  }
}
