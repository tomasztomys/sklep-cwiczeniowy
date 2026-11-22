# Specyfikacja sklepu ćwiczeniowego 1.0

Status: **zatwierdzona 2026-11-22** (decyzje w `docs/decyzje.md`).

Ten dokument jest źródłem prawdy o zachowaniu sklepu. Nazwy dostępne, role, komunikaty, kody odpowiedzi,
treść błędów, ciasteczka, nagłówki, zmienne środowiskowe i dane startowe są kontraktem z książką:
zmiana jednego znaku oznacza zmianę w tekście książki.

## Jak czytać ten dokument

Każde wymaganie ma identyfikator i źródło.

- `R7 §7.2 «cytat»` – wymaganie wynika z książki: rozdział, podrozdział i dosłowny cytat. `W` to Wstęp, `DA`–`DF` to dodatki.
- `[makieta]` – zachowanie makiety z `wzorzec/mock/sklep.js`, którego książka nie opisuje. Zatwierdzone.
- `[plan]` – ustalenie z planu sklepu („Plan: sklep i repozytorium”), którego książka nie opisuje. Zatwierdzone.
- `[propozycja]` – ustalenie tam, gdzie książka czegoś wymaga, ale nie mówi jak. Zatwierdzone (`docs/decyzje.md`, część C).
- `[decyzja B-n]` – zmiana sklepu przyjęta przy rozstrzyganiu rozbieżności z `docs/rozbieznosci.md`.

Celowe usterki dostępności są opisane osobno w `docs/usterki-celowe.md`.

---

## 1. Uruchomienie i konfiguracja

**K-1. Obraz.** Sklep jest dostarczany jako obraz `ghcr.io/tomasztomys/sklep-cwiczeniowy:1.0` dla `linux/amd64` i `linux/arm64` [plan].
- R3 §3.3 «image: ghcr.io/AUTOR/sklep-cwiczeniowy:1.0»
- R13 §13.2 «Sklep ćwiczeniowy 1.0 z SKLEP_BLEDY=cena-kubka»

**K-2. Port.** Sklep słucha na porcie z zmiennej `PORT`, domyślnie 3000 [plan], na wszystkich interfejsach, bo w CI i w Dockerze łączą się z nim inne kontenery.
- R3 §3.3 «Po docker compose up -d otwórz w przeglądarce adres http://localhost:3000»
- R12 §12.1 «BASE_URL: http://sklep:3000»
- R11 §11.1 «host.docker.internal pozwala kontenerowi dotrzeć do sklepu działającego na twoim komputerze.»

**K-3. Kontrola stanu.** `GET /api/health` zwraca `200` i `{"status":"ok"}`, bez sesji. Obraz ma `HEALTHCHECK` oparty na tym adresie [plan]. `HEALTHCHECK` korzysta tylko z narzędzi obecnych w obrazie i ma limit czasu powyżej 3 s, bo tryb `wolne-api` opóźnia także `/api/health` [propozycja].
- R3 §3.3 «Adres http://localhost:3000/api/health powinien zwrócić odpowiedź {"status":"ok"}.»

**K-4. Czas startu.** Sklep odpowiada na `/api/health` w ciągu kilku sekund od startu kontenera.
- R3 §3.3 «Kolejne starty zajmują sekundy.»
- R12 §12.1 «W CI sklep startuje razem z testami i potrzebuje kilku sekund, żeby zacząć odpowiadać.»

**K-5. Stan w pamięci.** Dane są trzymane w pamięci procesu. Każdy start kontenera zaczyna od stanu początkowego.
- R3 §3.3 «dane wracają do stanu początkowego»
- R3 §3.3 «Po nim kolejne uruchomienie startuje sklep od stanu początkowego. To celowe: testy potrzebują przewidywalnego punktu wyjścia»

**K-6. `SKLEP_DANE_STARTOWE`.** Wartość `tak` wczytuje dane startowe z rozdziału 2 tej specyfikacji. Domyślnie `tak` [plan]. Inna wartość uruchamia pusty sklep: bez produktów, kont i kodów [propozycja].
- R3 §3.3 «SKLEP_DANE_STARTOWE wczytuje przykładowe produkty, konta testowe i kody rabatowe, w tym JESIEN10 z rozdziału 2.»

**K-7. `SKLEP_BLEDY`.** Lista trybów błędów rozdzielona przecinkami (rozdział 7). Pusta wartość albo brak zmiennej oznacza sklep bez błędów. Nieznana nazwa trybu: ostrzeżenie w logach z listą znanych trybów, sklep startuje normalnie [propozycja].
- R3 §3.3 «SKLEP_BLEDY jest na razie puste.»
- R10 «Możesz włączyć obie naraz, oddzielając je przecinkiem.»

**K-8. Usługa w GitHub Actions.** Obraz działa jako `services:` bez dodatkowych poleceń i argumentów, z samą zmienną `SKLEP_DANE_STARTOWE`.
- R12 §12.1 «SKLEP_DANE_STARTOWE: 'tak'»

**K-9. Brak zewnętrznej sieci.** Sklep nie pobiera niczego z internetu: obrazy, czcionki, style i skrypty są w obrazie [plan].

---

## 2. Dane startowe

**DS-1. Produkty.** Katalog ma dokładnie trzy produkty, w tej kolejności:

| id | Nazwa | Adres strony | Cena | Tekst alternatywny obrazu |
| --- | --- | --- | --- | --- |
| 7 | Kubek | `/produkty/kubek` | 49,99 zł | Biały kubek z logo sklepu |
| 12 | Notes | `/produkty/notes` [makieta] | 15,50 zł | [propozycja] |
| 15 [makieta] | Bluza | `/produkty/bluza` [makieta] | 120,00 zł [makieta] | [propozycja] |

