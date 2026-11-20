import http from 'node:http';
import { randomUUID } from 'node:crypto';

const bledy = (process.env.SKLEP_BLEDY ?? '').split(',').filter(Boolean);
const produkty = [
  { id: 7, nazwa: 'Kubek', cena: 49.99, slug: 'kubek' },
  { id: 12, nazwa: 'Notes', cena: 15.5, slug: 'notes' },
  { id: 15, nazwa: 'Bluza', cena: 120, slug: 'bluza' },
];
const uzytkownicy = new Map([
  ['klient@sklep.test', { haslo: 'Klient123!', rola: 'klient' }],
  ['admin@sklep.test', { haslo: 'Admin123!', rola: 'admin' }],
]);
const sesje = new Map();
const koszyki = new Map();
const zamowienia = new Map([[1, { id: 1, wlasciciel: 'admin@sklep.test', suma: 49.99 }]]);
const kody = { JESIEN10: { procent: 10, aktywny: true }, LATO5: { procent: 5, aktywny: false } };

const zl = (v) => v.toFixed(2).replace('.', ',') + ' zł';
const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
const kto = (req) => {
  const m = /(?:^|;\s*)sesja=([^;]+)/.exec(req.headers.cookie ?? '');
  return m ? sesje.get(m[1]) : undefined;
};
const koszyk = (email) => {
  const poz = (koszyki.get(email) ?? []).map((p) => {
    const pr = produkty.find((x) => x.id === p.produktId);
    return { produktId: p.produktId, nazwa: pr.nazwa, ilosc: p.ilosc, cena: Math.round(pr.cena * p.ilosc * 100) / 100 };
  });
  return { pozycje: poz, suma: Math.round(poz.reduce((s, p) => s + p.cena, 0) * 100) / 100 };
};
const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
};
const html = (res, tytul, tresc, email) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Content-Security-Policy': "frame-ancestors 'none'" });
  res.end(`<!doctype html><html lang="pl"><head><title>${tytul}</title></head><body>
<header><a href="/">Sklep ćwiczeniowy</a> <button aria-label="Koszyk" onclick="location.href='/koszyk'">🛒</button>
${email ? '<button onclick="document.cookie=\'sesja=; Max-Age=0; path=/\';location.href=\'/\'">Wyloguj się</button>' : '<a href="/logowanie">Zaloguj się</a>'}</header>
<main>${tresc}</main>
<footer><p style="color:#c8c8c8">Darmowa dostawa od 200 zł</p><button class="czat"><svg aria-hidden="true" width="16" height="16"></svg></button>
<div class="btn" onclick="alert('zapisano')">Zapisz się do newslettera</div><label>Szukaj <input type="search" id="szukaj-stopka" hidden></label><input type="search" id="szukaj"></footer>
${bledy.includes('zmiana-stylu') ? '<style>button{padding:12px 24px;background:#d33;color:#fff}</style>' : ''}
</body></html>`);
};
const cialo = async (req) => {
  let d = '';
  for await (const c of req) d += c;
  try { return d ? JSON.parse(d) : {}; } catch { return {}; }
};

http.createServer(async (req, res) => {
  req.on('error', () => {});
  res.on('error', () => {});
  try { await obsluz(req, res); } catch { if (!res.headersSent) { res.writeHead(500); } res.end(); }
}).listen(Number(process.env.PORT ?? 3000));

