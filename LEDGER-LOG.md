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
