import type { Ingredient, Tool } from "@minedining/recipe-spec";
import { quantity } from "@minedining/recipe-spec";
import type { Loaded } from "../recipes";
import { href } from "../router";
import { IngredientTable } from "./IngredientTable";
import { StepsCook } from "./StepsCook";
import { CookBar } from "./CookBar";
import { displayName } from "../format";
import { ACTIVE_DEFAULT, PASSIVE_DEFAULT } from "../cook/scheduler";

function totalText(s: number): string {
	const m = Math.round(s / 60);
	return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
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
		<div className="page with-bar">
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
				<a className="big" href={href({ name: "graph", id: loaded.id })}>Graph</a>
			</div>
			<Issues loaded={loaded} />

			<h2>Ingredients and tools</h2>
			<IngredientTable recipe={r} steps={loaded.steps!} />
			<details className="plain-list">
				<summary>As a plain list</summary>
				<ul className="ingredients">
					{ingredients.map(([id, n]) => (
						<li key={id}>
							<span className="qty">{quantity(n.quantity, n.name)}</span> <span>{displayName(n)}</span>
							{n.optional && <span className="muted"> (optional)</span>}
							{n.note && <div className="muted small">{n.note}</div>}
						</li>
					))}
				</ul>
				<ul className="tools">
					{tools.map(([id, t]) => (
						<li key={id}>
							{t.name}
							{t.optional && <span className="muted"> (optional)</span>}
						</li>
					))}
				</ul>
			</details>

			<h2>Steps</h2>
			{loaded.plan && (
				<p className="muted">
					About {totalText(loaded.plan.total)} in total{loaded.plan.estimated ? ` (estimate: steps without a time count ${ACTIVE_DEFAULT / 60} min hands-on, ${PASSIVE_DEFAULT / 60} min waiting)` : ""}. Times are planned starts; preheating starts as late as still works.
				</p>
			)}
			<StepsCook />
			<CookBar />
		</div>
	);
}
