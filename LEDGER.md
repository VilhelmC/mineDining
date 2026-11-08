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
| C-ARCH | Recipe DAG schema + core architecture | — | *(paste when opened)* | `Continuation_Prompts/C-ARCH_schema-and-architecture.md` | rows A-2..A-6, `spec/`, `docs/prior-art.md` |

### 1b · Continuation prompts

**Every prompt carries a FALSIFIER** — one checkable sentence, true today, false once the prompt has expired. Check it before working, and **write today's date into Last verified when you start a thread from a prompt**. Format and rules: `Continuation_Prompts/_TEMPLATE.md`. Checking that the read-first list *resolves* is not the test — claims go stale, paths rarely do.

| Prompt | Scope | Purpose | Written | Last verified | Sufficient to start cold? |
|---|---|---|---|---|---|
| `_TEMPLATE.md` | the house format | n/a | 2026-11-08 | 2026-11-08 | n/a — copy it, do not work from it |
| `C-ARCH_schema-and-architecture.md` | DAG schema spec, validator, versioning, platform | COMMISSION | 2026-11-08 | 2026-11-08 | yes (cold-read 2026-11-08) |

---

## 2 · Board

*One section per workstream, with an owning thread. Rows are edited in place.*

### A · Core app architecture · owner C-ARCH

| # | Item | State | Next action |
|---|---|---|---|
| A-1 | Fill `PROJECT-STATE.md` §1–§5; write `docs/DESIGN-BRIEF.md` | `done` | — (C-SETUP) |
| A-2 | Prior-art reading → `docs/prior-art.md` | `specified` [cp] | C-ARCH task 1 |
| A-3 | Spec language decision; recipe fixtures in `spec/fixtures/` | `specified` [cp] | C-ARCH tasks 2–3 |
| A-4 | Recipe DAG spec v0.1 + versioning policy (`spec/VERSIONING.md`, `spec/CHANGELOG.md`) | `specified` [cp] | C-ARCH tasks 4–5 |
| A-5 | Validator + "nothing implicit" acceptance test | `specified` [cp] | C-ARCH tasks 6–7 |
| A-6 | Platform decision (PWA vs React Native) | `specified` [cp] | C-ARCH task 8; Vilhelm decides |

### B · Backlog — later workstreams (no owner yet)

*Order and grouping: `docs/DESIGN-BRIEF.md` §3, §5. Each becomes a workstream when its thread opens.*

| # | Item | State | Next action |
|---|---|---|---|
| B-1 | Link import (schema.org JSON-LD → LLM → DAG); then screenshot, text | `todo` | after A-4 |
| B-2 | Instruction generation + cooking mode (screen on, timers) | `todo` | after A-5 |
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
| 2026-11-08 | Platform: PWA vs React Native | open — no deadline | A-6 | C-ARCH |
| 2026-11-08 | Spec language (JSON Schema vs TS types as source of truth) | open — no deadline | A-3 | C-ARCH |

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
