# Rozbieżności: książka, specyfikacja i sklep

Status: **rozstrzygnięte 2026-11-22**, decyzje w `docs/decyzje.md`. Część A opisuje różnice makiety wobec specyfikacji, których makieta nie musi nadrabiać.

Każda pozycja ma: miejsce, objaw i propozycję. Propozycja to zmiana sklepu, errata książki albo pozostawienie bez zmian.
Identyfikatory wymagań (np. API-5) odnoszą się do `docs/specyfikacja.md`.

---

## A. Wymagania, których makieta nie spełnia

Makieta pozostaje wzorcem zachowania tylko tam, gdzie zgadza się ze specyfikacją. Każdą pozycję sprawdzono na działającej makiecie.

| Nr | Wymaganie | Objaw w makiecie |
| --- | --- | --- |
| M-1 | ST-5, DS-1 | `/img/kubek.jpg` i pozostałe obrazy zwracają 404. Daje to błąd w konsoli i pusty obraz. Notes i bluza mają tekst alternatywny kubka |
| M-2 | S-4 | „Wyloguj się” kasuje ciasteczko z JavaScriptu, a ciasteczko jest `HttpOnly`, więc nic się nie dzieje. Sesja na serwerze zostaje |
| M-3 | ST-14 | Zerwane połączenie (`route.abort()`) przy wczytywaniu katalogu nie pokazuje komunikatu, tylko błąd w konsoli |
| M-4 | API-5, API-0.3 | Brak `produktId` albo niepoprawny JSON daje 404 „Nie ma takiego produktu” zamiast 400. Ilość jako tekst jest przyjmowana: `"2"` po 1 szt. daje ilość `"12"` i sumę 599,88 zł. Ilość 1,5 i 1 000 000 są przyjmowane |
| M-5 | API-6, ST-45 | Rabat nie jest zapamiętywany: `GET /api/cart` po `JESIEN10` zwraca 49,99 zamiast 44,99, a po odświeżeniu strony koszyka rabatu nie ma. Kod zastosowany przy pustym koszyku daje błąd JavaScriptu, bo brak elementu sumy |
| M-6 | ST-2, N-2 | Ikona koszyka to emoji 🛒, które wygląda różnie zależnie od systemu. Brak własnych czcionek |
| M-7 | K-6, K-7 | `SKLEP_DANE_STARTOWE` jest ignorowana: dane wczytują się zawsze. Nieznana nazwa w `SKLEP_BLEDY` jest cicho pomijana |
| M-8 | B-1, ST-25 | Nagłówki bezpieczeństwa są tylko na stronach HTML z kodem 200, bez 404 i API. `/produkty/<nieznany>` zwraca pustą odpowiedź 404 |
| M-9 | ST-23 | Błąd przy dodawaniu do koszyka na stronie produktu (np. 500) nie pokazuje żadnego komunikatu |
| M-10 | U-3, U-4 | W stopce są dwa pola wyszukiwania (jedno ukryte w etykiecie „Szukaj”). Newsletter otwiera okienko `alert()` |
| M-11 | API-8 | Zamówienie nr 1 zwraca `{id, wlasciciel, suma}` bez pozycji, z adresem e-mail właściciela |
| M-12 | K-1, K-3 | Brak Dockerfile, obrazu, `HEALTHCHECK` i wersji wieloarchitekturowej (zgodnie z założeniem makiety) |
| M-13 | API-9 | Po `DELETE /api/users/me` sesja usuniętego konta nadal działa: `GET /api/cart` zwraca 200 |
| M-14 | API-6 | Kod rabatowy jest szukany także w prototypie obiektu: `toString` daje „Kod rabatowy jest nieaktywny” zamiast „Nieznany kod rabatowy” |
| M-15 | API-2 | E-mail podany jako liczba albo bez `@` jest przyjmowany przy rejestracji |
| M-16 | API-0.6, API-8 | Nieznany adres API bez sesji daje 401 zamiast 404; zamówienie `abc` daje „Nie znaleziono” zamiast „Nie ma takiego zamówienia” |

### Testy API sklepu na makiecie (etap 3)

Te same 62 testy z `testy/api/` uruchomione na makiecie: 40 przechodzi, 22 nie. Każdy nieudany test odpowiada pozycji M-2, M-4, M-5, M-8, M-11 i M-13–M-16 albo endpointom dodanym decyzją B-1 (`PATCH` i `DELETE /api/cart/items/{produktId}`) i S-4 (`POST /api/logout`). Na sklepie przechodzą wszystkie 62 testy oraz wszystkie 12 testów `@api` z kodu książki (`wzorzec/tests`).

