# Zestaw startowy: makieta sklepu i testy z książki

Ten katalog powstał podczas weryfikacji kodu z książki „Automatyzacja testów z agentem AI u boku”.
To materiał referencyjny dla Claude Code, a nie gotowe repozytorium dla czytelnika.

## Co jest w środku

- `mock/sklep.js` – makieta sklepu ćwiczeniowego w jednym pliku (Node.js, bez zależności).
  Zachowuje się tak, jak zakłada kod z książki: API, strony, dane startowe, konta testowe,
  kody rabatowe, celowe usterki dostępności i tryby błędów `SKLEP_BLEDY`.
  Jest uproszczona: HTML w szablonach tekstowych, dane w pamięci, brak Dockerfile.
- `tests/` – testy z rozdziałów 6–17 (Page Objecty, fixtures, testy API, wizualne, dostępności,
  bezpieczeństwa, mutacje, seed dla agentów), sprawdzone na Playwright 1.65.1.
- `ewaluacje/` – kod z rozdziału 18 (asystent sklepu, sędzia LLM, ewaluacja).
- `wydajnosc/` – skrypt k6 z rozdziału 11.
- `scripts/`, `merge.config.ts`, `.github/workflows/` – kod z rozdziałów 12–13.
- `playwright.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `package.json` – konfiguracja.

## Uruchomienie

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env
node mock/sklep.js &                      # sklep na http://localhost:3000
npx playwright test --project=chromium
SKLEP_BLEDY=cena-kubka node mock/sklep.js # sklep z wybranym błędem (kilka: oddziel przecinkami)
```

Tryby `SKLEP_BLEDY`: `cena-kubka`, `wolne-api`, `losowa-kolejnosc`, `zmiana-stylu`.
Mutacje z rozdziału 16 włączasz zmienną `MUTACJA` (lista w `tests/mutacje.ts`).

## Jak użyć w Claude Code

Daj makietę agentowi jako wzorzec zachowania (behavior oracle): prawdziwy sklep ma przejść
te same testy co makieta, ale ma być zbudowany porządnie (TypeScript, Dockerfile, obraz
multi-arch, specyfikacja w `docs/`). Szczegóły: zakładka „Plan: sklep i repozytorium” w dokumencie książki.
