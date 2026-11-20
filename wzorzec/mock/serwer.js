import http from 'node:http';
const strony = {
  '/': `<!doctype html><html lang="pl"><head><title>Sklep ćwiczeniowy</title></head><body>
<header><a href="/">Sklep ćwiczeniowy</a> <button aria-label="Koszyk">🛒</button></header>
<main><h1>Produkty</h1><ul>
<li><h2><a href="/produkty/kubek">Kubek</a></h2><p>49,99 zł</p><button data-testid="dodaj-do-koszyka">Dodaj do koszyka</button></li>
<li><h2><a href="/produkty/notes">Notes</a></h2><p>15,50 zł</p><button data-testid="dodaj-do-koszyka">Dodaj do koszyka</button></li>
<li><h2><a href="/produkty/bluza">Bluza</a></h2><p>120,00 zł</p><button data-testid="dodaj-do-koszyka">Dodaj do koszyka</button></li>
</ul></main></body></html>`,
  '/produkty/kubek': `<!doctype html><html lang="pl"><head><title>Kubek – Sklep ćwiczeniowy</title></head><body>
<main><h1>Kubek</h1><img src="/img/kubek.jpg" alt="Biały kubek z logo sklepu"><p class="cena">49,99 zł</p>
<label for="ilosc">Ilość</label><input id="ilosc" type="number" value="1">
<button class="btn btn-primary" data-testid="dodaj-do-koszyka">Dodaj do koszyka</button>
<p role="status" id="st"></p></main>
<script>document.querySelector('button').addEventListener('click',()=>setTimeout(()=>{document.getElementById('st').textContent='Dodano do koszyka'},800));</script>
</body></html>`,
};
http.createServer((req, res) => {
  const s = strony[req.url];
  if (!s) { res.writeHead(404); return res.end('nie ma'); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(s);
}).listen(3999);
