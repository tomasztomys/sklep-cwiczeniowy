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

## Errata w dokumencie książki

Punkty 1–5 wprowadzone 2026-11-22 w dokumencie i w `ksiazka/`. Punkt 6 czeka na etap 9.

1. R2 ćw. 1: «np. rejestrację, wyszukiwanie, koszyk, rabaty, historię zamówień, uprawnienia i zmianę hasła» → «np. logowanie, rejestrację, katalog, koszyk, rabaty i uprawnienia do zamówień».
2. R11 §11.2 i ćw. 3: «cały zakup» → «całą ścieżkę od katalogu do koszyka z kodem rabatowym».
3. R6 §6.4, nagranie Codegen: `getByRole('button', { name: 'Koszyk', exact: true })`.
4. R8 ćw. 1: dopisać, że lokator przycisku „Koszyk” w obiekcie `Naglowek` trzeba zawęzić do `banner` albo użyć `exact: true`, bo na stronie produktu jest też „Dodaj do koszyka”.
5. R16 §16.2: «To mutacje po stronie serwera, więc działają też na testy API.» → «To mutacje po stronie serwera, więc część z nich, `wolne-api` i `losowa-kolejnosc`, działa też na testy API.»
6. Etap 9: adresy repozytorium i obrazu we Wstępie, w R3 i R12.

Po zmianach w sklepie z B-1 i B-4 rozdziały 5 (ćw. 2), 11 (§11.4) i 15 (ćw. 1) oraz dodatek A działają bez errat.
