import { recipes } from "../recipes";
import { href } from "../router";

export function RecipeList() {
	return (
		<div className="page">
			<header className="top">
				<h1>mineDining</h1>
			</header>
			<ul className="cards">
				{recipes.map((r) => {
					const m = r.recipe?.meta;
					const errors = r.issues.filter((i) => i.level === "error").length;
					return (
						<li key={r.file}>
							<a className="card" href={href({ name: "recipe", id: r.id })}>
								<span className="card-title">{m?.title ?? r.id}</span>
								<span className="muted">
									{m
										? [`${m.servings} servings`, m.course, m.difficulty, `${r.steps!.length} steps`].filter(Boolean).join(" · ")
										: `invalid: ${errors} error${errors === 1 ? "" : "s"}`}
								</span>
							</a>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
