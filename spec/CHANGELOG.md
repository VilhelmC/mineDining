# Spec changelog

*Newest first. Each entry: what changed, why, which fixture forced it. Rules: `spec/VERSIONING.md`.*

---

## Unreleased — candidates

Found by rendering the v0.1.0 fixtures with the reference generator. None is adopted yet; each needs a fixture showing the problem first.

- **Input roles.** "Brown the olive oil (15 mL) and the minced beef (500 g)": the oil is the cooking medium, not a thing being browned. Candidate: `role` on an input (`target` · `medium` · `addition`), so text can say "brown the beef in the oil". *(lasagna `brown-beef`, stir-fry `sear-chicken`)*
- **Repetition / batches.** Crêpes are cooked one at a time; v0.1 has no "repeat per item" or batch count. *(crepes `cook-crepes`)*
- **Optional propagation.** An intermediate made only from optional inputs (chopped chives) is not marked optional where it is used. Decide: derive it in the validator, or declare it. *(vinaigrette `finish`)*
- **Tool state.** A pan carries fond from one operation to the next; v0.1 only says the same tool instance is used. *(prior-art: Beef Stroganoff, Cooking for Engineers)*
- **Sub-recipes.** Cooklang-style references to another recipe as an ingredient, scaled by its yield (courses, mother sauces). *(docs/prior-art.md §3)*
- **Verb vocabulary.** `verb` is any slug; a controlled list (with glossary entries) is needed before import (B-1) so an LLM cannot invent verbs.
- **Ingredient identity.** `ref` and `wikidata` are optional and unchecked; ingredient-set search (B-4) and densities (B-3) need a catalogue.

## 0.1.0 — 2026-11-08

First version. Bipartite material/operation DAG; tools as a separate relation; `after` ordering edges; outputs and byproducts; split amounts; canonical units with source text; scaling rules; semantic validator; reference generator. Fixtures: crepes, stir-fry-with-rice, lasagna, vinaigrette, meringues.
