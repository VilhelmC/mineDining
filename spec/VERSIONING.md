# Spec versioning

*How the recipe spec changes without breaking stored recipes. The spec is expected to change: we will not foresee everything up front. This policy makes each change cheap and safe.*

---

## Version numbers

`schemaVersion` is `MAJOR.MINOR.PATCH`.

| While `0.x` | From `1.0` | Meaning |
|---|---|---|
| MINOR | MAJOR | **Breaking**: a document valid before is invalid after, or means something different |
| PATCH | MINOR | **Additive**: every document valid before is still valid and means the same (e.g. a new optional field) |
| — | PATCH | Clarification only: prose, descriptions, error messages; no change to valid documents |

`1.0.0` is declared when the app stores real users' recipes. Until then, breaking changes are cheap; use that.

## The rule for every revision

A change to `spec/schema/recipe.schema.json` is not done until all of these are:

1. **Reason first.** A fixture in `spec/fixtures/` that the old version cannot express (or expresses wrongly). Add it before changing the schema.
2. **Bump** `schemaVersion` `const` in the schema.
3. **Freeze** the new schema as `spec/schema/archive/recipe.schema.<new>.json`. Archived versions are never edited; a test fails if the live schema differs from the archived copy of its own version (a change without a bump).
4. **Migrate.** Add one step `<old>` → `<new>` to `spec/validator/src/migrate.ts`. An additive bump's step only rewrites `schemaVersion`. A breaking bump's step transforms the document, or throws with a reason when no automatic transformation exists.
5. **Regenerate types** (`npm run gen-types`), update the validator and generator.
6. **Migrate the fixtures** in place to the new version; all tests green.
7. **Log** in `spec/CHANGELOG.md` (what, why, which fixture forced it) and in `LEDGER-LOG.md`.

## Reading old documents

The validator accepts only the current version. Code that loads a stored recipe calls `migrate(doc)` first; it walks the chain of steps from the document's version to the current one.
