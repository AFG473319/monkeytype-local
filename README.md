# monkeytype local

A typing test you can run offline, forever. Open `index.html` in any modern browser
and you get the whole thing: no server, no build step, no dependencies, no account,
and not a single network request.

It is a from-scratch homage to [monkeytype](https://monkeytype.com) — the same layout,
the same metrics, the same feel — with all of the logic written for this project and
all of the data bundled locally.

---

## Running it

Double-click **`index.html`**. That is the entire installation.

The site is designed to work from a `file://` URL, so it also works if you copy the
folder to a USB stick, an air-gapped machine, or a 2012 laptop. Nothing is fetched at
runtime: no CDN, no Google Fonts, no analytics, no telemetry.

If you would rather serve it over HTTP, any static server does the job:

```sh
npx serve .        # or: python -m http.server
```

---

## What it does

**Four modes**

| mode | what it is |
| --- | --- |
| `time` | 15 / 30 / 60 / 120 seconds; the clock decides when you stop |
| `words` | 10 / 25 / 50 / 100 / on and on; you stop when the last word is done |
| `quote` | short, medium, long and thicc passages, punctuation and capitals included |
| `zen` | no word list at all — type whatever you want, press enter to finish |

**Test configuration**

- `punctuation` and `numbers` injection, exactly the way a real test mixes them in
- eight languages: english (2,308 common words), english 200, english + long words,
  plus javascript, python, html, css and sql
- six funboxes: none, long words, numbers only, punctuation hell, reverse, uppercase
- difficulty: `normal`, `expert` (no backspace), `master` (no backspace, punctuation and numbers forced on)

**Scoring**

- live wpm / acc / burst / timer above the words while you type
- results screen: wpm, acc, raw, consistency, burst, characters, test type, duration
- a proper results chart — wpm and raw as lines, your per-second errors as bars, with a hover tooltip
- optional words history under the chart, mistakes highlighted
- personal bests tracked per mode, per value, per language, per punctuation/numbers setting
- everything stored in `localStorage` — see below

**Look and feel**

- 51 themes, including serika, dracula, nord, monokai, solarized, rose pine and friends
- a fully editable custom theme (ten colour pickers)
- five caret styles, smooth caret, blinking when idle
- 3-line scrolling word view, smooth line scroll, max line width, page width
- focus mode that fades the interface out while you type
- an on-screen keymap in two flavours: your keyboard layout, or an accuracy heatmap
- click and error sounds synthesised with the Web Audio API (there are no audio files to download)

**Interface**

- `Esc` opens the command line: fuzzy search over every theme, language, mode, setting and page
- theme dropdown in the header, click-to-switch, with colour swatches
- about, profile and settings pages
- results, personal bests and a progress chart on the profile page

---

## Keyboard

| key | action |
| --- | --- |
| `tab` then `enter` | restart the test, same settings (the classic gesture) |
| `tab` | arms the restart, shows the hint |
| `esc` | open the command line |
| `ctrl` + `k` | open the command line |
| `enter` | next test, once a result is showing |
| `backspace` | step back a letter, or back into the previous word |
| `ctrl` + `backspace` | clear the current word |

`esc` also restarts the test instead of opening the command line when *Quick restart*
is set to `esc` — just like the real thing.

---

## How the numbers are calculated

Spelled out, because a typing test you cannot audit is just a random number generator.

- **wpm** (net) — every correctly typed character counts, and the space after a word
  counts only if that word was completed perfectly. Divide by 5, divide by minutes.
  A word with one wrong letter in it therefore contributes nothing.
- **raw** — every character you pressed, right or wrong, over the same window. The two
  lines on the results chart are the actual gap between your speed and your accuracy.
- **accuracy** — correct keystrokes ÷ all keystrokes. Backspacing does **not** refund a
  wrong press, which is why fixing a mistake does not restore your accuracy to 100%.
- **consistency** — `1 − (standard deviation ÷ mean)` of your per-second raw wpm.
  High consistency means you held a pace instead of sprinting and stalling.
- **burst** — your best single second of raw speed.
- **characters** — `correct / incorrect / extra / missed`. *Extra* is text typed past
  the end of a word; *missed* is letters skipped by pressing space early.

The chart samples once per second, so the x-axis is seconds for a result and test count
for the profile graph.

---

## Where your data lives

Three keys in `localStorage`, nothing else:

| key | contents |
| --- | --- |
| `mt_config` | every setting |
| `mt_results` | your test history (last 2000 tests) |
| `mt_pbs` | personal bests |

Nothing is uploaded, because there is nowhere to upload it to. "Delete account" is
`reset data` in the footer, or clearing site data for the page.

---

## Project layout

```
index.html          the whole shell: header, pages, config bar, command line
css/style.css       all styling, driven by ten theme variables
js/app.js           bootstrap, routing, wiring
js/config.js        defaults, the settings schema, persistence, result storage
js/typing.js        the engine: generation, input, rendering, scoring, timing
js/ui.js            config bar, dropdowns, settings page, profile, results screen
js/chart.js         a small dependency-free SVG line/bar chart
js/commands.js      the fuzzy command line
js/keymap.js        keyboard layouts, live highlighting, the accuracy heatmap
js/sound.js         Web Audio click and error sounds
js/data/words.js    english word lists and the code languages
js/data/quotes.js   the quote pool
js/data/themes.js   the theme palettes
tests/smoke.html    the test suite (see below)
```

Scripts are plain classic scripts loaded in order, deliberately: `type="module"` and
`fetch()` of local JSON are both blocked on `file://` URLs by browser security rules,
and the whole point of this project is that double-clicking the HTML file works.

---

## Tests

There is no npm, no test runner and no build step, so the suite is a page:
open **`tests/smoke.html`** and look at the report it prints at the bottom. The first
line is a machine-readable summary and the `<title>` mirrors it
(`SMOKE failed=0 total=109`), so a script can check it without parsing the list.

It covers 109 checks across the real seams — the word generator, the typing engine, the
chart renderer and the UI — including:

- a deterministic, seeded property test proving that a generated sentence always opens
  with a capital letter and never with a number, and always ends with sentence punctuation
- typing, mistakes, extra letters, backspacing, and backspacing across a word boundary
- the caret following the letters, including on extra letters
- the clock ending a timed test on its own, with no interval left running
- expert mode refusing backspace while normal mode allows it
- personal bests only ever improving
- theme switching, punctuation/numbers injection and the config bar
- the word lists themselves: no duplicated words, no label that claims a size the list
  does not have, and `english 200` really is the top 200 of the english list
- the live speed readout staying sane from the very first keystroke instead of dividing
  by a millisecond-wide time window

To run it headlessly:

```sh
chrome --headless=new --allow-file-access-from-files \
  --virtual-time-budget=9000 --dump-dom tests/smoke.html
```

One caveat, stated plainly: `tests/smoke.html` mirrors the markup of `index.html`
rather than loading it, because `file://` pages cannot read each other. If you change
the ids in `index.html`, change them there too — the suite fails loudly when an id goes
missing, but it cannot notice markup that was never mirrored.

---

## What this is not

Being explicit about the boundaries, because "just like the real site" deserves an
honest answer:

- **No accounts, leaderboards, daily challenges, XP, badges or theme shop.** Those are
  server features. There is no server here, and adding a fake one would be worse than
  leaving them out.
- **No custom text mode**, and time/word values are the fixed presets rather than
  arbitrary numbers. Typing your own passage is what zen mode is for.
- **A smaller language set.** Eight rather than the real site's dozens.
- **Themes are recreations.** The palettes for well-known schemes (Dracula, Nord,
  Solarized, Monokai, Rose Pine …) are reproduced as colour data, which is not
  copyrightable, and the rest are original in the same spirit. Expect close
  approximations rather than guaranteed pixel matches.
- **The word lists are mine.** They come from common-English frequency data and from
  language keywords, not from monkeytype's lists.
- **This shares no code or assets with monkeytype.**

---

## Credits and provenance

**This is an independent tribute to [monkeytype](https://monkeytype.com), the typing
test created by Miodec and its contributors.** The source of the idea is
<https://github.com/monkeytypegame/monkeytype> — its interface, its metric definitions
and the overall feel of it shaped every decision here.

To be explicit about the relationship:

- **This is not affiliated with, endorsed by, or connected to monkeytype or Miodec.**
- **No monkeytype code, word list, styling or asset was copied or ported.** Everything
  in this repository was written from scratch for it. The *behaviour* is an imitation;
  the *implementation* is not a derivative work of theirs.
- **The name is used only to describe what this project imitates.** "monkeytype" and its
  branding belong to their owners. Nothing here tries to pass itself off as the
  original, and the mark in the header is a different one.
- The original project is licensed **GPL-3.0**, and that licence covers *their* code.
  None of it is present here, so this repository is licensed **MIT** (see `LICENSE`).
  If you want to reuse monkeytype's actual code, go to their repository and respect
  GPL-3.0 there.

Word lists are drawn from common-English frequency data; quotes are from public-domain
authors and historical documents, or short attributed quotations; theme palettes are
colour data recreated from widely known colour schemes.

---

## How this was built

This project was created with AI assistance, and that is stated here deliberately.

Correctness rests on the automated test suite described under **Tests** below rather
than on years of production use, so treat it as reviewed-by-one-person software. It is a
complete, working implementation, not a mock-up or a wrapper — and a bug here is an
ordinary bug in an ordinary repository, so please open an issue.

---

## License

MIT — see [`LICENSE`](LICENSE). You may use, modify and redistribute this code, including
commercially, provided the copyright notice is kept. It comes with no warranty.

The "monkeytype" name and branding are not covered by this licence and remain the
property of their owners.
