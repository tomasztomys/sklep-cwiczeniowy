// Strony sklepu (specyfikacja, rozdział 4). Teksty i role są kontraktem z książką.
import { Hono, type Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { html, raw } from 'hono/html';
import type { Konfiguracja } from '../konfiguracja.ts';
import type { KoszykWidok, Sklep } from '../stan.ts';
import { uklad, zl } from './uklad.ts';

const zlZ = (zlote: number): string => zl(Math.round(zlote * 100));

// Wspólne funkcje skryptów w przeglądarce. Dane od użytkownika zawsze jako textContent (ST-46).
const pomocnicy = `
const zl = (v) => v.toFixed(2).replace('.', ',') + ' zł';
const ustaw = (id, tekst) => { document.getElementById(id).textContent = tekst; };
const wyslij = async (adres, metoda, dane) => {
  const odpowiedz = await fetch(adres, { method: metoda, headers: { 'Content-Type': 'application/json' }, body: dane === undefined ? undefined : JSON.stringify(dane) });
  if (odpowiedz.status === 401) { location.href = '/logowanie'; return null; }
  const tresc = odpowiedz.status === 204 ? null : await odpowiedz.json().catch(() => null);
  return { ok: odpowiedz.ok, status: odpowiedz.status, tresc };
};`;

function tabelaKoszyka(k: KoszykWidok) {
  if (k.pozycje.length === 0) return html`<p>Koszyk jest pusty</p>`;
  return html`<table>
  <thead><tr><th scope="col">Produkt</th><th scope="col">Ilość</th><th scope="col">Cena</th><th scope="col"><span class="niewidoczny">Akcje</span></th></tr></thead>
  <tbody>${k.pozycje.map(
    (p) => html`<tr><td>${p.nazwa}</td><td>${p.ilosc}</td><td>${zlZ(p.cena)}</td><td><button type="button" class="btn btn-drugorzedny" title="Usuń z koszyka" data-usun="${p.produktId}">Usuń</button></td></tr>`,
  )}</tbody>
</table>
<p class="suma" id="suma">Suma: ${zlZ(k.suma)}</p>
<button type="button" class="btn btn-drugorzedny" id="usun-wszystko">Usuń wszystko</button>`;
}

export function utworzStrony(sklep: Sklep, konfiguracja: Konfiguracja): Hono {
  const strony = new Hono();
  const zalogowany = (c: Context) => sklep.ktoZalogowany(getCookie(c, 'sesja'));
  const zmianaStylu = konfiguracja.bledy.has('zmiana-stylu');
  const strona = (c: Context, tytul: string | undefined, tresc: ReturnType<typeof html>, status: 200 | 404 = 200) =>
    c.html(uklad({ tytul, email: zalogowany(c), zmianaStylu, tresc }), status);

  strony.get('/', (c) =>
    strona(
      c,
      undefined,
      html`<h1>Produkty</h1>
<ul class="produkty" id="lista"></ul>
<p role="status" id="komunikat"></p>
<p role="alert" id="blad"></p>
<script>${raw(pomocnicy)}
const adres = (nazwa) => nazwa.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/ł/g, 'l');
async function dodaj(produktId) {
  ustaw('komunikat', ''); ustaw('blad', '');
  const wynik = await wyslij('/api/cart/items', 'POST', { produktId, ilosc: 1 });
  if (!wynik) return;
  if (wynik.ok) ustaw('komunikat', 'Dodano do koszyka'); else ustaw('blad', wynik.tresc?.blad ?? 'Nie udało się dodać produktu');
}
(async () => {
  let produkty;
  try {
    const odpowiedz = await fetch('/api/products');
    if (!odpowiedz.ok) throw new Error(String(odpowiedz.status));
    produkty = await odpowiedz.json();
  } catch {
    ustaw('blad', 'Nie udało się wczytać produktów');
    return;
  }
  const lista = document.getElementById('lista');
  for (const p of produkty) {
    const li = document.createElement('li'); li.className = 'produkt';
    const h2 = document.createElement('h2'); const a = document.createElement('a');
    a.href = '/produkty/' + adres(p.nazwa); a.textContent = p.nazwa; h2.append(a);
    const cena = document.createElement('p'); cena.className = 'cena'; cena.textContent = zl(p.cena);
    const przycisk = document.createElement('button'); przycisk.type = 'button'; przycisk.className = 'btn btn-primary';
    przycisk.dataset.testid = 'dodaj-do-koszyka'; przycisk.textContent = 'Dodaj do koszyka';
    przycisk.addEventListener('click', () => dodaj(p.id));
    li.append(h2, cena, przycisk); lista.append(li);
  }
})();
</script>`,
    ),
  );

  strony.get('/produkty/:adres', (c) => {
    const p = sklep.produktPoAdresie(c.req.param('adres'));
    if (!p) return nieZnaleziono(c);
    const cenaGr = konfiguracja.bledy.has('cena-kubka') && p.id === 7 ? 5999 : p.cenaGr;
    return strona(
      c,
      p.nazwa,
      html`<div class="karta-produktu">
<h1>${p.nazwa}</h1>
<img src="/img/${p.adres}.jpg" alt="${p.opisObrazu}" width="600" height="600">
<p class="cena">${zl(cenaGr)}</p>
<div>
<label for="ilosc">Ilość</label>
<input id="ilosc" type="number" value="1" min="1" max="99">
</div>
<div class="akcje"><button type="button" class="btn btn-primary" data-testid="dodaj-do-koszyka" id="dodaj" data-produkt="${p.id}">Dodaj do koszyka</button></div>
<p role="status" id="komunikat"></p>
<p role="alert" id="blad"></p>
</div>
<script>${raw(pomocnicy)}
document.getElementById('dodaj').addEventListener('click', async (e) => {
  ustaw('komunikat', ''); ustaw('blad', '');
  const produktId = Number(e.currentTarget.dataset.produkt);
  const wynik = await wyslij('/api/cart/items', 'POST', { produktId, ilosc: Number(document.getElementById('ilosc').value) });
  if (!wynik) return;
  if (wynik.ok) setTimeout(() => ustaw('komunikat', 'Dodano do koszyka'), 300);
  else ustaw('blad', wynik.tresc?.blad ?? 'Nie udało się dodać produktu');
});
</script>`,
    );
  });

  const formularzKonta = (rodzaj: 'logowanie' | 'rejestracja', komunikat = '') =>
    html`<h1>${rodzaj === 'logowanie' ? 'Logowanie' : 'Rejestracja'}</h1>
<form class="formularz" id="formularz" novalidate>
<label for="email">E-mail</label>
<input id="email" name="email" type="email" ${rodzaj === 'logowanie' ? html`placeholder="np. jan@example.com" ` : ''}autocomplete="username">
<label for="haslo">Hasło</label>
<input id="haslo" name="haslo" type="password" autocomplete="${rodzaj === 'logowanie' ? 'current-password' : 'new-password'}">
<button type="submit" class="btn btn-primary">${rodzaj === 'logowanie' ? 'Zaloguj się' : 'Załóż konto'}</button>
</form>
<p role="status" id="komunikat">${komunikat}</p>
<p role="alert" id="blad"></p>
${rodzaj === 'logowanie' ? html`<p>Nie masz konta? <a href="/rejestracja">Załóż konto</a></p>` : html`<p>Masz już konto? <a href="/logowanie">Przejdź do logowania</a></p>`}
<script>
document.getElementById('formularz').addEventListener('submit', async (e) => {
  e.preventDefault();
  document.getElementById('komunikat').textContent = '';
  document.getElementById('blad').textContent = '';
  const dane = { email: document.getElementById('email').value, haslo: document.getElementById('haslo').value };
  const odpowiedz = await fetch('${rodzaj === 'logowanie' ? '/api/login' : '/api/users'}', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dane) });
  if (odpowiedz.ok) { location.href = '${rodzaj === 'logowanie' ? '/' : '/logowanie?konto=zalozone'}'; return; }
  const tresc = await odpowiedz.json().catch(() => ({}));
  document.getElementById('blad').textContent = tresc.blad ?? 'Coś poszło nie tak';
});
</script>`;

  strony.get('/logowanie', (c) =>
    strona(c, 'Logowanie', formularzKonta('logowanie', c.req.query('konto') === 'zalozone' ? 'Konto zostało założone. Zaloguj się.' : '')),
  );
  strony.get('/rejestracja', (c) => strona(c, 'Rejestracja', formularzKonta('rejestracja')));

  strony.get('/koszyk', (c) => {
    const email = zalogowany(c);
    if (!email) return c.redirect('/logowanie', 302);
    return strona(
      c,
      'Koszyk',
      html`<h1>Koszyk</h1>
<div id="koszyk">${tabelaKoszyka(sklep.widokKoszyka(email))}</div>
<div class="rabat">
<label for="kod">Kod rabatowy</label>
<div class="akcje"><input id="kod" class="pole" type="text" autocomplete="off"><button type="button" class="btn btn-primary" id="zastosuj">Zastosuj</button></div>
</div>
<p role="status" id="komunikat"></p>
<p role="alert" id="blad"></p>
<script>${raw(pomocnicy)}
const koszyk = document.getElementById('koszyk');
function pokaz(k) {
  koszyk.replaceChildren();
  if (k.pozycje.length === 0) { const p = document.createElement('p'); p.textContent = 'Koszyk jest pusty'; koszyk.append(p); return; }
  const tabela = document.createElement('table');
  tabela.innerHTML = '<thead><tr><th scope="col">Produkt</th><th scope="col">Ilość</th><th scope="col">Cena</th><th scope="col"><span class="niewidoczny">Akcje</span></th></tr></thead><tbody></tbody>';
  for (const p of k.pozycje) {
    const tr = document.createElement('tr');
    for (const tekst of [p.nazwa, String(p.ilosc), zl(p.cena)]) { const td = document.createElement('td'); td.textContent = tekst; tr.append(td); }
    const td = document.createElement('td'); const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn btn-drugorzedny'; b.title = 'Usuń z koszyka'; b.dataset.usun = String(p.produktId); b.textContent = 'Usuń';
    td.append(b); tr.append(td); tabela.tBodies[0].append(tr);
  }
  const suma = document.createElement('p'); suma.className = 'suma'; suma.id = 'suma'; suma.textContent = 'Suma: ' + zl(k.suma);
  const wszystko = document.createElement('button'); wszystko.type = 'button'; wszystko.className = 'btn btn-drugorzedny'; wszystko.id = 'usun-wszystko'; wszystko.textContent = 'Usuń wszystko';
  koszyk.append(tabela, suma, wszystko);
}
koszyk.addEventListener('click', async (e) => {
  const cel = e.target.closest('button');
  if (!cel) return;
  ustaw('komunikat', ''); ustaw('blad', '');
  if (cel.id === 'usun-wszystko') {
    const wynik = await wyslij('/api/cart', 'DELETE');
    if (wynik?.ok) pokaz({ pozycje: [], suma: 0 });
  } else if (cel.dataset.usun) {
    const wynik = await wyslij('/api/cart/items/' + cel.dataset.usun, 'DELETE');
    if (wynik?.ok) pokaz(wynik.tresc); else if (wynik) ustaw('blad', wynik.tresc?.blad ?? 'Nie udało się usunąć');
  }
});
document.getElementById('zastosuj').addEventListener('click', async () => {
  ustaw('komunikat', ''); ustaw('blad', '');
  const kod = document.getElementById('kod').value;
  const wynik = await wyslij('/api/cart/discount', 'POST', { kod });
  if (!wynik) return;
  if (wynik.ok) { pokaz(wynik.tresc); ustaw('komunikat', 'Zastosowano kod ' + kod); }
  else ustaw('blad', wynik.tresc?.blad ?? 'Nie udało się zastosować kodu');
});
</script>`,
    );
  });

  function nieZnaleziono(c: Context) {
    return strona(c, 'Nie znaleziono', html`<h1>Nie ma takiej strony</h1><p><a href="/">Wróć do katalogu</a></p>`, 404);
  }
  strony.all('*', nieZnaleziono);

  return strony;
}
