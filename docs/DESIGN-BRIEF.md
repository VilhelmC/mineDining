# DESIGN-BRIEF

*Feature set and architecture direction for mineDining. Written 2026-11-08 by C-SETUP from Vilhelm's brainstormed feature list and the discussion that followed. Substance lives here; state lives in `LEDGER.md`.*

---

## 1 · Problem

Cooking from a recipe means reading, timing and improvising with occupied hands. Recipes as published are linear prose: they hide parallelism ("meanwhile…"), leave quantities implicit ("add the eggs"), and break when the cook changes anything — servings, a missing ingredient, a unit system, no scale. Success: a cook can follow any saved recipe hands-busy without re-reading, and can adapt it (scale, substitute, convert) without the result silently going wrong.

## 2 · Governing idea — the recipe is a DAG

Every recipe is stored as a **directed acyclic graph of a process**, in the spirit of MathJSON (a typed expression tree serialised as JSON). Nearly every feature is a *computation over that graph* rather than a separate subsystem. The schema is therefore the load-bearing artefact of the project.

Node kinds (first draft, to be settled by C-ARCH):

- **ingredient** — identity, quantity, unit, form/prep state ("diced"), scaling rule.
- **tool** — pan, oven, whisk; links to the user's kitchen inventory.
- **operation** — verb (whisk, sear, rest) with parameters: duration, temperature, heat, and a completion criterion ("until golden").
- **intermediate** — the named product of an operation ("roux", "dough"); branches join here.

Edges carry flow of material (and tool use). Independent branches = work that can run in parallel.

### 2b · Questions the spec must answer (C-ARCH) — answered in `spec/README.md` §9

1. Is the graph bipartite (material nodes ↔ operation nodes)?
2. Are tool edges part of the DAG for acyclicity and consumption checks, or a separate relation? (A tool is reused across steps; it is not consumed.)
3. Shared intermediates: referenced by ID (true DAG), not by MathJSON-style nesting (a tree).
4. How an intermediate's quantity is split across several consumers (e.g. béchamel used in two layers).
5. Multi-component dishes (stir-fry + rice): several declared final outputs, plated together.
6. Unquantified amounts ("salt to taste", optional garnish): how marked, and how the "nothing implicit" rule treats them.
7. Units: store canonical SI **and** the source value + unit ("1 cup"), so display and round-tripping keep the author's intent.
8. Glossary references: slug IDs to a glossary that does not exist yet.

## 3 · Features, grouped by what they derive from

### 3a · Derived from the DAG

| Feature | How it derives |
|---|---|
| Follow-along instructions | Topological traversal → generated steps with every quantity explicit: "add the eggs (2)", never "add the eggs". |
| Parallelism & total time | Independent branches → "start the rice while the onions sweat"; critical path = total time. |
| Graph view of execution | Render the DAG directly. |
| Tools list / kitchen check | Collect tool nodes; compare against the user's kitchen inventory. |
| Glossary tooltips | Operation verbs and terms link to glossary entries; shown as tooltip, no page switch. |
| Courses / tutorials ("Sauces 101") | Built from reusable sub-graphs (a mother sauce is a small DAG that larger recipes embed). |
| Facet values | Time, difficulty (operation count / technique set), diet (from ingredients) partly computable. |

### 3b · Scaling and units — one solver

- **Servings rescale** — uniform factor.
- **Constraint rescale** ("I have 2 eggs, recipe says 3") — factor = min over ingredients of available / required.
- **Complications** — discrete quantities (eggs: round or treat as the binding constraint); non-linear items (pan size, bake time, leavening, salt). Hence each ingredient/operation carries a **scaling rule**: linear · discrete · non-scaling/heuristic.
- **Weight ↔ volume** — needs per-ingredient density; flour is the hard case (scooped vs spooned).
- **Unit system** (metric etc.) — display-only, provided storage is canonical SI.

### 3c · Ingestion

Interpret recipes from **link** (first priority), screenshot or text. Most recipe sites embed schema.org/Recipe JSON-LD, so links parse deterministically to a *linear* recipe. **Linear → DAG is the hard step**: an LLM emits DAG JSON, which is validated against the schema before acceptance. Screenshot/text add OCR/extraction in front of the same converter.

### 3d · Library

Save recipes with an image for navigation; search; filter by any recipe property (category, diet, difficulty, occasion, style, time); search by available ingredient set (match ingredient nodes, allowing substitutes); comments and reviews with photos on recipe files.

### 3e · Inventory and shopping

Kitchen inventory (tools) and pantry inventory (ingredients). Fully automatic pantry tracking is not realistic without receipt/barcode capture; workable version: deduct on cook completion in cooking mode + manual correction. Shopping list = requirement − inventory.

### 3f · Cooking mode

Screen stays on (Wake Lock API in the browser), large step display, timers from operation durations.

### 3g · Recipe development

Help developing new recipes: DAG editor + LLM suggestions that preserve graph validity (substitutions, variations). Most open-ended; deferred.

## 4 · Platform

Phone first, then iPad, then laptop. **Decided 2026-11-08: PWA, React + TypeScript** (one codebase, Wake Lock for cooking mode). Known cost: weaker iOS offline storage and camera integration.

## 5 · Order of work (proposed)

1. DAG schema spec + validator + fixtures (C-ARCH) — done, `spec/`.
2. Platform / stack decision (C-ARCH) — done, PWA.
2b. PWA scaffold + cooking mode (C-APP).
3. Link import → DAG.
4. Instruction generation + cooking mode — now part of 2b (C-APP).
5. Scaling + unit conversion.
6. Library, search, filters, reviews.
7. Glossary, courses, inventory, shopping list.
8. Recipe development.

## 6 · Prior art to check

*Named from memory in conversation; **unread this session** — no claim about their content is made here until read.*

- schema.org/Recipe — the de-facto web format (linear).
- Cooklang — recipe markup language.
- Cooking for Engineers tabular recipe notation — close to a DAG.
- Open Recipe Format, RecipeML — older interchange formats.
- MathJSON — model for typed-tree JSON serialisation.
- USDA FoodData Central — portion weights, a possible density source.
- Existing apps (e.g. Paprika, Mela) — feature baseline for library/import.
