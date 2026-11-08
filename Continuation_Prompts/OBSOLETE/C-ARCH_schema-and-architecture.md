> **SUPERSEDED 2026-11-08 by `Continuation_Prompts/C-APP_pwa-cooking-mode.md` — do not build on this.** Commission done: spec v0.1.0 in `spec/`, platform decided (PWA).

# Continuation prompt — recipe DAG schema and core architecture

*Start a new conversation with `start C-ARCH in <project root>` — the thread reads this file — or paste the block below as its opening message. Self-contained. Written 2026-11-08 by C-SETUP. Ledger rows A-2 to A-6.*

---

## Paste this

```
NAME THIS CONVERSATION: C-ARCH · recipe DAG schema + core architecture

PROMPT STATUS. Written 2026-11-08 · thread C-ARCH · purpose: COMMISSION
Last verified 2026-11-08 by C-SETUP.
FALSIFIER: "spec/VERSIONING.md does not exist, and LEDGER.md §3 has no taken
decision naming the app platform." If false, STOP and rewrite this prompt.

OWNS: LEDGER.md workstream A rows A-2 to A-6; folder spec/ and file
docs/prior-art.md (both to create).

WHAT EXISTS (paths relative to the project root):
  - Ledger scaffold only: PROJECT-STATE.md, LEDGER.md, LEDGER-LOG.md,
    ANSWERS.md, TODO.md, WORK-PLAN.md, Continuation_Prompts/.
  - docs/DESIGN-BRIEF.md — the full feature set, grouped by what derives from
    the recipe DAG, with a proposed order of work and a prior-art list.
  - No code, no schema, no fixtures. No platform chosen.

READ FIRST, in order:
  1. PROJECT-STATE.md — orientation; §2 core idea, §4 decisions.
  2. LEDGER.md §2 workstream A and §3 — current rows and decisions.
  3. docs/DESIGN-BRIEF.md — the features the schema must serve. §2 (node
     kinds) and §3 (what derives from the graph) are the schema's requirements;
     §2b lists the semantic questions the spec must answer; §6 is the
     prior-art list, all UNREAD.

INBOX: none.

DECISIONS INHERITED (do not relitigate):
  - The recipe is a DAG of a process (ingredient, tool, operation,
    intermediate nodes; edges = flow of material / tool use), serialised as
    typed JSON in the spirit of MathJSON.
  - The DAG is a STANDALONE, VERSIONED SPEC WITH A VALIDATOR, not merely the
    app's internal data model.
  - The spec WILL be revised as needs emerge; revision is expected, not a
    failure. The versioning policy (task 5) is what makes that safe.
  - Links are the first ingestion path (schema.org/Recipe JSON-LD → LLM →
    DAG, validated). Not this thread's to build, but the schema must make it
    possible.
  - Platform priority: phone > iPad > laptop.

OPEN TASKS, in order:
  1. Prior art. Read schema.org/Recipe, Cooklang, MathJSON, and the Cooking
     for Engineers tabular notation; note in docs/prior-art.md what each does
     that the spec should adopt or avoid. Anything not actually read is marked
     "unread" in those words. The other DESIGN-BRIEF §6 items are deferred:
     USDA FoodData Central to B-3, Paprika/Mela to B-4, Open Recipe Format and
     RecipeML optional here. Needs web access.
  2. Spec language. Propose to Vilhelm how the spec is written (e.g. JSON
     Schema as source of truth + generated TypeScript types; or TS types +
     generated JSON Schema) and the validator's language (default: TypeScript,
     so app and validator share types). This partly depends on task 8 — if the
     platform is still open, choose provisionally and say so. Record in
     LEDGER §3.
  3. Fixtures before schema freeze. Hand-encode 4–6 recipes into spec/fixtures/
     chosen to stress the schema: a linear recipe; parallel branches (e.g.
     stir-fry + rice); a reused intermediate (e.g. béchamel in lasagna); a
     discrete ingredient (eggs); a non-scaling element (bake time / pan size).
  4. Spec v0.1 in spec/: node kinds, edge kinds, quantity + canonical SI unit,
     scaling rule per node (linear · discrete · non-scaling), operation
     parameters (duration, temperature, completion criterion), tool refs,
     glossary term refs (slug IDs; the glossary itself is not built here),
     schemaVersion field. The spec must answer every question in
     DESIGN-BRIEF §2b; record each answer in the spec.
  5. Versioning policy in spec/VERSIONING.md: version scheme, changelog
     (spec/CHANGELOG.md), one migration function per version step, all
     fixtures re-validated after every revision.
  6. Validator: structural (schema) + semantic checks — acyclic; every
     ingredient consumed; every intermediate consumed or a declared final
     output; one or more declared final outputs (dish components); every
     quantity resolvable or explicitly marked unquantified ("to taste",
     optional).
  7. Acceptance test for "nothing implicit": a minimal generator that walks
     each fixture and prints follow-along steps; every ingredient mention
     carries its quantity.
  8. Platform decision: PWA (React + TS) vs React Native, against phone-first,
     screen-on (Wake Lock), offline, camera. Present trade-offs to Vilhelm;
     record his choice in LEDGER §3.
  Order reason: reading prior art and encoding real recipes surfaces the
  schema's needs before it is written; the platform choice does not block the
  spec and can run alongside.

CONSTRAINTS:
  - Vilhelm: "we may not foresee everything we want the schema to be up front
    and will need to accept revisions during the process."
  - Vilhelm: "nothing is implicit (e.g. no instruction says 'add the eggs' -
    it should say 'add the eggs (2)' for example)".
  - Code indentation uses tabs, not spaces.
  - Commands Vilhelm runs by hand: one per line, no `&&`, `python` not
    `python3`, backslash paths (Windows PowerShell 5.1).
  - No claim about what a source argues on the strength of an abstract or
    summary — read it, or mark it unread.

TOUCHES: none yet. Future import thread (link → DAG) and cooking-mode thread
consume the spec — note contacts in the ledger row.

FIRST MOVE: check the falsifier, stamp Last verified in LEDGER §1b, register
this conversation in LEDGER §1 with its link, then start task 1.

LEDGER. Before finishing: entry at the TOP of LEDGER-LOG.md; rows A-2..A-6;
§3 for each decision; §1b.
PROMPT. Every edit to this prompt is stamped and swept (_TEMPLATE.md rule 3).
When the spec v0.1 and the platform decision both exist, supersede this
prompt with a CONTINUE prompt for the next thread.
GIT. Owner commits at the end of every session; never `git stash`.
```

---

## Why this shape

First prompt for the project. The falsifier tracks the two outputs that end the commission (`spec/VERSIONING.md`, written late, and a recorded platform decision) — not `spec/` itself, which task 3 creates early. Fixtures come before the schema so the schema is fitted to real recipes; the versioning policy is a task of its own because Vilhelm made revision an explicit expectation.

## Revisions

| Date | Thread | Session | What changed |
|---|---|---|---|
| 2026-11-08 | C-SETUP | [session](https://claude.ai/code/session_01WGDGhYqkmSvqNPDEVbbK8L) | Written. Cold-read: 9 gaps, fixed (falsifier moved off `spec/` to `spec/VERSIONING.md`; graph-semantics questions added as DESIGN-BRIEF §2b; validator rules allow multi-component dishes and unquantified amounts; prior-art scope and validator language stated). |
