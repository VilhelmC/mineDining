# Recipe DAG spec — v0.1.0

*Normative description of the mineDining recipe format. Machine-checkable parts: `spec/schema/recipe.schema.json` (structure) and `spec/validator/` (semantics). Revision rules: `spec/VERSIONING.md`. History: `spec/CHANGELOG.md`.*

---

## 1 · What is at stake

A published recipe is linear prose. It hides which steps can run in parallel, leaves quantities implicit ("add the eggs"), and breaks silently when the cook changes servings, units or ingredients. mineDining stores each recipe as a **process graph** from which instructions, timing, tool lists, scaling and glossary links are *computed*. Everything downstream depends on this format, so it is specified and validated independently of the app.

## 2 · The model

A recipe is a **bipartite directed acyclic graph**. *Materials* (ingredients and intermediates) flow into *operations*; operations produce new intermediates. Tools are attached to operations but are not part of the material flow. A recipe ends in one or more **outputs** (the components served) and optional **byproducts** (kept for another use).

```
ingredient ─┐                    ┌─→ intermediate ─→ operation ─→ … ─→ output
ingredient ─┼─→ operation ───────┤
intermediate┘      ▲  uses tool  └─→ intermediate (byproduct)
                   └── after: operation   (ordering only, e.g. preheat)
```

Every edge is stored once, on the operation: `inputs` (material → op), `produces` (op → material), `tools` (op uses tool), `after` (op → op, ordering without material).

## 3 · Document

| Field | Meaning |
|---|---|
| `schemaVersion` | `"0.1.0"`; the validator accepts only the current version — older documents are migrated first |
| `id` | slug (`^[a-z][a-z0-9-]*$`) |
| `meta` | `title`, `servings` (required); `description`, `source {url,name,author}`, `image`, `locale`, `course`, `cuisine`, `diet[]`, `difficulty`, `tags[]` |
| `nodes` | object keyed by node id (keys are unique by construction) |
| `outputs` | ≥ 1 material ids served as the dish (several = multi-component dish) |
| `byproducts` | material ids produced but not served (egg yolks) |

## 4 · Nodes

| `kind` | Required | Optional |
|---|---|---|
| `ingredient` | `name`, `quantity` | `ref` (catalogue slug), `wikidata`, `scaling`, `state` (purchased state only), `optional`, `glossary`, `note` |
| `tool` | `name` | `ref`, `size`, `scaling`, `optional`, `note` |
| `intermediate` | `name` | `yield` (measured), `glossary`, `note` |
| `operation` | `verb`, `inputs`, `produces`, `attention` | `tools`, `after`, `params {duration, temperature, until}`, `glossary`, `note` |

- `verb` is a slug from a controlled vocabulary and doubles as its glossary key (`whisk`, `fold`, `saute`).
- `attention`: `active` needs the cook's hands; `passive` runs unattended (simmer, rest, bake). The scheduler starts passive work early and fills it with active work.
- `until` is the completion criterion a cook can observe; prefer it to bare durations.
- A tool node is one physical instance: two ops naming `pan` use the same pan.

## 5 · Inputs and amounts

An input is `{ "ref": id, "amount"?: … }`. `amount` is `"all"` (default), `"rest"`, `{ "fraction": f }` with 0 < f ≤ 1, or `{ "quantity": Measured }`. A material used by **one** operation needs no amount. A material used by **several** must say how it is split; at most one use may take `"rest"`.

## 6 · Quantities and units

- **Measured:** `{ value, unit, noun?, each?, source? }`, `unit` ∈ `g` · `mL` · `count`. Storage is canonical; display units are computed.
- `value` is a number or `{ min, max }`.
- `noun` names the counted item when it is not the ingredient itself (`3` `clove` of garlic); `each` sizes it (`1` `can` of `400 g`).
- `source` keeps the author's original (`{ "text": "1 cup" }`) for display and round-tripping.
- **Unquantified:** `{ "unquantified": "to-taste" | "as-needed" }`. This is a quantity, so it satisfies "nothing implicit".
- Durations are seconds (`unit: "s"`); temperatures are `°C` (`unit: "C"`) or a stove setting `{ "heat": "medium-high" }`.

