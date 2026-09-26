# Help text

The text of the "How it works" card and of the Help panel lives in one file: `help.ts`. Change the wording by editing only that file.

- `goal`: the goal of the game, at most 5 short sentences.
- `steps`: 3 or 4 steps, each with an icon (`pick`, `note`, `place` or `hint`), a title and a short text.
- `more`, `keywords`, `close`, `link`: the remaining buttons and headings.
- `version`: raise this number after a real change of the rules or the wording; everybody then gets the card once more on the first visit of level 1.
- The keywords (the glossary) are not shown by default, only behind the "Keywords" button. The glossary lives in `src/ui/play/glossary.ts`; its examples are cards rendered by the engine (`src/engine/clues/en.ts`), so they never drift from the game.

`bun run test` guards the lengths.

## Legend

The Legend (the "Legend" button next to Help, and a button on the "How it works" card) says what is on the board of the current level. The rows about objects, doors and windows are built from the floor plan of that level (`src/ui/help/legend.ts`), so it never lists something that is not there. The words around them live in `help.ts` under `legend`.
