# Sklep ćwiczeniowy

Sklep internetowy do ćwiczeń z książki „Automatyzacja testów z agentem AI u boku.
Start z Playwright i TypeScript”. Ma stałe dane startowe, konta testowe, kody rabatowe,
tryby błędów i kilka celowych usterek dostępności do znalezienia.

**Czytasz książkę?** Nie potrzebujesz tego kodu. Swoje testy piszesz w repozytorium utworzonym
z szablonu [testy-sklepu](https://github.com/tomasztomys/testy-sklepu), a sklep uruchamiasz z gotowego
obrazu według rozdziału 3. Wymagania są w [docs/wymagania.md](docs/wymagania.md), a opis API w [docs/api.md](docs/api.md).

## Uruchomienie z obrazu

```bash
docker run --rm -p 3000:3000 ghcr.io/tomasztomys/sklep-cwiczeniowy:1.0
```

Sklep działa pod http://localhost:3000, kontrola stanu: http://localhost:3000/api/health.
Obraz jest dostępny dla `linux/amd64` i `linux/arm64`.

| Konto | E-mail | Hasło |
| --- | --- | --- |
| Klient | `klient@sklep.test` | `Klient123!` |
| Administrator | `admin@sklep.test` | `Admin123!` |

| Zmienna | Domyślnie | Znaczenie |
| --- | --- | --- |
| `PORT` | `3000` | port w kontenerze |
| `SKLEP_DANE_STARTOWE` | `tak` | produkty, konta i kody rabatowe; inna wartość daje pusty sklep |
| `SKLEP_BLEDY` | pusta | tryby błędów oddzielone przecinkami: `cena-kubka`, `wolne-api`, `losowa-kolejnosc`, `zmiana-stylu` |

Dane są w pamięci: każdy start kontenera zaczyna od stanu początkowego.

## Praca nad sklepem

Wymagania: Node.js 26 (`nvm use`), Docker.

```bash
npm ci
npm run check            # tsc i ESLint, bez ostrzeżeń
npm test                 # testy sklepu w Playwright (same uruchamiają sklep)
docker compose up -d     # sklep z kodu w kontenerze
narzedzia/akceptacja.sh  # kod z książki jako testy akceptacyjne na obrazie
```

Zasady pracy, także dla Claude Code: [CLAUDE.md](CLAUDE.md). Rozbieżności między książką a sklepem
i decyzje autora: [docs/rozbieznosci.md](docs/rozbieznosci.md), [docs/decyzje.md](docs/decyzje.md).

## Publikacja wersji

Tag `v*` uruchamia workflow `publikacja.yml`: testy akceptacyjne na zbudowanym obrazie, potem obraz
dla obu architektur w GHCR z tagami wersji i `latest`.

```bash
git tag v1.0 && git push origin v1.0
```

Po pierwszej publikacji ustaw pakiet w GHCR jako publiczny (Package settings → Change visibility),
żeby czytelnicy pobierali obraz bez logowania.

## Zawartość

- `src/` – sklep (Hono, Node.js 26, TypeScript bez kroku budowania)
- `publiczne/` – style, czcionka Inter (licencja OFL), obrazy produktów
- `testy/` – testy sklepu
- `docs/` – dla czytelnika: `wymagania.md`, `api.md`; dla autora i agenta: specyfikacja z cytatami, celowe usterki, rozbieżności i decyzje
- `akceptacja/` – kod z książki złożony w projekt czytelnika (generowany, nie edytuj)
- `narzedzia/` – skrypty: wyciąganie kodu z książki, testy akceptacyjne, szablon `testy-sklepu` (`szablon.sh`), obrazy produktów
- `wzorzec/` – makieta, na której pierwotnie sprawdzono kod z książki
