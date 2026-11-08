# Continuation prompt — PWA scaffold and cooking mode

*Start a new conversation with `start C-APP in <project root>` — the thread reads this file — or paste the block below as its opening message. Self-contained. Written 2026-11-08 by C-ARCH. Ledger rows C-1 to C-6.*

---

## Paste this

```
NAME THIS CONVERSATION: C-APP · PWA scaffold + cooking mode

PROMPT STATUS. Written 2026-11-08 · thread C-APP · purpose: CONTINUE
UPDATED 2026-11-08 · C-APP · https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr — site live, auto-deploy; browser-test fixes; testing via Chrome.
UPDATED 2026-11-08 · C-APP · https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr — C-6 route decided (Pages, Android Chrome); C-4 done.
UPDATED 2026-11-08 · C-APP · https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr — C-1..C-3 done, C-4/C-5 drafted, C-6 proposed; tasks rewritten.
Last verified 2026-11-08 by C-APP.
FALSIFIER: "LEDGER.md row C-5 (cooking mode) is not in state `done`." If false,
STOP and rewrite this prompt.

OWNS: LEDGER.md workstream C rows C-1 to C-6; folder app/; root package.json
and package-lock.json; .github/workflows/pages.yml. May change spec/validator/
CODE (not the schema) when the app needs it, keeping `npm test` green and
noting it in the row; schema changes follow spec/VERSIONING.md.

WHAT EXISTS (paths relative to the project root):
  - spec/ — recipe DAG spec v0.1.0 and its TypeScript package
    spec/validator/ (validate, generateSteps, migrate, schema, types).
  - Root package.json — npm workspaces (spec/validator, app), one root
    package-lock.json. `npm install` at the root builds the spec package.
  - app/ — Vite + React + TS PWA (vite-plugin-pwa, manifest, icons). See
    app/README.md for layout, commands and the settled cooking-mode rules.
    Views: recipe list (bundled spec/fixtures through migrate+validate),
    recipe view, graph view (React Flow + dagre, lazy; opens readable on
    a phone), cooking mode.
    app/src/cook/scheduler.ts is the live scheduler (pure, vitest-tested
    over every fixture). Built and checked in a phone-sized headless browser
    only — never on a real phone.
  - Live at https://vilhelmc.github.io/mineDining/ — .github/workflows/
    pages.yml deploys on every push to main touching app/ or spec/
    (BASE=/mineDining/). Test phone: Android + Chrome.
  - Scheduler extras: prep steps (preheat) are just-in-time (PREP_LEAD);
    alerts wait for the Start/Resume tap (audio unlock).

READ FIRST, in order:
  1. LEDGER.md workstream C and §3 — row states and decisions.
  2. ANSWERS.md — entries tagged C-5 or C-6 (phone test results).
  3. app/README.md — what the app is and how cooking mode behaves.
  4. app/src/cook/scheduler.ts header comment — the scheduling rules.
  5. spec/README.md §4, §11 only if touching steps or the spec.

INBOX: from C-ARCH — the generator's prose is deliberately plain. Better
wording needs input roles, a spec revision candidate (spec/CHANGELOG.md,
Unreleased). Do not fake roles in the UI; revise the spec per VERSIONING.md.

DECISIONS INHERITED (do not relitigate): see LEDGER §3 — PWA React+TS;
JSON Schema canonical; recipes load through validate()/migrate(); nothing
implicit; npm workspaces; React Flow + dagre; cooking-mode timer/alert rules.

OPEN TASKS, in order:
  1. Re-test the deployed site in Chrome after each push (see TESTING).
  2. C-5 Cook-through of one fixture on his phone: wake lock held, alerts
     (sound, vibration, notification when hidden), resume after lock/reload.
     Fix what fails; row → `done` when he confirms.
  3. Bundle: the main chunk is ~400 kB (Ajv compiles the schema at runtime).
     Optional: precompile the validator (Ajv standalone) if load time hurts.
  Order reason: C-5 is the goal and needs C-6 to be tested at all.
  After C-5: the spec revision round (A-7, input roles for better step
  prose) or link import (B-1) — ask Vilhelm; both need their own thread.

TESTING (Vilhelm's instruction): test in his Chrome with the Claude in Chrome
tools; ask for manual tests only where a desktop browser can't (vibration,
lock screen, real audio, home-screen install). Window resizing does not
work there; to see phone width, replace the page body with iframes of
the app at 412 px (same origin). Fast-forward timers by editing
localStorage `minedining.cook.<id>` startedAt, then location.reload().

CONSTRAINTS:
  - Code indentation uses tabs, not spaces (YAML excepted).
  - Commands Vilhelm runs by hand: one per line, no `&&`, `python` not
    `python3`, backslash paths (Windows PowerShell 5.1).
  - Device bridge: `npm install` inside the mounted project folder is too
    slow and gets killed at the call time limit. Install and test in a copy
    outside the mount (rsync to $HOME/work excluding node_modules, .git,
    dist), copy back only package-lock.json. Packages installed in the VM
    are Linux builds; Vilhelm runs `npm install` on Windows. node_modules/
    and dist/ are gitignored.
  - The assistant cannot delete files in the project folder without asking.

TOUCHES: a future C-IMPORT thread (link → DAG, row B-1) also consumes the
spec. Spec revisions go through spec/VERSIONING.md, noted in the row.

FIRST MOVE: check the falsifier, stamp Last verified in LEDGER §1b, read
ANSWERS.md for C-6, then task 1.

LEDGER. Before finishing: entry at the TOP of LEDGER-LOG.md; rows C-1..C-6;
§3 for each decision; §1b.
PROMPT. Every edit to this prompt is stamped and swept (_TEMPLATE.md rule 3).
GIT. Owner commits at the end of every session; never `git stash`.
```

---

## Why this shape

Supersedes the C-ARCH prompt, whose commission (spec v0.1 + platform decision) is done. The falsifier points at the commission's goal (cooking mode), not at `app/`, which task 1 creates early: the C-ARCH cold read showed that a falsifier tied to an early artefact expires while the work is still live.

## Revisions

| Date | Thread | Session | What changed |
|---|---|---|---|
| 2026-11-08 | C-ARCH | [session](https://claude.ai/code/session_01WGDGhYqkmSvqNPDEVbbK8L) | Written; supersedes `C-ARCH_schema-and-architecture.md`. Cold-read: 9 gaps, fixed — validator made browser-safe with a package entry (was blocked on `node:fs`); Step gains params/produces/dependsOn; C-APP may change validator code; cooking-mode questions listed; C-4 criteria; C-6 as open decision; stale ledger/brief text corrected. |
| 2026-11-08 | C-APP | [session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr) | Cold-read on start: 2 gaps, fixed — npm install on the device mount times out (constraint added); spec README tooling stale once the root became a workspace (§12 updated). Then C-1..C-3 done, C-4/C-5 drafted, C-6 proposed; purpose → CONTINUE; WHAT EXISTS, READ FIRST, tasks rewritten. Falsifier unchanged, still true. |
| 2026-11-08 | C-APP | [session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr) | Site live + auto-deploy; browser-test fixes; TESTING section added; tasks swept. Falsifier still true. |
| 2026-11-08 | C-APP | [session](https://claude.ai/code/session_01WGDGhb1cAHLoyMNLZwZ6nr) | C-6 route + phone decided; C-4 done; WHAT EXISTS, READ FIRST, tasks swept. Falsifier still true. |
