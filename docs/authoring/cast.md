# The cast: names, genders and portraits

Every puzzle has N people: N - 1 suspects and the victim ("the victim", no name, no gender). The suspects' names and genders are decided
**when the schedule is generated** and baked into the puzzle file; nothing picks a name at runtime, so everybody gets the same puzzle and the same names.

## The pool (`src/content/cast/pool.ts`)

`CAST_POOL` holds simple, plain English first names, each with the gender it reads as (`woman` or `man`). Rules (a test keeps them):

- first letters A-Y without Q, U, X and Z (22 letters); four to six names per letter;
- at least two names of each gender on every letter, so the previous day's name can always be avoided without breaking the gender balance;
- no duplicates, no unusual or hard to read names, no names of real public figures;
- no name that a hint or clue sentence could contain as a word part (for example a name that is a prefix of "marked").

The personal-data audit (`bun run audit:personal`) scans the pool like any other file; never add a name from the owner's circle.

## Picking a cast (`castFor`)

```ts
import { castFor } from 'src/content/cast'
const { names, genders, portraits } = castFor(size, seed, previousCast)
```

- `size` is the number of people, victim included (`size - 1` suspects; a 9x9 board has size 9). At most 23.
- One name per suspect, each on a **distinct first letter**; **genders balanced** (women and men differ by at most one; with an odd number the seed decides who has one more).
- Seeded and deterministic: same `size` and `seed`, same cast. The schedule tool passes a seed per day (for example the puzzle id).
- `previousCast` (the day before's names): none of them is used again, and its letters are left alone while other letters exist (up to 11 suspects never share a letter with the day before). Consecutive days therefore never repeat a set.
- Names come back in alphabetical order of their first letter, which is also the seat order: the notes and markers of the board use the initial letter, so a player finds a suspect by letter.

## Gates

`castProblems(names, genders?)` (same folder) returns what is wrong with a cast: names outside the pool, two names on one letter, a gender that differs from the pool's,
genders not balanced. `entryProblems` (`src/content/packs/gates.ts`) runs it on every pack entry (and requires a gender on every suspect); the schedule tool
uses the same helper, plus `sharedNames(today, yesterday)` to check that consecutive days share no name.

## Portraits (`src/content/cast/portraits.ts`)

Portraits do not depend on names. `PORTRAIT_DESIGNS` has eight female-coded and eight male-coded flat busts (`f1`-`f8`, `m1`-`m8`): a hair style, an outfit and an accessory each
(glasses, hoops, headband, cap, beanie, beard, moustache, freckles), drawn by `ProceduralAvatar` (`src/render/cards/procedural/`). A **look** adds colours: skin (8 tones), hair, shirt and accent.

`portraitsFor(genders, seed)` maps the people to looks by gender slot: the k-th woman gets the k-th female design of a seeded order, the k-th man the k-th male design,
so two people of one puzzle never share a design (up to eight of each gender); the first eight skin tones and first ten shirt colours are all different. The app builds the
looks from the puzzle's genders and its seed (`buildCastFromPeople`, `castFor` in `src/ui/play/people.ts`), so a puzzle looks the same on every device.

To look at every design and some sample casts: `bun tools/portrait-sheet.ts /some/folder/portraits.html` (default: the OS temp folder), then open the file in a browser.

## Ladder tools

`bun tools/ladder.ts --cast` labels a puzzle with `ladderCast(size)` (`castFor(size, 'ladder')`) and gives the people its genders, so the gender cards match the names.
