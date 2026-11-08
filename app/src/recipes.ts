import { migrate, validate, generateSteps, type Issue, type Recipe, type Step } from "@minedining/recipe-spec";
import { plan, type Plan } from "./cook/scheduler";

/** A recipe as the app holds it: loaded through migrate() + validate(), never trusted raw. */
export interface Loaded {
	id: string;
	file: string;
	recipe?: Recipe;
	/** Steps in planned order (cook mode's schedule, simulated), numbered 1..n. */
	steps?: Step[];
	plan?: Plan;
	issues: Issue[];
}

// Bundled for now (C-2): the spec fixtures. No backend yet.
const files = import.meta.glob<unknown>("../../spec/fixtures/*.recipe.json", { eager: true, import: "default" });

export function load(file: string, raw: unknown): Loaded {
	const fallbackId = file.split("/").pop()!.replace(/\.recipe\.json$/, "");
	let doc: unknown;
	try {
		doc = migrate(raw as { schemaVersion?: string });
	} catch (e) {
		return { id: fallbackId, file, issues: [{ level: "error", code: "migrate", path: "/schemaVersion", message: String(e) }] };
	}
	const issues = validate(doc);
	const id = typeof (doc as { id?: unknown }).id === "string" ? (doc as { id: string }).id : fallbackId;
	if (issues.some((i) => i.level === "error")) return { id, file, issues };
	const recipe = doc as Recipe;
	const p = plan(generateSteps(recipe));
	return { id, file, recipe, steps: p.steps, plan: p, issues };
}

export const recipes: Loaded[] = Object.entries(files)
	.map(([file, raw]) => load(file, raw))
	.sort((a, b) => (a.recipe?.meta.title ?? a.id).localeCompare(b.recipe?.meta.title ?? b.id));

export const byId = (id: string) => recipes.find((r) => r.id === id);
