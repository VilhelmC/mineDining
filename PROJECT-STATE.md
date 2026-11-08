# PROJECT-STATE

*Orientation document. Read first in any substantive task. It says what the project **is**; `LEDGER.md` says where everything currently **stands**. Rewrite sections when they go false — do not append corrections below them.*

**Where the work lives.** The canonical copy is the git remote; working copies are clones. **No document hard-codes a local path** — give paths relative to the project root.

| | |
|---|---|
| Canonical repository | https://github.com/VilhelmC/mineDining (branch `main`) |
| Workstation A | *(local path — the only place one is written)* |

**Assistant sessions cannot commit.** They write into the working tree through a file bridge; the work is at risk until committed. Commit at the end of every session; pull on arrival, push on leaving; never `git stash` between machines.

---

## 1 · What this project is

Cooking from a recipe means reading, timing and improvising with occupied hands, and published recipes are linear prose that hide parallelism, leave quantities implicit and break when the cook changes anything (servings, a missing ingredient, units, no scale). mineDining is a kitchen app — phone first, then iPad, then laptop — for guided walk-throughs, brainstorming, and modifying recipes without the result silently going wrong. Success: any saved recipe can be followed hands-busy without re-reading, and adapted (scaled, substituted, converted) safely. Full feature set: `docs/DESIGN-BRIEF.md`.

## 2 · The core idea

**Every recipe is a directed acyclic graph of a process** (ingredients, tools, operations, intermediates), serialised as typed JSON in the spirit of MathJSON. Nearly every feature — follow-along instructions with every quantity explicit, parallelism and timing, tool lists, glossary links, scaling, courses — is a computation over that graph. The schema is the load-bearing artefact.

## 3 · What is established

- **Recipe DAG spec v0.1.0** — `spec/README.md` (normative), `spec/schema/recipe.schema.json`; 5 fixtures in `spec/fixtures/`.
- **Validator + reference step generator** — `spec/validator/` (TypeScript, `npm test` green), including the "nothing implicit" acceptance test.
- Prior art read and assessed — `docs/prior-art.md`: no existing format is a dependency graph.
- Feature set and order of work — `docs/DESIGN-BRIEF.md`.

## 4 · Decisions taken

- The recipe DAG is a **standalone, versioned spec with a validator**, not just the app's internal model.
- The spec **will be revised** as needs emerge: every revision bumps its version, is logged, and ships a migration so existing recipe files stay valid.
- Import from **links** is the first ingestion path.
- Platform: **PWA, React + TypeScript**, phone first.
- Spec source of truth: **JSON Schema 2020-12**; TS types generated from it.

Full register: `LEDGER.md` §3.

## 5 · Order of work

See `docs/DESIGN-BRIEF.md` §5. Spec v0.1 done (C-ARCH). Now: the PWA and cooking mode (thread C-APP). Next candidates: link import (B-1), a spec revision round (A-7).

## 6 · Known inconsistencies in the corpus

*Where documents disagree, and which one wins until fixed.*

None known (2026-11-08).

## 7 · Map of the folder

| Path | What it holds |
|---|---|
| `PROJECT-INSTRUCTIONS.md` | the Claude project instructions, as pasted |
| `LEDGER.md`, `LEDGER-LOG.md` | state; history |
| `ANSWERS.md` | append-only answers to open items |
| `TODO*.md` | dated tasks |
| `docs/` | design documents; `docs/DESIGN-BRIEF.md` is the feature set, `docs/prior-art.md` |
| `spec/` | the recipe DAG spec, schema, fixtures, validator (`spec/validator/`) |
| `app/` | the PWA (from C-APP) |
| `Continuation_Prompts/` | one hand-off prompt per thread; `OBSOLETE/` is not built on |

## 8 · Working conventions

See `PROJECT-INSTRUCTIONS.md`.