- R7 §7.2 «W katalogu sklepu są trzy produkty: Kubek, Notes i Bluza.»
- R7 ćw. 2 «katalog pokazuje trzy produkty w kolejności Kubek, Notes, Bluza»
- R4 §4.3 «const kubek: Produkt = { id: 7, nazwa: 'Kubek', cena: 49.99 };»
- R4 §4.4 «{ produkt: { id: 12, nazwa: 'Notes', cena: 15.5 }, ilosc: 1 },»
- R13 §13.2 «49,99 zł, zgodnie z danymi startowymi sklepu»
- R7 ćw. 2 «a wiersz koszyka zawiera „Notes” i cenę 15,50 zł»
- R5 §5.1 «<img src="/img/kubek.jpg" alt="Biały kubek z logo sklepu">»

**DS-2. Konta testowe.**

| Rola | E-mail | Hasło |
| --- | --- | --- |
| `klient` | `klient@sklep.test` | `Klient123!` |
| `admin` | `admin@sklep.test` | `Admin123!` |

- R3 §3.3 «Klient | klient@sklep.test | Klient123!»
- R3 §3.3 «Administrator | admin@sklep.test | Admin123!»
- R9 §9.3 «rola: z.enum(['klient', 'admin']),»

**DS-3. Kody rabatowe.** `JESIEN10` jest aktywny i obniża sumę o 10%. `LATO5` jest nieaktywny (5%). Wielkość liter ma znaczenie.
- R15 §15.2 «kod JESIEN10 jest aktywny i obniża sumę o 10%, kod LATO5 jest nieaktywny, kody rozróżniają wielkość liter»
- R4 ćw. 1 «JESIEN10 (10%, aktywny) i LATO5 (5%, nieaktywny)»

**DS-4. Zamówienie nr 1** należy do administratora. Kwota i pozycje: [makieta] jeden kubek, suma 49,99 zł.
- R5 ćw. 3 «pobierz zamówienie numer 1, które w danych startowych należy do administratora»

---

## 3. Sesja i konta

**S-1. Ciasteczko sesji.** Po udanym logowaniu serwer ustawia ciasteczko `sesja` z atrybutami `HttpOnly`, `SameSite=Lax` i `Path=/`, bez `Secure` (sklep działa przez HTTP). Wartość jest losowa i nieprzewidywalna.
- R5 §5.3 «Set-Cookie: sesja=8f3a...; HttpOnly; SameSite=Lax; Path=/»
- R11 §11.4 «Na środowisku z HTTPS dopisz sprawdzenie atrybutu Secure.»

**S-2. Sesja w API i na stronach.** Ta sama sesja działa dla stron i dla API. Sklep rozpoznaje użytkownika wyłącznie po ciasteczku `sesja`, także wysłanym ręcznie w nagłówku `Cookie`.
- R5 §5.3 «Po zalogowaniu serwer ustawia ciasteczko sesja nagłówkiem Set-Cookie.»
- R5 ćw. 4 «Pozostałe metody mają wysyłać je w nagłówku Cookie»

**S-3. Logowanie przez stronę** kończy się przejściem na `/`, gdzie w nagłówku jest przycisk „Wyloguj się”.
- R7 §7.3 «Po zalogowaniu adres to /»
- R6 §6.4 «Ty wiesz: na przycisk „Wyloguj się”.»

**S-4. Wylogowanie.** Przycisk „Wyloguj się” unieważnia sesję na serwerze, usuwa ciasteczko i przenosi na `/`. Służy do tego `POST /api/logout` [propozycja]. Po wylogowaniu nagłówek pokazuje link „Zaloguj się”.
- R8 ćw. 1 «obiekt komponentu Naglowek z przyciskami „Koszyk” i „Wyloguj się”»
- R5 §5.2 «Usunięcie ciasteczka sesji symuluje wylogowanie albo wygaśnięcie sesji.»

**S-5. Brak wygasania.** Sesja nie wygasa sama do restartu sklepu albo wylogowania [makieta].

**S-6. Rejestracja** odbywa się przez API (`POST /api/users`). Nowe konto ma rolę `klient` i nie jest automatycznie logowane [makieta].
- R8 «rejestracji nowego klienta przez API (POST /api/users)»

**S-7. Koszyk jest po stronie serwera**, przypisany do konta, i przetrwa zamknięcie przeglądarki.
- R7 §7.3 «koszyk zostaje na serwerze także po zakończeniu testu»

---

## 4. Strony

### 4.1. Elementy wspólne

**ST-1. Tytuł.** Tytuł każdej strony zawiera „Sklep ćwiczeniowy”. Strona główna ma tytuł „Sklep ćwiczeniowy”, pozostałe „<Nazwa strony> – Sklep ćwiczeniowy” [makieta].
- R6 §6.2 «await expect(page).toHaveTitle(/Sklep ćwiczeniowy/);»

**ST-2. Nagłówek** (`<header>` na najwyższym poziomie, rola `banner`) zawiera:
- link „Sklep ćwiczeniowy” do `/` [makieta],
- przycisk „Koszyk” z ikoną SVG i nazwą dostępną z `aria-label`, który przenosi na `/koszyk`,
- dla niezalogowanego **link** „Zaloguj się” do `/logowanie`. Nie może to być przycisk, bo na stronie logowania kolidowałby z przyciskiem formularza (T-1) [makieta],
- dla zalogowanego przycisk „Wyloguj się” (S-4).

