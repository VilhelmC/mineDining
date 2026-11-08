# LEDGER

*Running state across the parallel threads of mineDining. Opened 2026-11-08. This file answers one question: **for each thing in flight, what is its state, what is the next action, and which conversation last touched it.***

**What belongs here and what does not.** `PROJECT-STATE.md` carries orientation and established results. `WORK-PLAN.md` carries the plan, effort and windows. Documents carry the substance. **The ledger carries only state, next action and provenance.** If a row starts growing an argument, the argument belongs in a document and the row points at it.

**Update protocol.** At the end of any working session: append an entry to **`LEDGER-LOG.md`** (newest first), update the §2 rows you touched, add any decision to §3, register the conversation in §1 if it is new.

**Two files, on purpose.** This one carries **state**; its rows are edited in place, so a merge has to be read. `LEDGER-LOG.md` carries **what happened**, is append-only, and is `merge=union` in `.gitattributes`, so two machines writing the same day merge without conflict and nothing is dropped. Never extend union merge to this file: union on an edited row keeps both versions of it, silently.

**State vocabulary.** `todo` · `specified` (scoped and handed off, not started) · `active` · `drafted` (exists, not finished or not acted on) · `blocked` · `done` · `parked`. **[cal]** calendar-critical: the risk is lead time, not effort. **[cp]** item has its own continuation prompt (§1b).

---

## 1 · Conversation register

Each thread gets a key (`C-XXX`). Paste the conversation link when you open it — links are the only reliable way back. The key is also the first word of the conversation's title and of its prompt's filename.

