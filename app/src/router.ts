import { useEffect, useState } from "react";

/** Hash routes: works on any static host (GitHub Pages) without server rewrites. */
export type Route =
	| { name: "list" }
	| { name: "recipe"; id: string }
	| { name: "graph"; id: string }
	| { name: "map"; id: string }
	| { name: "cook"; id: string };

export function parse(hash: string): Route {
	const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
	if (parts[0] === "r" && parts[1]) {
		const id = decodeURIComponent(parts[1]);
		if (parts[2] === "graph") return { name: "graph", id };
		if (parts[2] === "map") return { name: "map", id };
		if (parts[2] === "cook") return { name: "cook", id };
		return { name: "recipe", id };
	}
	return { name: "list" };
}

export function href(r: Route): string {
	if (r.name === "list") return "#/";
	const base = `#/r/${encodeURIComponent(r.id)}`;
	return r.name === "recipe" ? base : `${base}/${r.name}`;
}

export function useRoute(): Route {
	const [route, setRoute] = useState(() => parse(location.hash));
	useEffect(() => {
		const on = () => setRoute(parse(location.hash));
		addEventListener("hashchange", on);
		return () => removeEventListener("hashchange", on);
	}, []);
	return route;
}
