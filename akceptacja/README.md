# Kod z książki jako testy akceptacyjne (etap 6)

Ten katalog jest GENEROWANY skryptem `narzedzia/zloz-akceptacje.py` z bloków kodu w `ksiazka/`. Nie edytuj go ręcznie:
popraw tekst książki albo manifest w skrypcie i złóż katalog ponownie.

Każdy blok kodu z książki jest w manifeście: użyty w pliku albo pominięty z podanym powodem. Uzupełnienia, których
nie ma w książce (importy, owinięcie fragmentów w testy, obejścia zalecane w rozdziale 7.3), mają komentarz
`UZUPEŁNIENIE (etap 6)`.

Uruchomienie całej macierzy (baza, mutacje z rozdziału 16, tryby SKLEP_BLEDY) na obrazie sklepu:

```bash
narzedzia/akceptacja.sh            # buduje obraz z kodu
narzedzia/akceptacja.sh <obraz>    # testuje gotowy obraz
```

Wyniki i rozbieżności z tekstem: `docs/rozbieznosci.md`, część E.