---

## B. Sprzeczności i luki w książce

### B-1. Zarządzanie koszykiem, którego sklep nie ma

- **Miejsca:**
  - R5 §5.3, tabela metod: «Zmiana ilości produktu w koszyku» jako przykład PUT i PATCH;
  - R5 ćw. 2: «Zaloguj się, dodaj kubek do koszyka, użyj kodu JESIEN10 i opróżnij koszyk.» – w przeglądarce, z panelem Network;
  - DA A.4: «page.getByTitle('Usuń z koszyka')» oraz «wiersz.getByRole('button', { name: 'Usuń' })».
- **Objaw:** żaden inny rozdział nie opisuje zmiany ilości, usuwania pozycji ani opróżniania koszyka w interfejsie. Czytelnik w ćwiczeniu z rozdziału 5 nie ma czego kliknąć, a przykłady ze ściągi nie działają na sklepie.
- **Propozycja A (zmiana sklepu, zalecana):**
  - w każdym wierszu koszyka przycisk „Usuń” z `title="Usuń z koszyka"` (`DELETE /api/cart/items/{produktId}` → 200 z koszykiem);
  - pod tabelą przycisk „Usuń wszystko” (`DELETE /api/cart`);
  - w API `PATCH /api/cart/items/{produktId}` z `{ilosc}` → 200 z koszykiem, bez interfejsu.
  
  Nazwa „Usuń wszystko” nie zawiera słowa „koszyk”, więc nie koliduje z `getByRole('button', { name: 'Koszyk' })` (zob. B-8). Nawiązuje też do historii agenta z rozdziału 1.
- **Propozycja B (errata):** w R5 zmienić przykład PUT/PATCH na ogólny, w ćw. 2 opróżniać koszyk przez API, a w ściądze podać przykłady, które działają na sklepie.

### B-2. Scenariusze sklepu, których sklep nie ma

- **Miejsce:** R2 ćw. 1: «Wypisz 10 scenariuszy sklepu ćwiczeniowego, np. rejestrację, wyszukiwanie, koszyk, rabaty, historię zamówień, uprawnienia i zmianę hasła.»
- **Objaw:** sklep nie ma wyszukiwania (pole w stopce to celowa usterka U-3 bez działania), historii zamówień ani zmiany hasła. Rejestracja jest tylko w API.
- **Propozycja (errata):** «np. logowanie, rejestrację przez API, katalog, koszyk, rabaty i uprawnienia do zamówień». Dodawanie tych funkcji do sklepu nie jest potrzebne do żadnego innego rozdziału.

### B-3. „Cały zakup” bez składania zamówienia

- **Miejsca:** R11 §11.2: «przejście całego zakupu wyłącznie klawiaturą, z widocznym fokusem na każdym kroku»; R11 ćw. 3: «Przejdź cały zakup tylko klawiaturą i powiększ stronę do 200%.»
- **Objaw:** sklep nie ma składania zamówienia. Ścieżka kończy się na koszyku z rabatem.
- **Propozycja (errata):** «całą ścieżkę od katalogu do koszyka z kodem rabatowym». Składanie zamówienia (`POST /api/orders`, potwierdzenie) to duży zakres bez innych odwołań w książce.

### B-4. Formularz rejestracji

- **Miejsca:**
  - R11 §11.4: «Dla pola kodu rabatowego i formularza rejestracji zaproponuj dane wejściowe»;
  - R15 ćw. 1: «Zleć plannerowi plan logowania i rejestracji.»;
  - wobec tego R8: «rejestracji nowego klienta przez API (POST /api/users)».
- **Objaw:** sklep nie ma strony rejestracji. Planner bada interfejs w przeglądarce, więc nie znajdzie rejestracji.
- **Propozycja A (zmiana sklepu, zalecana):** strona `/rejestracja` z polami „E-mail” i „Hasło” i przyciskiem „Załóż konto”. Wywołuje `POST /api/users`, błąd pokazuje w `alert`, po sukcesie przenosi na `/logowanie` z komunikatem w `status` „Konto zostało założone”. Link „Załóż konto” na stronie logowania (nie w nagłówku, żeby nie zmieniać nagłówka na wszystkich zrzutach).
- **Propozycja B (errata):** w R11 mówić o formularzu logowania, w R15 o planie logowania i koszyka.

### B-5. Granica ilości „zapytaj zespół”