| Key | Thread | Opened | Link | Start a new one from | Owns |
|---|---|---|---|---|---|
| C-SETUP | Project setup + design brief | 2026-11-08 | [session](https://claude.ai/code/session_01WGDGhYqkmSvqNPDEVbbK8L) | — | this ledger, `PROJECT-STATE.md`, `docs/DESIGN-BRIEF.md` |
| C-ARCH | Recipe DAG schema + core architecture | 2026-11-08 | [session](https://claude.ai/code/session_01WGDGhYqkmSvqNPDEVbbK8L) (continued from C-SETUP) | `Continuation_Prompts/OBSOLETE/C-ARCH_schema-and-architecture.md` (superseded) | rows A-2..A-7, `spec/`, `docs/prior-art.md` |
| C-APP | PWA scaffold + cooking mode | 2026-11-08 | [session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr) | `Continuation_Prompts/C-APP_pwa-cooking-mode.md` | rows C-1..C-6, `app/`; `spec/validator/` code (not schema) |

### 1b · Continuation prompts

**Every prompt carries a FALSIFIER** — one checkable sentence, true today, false once the prompt has expired. Check it before working, and **write today's date into Last verified when you start a thread from a prompt**. Format and rules: `Continuation_Prompts/_TEMPLATE.md`. Checking that the read-first list *resolves* is not the test — claims go stale, paths rarely do.

| Prompt | Scope | Purpose | Written | Last verified | Sufficient to start cold? |
|---|---|---|---|---|---|
| `_TEMPLATE.md` | the house format | n/a | 2026-11-08 | 2026-11-08 | n/a — copy it, do not work from it |
| `OBSOLETE/C-ARCH_schema-and-architecture.md` | DAG schema spec, validator, versioning, platform | SUPERSEDED 2026-11-08 by C-APP — commission done | 2026-11-08 | 2026-11-08 | n/a |
| `C-APP_pwa-cooking-mode.md` | PWA scaffold, recipe + graph views, cooking mode | CONTINUE (C-1..C-3 done; C-5 awaits phone test) | 2026-11-08 | 2026-11-08 (C-APP, updated) | yes (cold-read 2026-11-08 on start: 2 gaps, fixed) |

---

## 2 · Board

*One section per workstream, with an owning thread. Rows are edited in place.*

### A · Recipe spec and architecture · owner C-ARCH (closed 2026-11-08)

| # | Item | State | Next action |
|---|---|---|---|
| A-1 | Fill `PROJECT-STATE.md` §1–§5; write `docs/DESIGN-BRIEF.md` | `done` | — (C-SETUP) |
| A-2 | Prior-art reading → `docs/prior-art.md` | `done` | Cooking for Engineers table structure unverified (§5 there) |
| A-3 | Spec language decision; recipe fixtures in `spec/fixtures/` | `done` | 5 fixtures |
| A-4 | Recipe DAG spec v0.1 + versioning policy (`spec/VERSIONING.md`, `spec/CHANGELOG.md`) | `done` | v0.1.0, `spec/README.md` |
| A-5 | Validator + "nothing implicit" acceptance test | `done` | `spec/validator/`, `npm test` green |
| A-6 | Platform decision (PWA vs React Native) | `done` | PWA, React + TS (§3) |
| A-7 | Spec revision candidates (`spec/CHANGELOG.md` Unreleased) | `todo` | adopt each only with a fixture showing the need; first likely: input roles, verb vocabulary |

### C · App · owner C-APP

| # | Item | State | Next action |
|---|---|---|---|
| C-1 | PWA scaffold in `app/`, spec package wired in | `done` [cp] | npm workspaces at root (§3); `app/README.md`. Vilhelm: `npm install` at root on Windows |
| C-2 | Recipe list from fixtures | `done` [cp] | bundled via `import.meta.glob`, through migrate+validate |
| C-3 | Recipe view: ingredients, tools, generated steps | `done` [cp] | — |
| C-4 | Graph view of the DAG | `done` [cp] | Lanes (default, fits phone width; `app/src/graph/lanes.ts`, `app/src/views/LaneView.tsx`) + Map (React Flow + dagre, left to right, for wide screens) (§3) |
| C-7 | Collapsible sub-recipes in the lane view (fold ragù, béchamel into one card) | `todo` [cp] | after C-5; needs sub-recipe detection (single-exit branch); feeds courses (B-5) |
| C-5 | Cooking mode: step-by-step, Wake Lock, timers, passive steps | `drafted` [cp] | built per §3; browser-tested on the deployed site (wake lock, alerts on resume, overdue). Prep steps (preheat) now just-in-time. `done` after a cook-through on Vilhelm's Android phone |
| C-6 | Phone testing route (HTTPS) | `done` [cp] | live at https://vilhelmc.github.io/mineDining/; deploys on push to `main` (app/spec paths) |

### B · Backlog — later workstreams (no owner yet)

*Order and grouping: `docs/DESIGN-BRIEF.md` §3, §5. Each becomes a workstream when its thread opens.*

| # | Item | State | Next action |
|---|---|---|---|
| B-1 | Link import (schema.org JSON-LD → LLM → DAG); then screenshot, text | `todo` | ready to start (spec v0.1 exists); needs its own thread |
| B-2 | Instruction generation + cooking mode (screen on, timers) | moved → C-3, C-5 | reference generator exists (`spec/validator/src/instructions.ts`) |
| B-3 | Scaling (servings, constraint, discrete/non-linear) + unit and weight↔volume conversion | `todo` | after A-4 |
| B-4 | Library: save, image, search, filters, ingredient-set search, reviews with photos | `todo` | after A-6 |
| B-5 | Glossary tooltips, courses, kitchen/pantry inventory, shopping list | `todo` | later |
| B-6 | Recipe development assistant | `parked` | last |

---

## 3 · Decisions — do not relitigate without a reason

*Taken decisions and open ones. An open decision carries its deadline; when answered (in conversation or in `ANSWERS.md`), the owning thread moves it to taken and logs it.*

| Date | Decision | State | Where it lives | Conv. |
|---|---|---|---|---|
| 2026-11-08 | Project runs on the ledger / continuation-prompt practice | taken | `PROJECT-INSTRUCTIONS.md` | C-SETUP |
| 2026-11-08 | Every recipe is a DAG of a process (ingredient, tool, operation, intermediate) | taken | `docs/DESIGN-BRIEF.md` §2 | C-SETUP |
| 2026-11-08 | The DAG is a standalone versioned spec with a validator, not just an internal model | taken | `PROJECT-STATE.md` §4 | C-SETUP |
| 2026-11-08 | Spec revisions are expected; each bumps version, is logged, ships a migration | taken (policy detail open: A-4) | `PROJECT-STATE.md` §4 | C-SETUP |
| 2026-11-08 | Links are the first ingestion path | taken | `docs/DESIGN-BRIEF.md` §3c | C-SETUP |
| 2026-11-08 | Platform priority phone > iPad > laptop | taken | `docs/DESIGN-BRIEF.md` §4 | C-SETUP |
| 2026-11-08 | Platform: PWA, React + TypeScript | taken (Vilhelm) | A-6 | C-ARCH |
| 2026-11-08 | Spec language: JSON Schema 2020-12 canonical, TS types generated, validator in TS | taken (Vilhelm) | `spec/README.md` | C-ARCH |
| 2026-11-08 | Spec v0.1.0 model: bipartite material/operation DAG, tools separate, `after` edges, outputs + byproducts, split amounts, canonical units + source text | taken | `spec/README.md` §2–§9 | C-ARCH |
| 2026-11-08 | Spec revision procedure (fixture first, bump, freeze, migrate, regenerate, log) | taken | `spec/VERSIONING.md` | C-ARCH |
| 2026-11-08 | App consumes the spec package through npm workspaces at the root (`spec/validator`, `app`), one root lockfile | taken | `package.json`, `app/README.md` | C-APP |
| 2026-11-08 | Graph view library: React Flow (`@xyflow/react`) + `@dagrejs/dagre`, lazy-loaded | taken (Vilhelm) | C-4 | C-APP |
| 2026-11-08 | Cooking mode: until-only passive = stopwatch + Done; range = alert at min and max; wall-clock timers, catch-up on return, optional system notification when hidden | taken (Vilhelm) | `app/README.md`, `app/src/cook/scheduler.ts` | C-APP |
| 2026-11-08 | Phone testing route: GitHub Pages via manual workflow; test phone Android + Chrome | taken (Vilhelm) | C-6, `.github/workflows/pages.yml` | C-APP |
| 2026-11-08 | Graph layout is vertical (top to bottom, toposort order downward), opening at the top and scrolling like a page; supersedes left-to-right | taken (Vilhelm) | `app/src/views/GraphView.tsx` | C-APP |
| 2026-11-08 | The graph must fit the screen width: default view is a lane graph (one card per operation, dependencies as lanes in a left gutter, depth-first branch order); node-link Map kept for wide screens; collapsible sub-recipes later (C-7) | taken (Vilhelm) | `app/src/graph/lanes.ts`, `app/src/views/LaneView.tsx` | C-APP |
| 2026-11-08 | Pages deploy runs on every push to `main` touching app/spec (was manual) | taken | `.github/workflows/pages.yml` | C-APP |
| 2026-11-08 | Testing: the assistant tests in Vilhelm's Chrome (Claude in Chrome) and asks for manual tests only where a browser can't (phone sensors, audio, lock screen) | taken (Vilhelm) | C-APP prompt | C-APP |
| 2026-11-08 | Prep steps (no inputs, no products: preheat) are suggested only within `PREP_LEAD` = 2 unfinished steps of being needed — heuristic until the spec carries a prep duration; the reference generator still lists them first (candidate for A-7) | taken | `app/src/cook/scheduler.ts` | C-APP |

---

## 4 · Session log

Lives in **`LEDGER-LOG.md`** — append-only, newest first.

---

## 5 · Housekeeping

- **Rows carry state; `TODO*.md` files carry dated tasks.** The failure this prevents: next steps agreed in conversation and never written anywhere. If a next step has a date, it goes in a TODO file the same day.
- The ledger is the index, not the archive.
- A conversation that does not register itself in §1 is a thread you will lose.
- `PROJECT-INSTRUCTIONS.md` and the Claude project settings are edited together.
- When two threads touch the same item, say so in the row.
- Never edit a `LEDGER-LOG.md` entry; write a new one that corrects it.
- Never `git stash` to move between machines. Commit instead.
