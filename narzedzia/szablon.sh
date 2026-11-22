#!/bin/bash
# Etap 8: buduje historię repozytorium testy-sklepu – stan projektu po rozdziałach od..do, każdy sprawdzony.
# Użycie: narzedzia/szablon.sh <od> <do> [obraz-sklepu]
# Rozdział 3 trafia na gałąź main (start dla czytelnika), kolejne na gałąź rozdzialy; każdy stan ma tag rozdzial-NN.
set -uo pipefail
cd "$(dirname "$0")/.."
SKLEP=$(pwd); REPO="$SKLEP/../testy-sklepu"; OBRAZ="${3:-sklep-cwiczeniowy:akceptacja}"
PW=mcr.microsoft.com/playwright:v1.65.1-noble
AXE=("dostepnosc.spec.ts › strona / nie ma naruszeń WCAG wykrywalnych automatycznie" "dostepnosc.spec.ts › strona /logowanie nie ma naruszeń WCAG wykrywalnych automatycznie" "dostepnosc.spec.ts › strona /produkty/kubek nie ma naruszeń WCAG wykrywalnych automatycznie")

docker rm -f sklep-szablon >/dev/null 2>&1
docker run -d --name sklep-szablon "$OBRAZ" >/dev/null

for n in $(seq "$1" "$2"); do
  NN=$(printf "%02d" "$n"); T=$(mktemp -d)
  python3 narzedzia/zloz-akceptacje.py --do-rozdzialu "$n" --szablon --cel "$T" >/dev/null || { echo "✗ rozdział $n: składanie"; exit 1; }
  cp narzedzia/szablon/package-lock.json "$T/"
  # Sprawdzenie w obrazie Playwrighta, w sieci kontenera sklepu (sklep pod http://localhost:3000).
  # Plik .env tylko na czas sprawdzenia; dane z rozdziału 8.5, nie trafiają do repozytorium.
  printf 'BASE_URL=http://localhost:3000\nADMIN_EMAIL=admin@sklep.test\nADMIN_HASLO=Admin123!\n' > "$T/.env"
  docker run --rm --ipc=host --init --network container:sklep-szablon -e NPM_CONFIG_UPDATE_NOTIFIER=false \
    -v "$T":/work -v szablon-node-modules:/work/node_modules -v "$SKLEP/narzedzia":/narzedzia -w /work $PW sh -c "
      npm ci --silent || exit 11
      if [ $n -ge 4 ]; then npm run check --silent >/tmp/check.log 2>&1 || { cat /tmp/check.log; exit 12; }; fi
      if [ $n -ge 6 ]; then npx playwright test --project=chromium --workers=1 --reporter=json > /narzedzia/.wyniki-szablon.json 2>/dev/null; fi
      exit 0" ; KOD=$?
  [ $KOD -ne 0 ] && { echo "✗ rozdział $n: kod $KOD (11 = npm ci, 12 = npm run check)"; exit 1; }
  if [ "$n" -ge 6 ]; then
    OCZ=(); [ "$n" -ge 11 ] && OCZ=("${AXE[@]}")
    node narzedzia/porownaj-wyniki.mjs narzedzia/.wyniki-szablon.json "rozdział $n: testy" ${OCZ[@]+"${OCZ[@]}"} || exit 1
  else
    echo "✓ rozdział $n: npm ci$([ "$n" -ge 4 ] && echo ', npm run check')"
  fi
  rm -f "$T/.env"; rm -rf "$T/test-results" "$T/playwright-report" "$T/playwright/.auth"; rmdir "$T/playwright" 2>/dev/null
  # Zapis stanu w repozytorium testy-sklepu.
  if [ "$n" -eq 3 ]; then git -C "$REPO" switch -q main; else git -C "$REPO" switch -q rozdzialy 2>/dev/null || git -C "$REPO" switch -q -c rozdzialy rozdzial-03; fi
  find "$REPO" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
  cp -R "$T"/. "$REPO"/
  git -C "$REPO" add -A
  if [ "$n" -eq 3 ]; then MSG="Szablon: stan z początku rozdziału 3"; else MSG="Stan projektu po rozdziale $n"; fi
  git -C "$REPO" commit -q -m "$MSG" -m "Kod z książki do rozdziału $n włącznie, sprawdzony: npm ci$([ "$n" -ge 4 ] && echo ', npm run check')$([ "$n" -ge 6 ] && echo ', testy Playwright na obrazie sklepu')." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" || echo "  (bez zmian w rozdziale $n)"
  git -C "$REPO" tag -f "rozdzial-$NN" >/dev/null
  rm -rf "$T"
done
docker rm -f sklep-szablon >/dev/null; rm -f narzedzia/.wyniki-szablon.json
