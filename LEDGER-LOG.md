# LEDGER-LOG

*What happened, session by session. **Append-only, newest first** — never edit an entry; write a new one that corrects it. Marked `merge=union` in `.gitattributes`, so entries written on two machines the same day both survive. State lives in `LEDGER.md`; this file is history.*

**Entry format.**

```
### YYYY-MM-DD · C-KEY · <short title>
[session](<conversation link>)

- **Wrote:** files created or changed, with paths.
- **Rows:** ledger rows touched and their new state.
- **Decisions:** taken or opened (and added to §3).
- **Answers acted on:** ANSWERS.md entries, by heading.
- **Prompts:** written / updated / verified / superseded.
- **Next:** the one thing the next session on this thread should do.
```

---

### 2026-11-08 · C-APP · Tools as chips with curves
[session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr)

- **Wrote:** `app/src/views/IngredientTable.tsx` (chips, measured SVG curves, targets), `app/src/graph/tree.ts` (+ test: tool rows removed), `app/src/styles.css`; `LEDGER.md` C-8, §3; prompt.
- **Rows:** C-8 updated.
- **Decisions:** taken — chips + curves replace tool rows (Vilhelm).
- **Answers acted on:** none.
- **Prompts:** C-APP swept; falsifier still true. Tests 29 green; lasagna 15 and stir-fry 13 curves, no overflow at 412 px; first try drew curves over labels, moved behind the table.
- **Next:** Vilhelm pushes; phone cook-through.

### 2026-11-08 · C-APP · Cooking on the recipe page; tools in the table
[session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr)

- **Wrote:** `app/src/cook/session.tsx`, `app/src/views/StepsCook.tsx`, `app/src/views/CookBar.tsx`, `app/src/views/Timer.tsx` (new); `app/src/cook/scheduler.ts` (+ test: `check`, `uncheck`, `ancestors`, `descendants`), `app/src/graph/tree.ts` (+ test: tool rows), `app/src/views/IngredientTable.tsx`, `app/src/views/LaneView.tsx`, `app/src/views/GraphView.tsx`, `app/src/views/RecipeView.tsx`, `app/src/App.tsx`, `app/src/styles.css`, `app/README.md`; `app/src/views/CookingMode.tsx` removed (Vilhelm `git rm`); `LEDGER.md` C-5, C-8, C-10, §3; prompt.
- **Rows:** C-10 added `done`; C-8 extended (tools); C-5 `drafted` (phone test pending).
- **Decisions:** taken — tools as rows; cooking on recipe page, graphs separate; cascade ticking; highlight + timeline scrubber (Vilhelm).
- **Answers acted on:** none.
- **Prompts:** C-APP swept; falsifier still true. Tests 29 green; headless phone run: start, bar Done ×2, tick Saute in the table → brown/chop/mince/saute done; untick Chop in lanes → chop + saute undone; timeline drag previews Bake at 1:00:00 in table and list; no errors.
- **Next:** Vilhelm pushes; phone cook-through.

### 2026-11-08 · C-APP · Latest-start scheduling (C-9)
[session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr)

- **Wrote:** `app/src/cook/scheduler.ts` (+ test), `app/src/cook/alerts.ts`, `app/src/recipes.ts`, `app/src/graph/lanes.ts` (+ test), `app/src/views/CookingMode.tsx`, `app/src/views/LaneView.tsx`, `app/src/views/RecipeView.tsx`, `app/src/styles.css`, `app/README.md`; `spec/fixtures/lasagna.recipe.json`, `spec/fixtures/meringues.recipe.json` (preheat durations, data only); `spec/CHANGELOG.md`; `LEDGER.md` A-7, C-9, §3; prompt.
- **Rows:** C-9 `done`; A-7 note (two new candidates).
- **Decisions:** taken — latest-start scheduling (Vilhelm); `PREP_LEAD` superseded.
- **Answers acted on:** none.
- **Prompts:** C-APP swept; falsifier still true. Tests: app 28, spec 24 green. Phone-size headless run: lasagna plan preheats at 45 min for a 60-min bake; cook mode raised "Start now" with 4 min of simmer left, not at 16 min.
- **Next:** Vilhelm pushes; re-test deployed site in Chrome; phone cook-through (C-5).

### 2026-11-08 · C-APP · Bracket-table ingredient list
[session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr)

