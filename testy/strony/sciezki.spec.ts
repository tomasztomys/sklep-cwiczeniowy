import { test, expect, nowyKlient } from '../fixtures.ts';

test.describe('ST-10–ST-14 katalog', () => {
  test('pokazuje trzy produkty z cenami w stałej kolejności', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Produkty', level: 1 })).toBeVisible();
    const produkty = page.getByRole('listitem');
    await expect(produkty.getByRole('heading')).toHaveText(['Kubek', 'Notes', 'Bluza']);
    await expect(produkty.locator('.cena')).toHaveText(['49,99 zł', '15,50 zł', '120,00 zł']);
    await expect(produkty.getByRole('link', { name: 'Notes' })).toHaveAttribute('href', '/produkty/notes');
  });

  test('gość po kliknięciu „Dodaj do koszyka” trafia na logowanie', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('listitem').filter({ hasText: 'Kubek' }).getByRole('button', { name: 'Dodaj do koszyka' }).click();
    await expect(page).toHaveURL('/logowanie');
  });

  test('klient dodaje notes z katalogu', async ({ klient, page }) => {
    await page.goto('/');
    await page.getByRole('listitem').filter({ hasText: 'Notes' }).getByRole('button', { name: 'Dodaj do koszyka' }).click();
    await expect(page.getByRole('status')).toHaveText('Dodano do koszyka');
    await page.goto('/koszyk');
    await expect(page.getByRole('row').filter({ hasText: 'Notes' })).toContainText('15,50 zł');
  });

  for (const [opis, awaria] of [
    ['kod 500', 'blad'],
    ['zerwane połączenie', 'przerwa'],
  ] as const) {
    test(`błąd API produktów (${opis}) daje komunikat`, async ({ page }) => {
      await page.route('**/api/products', (route) => (awaria === 'blad' ? route.fulfill({ status: 500, json: { blad: 'awaria' } }) : route.abort()));
      await page.goto('/');
      await expect(page.getByRole('alert')).toHaveText('Nie udało się wczytać produktów');
    });
  }
});

test.describe('ST-20–ST-23 strona produktu', () => {
  test('karta produktu ma elementy w kolejności z rozdziału 7', async ({ page }) => {
    await page.goto('/produkty/kubek');
    await expect(page.getByRole('main')).toMatchAriaSnapshot(`
      - heading "Kubek" [level=1]
      - img "Biały kubek z logo sklepu"
      - paragraph: /\\d+,\\d{2} zł/
      - spinbutton "Ilość"
      - button "Dodaj do koszyka"
    `);
  });

  test('dodanie dwóch kubków pokazuje komunikat, a koszyk ma 99,98 zł', async ({ klient, page }) => {
    await page.goto('/produkty/kubek');
    await page.getByLabel('Ilość').fill('2');
    await page.getByRole('button', { name: 'Dodaj do koszyka' }).click();
    await expect(page.getByRole('status')).toHaveText('Dodano do koszyka');
    await page.goto('/koszyk');
    await expect(page.getByRole('row').filter({ hasText: 'Kubek' })).toContainText('99,98 zł');
    await expect(page.getByText(/^Suma:/)).toHaveText('Suma: 99,98 zł');
  });

  test('błędna ilość i błąd serwera dają komunikat w alert, bez „Dodano do koszyka”', async ({ klient, page }) => {
    await page.goto('/produkty/kubek');
    await page.getByLabel('Ilość').fill('0');
    await page.getByRole('button', { name: 'Dodaj do koszyka' }).click();
    await expect(page.getByRole('alert')).toHaveText('Nieprawidłowa ilość');
    await page.route('**/api/cart/items', (route) => route.fulfill({ status: 500, json: { blad: 'Błąd serwera' } }));
    await page.getByLabel('Ilość').fill('1');
    await page.getByRole('button', { name: 'Dodaj do koszyka' }).click();
    await expect(page.getByRole('alert')).toHaveText('Błąd serwera');
    await expect(page.getByRole('status')).toHaveText('');
  });
});