- **Miejsce:** R9 §9.2: «Ilość 1 i bardzo duża ilość | Zależy od wymagań: zapytaj zespół»
- **Objaw:** czytelnik ma zapytać zespół, ale nie ma kogo. Odpowiedź musi być w dokumentacji wymagań sklepu.
- **Propozycja (zmiana sklepu):** ilość całkowita 1–99, powyżej `400` „Nieprawidłowa ilość” (API-5). Zapisać w dokumentacji dla czytelnika razem z dwiema innymi odpowiedziami, o które książka każe pytać: kolejność katalogu jest określona (R10 ćw. 2), a kody rabatowe rozróżniają wielkość liter (R9 §9.2).

### B-6. Kod nagrany w Codegen nie przejdzie trybu ścisłego

- **Miejsce:** R6 §6.4, nagranie: `await page.getByRole('button', { name: 'Koszyk' }).click();` na stronie kubka.
- **Objaw:** R7 §7.1 mówi: «Domyślnie nazwa w getByRole pasuje także do fragmentu tekstu, bez rozróżniania wielkości liter.» Nazwa „Koszyk” pasuje więc też do „Dodaj do koszyka”, a kliknięcie kończy się błędem trybu ścisłego. Codegen w takiej sytuacji sam dodaje `exact: true`, więc nagranie w książce nie zgadza się z tym, co czytelnik zobaczy.
- **Propozycja (errata):** w nagraniu `{ name: 'Koszyk', exact: true }`. To samo dotyczy R8 ćw. 1 (obiekt `Naglowek` z przyciskiem „Koszyk”): warto dopisać wskazówkę o zawężeniu do `banner` albo `exact: true`, bo obiekt będzie używany na stronie produktu.

### B-7. Tryby błędów a testy API

- **Miejsce:** R16 §16.2: «To mutacje po stronie serwera, więc działają też na testy API.»
- **Objaw:** `cena-kubka` i `zmiana-stylu` zmieniają tylko strony. Testy API wykryją tylko `wolne-api` (czas) i `losowa-kolejnosc`.
- **Propozycja (errata):** «To mutacje po stronie serwera, więc część z nich, `wolne-api` i `losowa-kolejnosc`, działa też na testy API.» Alternatywa: `cena-kubka` zmienia też cenę w API, ale wtedy błąd przestaje być błędem samej strony z przykładu w R13 §13.2.

### B-8. Przycisk „Koszyk” a inne nazwy z „koszyk”

- **Miejsca:** R6 §6.4, R7 §7.2, R8 ćw. 1.
- **Objaw:** każdy nowy przycisk, którego nazwa zawiera „koszyk”, np. „Opróżnij koszyk”, spowoduje błąd trybu ścisłego w lokatorze `getByRole('button', { name: 'Koszyk' })` bez zawężenia.
- **Propozycja (ograniczenie sklepu):** żaden przycisk poza „Koszyk” i „Dodaj do koszyka” nie zawiera słowa „koszyk” (dopisane jako T-1 przy decyzji o B-1).

### B-9. „Aplikacja z bazą danych”

- **Miejsce:** R3 §3.3: «Sklep ćwiczeniowy to aplikacja internetowa z bazą danych.»
- **Objaw:** dane są w pamięci (K-5). Sprzeczność jest tylko pozorna, bo reset po `docker compose down` opisany w tym samym podrozdziale działa właśnie dlatego.
- **Propozycja:** bez zmian albo errata «z danymi w pamięci».

### B-10. Przycisk czatu w sklepie „bez funkcji AI”

- **Miejsca:** R18: «Sklep ćwiczeniowy nie ma funkcji AI», a przycisk czatu w stopce opisuje R11 §11.2.
- **Objaw:** czytelnik może uznać przycisk czatu za funkcję do przetestowania w rozdziale 18.
- **Propozycja:** bez zmian. Przycisk nic nie robi (U-1).

### B-11. Podpowiedź w polu e-mail

- **Miejsce:** DA A.4: «page.getByPlaceholder('np. jan@example.com')»
- **Objaw:** w sklepie nie ma takiego pola.
- **Propozycja (zmiana sklepu):** dodać `placeholder="np. jan@example.com"` do pola „E-mail” na `/logowanie`. Nie zmienia to nazwy dostępnej ani wyniku axe.

### B-12. Adresy do uzupełnienia

- **Miejsca:** Wstęp «[DO UZUPEŁNIENIA: adres repozytorium]», R3 §3.3 i R12 «ghcr.io/AUTOR/sklep-cwiczeniowy:1.0».
- **Propozycja:** w etapie 9 wpisać `ghcr.io/tomasztomys/sklep-cwiczeniowy:1.0` i `https://github.com/tomasztomys/testy-sklepu`.

