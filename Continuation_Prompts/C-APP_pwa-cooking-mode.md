# Continuation prompt — PWA scaffold and cooking mode

*Start a new conversation with `start C-APP in <project root>` — the thread reads this file — or paste the block below as its opening message. Self-contained. Written 2026-11-08 by C-ARCH. Ledger rows C-1 to C-6.*

---

## Paste this

```
NAME THIS CONVERSATION: C-APP · PWA scaffold + cooking mode

PROMPT STATUS. Written 2026-11-08 · thread C-APP · purpose: COMMISSION
Last verified 2026-11-08 by C-ARCH.
FALSIFIER: "LEDGER.md row C-5 (cooking mode) is not in state `done`." If false,
STOP and rewrite this prompt.

OWNS: LEDGER.md workstream C rows C-1 to C-6; folder app/ (to create). May
change spec/validator/ CODE (not the schema) when the app needs it, keeping
`npm test` green and noting it in the row; schema changes follow
spec/VERSIONING.md.

WHAT EXISTS (paths relative to the project root):
  - spec/ — recipe DAG spec v0.1.0, complete and tested:
      spec/README.md (normative), spec/schema/recipe.schema.json,
      spec/fixtures/*.recipe.json (5 recipes), spec/VERSIONING.md,
      spec/CHANGELOG.md (incl. revision candidates).
  - spec/validator/ — TypeScript package @minedining/recipe-spec, browser-safe
    (no Node built-ins at runtime; the schema is compiled into src/schema.ts).
    Entry src/index.ts → dist/src/index.js via package.json "exports"; a
    `prepare` script builds it on install. Exports validate() (structure +
    semantics), generateSteps() (reference follow-along text; each Step
    carries params, produces and dependsOn), migrate(), schema, and the
    generated types. `npm test` is green.
  - docs/DESIGN-BRIEF.md — full feature set; docs/prior-art.md.
  - No app code. No app/ folder.

READ FIRST, in order:
  1. PROJECT-STATE.md — orientation; §2 core idea, §4 decisions.
  2. LEDGER.md workstream C and §3 — rows and decisions.
  3. spec/README.md — the format the app renders; §2 model, §4 attention
     (active/passive), §8 validity, §11 known limits.
  4. spec/validator/src/instructions.ts — the reference step generator and
     scheduling rule (passive operations first); the app builds on it.
  5. docs/DESIGN-BRIEF.md §3a and §3f — what the app derives from the DAG;
     cooking mode.

INBOX: from C-ARCH — the generator's prose is deliberately plain ("Brown the
olive oil (15 mL) and the minced beef (500 g)"). Better wording needs input
roles, a spec revision candidate (spec/CHANGELOG.md, Unreleased). Do not fake
roles in the UI; if the UI needs them, revise the spec per VERSIONING.md.

DECISIONS INHERITED (do not relitigate):
  - Platform: PWA, React + TypeScript. Priority phone > iPad > laptop.
  - JSON Schema 2020-12 is the spec's source of truth; TS types are generated
    from it; validator and generator are TypeScript.
  - Recipes are spec documents; the app loads them through validate() (and
    migrate() for stored ones). The spec changes only via spec/VERSIONING.md.
  - Nothing implicit: every ingredient mention shows its quantity.

OPEN TASKS, in order:
  1. C-1 Scaffold app/ (Vite + React + TS, installable manifest, service
     worker). Consume spec/validator as a local package; decide how (npm
     workspaces at the root, or a file: dependency) and record it in LEDGER §3.
  2. C-2 Recipe list from spec/fixtures/ (bundled for now; no backend yet).
  3. C-3 Recipe view: ingredients with quantities, tools, generated steps.
  4. C-4 Graph view of the DAG. Propose a library to Vilhelm against: layered
     (left-to-right) DAG layout, pan/zoom usable on a phone, React-friendly.
  5. C-5 Cooking mode: one step at a time, large type, screen kept on (Screen
     Wake Lock API), timers from operation durations, passive steps shown as
     running in the background while active steps continue. Build a live
     scheduler on Step.dependsOn (a step is ready when its dependencies are
     done); generateSteps() gives only one linear order. Settle with Vilhelm
     before building: a passive step with only `until` and no duration; ranged
     durations; timer alerts (sound / vibration); behaviour when the phone
     locks or the tab is backgrounded (Wake Lock is released then).
  6. C-6 Phone testing route. Wake Lock and service workers need a secure
     context (HTTPS or localhost), so a phone on the LAN hitting the Vite dev
     server over plain http will not get them. Propose a route (e.g. GitHub
     Pages from the repo); record it in LEDGER §3 as an open decision until
     Vilhelm decides. Verify Wake Lock support in installed (home-screen)
     PWAs on his phone's OS version — reportedly unreliable on older iOS;
     unverified.
  Order reason: C-5 is the commission's goal; C-1..C-3 are its prerequisites;
  C-4 and C-6 can move if C-5 needs them sooner.

CONSTRAINTS:
  - Code indentation uses tabs, not spaces.
  - Commands Vilhelm runs by hand: one per line, no `&&`, `python` not
    `python3`, backslash paths (Windows PowerShell 5.1).
  - An assistant writing through the device bridge runs in a Linux VM. Native
    npm packages (Vite's esbuild, rollup) installed there are Linux builds.
    Vilhelm runs `npm install` on Windows before `npm run dev`; say so at the
    end of any session that installed packages. node_modules/ and dist/ are
    gitignored.
  - The assistant cannot delete files in the project folder without asking.

TOUCHES: a future C-IMPORT thread (link → DAG, row B-1) also consumes the spec.
Spec revisions from this thread go through spec/VERSIONING.md and are noted in
the ledger row.

FIRST MOVE: check the falsifier, stamp Last verified in LEDGER §1b, register
this conversation in LEDGER §1, then start C-1.

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