- **Wrote:** `app/src/graph/tree.ts` (+ `tree.test.ts`), `app/src/views/IngredientTable.tsx` (new); `app/src/views/RecipeView.tsx`, `app/src/format.ts` (`displayName` moved here), `app/src/styles.css`; `LEDGER.md` C-8, C-9, §3; prompt.
- **Rows:** C-8 `done`; C-9 added `todo` (latest-start scheduling, proposed, awaiting Vilhelm).
- **Decisions:** taken — bracket table and its non-tree rules.
- **Answers acted on:** none.
- **Prompts:** C-APP swept; falsifier still true. Tests 26 green; all 5 fixtures fit 412 px, no errors.
- **Next:** Vilhelm pushes; decide C-9.

### 2026-11-08 · C-APP · Lane graph view
[session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr)

- **Wrote:** `app/src/graph/lanes.ts` (+ `lanes.test.ts`), `app/src/views/LaneView.tsx` (new); `app/src/views/GraphView.tsx` (Map, left to right, fitView), `app/src/router.ts` (`#/r/<id>/map`), `app/src/App.tsx`, `app/src/styles.css`; `LEDGER.md` C-4, C-7, §3; prompt.
- **Rows:** C-4 `done` (lanes + map); C-7 added `todo`.
- **Decisions:** taken — lane graph default, must fit width; sub-recipes later (Vilhelm).
- **Answers acted on:** none.
- **Prompts:** C-APP swept; falsifier still true. Tests 20 green; at 412 px no horizontal overflow on any checked fixture, dark and light.
- **Next:** Vilhelm pushes; re-test deployed site in Chrome.

### 2026-11-08 · C-APP · Graph layout vertical
[session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr)

- **Wrote:** `app/src/views/GraphView.tsx`; `LEDGER.md` C-4, §3; prompt.
- **Rows:** C-4 `done` (layout changed).
- **Decisions:** taken — vertical graph layout (Vilhelm).
- **Answers acted on:** none.
- **Prompts:** C-APP swept; falsifier still true. Checked at phone size, dark mode: opens at top, wheel scrolls, no errors.
- **Next:** Vilhelm pushes; re-test deployed site in Chrome.

### 2026-11-08 · C-APP · Browser test round 1: fixes; auto-deploy
[session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr)

- **Wrote:** `app/src/cook/scheduler.ts` (+ test), `app/src/views/CookingMode.tsx`, `app/src/views/GraphView.tsx`, `app/src/views/RecipeView.tsx`, `app/src/styles.css`, `.github/workflows/pages.yml`; `LEDGER.md` C-5, C-6, §3; prompt.
- **Rows:** C-6 `done` (site live); C-5 `drafted` (browser-tested; phone cook-through pending).
- **Decisions:** taken — deploy on push; testing via Claude in Chrome (Vilhelm); prep-step heuristic.
- **Answers acted on:** none.
- **Prompts:** C-APP swept; falsifier still true.
- **Found in Chrome on the deployed site, fixed:** graph unstyled in dark mode and labels too small at phone width; preheat suggested ~1 h early; alerts due on the Resume screen fired silently; "2 scallion". Verified working: wake lock held, overdue timer and banner after a simulated 31-min suspension, resume after reload.
- **Next:** Vilhelm commits/pushes; assistant re-tests the deployed fixes in Chrome; phone cook-through.

### 2026-11-08 · C-APP · Phone route decided; graph readable on phone
[session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr)

- **Wrote:** `app/src/views/GraphView.tsx` (initial viewport); `app/README.md` (first install after workspace switch); `LEDGER.md` C-4, C-6, §3; `Continuation_Prompts/C-APP_pwa-cooking-mode.md`.
- **Rows:** C-4 `done`; C-6 `active` (on Vilhelm: enable Pages, run workflow).
- **Decisions:** taken — phone route GitHub Pages; test phone Android + Chrome (Vilhelm).
- **Answers acted on:** none (answered in conversation).
- **Prompts:** C-APP updated, swept; falsifier still true. Pages build checked at `/mineDining/` (manifest 200, service worker registers, no console errors).
- **Next:** Vilhelm deploys to Pages and cooks one fixture on his phone (C-5).

### 2026-11-08 · C-APP · PWA scaffold, views, cooking mode
[session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr)