async function obsluz(req, res) {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  const email = kto(req);
  if (p.startsWith('/api/') && bledy.includes('wolne-api')) await czekaj(Math.random() * 3000);
  if (p === '/api/health') return json(res, 200, { status: 'ok' });
  if (p === '/api/products' && req.method === 'GET') {
    const lista = bledy.includes('losowa-kolejnosc') ? [...produkty].sort(() => Math.random() - 0.5) : produkty;
    return json(res, 200, lista.map(({ slug, ...r }) => r));
  }
  if (p === '/api/users' && req.method === 'POST') {
    const b = await cialo(req);
    if (!b.email || !b.haslo) return json(res, 400, { blad: 'Brak e-maila lub hasła' });
    if (uzytkownicy.has(b.email)) return json(res, 409, { blad: 'Użytkownik już istnieje' });
    uzytkownicy.set(b.email, { haslo: b.haslo, rola: 'klient' });
    return json(res, 201, { email: b.email, rola: 'klient' });
  }
  if (p === '/api/login' && req.method === 'POST') {
    const b = await cialo(req);
    const u = uzytkownicy.get(b.email);
    if (!u || u.haslo !== b.haslo) return json(res, 401, { blad: 'Nieprawidłowy e-mail lub hasło' });
    const t = randomUUID();
    sesje.set(t, b.email);
    return json(res, 200, { email: b.email, rola: u.rola }, { 'Set-Cookie': `sesja=${t}; HttpOnly; SameSite=Lax; Path=/` });
  }
  if (p.startsWith('/api/') && p !== '/api/login') {
    if (!email) return json(res, 401, { blad: 'Brak sesji' });
    if (p === '/api/users/me' && req.method === 'DELETE') { uzytkownicy.delete(email); koszyki.delete(email); return json(res, 204); }
    if (p === '/api/cart' && req.method === 'GET') return json(res, 200, koszyk(email));
    if (p === '/api/cart' && req.method === 'DELETE') { koszyki.set(email, []); return json(res, 204); }
    if (p === '/api/cart/items' && req.method === 'POST') {
      const b = await cialo(req);
      if (!produkty.some((x) => x.id === b.produktId)) return json(res, 404, { blad: 'Nie ma takiego produktu' });
      if (!(b.ilosc >= 1)) return json(res, 400, { blad: 'Nieprawidłowa ilość' });
      const l = koszyki.get(email) ?? [];
      const ist = l.find((x) => x.produktId === b.produktId);
      if (ist) ist.ilosc += b.ilosc; else l.push({ produktId: b.produktId, ilosc: b.ilosc });
      koszyki.set(email, l);
      return json(res, 201, koszyk(email));
    }
    if (p === '/api/cart/discount' && req.method === 'POST') {
      const b = await cialo(req);
      const k = kody[b.kod];
      if (!k) return json(res, 400, { blad: 'Nieznany kod rabatowy' });
      if (!k.aktywny) return json(res, 400, { blad: 'Kod rabatowy jest nieaktywny' });
      const ko = koszyk(email);
      return json(res, 200, { ...ko, suma: Math.round(ko.suma * (100 - k.procent)) / 100 });
    }
    const m = /^\/api\/orders\/(\d+)$/.exec(p);
    if (m) {
      const z = zamowienia.get(Number(m[1]));
      if (!z) return json(res, 404, { blad: 'Nie ma takiego zamówienia' });
      if (z.wlasciciel !== email) return json(res, 403, { blad: 'Brak dostępu' });
      return json(res, 200, z);
    }
    return json(res, 404, { blad: 'Nie znaleziono' });
  }
  if (p === '/') {
    return html(res, 'Sklep ćwiczeniowy', `<h1>Produkty</h1><ul id="lista"></ul><p role="status" id="st"></p><p role="alert" id="al"></p>
<script>
const zl=(v)=>v.toFixed(2).replace('.',',')+' zł';
async function dodaj(id){const r=await fetch('/api/cart/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({produktId:id,ilosc:1})});if(r.status===401){location.href='/logowanie';return;}document.getElementById('st').textContent='Dodano do koszyka';}
(async()=>{const r=await fetch('/api/products');if(!r.ok){document.getElementById('al').textContent='Nie udało się wczytać produktów';return;}const l=await r.json();
document.getElementById('lista').innerHTML=l.map(x=>'<li><h2><a href="/produkty/'+x.nazwa.toLowerCase()+'">'+x.nazwa+'</a></h2><p>'+zl(x.cena)+'</p><button data-testid="dodaj-do-koszyka" onclick="dodaj('+x.id+')">Dodaj do koszyka</button></li>').join('');})();
</script>`, email);
  }
  const pm = /^\/produkty\/(\w+)$/.exec(p);
  if (pm) {
    const x = produkty.find((y) => y.slug === pm[1]);
    if (!x) { res.writeHead(404); return res.end(); }
    const cena = bledy.includes('cena-kubka') && x.id === 7 ? 59.99 : x.cena;
    return html(res, `${x.nazwa} – Sklep ćwiczeniowy`, `<h1>${x.nazwa}</h1><img src="/img/${x.slug}.jpg" alt="Biały kubek z logo sklepu"><p class="cena">${zl(cena)}</p>
<label for="ilosc">Ilość</label><input id="ilosc" type="number" value="1">
<button class="btn btn-primary" data-testid="dodaj-do-koszyka" id="dodaj">Dodaj do koszyka</button><p role="status" id="st"></p>
<script>document.getElementById('dodaj').addEventListener('click',async()=>{const r=await fetch('/api/cart/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({produktId:${x.id},ilosc:Number(document.getElementById('ilosc').value)})});if(r.status===401){location.href='/logowanie';return;}setTimeout(()=>{document.getElementById('st').textContent='Dodano do koszyka'},300);});</script>`, email);
  }
  if (p === '/logowanie') {
    return html(res, 'Logowanie – Sklep ćwiczeniowy', `<h1>Logowanie</h1><form id="f"><label for="e">E-mail</label><input id="e" type="email"><label for="h">Hasło</label><input id="h" type="password"><button type="submit">Zaloguj się</button></form><p role="alert" id="al"></p>
<script>document.getElementById('f').addEventListener('submit',async(ev)=>{ev.preventDefault();const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('e').value,haslo:document.getElementById('h').value})});if(r.ok){location.href='/';}else{document.getElementById('al').textContent='Nieprawidłowy e-mail lub hasło';}});</script>`, email);
  }
  if (p === '/koszyk') {
    if (!email) { res.writeHead(302, { Location: '/logowanie' }); return res.end(); }
    const k = koszyk(email);
    const tab = k.pozycje.length ? `<table><thead><tr><th>Produkt</th><th>Ilość</th><th>Cena</th></tr></thead><tbody>${k.pozycje.map((x) => `<tr><td>${x.nazwa}</td><td>${x.ilosc}</td><td>${zl(x.cena)}</td></tr>`).join('')}</tbody></table><p id="suma">Suma: ${zl(k.suma)}</p>` : '<p>Koszyk jest pusty</p>';
    return html(res, 'Koszyk – Sklep ćwiczeniowy', `<h1>Koszyk</h1>${tab}<label for="kod">Kod rabatowy</label><input id="kod"><button id="zast">Zastosuj</button><p role="status" id="st"></p><p role="alert" id="al"></p>
<script>document.getElementById('zast').addEventListener('click',async()=>{const kod=document.getElementById('kod').value;const r=await fetch('/api/cart/discount',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kod})});const d=await r.json();if(r.ok){document.getElementById('st').textContent='Zastosowano kod '+kod;document.getElementById('suma').textContent='Suma: '+d.suma.toFixed(2).replace('.',',')+' zł';}else{document.getElementById('al').textContent=d.blad;}});</script>`, email);
  }
  res.writeHead(404); res.end('nie ma');
}
