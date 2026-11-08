import type { Ingredient, Tool } from "@minedining/recipe-spec";
import { quantity } from "@minedining/recipe-spec";
import type { Loaded } from "../recipes";
import { href } from "../router";

/** "2 scallion" → "2 scallions": a bare count (no noun) of more than one names the ingredient in the plural. */
function displayName(n: Ingredient): string {
	const q = n.quantity;
	if (!("unit" in q) || q.unit !== "count" || q.noun) return n.name;
	const v = q.value;
	if (typeof v === "number" && v <= 1) return n.name;
	return /(s|sh|ch|x)$/.test(n.name) ? n.name + "es" : n.name + "s";
}

export function Issues({ loaded }: { loaded: Loaded }) {
	if (!loaded.issues.length) return null;
	return (
		<ul className="issues">
			{loaded.issues.map((i, k) => (
				<li key={k} className={i.level}>
					<code>{i.code}</code> {i.path}: {i.message}
				</li>
			))}
		</ul>
	);
}

export function RecipeView({ loaded }: { loaded: Loaded }) {
	const r = loaded.recipe;
	if (!r) {
		return (
			<div className="page">
				<a className="back" href={href({ name: "list" })}>‹ Recipes</a>
				<h1>{loaded.id}</h1>
				<p>This recipe does not pass the validator.</p>
				<Issues loaded={loaded} />
			</div>
		);
	}
	const nodes = Object.entries(r.nodes);
	const ingredients = nodes.filter((e): e is [string, Ingredient] => e[1].kind === "ingredient");
	const tools = nodes.filter((e): e is [string, Tool] => e[1].kind === "tool");
	const m = r.meta;
	return (
		<div className="page">
			<a className="back" href={href({ name: "list" })}>‹ Recipes</a>
			<h1>{m.title}</h1>
			<p className="muted">
				{[`${m.servings} servings`, m.course, m.cuisine, m.difficulty].filter(Boolean).join(" · ")}
				{m.source?.url && (
					<>
						{" · "}
						<a href={m.source.url} target="_blank" rel="noreferrer">{m.source.name ?? "source"}</a>
					</>
				)}
			</p>
			{m.description && <p>{m.description}</p>}
			<div className="actions">
				<a className="big primary" href={href({ name: "cook", id: loaded.id })}>Cook</a>
				<a className="big" href={href({ name: "graph", id: loaded.id })}>Graph</a>
			</div>
			<Issues loaded={loaded} />

			<h2>Ingredients</h2>
			<ul className="ingredients">
				{ingredients.map(([id, n]) => (
					<li key={id}>
						<span className="qty">{quantity(n.quantity, n.name)}</span> <span>{displayName(n)}</span>
						{n.optional && <span className="muted"> (optional)</span>}
						{n.note && <div className="muted small">{n.note}</div>}
					</li>
				))}
			</ul>

			<h2>Tools</h2>
			<ul className="tools">
				{tools.map(([id, t]) => (
					<li key={id}>
						{t.name}
						{t.optional && <span className="muted"> (optional)</span>}
					</li>
				))}
			</ul>

			<h2>Steps</h2>
			<ol className="steps">
				{loaded.steps!.map((s) => (
					<li key={s.op}>
						<span className={`badge ${s.attention}`}>{s.attention}</span> {s.text}
						{s.note && <div className="muted small">{s.note}</div>}
					</li>
				))}
			</ol>
			<p className="muted small">Steps are generated from the recipe graph; passive steps are listed as early as they can start.</p>
		</div>
	);
}
