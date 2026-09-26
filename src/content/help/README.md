# Uitleg voor Alice

De tekst van de kaart "Zo werkt het" en van het Uitleg-paneel staat in één bestand: `help.ts`. Je past het aan door alleen dat bestand te wijzigen.

- `goal`: het doel van het spel, maximaal 5 korte zinnen.
- `steps`: 3 of 4 stappen, elk met een icoon (`pick`, `note`, `place` of `hint`), een titel en een korte tekst.
- `more`, `keywords`, `close`, `link`: de overige knoppen en koppen.
- `version`: verhoog dit getal na een echte wijziging, dan krijgt iedereen de kaart nog één keer bij het eerste bezoek van level 1.
- De Kernwoorden (de woordenlijst) worden niet standaard getoond, alleen achter de knop "Kernwoorden". Die lijst staat in `src/ui/play/glossary.ts`.

`bun run test` bewaakt de lengtes.

## Legenda

De Legenda (knop "Legenda" naast Uitleg, en een knop op de kaart "Zo werkt het") zegt wat er op het bord van het huidige level staat. De regels over spullen, deuren en ramen worden uit de plattegrond van dat level gemaakt (`src/ui/help/legend.ts`), dus er staat nooit iets in wat er niet is. De woorden eromheen staan in `help.ts` onder `legend`.