test.describe('ST-30–ST-32, ST-50–ST-52, S-4 konta', () => {
  test('błędne hasło daje komunikat, poprawne loguje i przenosi na stronę główną', async ({ page }) => {
    await page.goto('/logowanie');
    await expect(page.getByPlaceholder('np. jan@example.com')).toBeVisible();
    await page.getByLabel('E-mail').fill('klient@sklep.test');
    await page.getByLabel('Hasło').fill('zle-haslo');
    await page.getByRole('button', { name: 'Zaloguj się' }).click();
    await expect(page.getByRole('alert')).toHaveText('Nieprawidłowy e-mail lub hasło');
    await page.getByLabel('Hasło').fill('Klient123!');
    await page.getByRole('button', { name: 'Zaloguj się' }).click();
    await expect(page.getByRole('button', { name: 'Wyloguj się' })).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('wylogowanie kończy sesję', async ({ klient, page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Wyloguj się' }).click();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Zaloguj się' })).toBeVisible();
    await page.goto('/koszyk');
    await expect(page).toHaveURL('/logowanie');
  });

  test('rejestracja zakłada konto, a potem można się zalogować', async ({ page }) => {
    const dane = nowyKlient();
    await page.goto('/logowanie');
    await page.getByRole('link', { name: 'Załóż konto' }).click();
    await expect(page.getByRole('heading', { name: 'Rejestracja', level: 1 })).toBeVisible();
    await page.getByLabel('E-mail').fill(dane.email);
    await page.getByLabel('Hasło').fill(dane.haslo);
    await page.getByRole('button', { name: 'Załóż konto' }).click();
    await expect(page).toHaveURL('/logowanie?konto=zalozone');
    await expect(page.getByRole('status')).toHaveText('Konto zostało założone. Zaloguj się.');
    await page.getByLabel('E-mail').fill(dane.email);
    await page.getByLabel('Hasło').fill(dane.haslo);
    await page.getByRole('button', { name: 'Zaloguj się' }).click();
    await expect(page.getByRole('button', { name: 'Wyloguj się' })).toBeVisible();
    await page.request.delete('/api/users/me');
  });

  test('rejestracja zajętego adresu pokazuje błąd z API', async ({ page }) => {
    await page.goto('/rejestracja');
    await page.getByLabel('E-mail').fill('klient@sklep.test');
    await page.getByLabel('Hasło').fill('cokolwiek');
    await page.getByRole('button', { name: 'Załóż konto' }).click();
    await expect(page.getByRole('alert')).toHaveText('Użytkownik już istnieje');
  });
});

test.describe('ST-40–ST-48 koszyk', () => {
  test('przycisk „Koszyk” w nagłówku prowadzi do koszyka, pusty koszyk ma komunikat', async ({ klient, page }) => {
    await page.goto('/produkty/notes');
    await page.getByRole('banner').getByRole('button', { name: 'Koszyk' }).click();
    await expect(page).toHaveURL('/koszyk');
    await expect(page.getByText('Koszyk jest pusty')).toBeVisible();
  });

  test('usuwanie pozycji i całego koszyka', async ({ klient, page }) => {
    await page.request.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
    await page.request.post('/api/cart/items', { data: { produktId: 12, ilosc: 3 } });
    await page.goto('/koszyk');
    await expect(page.getByRole('row').filter({ hasText: 'Notes' })).toContainText('46,50 zł');
    await page.getByRole('row').filter({ hasText: 'Notes' }).getByRole('button', { name: 'Usuń' }).click();
    await expect(page.getByRole('row').filter({ hasText: 'Notes' })).toHaveCount(0);
    await expect(page.getByText(/^Suma:/)).toHaveText('Suma: 49,99 zł');
    await expect(page.getByTitle('Usuń z koszyka')).toHaveCount(1);
    await page.getByRole('button', { name: 'Usuń wszystko' }).click();
    await expect(page.getByText('Koszyk jest pusty')).toBeVisible();
    expect(await (await page.request.get('/api/cart')).json()).toEqual({ pozycje: [], suma: 0 });
  });

  test('kod JESIEN10 obniża sumę i zostaje po odświeżeniu', async ({ klient, page }) => {
    await page.request.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
    await page.goto('/koszyk');
    await page.getByLabel('Kod rabatowy').fill('JESIEN10');
    await page.getByRole('button', { name: 'Zastosuj' }).click();
    await expect(page.getByRole('status')).toHaveText('Zastosowano kod JESIEN10');
    await expect(page.getByText(/^Suma:/)).toHaveText('Suma: 44,99 zł');
    await page.reload();
    await expect(page.getByText(/^Suma:/)).toHaveText('Suma: 44,99 zł');
  });

  for (const { kod, blad } of [
    { kod: 'LATO5', blad: 'Kod rabatowy jest nieaktywny' },
    { kod: 'XYZ', blad: 'Nieznany kod rabatowy' },
  ]) {
    test(`kod ${kod} daje alert i nie zmienia sumy`, async ({ klient, page }) => {
      await page.request.post('/api/cart/items', { data: { produktId: 7, ilosc: 1 } });
      await page.goto('/koszyk');
      await page.getByLabel('Kod rabatowy').fill(kod);
      await page.getByRole('button', { name: 'Zastosuj' }).click();
      await expect(page.getByRole('alert')).toHaveText(blad);
      await expect(page.getByText(/^Suma:/)).toHaveText('Suma: 49,99 zł');
    });
  }

  test('kod z HTML nie wykonuje skryptu (ST-46)', async ({ klient, page }) => {
    let okienko = false;
    page.on('dialog', async (d) => {
      okienko = true;
      await d.dismiss();
    });
    await page.goto('/koszyk');
    await page.getByLabel('Kod rabatowy').fill('<img src=x onerror=alert(1)>');
    await page.getByRole('button', { name: 'Zastosuj' }).click();
    await expect(page.getByRole('alert')).toHaveText('Nieznany kod rabatowy');
    expect(okienko).toBe(false);
  });
});