Źródła:
- R7 §7.2 «Element <header> na najwyższym poziomie ma rolę banner, więc przycisk koszyka w nagłówku znajdziesz tak:»
- R5 §5.1 «<button aria-label="Koszyk"><svg>…</svg></button>»
- R7 ćw. 3 «Przycisk „Koszyk” w nagłówku prowadzi do strony /koszyk.»

**ST-3. Obszar główny.** Treść strony jest w jednym elemencie `<main>` (rola `main`).
- R7 §7.4 «await expect(page.getByRole('main')).toMatchAriaSnapshot(`»

**ST-4. Stopka** na każdej stronie zawiera dokładnie cztery celowe usterki z `docs/usterki-celowe.md` i nic, co dawałoby inne naruszenia WCAG.

**ST-5. Konsola przeglądarki** jest czysta: żadna strona nie zgłasza błędów JavaScriptu ani nieudanych żądań, np. brakujących obrazów.
- R5 §5.2 «Sprawdź, czy przy wejściu na stronę nie pojawiają się czerwone błędy»

**ST-6. Format ceny.** Ceny na stronach mają format `49,99 zł`: przecinek dziesiętny, dwa miejsca po przecinku, zwykła spacja (U+0020) przed `zł`, bez separatora tysięcy, np. `1200,00 zł` [propozycja]. Zwykła spacja jest konieczna, bo mutacja z rozdziału 16 podmienia tekst `49,99 zł` w treści strony (T-5).
- R9 §9.5 «Tak sprawdzisz, jak katalog formatuje cenę, której nie ma w danych startowych:»
- R9 §9.5 «toContainText('9,90 zł');»

### 4.2. Katalog `/`

**ST-10.** Nagłówek pierwszego stopnia „Produkty”.
- R6 §6.2 «await expect(page.getByRole('heading', { name: 'Produkty', level: 1 })).toBeVisible();»

**ST-11. Lista produktów** ładowana w przeglądarce z `GET /api/products`, z danych z odpowiedzi (nazwa, cena). Kolejność jak w odpowiedzi API.
- R9 §9.5 «Katalog sklepu pobiera listę produktów w przeglądarce, wywołując GET /api/products.»

**ST-12. Element listy produktu** (`<li>`, rola `listitem`) zawiera kolejno: nagłówek poziomu 2 z linkiem do strony produktu, cenę i przycisk „Dodaj do koszyka” z `data-testid="dodaj-do-koszyka"`. Na stronie głównej nie ma innych elementów listy niż produkty, a każdy element ma dokładnie jeden nagłówek.
- R7 §7.2 «await notes.getByRole('button', { name: 'Dodaj do koszyka' }).click();»
- R7 §7.2 «has: page.getByRole('heading', { name: 'Notes' }),»
- R7 §7.2 «await expect(produkty).toHaveCount(3);»
- R7 §7.2 «await expect(produkty.getByRole('heading')).toHaveText(['Kubek', 'Notes', 'Bluza']);»
- R7 §7.2 «1) <button data-testid="dodaj-do-koszyka">Dodaj do koszyka</button> aka ...»
- R9 §9.5 «await expect(page.getByRole('listitem').filter({ hasText: 'Kubek' })).toContainText('9,90 zł');»

**ST-13. Dodanie z katalogu.** Kliknięcie „Dodaj do koszyka” dodaje 1 sztukę przez `POST /api/cart/items` i pokazuje w obszarze `status` tekst „Dodano do koszyka”. Niezalogowanego przenosi na `/logowanie` [makieta].
- R7 ćw. 2 «klient dodaje notes do koszyka z poziomu katalogu»

**ST-14. Błąd wczytania.** Gdy `GET /api/products` zwróci kod spoza 2xx albo połączenie zostanie zerwane, w obszarze `alert` pojawia się „Nie udało się wczytać produktów”. Pusta lista z API daje pustą listę bez komunikatu [propozycja].
- R9 §9.5 «await expect(page.getByRole('alert')).toHaveText('Nie udało się wczytać produktów');»
- R9 §9.5 «route.abort(), który symuluje zerwane połączenie»

### 4.3. Strona produktu `/produkty/<adres>`

**ST-20. Treść** obszaru `main`, w tej kolejności: nagłówek poziomu 1 z nazwą, obraz z tekstem alternatywnym, cena w akapicie `<p class="cena">`, pole liczbowe `<input id="ilosc" type="number" value="1">` z etykietą „Ilość”, przycisk „Dodaj do koszyka” z klasami `btn btn-primary` i `data-testid="dodaj-do-koszyka"`, obszar `status` na komunikat.
- R5 §5.1 «<h1>Kubek</h1>»
- R5 §5.1 «<p class="cena">49,99 zł</p>»
- R5 §5.1 «<label for="ilosc">Ilość</label>»
- R5 §5.1 «<input id="ilosc" type="number" value="1">»
- R5 §5.1 «<button class="btn btn-primary" data-testid="dodaj-do-koszyka">Dodaj do koszyka</button>»
- R7 §7.4 «- img "Biały kubek z logo sklepu"»
- R7 §7.4 «- spinbutton "Ilość"»
- DF F.7 «cy.get('#ilosc').clear().type('2');»

**ST-21. Cena** jest wyrenderowana przez serwer w HTML strony. Na stronie kubka tekst „49,99 zł” występuje dokładnie raz (T-5).
- R6 §6.2 «await expect(page.getByText('49,99 zł')).toBeVisible();»

**ST-22. Dodanie do koszyka.** Przycisk wysyła `POST /api/cart/items` z ilością z pola „Ilość”. Po odpowiedzi `201` w obszarze `status` pojawia się „Dodano do koszyka” z krótkim opóźnieniem, ok. 300 ms [plan], zawsze poniżej 1 s. Tekst komunikatu jest w HTML dokumentu strony, a nie w osobnym pliku skryptu (T-6).
- R6 §6.4 «await expect(page.getByRole('status')).toHaveText('Dodano do koszyka');»
- R7 §7.3 «Po kliknięciu „Dodaj do koszyka” komunikat pojawia się po chwili, a asercja po prostu na niego poczeka.»

**ST-23. Błąd dodania.** Odpowiedź spoza 2xx nie pokazuje „Dodano do koszyka”. Kod `401` przenosi na `/logowanie` [makieta], inne błędy pokazują treść `blad` z API w obszarze `alert` [propozycja].
- R7 §7.3 «koszyk wymaga zalogowania, a test się nie loguje»
- R16 §16.2 «'blad-koszyka': async (page) => {»

**ST-24. Klawiatura.** Z pola „Ilość” klawisz Tab przenosi fokus bezpośrednio na „Dodaj do koszyka”, a Enter na przycisku dodaje produkt.
- R11 §11.2 «await page.getByLabel('Ilość').focus();»
- R11 §11.2 «await page.keyboard.press('Tab');»
- R11 §11.2 «await page.keyboard.press('Enter');»

**ST-25. Nieznany produkt.** Adres `/produkty/<nieznany>` zwraca stronę 404 ze wspólnym nagłówkiem i stopką [propozycja].

### 4.4. Logowanie `/logowanie`

**ST-30. Formularz** z polami „E-mail” (`type="email"`, `placeholder="np. jan@example.com"` [decyzja B-11]) i „Hasło” (`type="password"`) powiązanymi z etykietami oraz przyciskiem „Zaloguj się”. Na stronie jest jeden przycisk o tej nazwie. Pod formularzem jest link „Załóż konto” do `/rejestracja` [decyzja B-4].
- R6 §6.2 «await page.getByLabel('E-mail').fill('klient@sklep.test');»
- R6 §6.2 «await page.getByLabel('Hasło').fill('Klient123!');»
- R6 §6.2 «await page.getByRole('button', { name: 'Zaloguj się' }).click();»
- DA A.4 «page.getByPlaceholder('np. jan@example.com')»

**ST-31. Błędne dane** (nieznany e-mail albo złe hasło) dają w obszarze `alert` ten sam komunikat „Nieprawidłowy e-mail lub hasło”.
- R6 §6.2 «await expect(page.getByRole('alert')).toHaveText('Nieprawidłowy e-mail lub hasło');»
- R11 §11.4 «komunikat logowania, który nie zdradza, które pole jest błędne»

**ST-32. Udane logowanie** przenosi na `/` (S-3).

### 4.5. Koszyk `/koszyk`

**ST-40. Dostęp.** Niezalogowany dostaje przekierowanie `302` na `/logowanie` [makieta].

**ST-41. Tabela** z nagłówkami kolumn „Produkt”, „Ilość”, „Cena” [makieta]. Każda pozycja to wiersz tabeli (rola `row`) z nazwą, ilością i wartością pozycji (cena × ilość).
- R6 §6.4 «await expect(page.getByRole('row').filter({ hasText: 'Kubek' })).toContainText('99,98 zł');»
- R9 §9.4 «await expect(stronaKoszyka.wiersz('Notes')).toContainText('46,50 zł');»

**ST-42. Suma.** Pod tabelą jest element, którego tekst w całości brzmi „Suma: 99,98 zł”. Tekst zaczyna się od „Suma:” w tym samym węźle tekstowym, bez znaczników w środku.
- R8 §8.1 «this.suma = page.getByText(/^Suma:/);»
- DA A.8 «await expect(stronaKoszyka.suma).toHaveText('Suma: 99,98 zł');»
- DF F.7 «By.xpath("//*[starts-with(text(), 'Suma:')]")»

**ST-43. Pusty koszyk** pokazuje tekst „Koszyk jest pusty” zamiast tabeli i sumy.
- R7 §7.1 «getByText('Koszyk jest pusty')»

**ST-44. Kod rabatowy.** Pole `<input id="kod">` z etykietą „Kod rabatowy” i przycisk „Zastosuj”. Na stronie jest jeden przycisk o tej nazwie.
- R8 §8.1 «this.kodRabatowy = page.getByLabel('Kod rabatowy');»
- R8 §8.1 «this.przyciskZastosuj = page.getByRole('button', { name: 'Zastosuj' });»
- DA A.4 «page.locator('#kod')»

**ST-45. Wynik zastosowania kodu.** Udane zastosowanie: obszar `status` pokazuje „Zastosowano kod JESIEN10”, a suma się aktualizuje, np. „Suma: 44,99 zł”. Odrzucone: obszar `alert` pokazuje treść `blad` z API, a suma się nie zmienia.
- R7 ćw. 4 «kod JESIEN10 daje komunikat „Zastosowano kod JESIEN10” i obniża sumę o 10%; kod LATO5 daje alert „Kod rabatowy jest nieaktywny”; kod XYZ daje alert „Nieznany kod rabatowy”.»
- R15 §15.2 «- Suma „Suma: 44,99 zł”»

**ST-46. Dane jako tekst.** Strona nigdy nie wstawia wpisanego kodu ani treści błędu jako HTML. Komunikaty nie powtarzają wpisanego kodu, z wyjątkiem „Zastosowano kod JESIEN10”, który wstawia znaną nazwę kodu jako tekst.
- R11 §11.4 «await stronaKoszyka.zastosujKod('<img src=x onerror=alert(1)>');»
- R11 §11.4 «await expect(stronaKoszyka.blad).toHaveText('Nieznany kod rabatowy');»

**ST-47. Usuwanie pozycji** [decyzja B-1]. Każdy wiersz koszyka ma przycisk „Usuń” z `title="Usuń z koszyka"`. Kliknięcie wywołuje `DELETE /api/cart/items/{produktId}` i bez przeładowania strony usuwa wiersz oraz aktualizuje sumę. Po usunięciu ostatniej pozycji strona pokazuje „Koszyk jest pusty”.
- DA A.4 «page.getByTitle('Usuń z koszyka')»
- DA A.4 «wiersz.getByRole('button', { name: 'Usuń' })»

**ST-48. Opróżnianie koszyka** [decyzja B-1]. Pod tabelą jest przycisk „Usuń wszystko”, który wywołuje `DELETE /api/cart` i pokazuje „Koszyk jest pusty”. Przy pustym koszyku przycisku nie ma.
- R5 ćw. 2 «Zaloguj się, dodaj kubek do koszyka, użyj kodu JESIEN10 i opróżnij koszyk.»

### 4.6. Rejestracja `/rejestracja` [decyzja B-4]

**ST-50. Formularz** z nagłówkiem poziomu 1 „Rejestracja”, polami „E-mail” (`type="email"`) i „Hasło” (`type="password"`) z etykietami i przyciskiem „Załóż konto”.
- R11 §11.4 «Dla pola kodu rabatowego i formularza rejestracji zaproponuj dane wejściowe»
- R15 ćw. 1 «Zleć plannerowi plan logowania i rejestracji.»

**ST-51. Wysłanie** wywołuje `POST /api/users`. Błąd z API (400, 409) pokazuje treść `blad` w obszarze `alert`. Treść pól nie jest wstawiana na stronę jako HTML (ST-46).

**ST-52. Sukces** przenosi na `/logowanie?konto=zalozone`, gdzie w obszarze `status` jest „Konto zostało założone. Zaloguj się.”. Rejestracja nie loguje automatycznie (S-6).

**ST-53. Dostęp.** Strona jest dostępna bez logowania. Zalogowany użytkownik też ją widzi i może założyć kolejne konto [propozycja].

---

## 5. API

Wspólne zasady:

- **API-0.1.** Treść żądań i odpowiedzi to JSON (`Content-Type: application/json`). Ceny i sumy w API to liczby w złotych z dokładnością do grosza.
- **API-0.2.** Błąd ma zawsze postać `{"blad": "<komunikat>"}`.
  - R9 §9.3 «export const Blad = z.object({ blad: z.string() });»
- **API-0.3.** Sklep nigdy nie odpowiada kodem 5xx na dane od klienta: niepoprawny JSON, brak pól, złe typy. Komunikaty błędów nie zawierają szczegółów technicznych.
  - R5 §5.3 «Kod 5xx to zawsze defekt, bo serwer nie powinien padać bez względu na to, co dostanie.»
  - R11 §11.4 «Kod 5xx przy błędnych danych, komunikaty błędów ze szczegółami technicznymi»
- **API-0.4.** Bez sesji dostępne są tylko `GET /api/health`, `GET /api/products`, `POST /api/users` i `POST /api/login`. Każdy inny endpoint koszyka, zamówień i konta bez sesji zwraca `401` `{"blad":"Brak sesji"}` [makieta].
  - R9 ćw. 4 «sprawdź, że wszystkie endpointy koszyka i zamówień bez sesji zwracają 401»
- **API-0.5.** Odpowiedzi nigdy nie zawierają hasła.
  - R9 §9.3 «Odpowiedź na rejestrację nie powinna zawierać hasła»
- **API-0.6.** Nieznany adres pod `/api/` zwraca `404` `{"blad":"Nie znaleziono"}` [makieta].

| Endpoint | Sukces | Błędy |
| --- | --- | --- |
| `GET /api/health` | `200` `{"status":"ok"}` | – |
| `GET /api/products` | `200` lista `{id, nazwa, cena}` | – |
| `POST /api/users` | `201` `{email, rola}` | `400` „Brak e-maila lub hasła”, `400` „Nieprawidłowy e-mail”, `409` „Użytkownik już istnieje” |
| `POST /api/login` | `200` `{email, rola}` + ciasteczko `sesja` | `401` „Nieprawidłowy e-mail lub hasło” |
| `POST /api/logout` [propozycja] | `204` + usunięcie ciasteczka | `401` |
| `GET /api/cart` | `200` koszyk | `401` |
| `DELETE /api/cart` | `204` | `401` |
| `PATCH /api/cart/items/{produktId}` [decyzja B-1] | `200` koszyk | `400` „Nieprawidłowa ilość”, `404` „Nie ma takiej pozycji w koszyku”, `401` |
| `DELETE /api/cart/items/{produktId}` [decyzja B-1] | `200` koszyk | `404` „Nie ma takiej pozycji w koszyku”, `401` |
| `POST /api/cart/items` | `201` koszyk | `400` „Nieprawidłowe dane” [propozycja], `400` „Nieprawidłowa ilość”, `404` „Nie ma takiego produktu”, `401` |
| `POST /api/cart/discount` | `200` koszyk po rabacie | `400` „Nieznany kod rabatowy”, `400` „Kod rabatowy jest nieaktywny”, `401` |
| `GET /api/orders/{id}` | `200` zamówienie | `403` „Brak dostępu”, `404` „Nie ma takiego zamówienia”, `401` |
| `DELETE /api/users/me` | `204` | `401` |

**API-1. `GET /api/products`** zwraca listę produktów z polami `id` (liczba całkowita), `nazwa` (niepusty tekst) i `cena` (liczba dodatnia), bez innych pól [plan], w kolejności z DS-1. Nie wymaga sesji.
- R9 §9.1 «expect(produkty.map((p) => p.nazwa)).toEqual(['Kubek', 'Notes', 'Bluza']);»
- R9 §9.3 «id: z.number().int(),»
- R9 §9.3 «nazwa: z.string().min(1),»
- R9 §9.3 «cena: z.number().positive(),»
- R18 «na podstawie danych z GET /api/products»

**API-2. `POST /api/users`** z `{"email","haslo"}` tworzy konto klienta i zwraca `201` z dokładnie dwoma polami: `email` i `rola` (`"klient"`). Zajęty e-mail daje `409`. Brak e-maila albo hasła daje `400`. Treść komunikatów: [makieta]. E-mail i hasło muszą być niepustymi tekstami, inaczej `400` „Brak e-maila lub hasła”. E-mail bez `@` albo ze spacją daje `400` „Nieprawidłowy e-mail” [propozycja]. Siła hasła nie jest sprawdzana.
- R9 §9.3 «const NowyUzytkownik = z.strictObject({»
- R9 §9.2 «Rejestracja na zajęty adres e-mail | 409»

**API-3. `POST /api/login`** z `{"email","haslo"}` zwraca `200` `{"email","rola"}` i ustawia ciasteczko (S-1). Błędne dane dają `401` z komunikatem z ST-31.
- R5 §5.3 «{"email":"klient@sklep.test","haslo":"Klient123!"}»
- R5 §5.3 «{"email":"klient@sklep.test","rola":"klient"}»
- R5 ćw. 3 «Potem zmień hasło na błędne i sprawdź, jaki kod zwraca logowanie.»

**API-4. Koszyk.** Odpowiedź koszyka ma postać `{"pozycje":[{"produktId","nazwa","ilosc","cena"}],"suma"}`. `cena` pozycji to jej wartość, czyli cena × ilość [makieta]. `suma` to suma wartości pozycji, po rabacie, jeśli kod jest zastosowany (API-6).
- R9 §9.3 «produktId: z.number().int(),»
- R9 §9.3 «ilosc: z.number().int().positive(),»
- R9 §9.3 «cena: z.number().nonnegative(),»
- R9 §9.3 «suma: z.number().nonnegative(),»

**API-5. `POST /api/cart/items`** z `{"produktId","ilosc"}` dodaje produkt i zwraca `201` z całym koszykiem. Ponowne dodanie tego samego produktu sumuje ilości. Kolejność sprawdzania [propozycja]:
1. `produktId` nie jest liczbą całkowitą albo go brak: `400` „Nieprawidłowe dane”,
2. `ilosc` nie jest liczbą całkowitą z zakresu 1–99 albo jej brak: `400` „Nieprawidłowa ilość” [decyzja B-5]. Gdy po zsumowaniu ilość pozycji przekroczyłaby 99, też `400` „Nieprawidłowa ilość”,
3. produkt nie istnieje: `404` „Nie ma takiego produktu”.

Źródła:
- R9 §9.2 «test('dodanie produktu zwraca 201 i aktualny koszyk'»
- R9 §9.2 «expect(koszyk.suma).toBe(99.98);»
- R9 §9.2 «test('nieistniejący produkt daje 404'»
- R9 §9.2 «Ilość 0 albo ujemna, brak pola, tekst zamiast liczby | 400»
- R9 §9.2 «Ilość 1 i bardzo duża ilość | Zależy od wymagań: zapytaj zespół»
- R9 ćw. 2 «dwukrotne dodanie tego samego produktu (ilości się sumują), ilość 0 (400), nieistniejący produkt (404), opróżnienie koszyka (204, a potem pusty koszyk).»

**API-6. `POST /api/cart/discount`** z `{"kod"}` stosuje kod do koszyka i zwraca `200` z koszykiem, w którym `suma` jest po rabacie. Rabat = `round(suma × procent) / 100` z zaokrągleniem połówek w górę, a suma po rabacie = suma − rabat. Przykład: 49,99 zł z `JESIEN10` daje 44,99 zł. Kod nieznany, pusty albo zapisany inną wielkością liter daje `400` „Nieznany kod rabatowy”. Kod nieaktywny daje `400` „Kod rabatowy jest nieaktywny”. Trwałość kodu w koszyku: [propozycja] kod zostaje zapamiętany do opróżnienia koszyka (`DELETE /api/cart` albo usunięcie ostatniej pozycji), a każda odpowiedź koszyka zwraca sumę po rabacie, przeliczoną po każdej zmianie pozycji.
- R2 §2.1 «POST /api/cart/discount z kodem JESIEN10 zwraca status 200 i sumę pomniejszoną o 10%; nieistniejący kod daje błąd 400»
- R13 §13.1 «expect(Koszyk.parse(JSON.parse(tresc)).suma).toBe(44.99);»
- R4 §4.2 «return Math.round(kwota * procent) / 100;»
- R9 §9.2 «{ kod: 'LATO5', blad: 'Kod rabatowy jest nieaktywny' },»
- R9 §9.2 «{ kod: 'jesien10', blad: 'Nieznany kod rabatowy' },»
- R9 §9.2 «{ kod: '', blad: 'Nieznany kod rabatowy' },»

**API-7. `DELETE /api/cart`** opróżnia koszyk i zwraca `204` bez treści. Następny `GET /api/cart` zwraca pusty koszyk z sumą 0.
- R5 §5.3 «DELETE /api/cart opróżnia koszyk»
- R5 §5.3 «204 No Content | Sukces bez treści odpowiedzi | Opróżnienie koszyka»

**API-8. `GET /api/orders/{id}`** zwraca `200` właścicielowi zamówienia, `403` „Brak dostępu” innemu zalogowanemu użytkownikowi i `404` „Nie ma takiego zamówienia” dla nieistniejącego numeru. Treść zamówienia [propozycja]: `{"id","pozycje","suma"}` w kształcie koszyka. Administrator nie ma wglądu w cudze zamówienia poza zamówieniem nr 1, które jest jego.
- R9 §9.2 «test('klient nie ma dostępu do cudzego zamówienia'»
- R8 §8.4 «test('administrator ma dostęp do zamówienia nr 1'»
- R5 §5.3 «403 Forbidden | Brak uprawnień: serwer wie, kim jesteś, ale nie pozwala | Klient próbuje odczytać cudze zamówienie»

**API-9. `DELETE /api/users/me`** usuwa konto zalogowanego użytkownika, jego koszyk i sesje, i zwraca `204`. Usunięcie kont testowych z DS-2: [propozycja] dozwolone; przywraca je restart sklepu.
- R8 §8.3 «po teście usuwa konto (DELETE /api/users/me).»

**API-10. `PATCH /api/cart/items/{produktId}`** [decyzja B-1] z `{"ilosc"}` ustawia ilość pozycji (nie dodaje) i zwraca `200` z koszykiem. Ilość spoza 1–99 albo nie całkowita daje `400` „Nieprawidłowa ilość”. Produkt, którego nie ma w koszyku, daje `404` „Nie ma takiej pozycji w koszyku”.
- R5 §5.3 «Zmiana ilości produktu w koszyku»

**API-11. `DELETE /api/cart/items/{produktId}`** [decyzja B-1] usuwa pozycję i zwraca `200` z koszykiem. Produkt, którego nie ma w koszyku, daje `404` „Nie ma takiej pozycji w koszyku”.

---

## 6. Bezpieczeństwo

**B-1. Nagłówki.** Każda odpowiedź HTML (także 404) ustawia `X-Content-Type-Options: nosniff`, `Content-Security-Policy` z dyrektywą `frame-ancestors 'none'` i `Referrer-Policy: strict-origin-when-cross-origin`. Odpowiedzi API ustawiają te same nagłówki [propozycja]. Sklep nie ustawia `Strict-Transport-Security`.
- R11 §11.4 «expect(naglowki['x-content-type-options']).toBe('nosniff');»
- R11 §11.4 «expect(naglowki['content-security-policy']).toContain("frame-ancestors 'none'");»
- R11 §11.4 «expect(naglowki['referrer-policy']).toBe('strict-origin-when-cross-origin');»
- R11 §11.4 «Lokalny sklep działa przez HTTP, więc go nie ustawia.»

**B-2. Ciasteczko** jak w S-1.
- R11 §11.4 «expect(ciasteczko).toContain('HttpOnly');»
- R11 §11.4 «expect(ciasteczko).toContain('SameSite=Lax');»

**B-3. Kontrola dostępu** jak w API-0.4 i API-8.

**B-4. XSS.** Dane od użytkownika trafiają na stronę wyłącznie jako tekst (ST-46).

**B-5. Hasła** nie pojawiają się w odpowiedziach (API-0.5) ani w logach sklepu [propozycja].

---

## 7. Tryby błędów `SKLEP_BLEDY`

| Tryb | Zachowanie | Czego nie zmienia |
| --- | --- | --- |
| `cena-kubka` | Strona `/produkty/kubek` pokazuje cenę 59,99 zł | API, katalog, koszyk [plan] |
| `wolne-api` | Każda odpowiedź pod `/api/` przychodzi z losowym opóźnieniem 0–3 s | Strony HTML |
| `losowa-kolejnosc` | `GET /api/products` zwraca produkty w losowej kolejności | Zawartość listy |
| `zmiana-stylu` | Przyciski na wszystkich stronach wyglądają inaczej: kolor, odstępy [plan] | Treść, nazwy dostępne, układ elementów |

- R6 §6.5 «Tu widać, że na stronie jest cena 59,99 zł.»
- R13 §13.2 «[Błąd\] Strona produktu „Kubek” pokazuje cenę 59,99 zł zamiast 49,99 zł»
- R10 «Wartość wolne-api w zmiennej SKLEP_BLEDY opóźnia odpowiedzi API losowo o 0–3 sekundy.»
- R10 «Wartość losowa-kolejnosc sprawia, że API zwraca produkty katalogu w losowej kolejności.»
- R11 §11.1 «Ustaw SKLEP_BLEDY: "zmiana-stylu" i uruchom testy. Playwright zgłosi liczbę różniących się pikseli»
- R16 §16.2 «To mutacje po stronie serwera, więc działają też na testy API.»

**TB-1.** Tryby można łączyć. Każdy tryb działa niezależnie od pozostałych (K-7).

**TB-2.** `zmiana-stylu` musi zmienić zrzuty z rozdziału 11: stronę kubka i obszar `main` koszyka z kubkiem.
- R11 §11.1 «test('strona kubka wygląda jak wzorzec', { tag: '@wizualne' }, async ({ page }) => {»
- R11 §11.1 «await expect(page.getByRole('main')).toHaveScreenshot('koszyk.png');»

---

## 8. Wymagania niefunkcjonalne

**N-1. Determinizm.** Bez trybów błędów każda odpowiedź i każda strona jest taka sama przy każdym uruchomieniu, z wyjątkiem wartości ciasteczka sesji [plan].

**N-2. Stabilny wygląd.** Brak animacji, przejść i treści zależnych od czasu. Czcionki są dostarczane przez sklep, bez czcionek systemowych [plan], żeby zrzuty z rozdziału 11 były powtarzalne w obrazie `mcr.microsoft.com/playwright:v1.65.1-noble`.
- R11 §11.1 «Przeglądarki różnie renderują czcionki na Windowsie, macOS i Linuksie.»

**N-3. Przeglądarki.** Wszystkie funkcje działają w Chromium, Firefoksie i WebKit z Playwrighta 1.65.1.
- R7 ćw. 8 «wynik uruchomienia we wszystkich trzech przeglądarkach»

**N-4. Telefon.** Dodanie do koszyka i logowanie działają w emulacji Pixel 7: żaden element nie jest zasłonięty ani poza ekranem.
- R8 ćw. 5 «Dodaj projekt mobile i oznacz tagiem @mobile co najmniej dwa testy, np. dodanie produktu do koszyka i logowanie.»

**N-5. Wydajność.** Bez trybów błędów `GET /api/products` odpowiada w czasie poniżej 50 ms, a strona główna ładuje się poniżej 500 ms, z dużym zapasem wobec budżetów z książki: 500 ms i 2 s. Przy 10 równoczesnych użytkownikach 95% żądań do `GET /api/products` mieści się w 500 ms, bez błędów [propozycja].
- R11 §11.3 «test('API produktów odpowiada w mniej niż 500 ms'»
- R11 §11.3 «expect(czas).toBeLessThan(2000);»
- R11 §11.3 «http_req_duration: ['p(95)<500'],»

**N-6. Bez AI.** Sklep nie ma funkcji AI. Przycisk czatu w stopce jest tylko celową usterką.
- R18 «Sklep ćwiczeniowy nie ma funkcji AI»

---

## 9. Ograniczenia testowalności

Te wymagania wynikają z tego, jak kod z książki szuka elementów. Ich złamanie psuje przykłady, choć sklep działałby poprawnie.

**T-1. Unikalne nazwy przycisków.** Na każdej stronie przyciski „Zaloguj się”, „Wyloguj się”, „Zastosuj”, „Załóż konto”, „Usuń wszystko” i „Koszyk” występują najwyżej raz. Żaden przycisk poza „Koszyk” i „Dodaj do koszyka” nie zawiera słowa „koszyk”, bo lokator `getByRole('button', { name: 'Koszyk' })` dopasowuje fragment nazwy [decyzja B-8]. Na stronie produktu „Dodaj do koszyka” występuje raz, a w katalogu raz w każdym elemencie listy. Dlatego „Zaloguj się” w nagłówku jest linkiem (ST-2).

**T-2. Jeden `status` i jeden `alert`.** Na każdej stronie jest najwyżej jeden element o roli `status` i najwyżej jeden o roli `alert`. Stopka nie może mieć takich ról.

**T-3. Elementy listy.** Na stronie głównej jedyne elementy `listitem` to trzy produkty (ST-12).

**T-4. Bez `data-testid="cart-total"`.** Sklep nie ma tego atrybutu, bo książka używa go jako przykładu wymyślonego lokatora. Jedyny `data-testid` w sklepie to `dodaj-do-koszyka`.
- R14 §14.1 «wymyślony lokator, np. page.getByTestId('cart-total'), choć na stronie nie ma takiego atrybutu,»

**T-5. Cena w HTML strony.** Tekst `49,99 zł`, zapisany zwykłą spacją, jest w treści dokumentu `/produkty/kubek` zwracanego przez serwer, bo mutacja `cena-kubka` z rozdziału 16 podmienia go w odpowiedzi serwera.
- R16 §16.2 «'cena-kubka': podmienTekst('/produkty/kubek', '49,99 zł', '59,99 zł'),»

**T-6. Komunikat w HTML strony.** Tekst `Dodano do koszyka` jest w treści dokumentu `/produkty/kubek`, np. w skrypcie osadzonym w stronie albo w atrybucie elementu. Inaczej mutacja `bez-komunikatu` z rozdziału 16 go nie podmieni.
- R16 §16.2 «'Dodano do koszyka',»
- R16 §16.2 «route.fetch() pobiera prawdziwą odpowiedź serwera, a route.fulfill() oddaje przeglądarce zmienioną.»

**T-7. Katalog z API w przeglądarce.** Lista produktów na stronie głównej pochodzi z `GET /api/products` wywołanego w przeglądarce, nie z HTML od serwera. Inaczej nie zadziała podmiana odpowiedzi z rozdziałów 9 i 16 (`pusty-katalog`) ani nagranie HAR.
- R9 §9.5 «await page.routeFromHAR('hary/produkty.har', {»

**T-8. Selektory CSS z przykładów** pozostają poprawne, choć książka ich nie zaleca: `#ilosc`, `#kod`, `.cena`, `.btn.btn-primary` na stronie produktu.
- R5 §5.1 «page.locator('.btn.btn-primary'); // klasy CSS, unikaj»
- R7 §7.1 «locator('.cena')»

**T-9. Tabela zabójstw.** Wynik czterech mutacji z podrozdziału 16.2 na testach z książki jest taki jak w tabeli w książce.
- R16 §16.2 «Tak wyglądał wynik czterech mutacji dla testów koszyka i katalogu.»
