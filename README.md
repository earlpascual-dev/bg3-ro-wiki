# Geffen Codex — a BG3 party build wiki for Ragnarok Online players

An offline static wiki holding a complete Baldur's Gate 3 party build, explained through Ragnarok Online class and skill analogies — and flagging every place the analogy breaks down.

**Live:** https://earlpascual-dev.github.io/bg3-ro-wiki/

No build step, no framework, no CDN, no dependencies. Works fully offline.

---

## The party

| RO concept | BG3 build | Role |
|---|---|---|
| Sniper | Hunter Ranger 12 | AoE DPS — Volley, Horde Breaker, Sharpshooter |
| Assassin Cross | Assassin Rogue 9 / Champion Fighter 3 | Single-target burst opener |
| Full Support Priest | Life Domain Cleric 12 | Heals, Bless, Warding Bond |
| Crusader | Oath of the Ancients Paladin 9 / Battle Master Fighter 3 | Chokepoint tank |

Covers level-by-level tables (1–12) for all four characters, full stat arrays, gear by act, turn-by-turn combat rotations, and a chronological action checklist with irreversible decisions flagged.

## Accuracy — read this

**This wiki was written entirely from recall. No source was consulted while writing it** — not bg3.wiki, not the game files, not a guide. There is no citation list.

Treat it as an experienced player's notes written from memory, not as a reference work. The **Overview → Sources & Confidence** panel breaks the content into high / medium / low confidence tiers and tells you what to verify first. Known weak spots: Favoured Enemy and Natural Explorer option names, and every vendor name and item location.

It also predates any game patch after roughly May 2026, so the "alternatives" lists may omit newer subclasses.

**Whatever the game's level-up screen actually shows you overrides this wiki.**

## Running it locally

```bash
npx -y http-server . -p 8126 -c-1
```

Then open http://localhost:8126

The folder version needs an HTTP server — `app.js` loads content with `fetch()`, which browsers block on `file://`. Opening `index.html` by double-clicking shows an error panel explaining exactly this.

To open it with no server at all, use the single-file build: **`dist/bg3-ro-wiki.html`** (~160 KB, fully self-contained, works from `file://`).

## Editing the content

All build content lives in `data/*.json`. `index.html` contains **no** build data — `app.js` fetches the JSON and renders everything, including the sidebar navigation.

**Edit JSON, never markup.**

```
data/characters.json   party meta, stat arrays, RO mappings, level 1-12 tables
data/gear.json         items by act, keyed to a wearer
data/rotations.json    pre-combat / opener / sustain / panic per character
data/checklist.json    chronological tasks with costs and warnings
```

`characters[].id` (`main`, `astarion`, `shadowheart`, `paladin`) is the foreign key used by `gear.json` (`wearer`), `rotations.json` (`characterId`) and `checklist.json` (`characterId`, which also accepts `party`).

After editing, re-run `node build.js` if you want the single-file build refreshed. The folder version needs no rebuild.

## Structure

```
index.html              empty shell — no build data
css/styles.css          RO window aesthetic, pure CSS
js/app.js               fetch, hash router, renderers, search, filters
data/*.json             all content
build.js                optional: emits dist/bg3-ro-wiki.html
dist/bg3-ro-wiki.html   generated single-file build
```

## Implementation notes

- **Hash routing** (`#/character/main`) so it works from a subpath, from `file://`, and from localhost identically.
- **One data source, two delivery modes.** `app.js` uses `window.__BG3_DATA__` when the single-file build has inlined it, and falls back to `fetch()` otherwise. No forked logic.
- **Checklist progress** persists to `localStorage` under `bg3_ro_wiki_checklist_v1`. Task ids come from JSON, so renumbering them orphans saved progress.
- **Search** lazily flattens all four JSON files into `{kind, title, text, route}` records on first keystroke.
- **All icons are original inline SVG.** No game assets, sprites, or fonts from Baldur's Gate 3 or Ragnarok Online are referenced or embedded anywhere — the entire RO window aesthetic is built from CSS borders and gradients. This is deliberate: it's what makes the project publishable.

## Licence

Original work. Baldur's Gate 3 is a trademark of Larian Studios; Ragnarok Online is a trademark of Gravity Co., Ltd. This is an unofficial fan-made guide with no affiliation to, or endorsement by, either.
