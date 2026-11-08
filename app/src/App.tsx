import { lazy, Suspense } from "react";
import { byId } from "./recipes";
import { href, useRoute } from "./router";
import { RecipeList } from "./views/RecipeList";
import { RecipeView } from "./views/RecipeView";
import { CookProvider } from "./cook/session";
import { LaneView } from "./views/LaneView";

// React Flow + dagre are most of the bundle: load them only for the map view.
const GraphView = lazy(() => import("./views/GraphView").then((m) => ({ default: m.GraphView })));

export function App() {
	const route = useRoute();
	if (route.name === "list") return <RecipeList />;
	const loaded = byId(route.id);
	if (!loaded) {
		return (
			<div className="page">
				<a className="back" href={href({ name: "list" })}>‹ Recipes</a>
				<p>No recipe “{route.id}”.</p>
			</div>
		);
	}
	if (!loaded.recipe) return <RecipeView loaded={loaded} />;
	return (
		<CookProvider key={loaded.id} loaded={loaded}>
			{route.name === "graph" ? (
				<LaneView loaded={loaded} />
			) : route.name === "map" ? (
				<Suspense fallback={<div className="page muted">Loading map…</div>}>
					<GraphView loaded={loaded} />
				</Suspense>
			) : (
				// "cook" is the recipe page now: cooking runs in its step list
				<RecipeView loaded={loaded} />
			)}
		</CookProvider>
	);
}
