# Decyzje autora

Tu autor zapisuje rozstrzygnięcia pozycji z `docs/rozbieznosci.md` i zatwierdzenia ustaleń ze specyfikacji.
Agent nie zmienia tego pliku bez polecenia (zob. `CLAUDE.md`).

2026-11-22: autor przyjął wszystkie rekomendacje z etapu 1 („zrób jak uważasz”).

| Pozycja | Decyzja | Skutek |
| --- | --- | --- |
| B-1 Zarządzanie koszykiem | Przycisk „Usuń” w wierszu (`title="Usuń z koszyka"`), przycisk „Usuń wszystko”, `DELETE` i `PATCH /api/cart/items/{produktId}` | Zmiana sklepu: ST-47, ST-48, API-10, API-11 |
| B-2 Scenariusze w R2 ćw. 1 | Lista scenariuszy ograniczona do funkcji sklepu | Errata |
| B-3 „Cały zakup” w R11 | „Ścieżka od katalogu do koszyka z kodem rabatowym” | Errata |
| B-4 Formularz rejestracji | Strona `/rejestracja`, link „Załóż konto” na `/logowanie` | Zmiana sklepu: ST-50–ST-53 |
| B-5 Granica ilości | Ilość całkowita 1–99 | Zmiana sklepu: API-5 |
| B-6 Nagranie Codegen w R6 | `{ name: 'Koszyk', exact: true }` i wskazówka w R8 ćw. 1 | Errata |
| B-7 Tryby błędów a testy API | Tylko `wolne-api` i `losowa-kolejnosc` działają na testy API | Errata |
| B-8 Nazwy z „koszyk” | Żaden inny przycisk nie zawiera słowa „koszyk” | Ograniczenie sklepu: T-1 |
| B-9 „Baza danych” w R3 | Bez zmian | – |
| B-10 Przycisk czatu | Bez zmian | – |
| B-11 Podpowiedź w polu e-mail | `placeholder="np. jan@example.com"` | Zmiana sklepu: ST-30 |
| B-12 Adresy do uzupełnienia | `ghcr.io/tomasztomys/sklep-cwiczeniowy:1.0`, `https://github.com/tomasztomys/testy-sklepu` | Errata w etapie 9 |
| C Ustalenia spoza książki | Wszystkie zatwierdzone | Specyfikacja bez zmian |
| B-13 Tab w WebKit na macOS | Ramka „Stan na XI 2026” w R11 §11.2: test klawiatury na Macu w Chromium albo w Dockerze; bez `test.skip`, który zablokowałaby reguła z R17 | Errata |
| B-14 Ostrzeżenie ESLint w R6 | Pusta linia po `test.step` w teście logowania | Errata |
| B-15 Mutacje a import | R8 ćw. 2: import z `./fixtures.ts` we wszystkich plikach testów; R16: mutacja działa tylko przy tym imporcie | Errata |
| B-16 Nazwa testu w tabeli zabójstw | „katalog pokazuje listę produktów”, jak w R6 | Errata |
| B-17 HAR a adres sklepu | R9 §9.5: nagranie działa tylko pod adresem, pod którym powstało | Errata |
| B-18 Mutacje pod `localhost` | R16: uruchamiaj mutacje lokalnie | Errata |
| B-19 Zmienna `karta` w dodatku A | Dopisana definicja w przykładzie | Errata |
| B-20 Szablon z przypiętymi wersjami | Szablon zawiera `package.json` i `package-lock.json` z wersjami ze Wstępu; R3: `npm ci` po sklonowaniu; R4: `npm ci` zamiast `npm init` i instalacji; R6: przywrócenie `@playwright/test@1.65.1` po instalatorze; R7, R8, R9, R11: pakiety „są już w szablonie” | Errata, wprowadzona 2026-11-22 |

## Errata w dokumencie książki

Punkty 1–5 wprowadzone 2026-11-22 w dokumencie i w `ksiazka/`. Punkt 6 (adresy) wprowadzony 2026-11-22 po publikacji obrazu `v1.0`. Erraty B-13–B-19 (decyzja autora „podejmij decyzje, jakie uważasz za najlepsze”) wprowadzone 2026-11-22 w dokumencie i w `ksiazka/`; po nich bramka z książki przechodzi bez uwag, a mutacja `cena-kubka` jest wykrywana jak w tabeli z R16.

1. R2 ćw. 1: «np. rejestrację, wyszukiwanie, koszyk, rabaty, historię zamówień, uprawnienia i zmianę hasła» → «np. logowanie, rejestrację, katalog, koszyk, rabaty i uprawnienia do zamówień».
2. R11 §11.2 i ćw. 3: «cały zakup» → «całą ścieżkę od katalogu do koszyka z kodem rabatowym».
3. R6 §6.4, nagranie Codegen: `getByRole('button', { name: 'Koszyk', exact: true })`.
4. R8 ćw. 1: dopisać, że lokator przycisku „Koszyk” w obiekcie `Naglowek` trzeba zawęzić do `banner` albo użyć `exact: true`, bo na stronie produktu jest też „Dodaj do koszyka”.
5. R16 §16.2: «To mutacje po stronie serwera, więc działają też na testy API.» → «To mutacje po stronie serwera, więc część z nich, `wolne-api` i `losowa-kolejnosc`, działa też na testy API.»
6. Etap 9: adresy repozytorium i obrazu we Wstępie, w R3 i R12.

Po zmianach w sklepie z B-1 i B-4 rozdziały 5 (ćw. 2), 11 (§11.4) i 15 (ćw. 1) oraz dodatek A działają bez errat.
