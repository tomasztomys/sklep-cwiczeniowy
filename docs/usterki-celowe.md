# Celowe usterki dostępności

Status: **szkic z etapu 1, do zatwierdzenia przez autora**.

Te usterki są zamierzone. Czytelnik szuka ich w rozdziałach 5 i 11 i pisze dla nich zgłoszenia w rozdziale 13.
Sklep nie może ich naprawić ani dodać innych. Źródła zapisujemy jak w `docs/specyfikacja.md`.

- R5 §5.1 «Sklep ćwiczeniowy ma kilka takich celowo przygotowanych usterek. Poszukasz ich w ćwiczeniach i w rozdziale 11.»
- R13 §13.2 «Usterki dostępności z rozdziału 11 są w sklepie na stałe»

## Lista

Wszystkie cztery usterki są w stopce, więc występują na każdej stronie (ST-4).

| Nr | Usterka | Jak zbudowana | Reguła axe |
| --- | --- | --- | --- |
| U-1 | Przycisk czatu bez nazwy dostępnej | `<button>` z samą ikoną SVG (`aria-hidden="true"`), bez tekstu, `aria-label`, `aria-labelledby` i `title`. Kliknięcie nic nie robi [propozycja] | `button-name` |
| U-2 | Za niski kontrast | Tekst „Darmowa dostawa od 200 zł” jasnoszary (`#c8c8c8`) na białym tle, kontrast ok. 1,7:1 [makieta] | `color-contrast` |
| U-3 | Pole wyszukiwania bez etykiety | `<input type="search">` bez `<label>`, `aria-label`, `aria-labelledby`, `title` i `placeholder`. Pole nic nie wyszukuje [propozycja] | `label` |
| U-4 | Newsletter jako `div` | `<div class="btn">` z tekstem „Zapisz się do newslettera” i obsługą kliknięcia, bez roli, bez `tabindex` i bez obsługi klawiatury. Kliknięcie myszą pokazuje obok tekst „Dziękujemy za zapis” [propozycja], bez okienka `alert()` | brak, axe tego nie wykrywa |

Źródła:
- R11 §11.2 «Na sklepie ćwiczeniowym wszystkie trzy testy się wyłożą, bo w stopce są celowo przygotowane usterki. axe zgłosi trzy rodzaje naruszeń:»
- R11 §11.2 «button-name | Przycisk czatu z samą ikoną, bez nazwy dostępnej»
- R11 §11.2 «color-contrast | Jasnoszary tekst „Darmowa dostawa od 200 zł” na białym tle»
- R11 §11.2 «label | Pole wyszukiwania bez etykiety»
- R11 §11.2 «W stopce jest jeszcze czwarta usterka: element „Zapisz się do newslettera”, czyli div, który tylko wygląda jak przycisk.»
- R11 §11.2 «Ten sam test napisany dla newslettera się wyłoży, bo div nie przyjmuje fokusu.»
- R5 §5.1 «<div class="btn" onclick="dodaj()">Dodaj do koszyka</div>»

## Warunki, które musi spełniać sklep

**UC-1. Dokładny wynik axe.** Skan axe z tagami `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` i `wcag22aa` na stronach `/`, `/produkty/kubek`, `/logowanie` i `/koszyk` (zalogowany, z produktem i bez) zgłasza dokładnie trzy reguły: `button-name`, `color-contrast` i `label`, każdą dla dokładnie jednego elementu w stopce [propozycja: jeden element na regułę]. Inne strony, np. `/produkty/notes`, dają ten sam wynik.
- R11 §11.2 «.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])»
- R11 §11.2 «const strony = ['/', '/produkty/kubek', '/logowanie'];»

**UC-2. Newsletter nie przyjmuje fokusu.** `focus()` na elemencie znalezionym przez `getByText('Zapisz się do newslettera')` nie ustawia na nim fokusu, więc test z `test.fail()` z książki przechodzi.
- R11 §11.2 «const newsletter = page.getByText('Zapisz się do newslettera');»
- R11 §11.2 «await expect(newsletter).toBeFocused({ timeout: 1000 });»

**UC-3. Tylko te usterki.** Poza U-1–U-4 sklep spełnia WCAG 2.2 AA w zakresie, który da się sprawdzić automatycznie, i obsługę klawiaturą na ścieżce zakupu (ST-24).

**UC-4. Usterki nie przeszkadzają testom.** Stopka nie ma elementów o rolach `status`, `alert` ani `listitem` i nie zawiera tekstów, których szukają testy z książki, np. cen produktów (T-1–T-3 w specyfikacji).