## 7 · Scaling

Each ingredient, tool and duration may carry `scaling`:

| `kind` | Behaviour | Default for |
|---|---|---|
| `linear` | proportional to the scale factor | ingredients |
| `discrete` | proportional, rounded to `step`, not below `min` (eggs) | — |
| `fixed` | never changes (a pinch of salt, oven time for meringues) | durations, tools |
| `heuristic` | needs judgement; `note` says how (dish size, bake time vs depth) | — |

The scaling solver itself is not part of this spec (ledger row B-3); the spec only carries the information it needs.

## 8 · Validity

Structural rules are in the JSON Schema. Semantic rules, enforced by `spec/validator` (error codes in brackets):

1. References resolve to the right kind: inputs → material, produces → intermediate, tools → tool, after → operation, outputs/byproducts → material `[ref-missing, ref-kind]`.
2. Each intermediate is produced by exactly one operation `[intermediate-unproduced, intermediate-multi]`.
3. No cycles over inputs, produces and after edges `[cycle]`.
4. Every material is consumed, or is an output, or a byproduct — never both consumed and terminal `[unused, terminal-consumed]`.
5. Splits: several uses require explicit amounts, at most one `"rest"`, fractions ≤ 1, quantity uses ≤ the known total `[split-ambiguous, split-rest, split-over]`; an unused remainder warns `[split-under]`.
6. An operation that consumes must produce `[op-sink]`; one with neither inputs nor products must use a tool and be waited on through `after` `[op-empty, op-unanchored ⚠]`.
7. Ranges have min ≤ max `[range]`; `each` only on counts `[each-not-count]`; a declared tool is used `[tool-unused ⚠]`; one material is not listed twice in an operation `[input-duplicate]`.

**Nothing implicit** is tested, not just stated: the reference generator (`spec/validator/src/instructions.ts`) renders every fixture and the tests check that each ingredient mention carries its quantity — "the egg (2)", never "the eggs".

## 9 · Answers to the open questions (DESIGN-BRIEF §2b)

| # | Question | v0.1 answer |
|---|---|---|
| 1 | Bipartite? | Yes: materials ↔ operations. |
| 2 | Tool edges in the DAG? | No. `tools` is a separate relation, excluded from the acyclicity and consumption checks. Scheduling conflicts on a shared tool are a scheduler concern (not checked). |
| 3 | Sharing intermediates | By id reference, never by nesting. |
| 4 | Splitting an intermediate | `amount`: fraction, quantity, or `"rest"` (§5). |
| 5 | Multi-component dishes | `outputs` has one or more entries. |
| 6 | "To taste", optional | `unquantified` quantity; `optional: true` on the ingredient or tool. |
| 7 | Units | Canonical `g` · `mL` · `count` · `s` · `C`, plus `source` text from the author. |
| 8 | Glossary references | Slug ids in `verb` and `glossary[]`; the glossary itself is not built yet. |

## 10 · Modelling guidance

- Anything that needs work is an operation, not an ingredient `state`: "1 onion, diced" = ingredient `onion` + operation `chop` → `chopped onion`.
- Use `after` only for ordering without material flow (preheating).
- Prefer an observable `until` to a bare duration; give both when the recipe does.
- One operation per thing the cook would call one step. Split when the heat, tool or attention changes ("bring to a boil, then simmer" is two operations).

## 11 · Known limits (revision candidates)

Logged as *Unreleased → candidates* in `spec/CHANGELOG.md`; each needs a fixture that shows the problem before it changes the schema.

## 12 · Tooling

Run once per workstation, from `spec\validator`:

```
npm install
npm test
node dist\src\cli.js --steps ..\fixtures\lasagna.recipe.json
```

After changing the schema: `npm run gen-types` regenerates `src/types.ts` and `src/schema.ts` (never edit either by hand); a test fails if `src/schema.ts` is out of date.

The package is browser-safe (no Node built-ins at runtime) and exports `validate`, `generateSteps`, `migrate`, `schema` and the types from `src/index.ts`.
