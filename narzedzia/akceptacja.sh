#!/bin/bash
# Etap 6: kod z książki (akceptacja/) jako testy akceptacyjne sklepu uruchomionego z obrazu.
# Testy działają w obrazie mcr.microsoft.com/playwright:v1.65.1-noble, jak CI z rozdziału 12.
# Użycie: narzedzia/akceptacja.sh [obraz-sklepu]   (bez argumentu buduje obraz z kodu)
set -uo pipefail
cd "$(dirname "$0")/.."
OBRAZ="${1:-sklep-cwiczeniowy:akceptacja}"
[ $# -eq 0 ] && docker build -q -t "$OBRAZ" . >/dev/null
python3 narzedzia/zloz-akceptacje.py | tail -1

# Testy w sieci kontenera sklepu: sklep jest pod http://localhost:3000, jak u czytelnika na komputerze.
# Pod adresem z sieci prywatnej (np. host.docker.internal albo http://sklep:3000) Chromium 159 blokuje
# żądania strony podmienionej przez page.route (Local Network Access), więc mutacje z rozdziału 16 by nie działały.
SIEC="--network container:sklep-akceptacja"; ADRES="http://localhost:3000"
sklep() { docker rm -f sklep-akceptacja >/dev/null 2>&1; docker run -d --name sklep-akceptacja -e SKLEP_BLEDY="$1" "$OBRAZ" >/dev/null; }
testy() { # $1 = MUTACJA, $2 = plik wyniku, $3 = filtr --grep
  docker run --rm --ipc=host --init $SIEC -e BASE_URL="$ADRES" -e MUTACJA="$1" -e NPM_CONFIG_UPDATE_NOTIFIER=false \
    -v "$(pwd)/akceptacja":/work -v akceptacja-node-modules:/work/node_modules -v "$(pwd)/narzedzia":/narzedzia -w /work \
    mcr.microsoft.com/playwright:v1.65.1-noble \
    sh -c "npm ci --silent && node scripts/czekaj-na-sklep.ts >/dev/null && npx playwright test --project=chromium --workers=1 --reporter=json $3 > /tmp/w.json 2>/dev/null; cp /tmp/w.json /narzedzia/.wyniki-$2.json"
}
porownaj() { node narzedzia/porownaj-wyniki.mjs "narzedzia/.wyniki-$1.json" "$2" "${@:3}" || BLAD=1; }

BLAD=0
AXE=("dostepnosc.spec.ts › strona / nie ma naruszeń WCAG wykrywalnych automatycznie" "dostepnosc.spec.ts › strona /logowanie nie ma naruszeń WCAG wykrywalnych automatycznie" "dostepnosc.spec.ts › strona /produkty/kubek nie ma naruszeń WCAG wykrywalnych automatycznie")
KOSZYK=("dodatek-a-struktura.spec.ts › klient dodaje dwa kubki do koszyka" "dodatek-f-trzy-narzedzia.spec.ts › klient dodaje dwa kubki do koszyka" "dostepnosc.spec.ts › przycisk dodawania do koszyka działa z klawiatury" "fragmenty.spec.ts › R7 §7.5 własny komunikat" "koszyk.spec.ts › klient dodaje dwa kubki do koszyka" "r10-niestabilne.spec.ts › niestabilny: sztywne czekanie" "r10-niestabilne.spec.ts › stabilny: asercja web-first" "wizualne.spec.ts › koszyk z kubkiem wygląda jak wzorzec")

sklep ""
testy "" baza ""
porownaj baza "bez mutacji i trybów (celowe usterki dostępności)" "${AXE[@]}"
testy cena-kubka cena-kubka ""
porownaj cena-kubka "MUTACJA=cena-kubka" "${AXE[@]}" "fragmenty.spec.ts › R7 §7.5 asercje miękkie"
testy bez-komunikatu bez-komunikatu ""
porownaj bez-komunikatu "MUTACJA=bez-komunikatu" "${AXE[@]}" "${KOSZYK[@]}"
testy blad-koszyka blad-koszyka ""
porownaj blad-koszyka "MUTACJA=blad-koszyka" "${AXE[@]}" "${KOSZYK[@]}" "fragmenty.spec.ts › DA A.6 czekanie na odpowiedź" "fragmenty.spec.ts › R10 §10.3 czekanie na odpowiedź serwera" "fragmenty.spec.ts › R7 §7.2 filtr hasText" "fragmenty.spec.ts › R7 §7.5 expect.poll"
testy pusty-katalog pusty-katalog ""
porownaj pusty-katalog "MUTACJA=pusty-katalog" "${AXE[@]}" "fragmenty.spec.ts › DA A.6 czekanie na odpowiedź" "fragmenty.spec.ts › R7 §7.2 filtr has" "fragmenty.spec.ts › R7 §7.2 filtr hasText" "fragmenty.spec.ts › R7 §7.2 listy elementów"
sklep cena-kubka
testy "" tryb-cena-kubka ""
porownaj tryb-cena-kubka "SKLEP_BLEDY=cena-kubka" "${AXE[@]}" "fragmenty.spec.ts › R7 §7.5 asercje miękkie" "katalog.spec.ts › strona kubka pokazuje nazwę i cenę"
sklep zmiana-stylu
testy "" tryb-zmiana-stylu "--grep @wizualne"
porownaj tryb-zmiana-stylu "SKLEP_BLEDY=zmiana-stylu (testy wizualne)" "wizualne.spec.ts › strona kubka wygląda jak wzorzec" "wizualne.spec.ts › koszyk z kubkiem wygląda jak wzorzec"
docker rm -f sklep-akceptacja >/dev/null
rm -f narzedzia/.wyniki-*.json
exit $BLAD
