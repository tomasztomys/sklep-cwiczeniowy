# Sklep ćwiczeniowy

Sklep internetowy, na którym czytelnicy książki „Automatyzacja testów z agentem AI u boku.
Start z Playwright i TypeScript” uczą się pisać testy. Czytelnik testuje go jak czarną skrzynkę:
uruchamia obraz `ghcr.io/tomasztomys/sklep-cwiczeniowy:1.0` i nie zagląda do kodu.
Tekst książki jest w `ksiazka/` (tylko lokalnie, katalog nie trafia do gita).

## Źródło prawdy

- `docs/specyfikacja.md` opisuje zachowanie sklepu. Zmiana zachowania wymaga najpierw zmiany
  specyfikacji i zgody autora: zaproponuj zmianę i poczekaj na odpowiedź.
- Kontraktem z książką są: nazwy dostępne, role i etykiety elementów, komunikaty, kody
  odpowiedzi, treść błędów, ciasteczka, nagłówki, zmienne środowiskowe i dane startowe.
  Zmiana jednego znaku oznacza zmianę w tekście książki.
- Gdy książka, specyfikacja i sklep się rozjeżdżają, nie rozstrzygaj sam. Zapisz pozycję
  w `docs/rozbieznosci.md`: rozdział, fragment, objaw, propozycja (zmiana sklepu albo errata).
- Decyzje autora są w `docs/decyzje.md`. Nie zmieniaj ich bez pytania.

## Celowe usterki

`docs/usterki-celowe.md` wymienia usterki dostępności, które czytelnik ma znaleźć.
Są zamierzone: nie naprawiaj ich i nie dodawaj nowych. Tryby `SKLEP_BLEDY` też są zamierzone.

## Wzorzec

`wzorzec/` to makieta sklepu (`wzorzec/mock/sklep.js`), na której sprawdzono kod z książki,
oraz testy z rozdziałów 6–18. Traktuj ją jako wzorzec zachowania: prawdziwy sklep ma przejść
te same testy. Nie kopiuj jej kodu i nie zmieniaj jej. Makieta i sklep domyślnie używają
portu 3000, więc uruchamiaj je po kolei albo ustaw `PORT`.

## Stos (zatwierdzony w etapie 2)

- Node.js 26, TypeScript 6 uruchamiany bez budowania (type stripping): importy z rozszerzeniem `.ts`,
  tylko składnia wymazywalna (bez `enum`, `namespace`, JSX).
- Hono z `@hono/node-server`; HTML z szablonów po stronie serwera (`hono/html`), mały skrypt w przeglądarce.
- Dane w pamięci, zero zasobów z sieci; obrazy, czcionki i style w `publiczne/`.
- Testy sklepu: Playwright 1.65.1 w `testy/`. Wersje zależności przypięte dokładnie.
- Nowa zależność wymaga zgody autora.

## Struktura

- `src/serwer.ts` – start serwera, `src/aplikacja.ts` – trasy, `src/konfiguracja.ts` – zmienne środowiskowe
- `testy/` – testy sklepu (identyfikator wymagania w nazwie `describe` albo testu)
- `Dockerfile`, `compose.yaml`, `.github/workflows/ci.yml`

## Polecenia

- `npm run check` – tsc i ESLint, bez ostrzeżeń (uruchamia go też hook `Stop`)
- `npm test` – testy sklepu w Playwright (same uruchamiają sklep z kodu)
- `BASE_URL=http://localhost:3000 npm test` – testy na działającym kontenerze
- `docker compose up -d` – sklep na http://localhost:3000
- `cd wzorzec && npm ci && npx playwright test --project=chromium` – testy na makiecie
  (Playwright sam ją uruchamia)

## Sposób pracy

- Każdy etap planu to osobna gałąź i osobny pull request do `main`.
- Zaczynaj od planu i czekaj na akceptację, zanim napiszesz kod.
- Nie rób `git push`, nie zmieniaj workflow i nie publikuj obrazu bez pytania.
- Nie wklejaj ani nie zapisuj tokenów i haseł poza kontami testowymi ze specyfikacji.

## Zanim skończysz

1. `npm run check`
2. Testy, których dotyczy zmiana (sklep, a przy zmianie zachowania także wzorzec).
3. Lista zmienionych plików, każdy z jednym zdaniem o tym, co się zmieniło.
