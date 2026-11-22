// Wspólny układ stron: nagłówek, obszar główny i stopka z celowymi usterkami (ST-1–ST-5, U-1–U-4).
import { html } from 'hono/html';
import type { HtmlEscapedString } from 'hono/utils/html';

type Tresc = HtmlEscapedString | Promise<HtmlEscapedString>;

export const zl = (gr: number): string => `${(gr / 100).toFixed(2).replace('.', ',')} zł`;

const ikonaKoszyka = html`<svg aria-hidden="true" focusable="false" width="22" height="22" viewBox="0 0 24 24"><path d="M4 7h16l-1.6 11.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8L4 7z M9 7a3 3 0 0 1 6 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
const ikonaCzatu = html`<svg aria-hidden="true" focusable="false" width="22" height="22" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;

export interface Strona {
  tytul?: string;
  email?: string;
  zmianaStylu?: boolean;
  tresc: Tresc;
}

export function uklad({ tytul, email, zmianaStylu = false, tresc }: Strona): Tresc {
  return html`<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${tytul ? `${tytul} – Sklep ćwiczeniowy` : 'Sklep ćwiczeniowy'}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styl.css">${zmianaStylu ? html`\n<link rel="stylesheet" href="/zmiana-stylu.css">` : ''}
</head>
<body>
<header class="naglowek">
  <a class="logo" href="/">Sklep ćwiczeniowy</a>
  <div class="naglowek-akcje">
    <button type="button" class="ikona" aria-label="Koszyk" data-przejdz="/koszyk">${ikonaKoszyka}</button>
    ${email ? html`<button type="button" class="btn btn-drugorzedny" id="wyloguj">Wyloguj się</button>` : html`<a class="btn btn-drugorzedny" href="/logowanie">Zaloguj się</a>`}
  </div>
</header>
<main class="tresc">
${tresc}
</main>
<footer class="stopka">
  <p class="dostawa">Darmowa dostawa od 200 zł</p>
  <button type="button" class="ikona czat">${ikonaCzatu}</button>
  <div class="btn newsletter" id="newsletter">Zapisz się do newslettera</div>
  <span class="newsletter-potwierdzenie" id="newsletter-potwierdzenie"></span>
  <input type="search" class="szukaj">
</footer>
<script>
document.querySelectorAll('[data-przejdz]').forEach((b) => b.addEventListener('click', () => { location.href = b.dataset.przejdz; }));
document.getElementById('wyloguj')?.addEventListener('click', async () => { await fetch('/api/logout', { method: 'POST' }); location.href = '/'; });
document.getElementById('newsletter').addEventListener('click', () => { document.getElementById('newsletter-potwierdzenie').textContent = 'Dziękujemy za zapis'; });
</script>
</body>
</html>`;
}