---

## C. Ustalenia spoza książki do zatwierdzenia

Te ustalenia są w specyfikacji, ale nie wynikają z tekstu książki. Pochodzą z makiety albo planu, albo są propozycją. Zatwierdź albo zmień każde z nich.

| Wymaganie | Ustalenie | Źródło |
| --- | --- | --- |
| K-2 | Zmienna `PORT`, domyślnie 3000 | plan |
| K-3 | `HEALTHCHECK` w obrazie | plan |
| K-6 | `SKLEP_DANE_STARTOWE` domyślnie `tak`; inna wartość daje pusty sklep | plan, propozycja |
| K-7 | Nieznany tryb błędu: ostrzeżenie w logach, start bez przerwania | propozycja |
| DS-1 | Bluza: id 15, 120,00 zł; adresy `/produkty/notes` i `/produkty/bluza`; teksty alternatywne notesu i bluzy | makieta, propozycja |
| DS-4 | Zamówienie nr 1: jeden kubek, 49,99 zł | makieta |
| S-4 | Wylogowanie przez `POST /api/logout` → 204 | propozycja |
| S-5, S-6 | Sesja nie wygasa; rejestracja nie loguje automatycznie | makieta |
| ST-1 | Tytuły stron „<Nazwa> – Sklep ćwiczeniowy” | makieta |
| ST-2 | „Zaloguj się” w nagłówku jako link | makieta |
| ST-6 | Ceny bez separatora tysięcy, ze zwykłą spacją | propozycja |
| ST-13, ST-23 | Niezalogowany po „Dodaj do koszyka” trafia na `/logowanie`; inne błędy w `alert` | makieta, propozycja |
| ST-14 | Pusta lista z API: pusta lista bez komunikatu | propozycja |
| ST-22 | Komunikat „Dodano do koszyka” po ok. 300 ms | plan |
| ST-25 | Strona 404 z nagłówkiem i stopką | propozycja |
| ST-40, ST-41 | Przekierowanie 302 z `/koszyk`; kolumny „Produkt”, „Ilość”, „Cena” | makieta |
| API-0.4, API-0.6 | Komunikaty „Brak sesji” i „Nie znaleziono” | makieta |
| API-2 | Komunikaty „Brak e-maila lub hasła” i „Użytkownik już istnieje”; walidacja: e-mail z `@`, niepuste hasło | makieta, propozycja |
| API-4 | `cena` pozycji to cena × ilość | makieta |
| API-5 | Kolejność walidacji, „Nieprawidłowe dane”, ilość 1–99 | propozycja |
| API-6 | Zaokrąglenie rabatu jak w R4; kod zapamiętany do opróżnienia koszyka | propozycja |
| API-8 | Treść zamówienia `{id, pozycje, suma}` | propozycja |
| API-9 | Konta testowe można usunąć; wracają po restarcie | propozycja |
| B-1, B-5 | Nagłówki bezpieczeństwa także w API; brak haseł w logach | propozycja |
| Tryby | `cena-kubka` tylko na stronie kubka; `zmiana-stylu` zmienia przyciski na wszystkich stronach | plan |
| N-1, N-2, N-5 | Determinizm, własne czcionki, budżety wydajności z zapasem | plan, propozycja |
| U-1–U-4 | Czat nic nie robi; kolor `#c8c8c8`; wyszukiwarka nic nie robi; newsletter pokazuje „Dziękujemy za zapis” | propozycja, makieta |
| UC-1 | Każda reguła axe dla dokładnie jednego elementu | propozycja |

---

## D. Uwagi do kolejnych etapów

- **Dokumentacja dla czytelnika.** Plan zakłada, że czytelnik czyta wymagania i opis API w repozytorium sklepu. `docs/specyfikacja.md` zawiera cytaty z książki i oznaczenia źródeł, które czytelnikowi nie są potrzebne. Proponuję w etapie 7 wygenerować z niej czysty dokument dla czytelnika (wymagania i API). `docs/usterki-celowe.md` zdradza odpowiedzi do ćwiczeń z rozdziałów 5 i 11. Rozdział 11 i tak je wymienia, ale warto rozważyć opis w dokumentacji dla czytelnika bez listy usterek.
- **Testy etapu 4** muszą sprawdzać ograniczenia T-1–T-9 i UC-1–UC-4, bo tych rzeczy nie sprawdzi żaden pojedynczy test z książki.
