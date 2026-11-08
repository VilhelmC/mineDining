# PRIOR-ART

*What existing recipe and expression formats do that the mineDining recipe-DAG spec should adopt or avoid. C-ARCH task 1 (row A-2), 2026-11-08. Each source records what was actually read; nothing here rests on a summary of an unread page.*

---

## 1 · The gap

None of the formats read encodes a recipe as a dependency graph. schema.org and Cooklang are linear step lists with sections; MathJSON is a strict tree. The DAG — explicit edges from materials into operations, intermediates consumed by later operations — is ours to define. Prior art is useful for vocabulary, quantity syntax, scaling rules and metadata, not for structure.

## 2 · schema.org/Recipe

**Read:** schema.org/Recipe, /HowToStep, /HowToSection (first ~40k chars each, covering all type-specific properties), /HowToSupply (full). **Unread:** HowToDirection, HowToTip, HowToTool, HowToItem, PropertyValue, RestrictedDiet, NutritionInformation, Duration.

- `recipeIngredient` is "ItemList or PropertyValue or Text" — in practice free text; no quantity/unit property on Recipe.
- `recipeInstructions`: ordered list of `HowToStep` / `HowToSection`; order by `position`, `nextItem`, `previousItem`. **No property links a step to an ingredient, tool, or another step.**
- Time: `prepTime`, `cookTime`, `performTime`, `totalTime` (ISO 8601 Duration) on the recipe; a step only has `timeRequired`.
- Yield: `recipeYield`, `yield` (QuantitativeValue or Text).
- `tool` = "used (but not consumed)"; `supply` = "consumed" — same split as our tool vs ingredient nodes.
- Facets: `recipeCategory`, `recipeCuisine`, `cookingMethod`, `keywords`, `suitableForDiet`, `nutrition`.

**Adopt:** the tool / consumed-supply distinction; ISO 8601 durations; metadata field names as an import mapping (B-1). **Avoid:** text-only ingredients. **Import consequence:** a link import yields ingredient strings + ordered step text; every edge of the DAG must be inferred (LLM) — confirms DESIGN-BRIEF §3c.

## 3 · Cooklang

**Read:** cooklang.org/docs/spec/, cooklang.org/docs/conventions/. **Unread:** cooklang-rs extensions.

- Inline markup: `@onion{1}(peeled and finely chopped)`, `@bacon strips{1%kg}`, cookware `#pot`, timers `~eggs{3%minutes}`, optional `@?chilli flakes{1%pinch}`.
- Scaling: linear by default from front-matter `servings`; fixed with `=`: `@salt{=1%tsp}`. Timers and cookware never scale.
- Recipe references: `@./sauces/hollandaise{150%ml}` scales the referenced recipe via its `yield` (experimental).
- Canonical metadata: `servings`, `yield`, `course`, `cuisine`, `difficulty`, `diet`, `tags`, `image`, `locale`, time keys.
- Structure: linear steps + sections only; **no intermediates, step IDs or dependencies.**

**Adopt:** per-quantity scaling marker (generalise `=` to our rule set linear · discrete · fixed/heuristic); optional flag per use; "preparation" as a node attribute; recipe-as-ingredient references with yield-based scaling (sub-recipes, courses); metadata keys as a facet vocabulary. **Avoid:** inline-text-as-source — we store the graph and generate text from it.

## 4 · MathJSON

**Read:** mathlive.io/math-json/ (full). **Unread:** Compute Engine canonical-form and custom-definitions guides.

- Expressions are `["Head", arg, …]`; long object forms `{"fn": …}`, `{"sym": …}`, `{"num": …}`, `{"str": …}` carry metadata (`comment`, `wikidata`, `sourceUrl`, `sourceOffsets`, `hash`); shorthand forms cannot.
- Vocabulary: a standard library of heads; new names must not collide with it.
- **Strictly a tree** on the page read: no node IDs or references. No versioning policy.

**Adopt:** typed heads from a controlled vocabulary (operation verbs = heads, with a standard library + extension rule); long form with metadata (`sourceOffsets` → provenance back to the imported recipe text; `wikidata` → ingredient identity). **Avoid:** nesting as the sharing mechanism — shared intermediates need IDs (DESIGN-BRIEF §2b Q3).

## 5 · Cooking for Engineers tabular notation

**Read:** pages fetched (recipe/71 Pan-Seared Scallops, recipe/122 Beef Stroganoff) but the table markup was flattened in retrieval; **the table structure itself is unread / unverified.** What was seen: ingredient lines with dual units ("4 Tbs. (55 g) butter"), sub-blocks per component (scallops / sauce), inline action words with times.

**Provisionally adopt:** dual-unit display; components as sub-graphs. Re-read in a browser before relying on the merged-cell semantics.

## 6 · Not read here (deferred)

Open Recipe Format, RecipeML (optional); USDA FoodData Central → B-3; Paprika, Mela → B-4.