- **Wrote:** `package.json`, `package-lock.json` (root, npm workspaces); `app/` (package.json, index.html, vite.config.ts, tsconfig.json, README.md, public/ icons, src/main.tsx, App.tsx, router.ts, recipes.ts, format.ts, styles.css, views/RecipeList.tsx, views/RecipeView.tsx, views/GraphView.tsx, views/CookingMode.tsx, cook/scheduler.ts, cook/scheduler.test.ts, cook/alerts.ts, cook/wakeLock.ts, cook/storage.ts); `.github/workflows/pages.yml`; `spec/README.md` §12; `PROJECT-STATE.md` §3, §5, §7; `LEDGER.md` §1, §1b, §2 C, §3; `TODO.md`; `Continuation_Prompts/C-APP_pwa-cooking-mode.md`. Untracked build output `node_modules/` (partial, Linux) and `app/dist/` are gitignored.
- **Rows:** C-1, C-2, C-3 `done`; C-4, C-5 `drafted`; C-6 `blocked` on Vilhelm.
- **Decisions:** taken — npm workspaces; React Flow + dagre (Vilhelm); cooking-mode timer/alert rules (Vilhelm). Opened — phone testing route (proposed GitHub Pages).
- **Answers acted on:** none (answered in conversation).
- **Prompts:** C-APP stamped on start (falsifier held); cold-read 2 gaps, fixed; updated to CONTINUE, falsifier still true. Tests: validator 24, app 12 green; production build checked in a phone-sized headless browser, no console errors.
- **Next:** Vilhelm commits, runs `npm install` at the root, decides C-6; then cook-through on his phone.

### 2026-11-08 · C-ARCH · Spec v0.1.0, validator, platform; commission closed
[session](https://claude.ai/code/session_01WGDGhYqkmSvqNPDEVbbK8L)

- **Wrote:** `docs/prior-art.md`; `spec/README.md`, `spec/VERSIONING.md`, `spec/CHANGELOG.md`, `spec/schema/recipe.schema.json`, `spec/schema/archive/recipe.schema.0.1.0.json`, `spec/fixtures/` (crepes, stir-fry-with-rice, lasagna, vinaigrette, meringues), `spec/validator/` (package.json, package-lock.json, tsconfig.json, src/validate.ts, src/instructions.ts, src/migrate.ts, src/cli.ts, src/index.ts, gen-schema.mjs, src/types.ts + src/schema.ts generated, test/fixtures.test.ts); `.gitignore` (node_modules, dist); `PROJECT-STATE.md` §3–§5, §7; `docs/DESIGN-BRIEF.md` §2b, §4, §5; `LEDGER.md`; `Continuation_Prompts/C-APP_pwa-cooking-mode.md`; `Continuation_Prompts/OBSOLETE/C-ARCH_schema-and-architecture.md`.
- **Rows:** A-2..A-6 `done`; A-7 `todo` (revision candidates); C-1..C-6 `specified` [cp]; B-2 moved into C-3/C-5.
- **Decisions:** taken — platform PWA React+TS (Vilhelm); spec language JSON Schema canonical + generated TS (Vilhelm); spec v0.1.0 model; revision procedure.
- **Answers acted on:** none (answered in conversation).
- **Prompts:** C-ARCH stamped on start (falsifier held), then superseded by C-APP — Vilhelm to delete `Continuation_Prompts/C-ARCH_schema-and-architecture.md`. C-APP written; cold-read 2026-11-08: 9 gaps, fixed (validator made browser-safe: `src/schema.ts` generated, `src/index.ts` entry, `exports`; Step gains params/produces/dependsOn; 24 tests green).
- **Next:** Vilhelm commits; run `npm install` in `spec\validator` on Windows; open C-APP.

### 2026-11-08 · C-SETUP · Design brief, decisions, C-ARCH commissioned
[session](https://claude.ai/code/session_01WGDGhYqkmSvqNPDEVbbK8L)

- **Wrote:** `docs/DESIGN-BRIEF.md` (new); `PROJECT-STATE.md` §1–§5, §7; `LEDGER.md` §1, §1b, §2, §3; `TODO.md`; `Continuation_Prompts/C-ARCH_schema-and-architecture.md` (new).
- **Rows:** A-1 `done`; A-2..A-6 `specified` [cp]; backlog B-1..B-6 added.
- **Decisions:** taken — recipe as DAG; DAG as standalone versioned spec with validator; spec revisions expected (versioned + migrations); links first; phone > iPad > laptop. Opened — platform (PWA vs RN), spec language.
- **Answers acted on:** none.
- **Prompts:** C-ARCH written; cold-read 2026-11-08: 9 gaps, fixed.
- **Next:** Vilhelm commits; open C-ARCH with `start C-ARCH in <project root>`.

### 2026-11-08 · C-SETUP · Project scaffolded

- **Wrote:** `PROJECT-INSTRUCTIONS.md`, `PROJECT-STATE.md`, `LEDGER.md`, `LEDGER-LOG.md`, `ANSWERS.md`, `TODO.md`, `WORK-PLAN.md`, `Continuation_Prompts/_TEMPLATE.md`, `.gitattributes`, `.gitignore`.
- **Next:** paste the block in `PROJECT-INSTRUCTIONS.md` into the Claude project's Instructions field; commit; fill `PROJECT-STATE.md`.
