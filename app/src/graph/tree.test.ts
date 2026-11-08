import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { generateSteps, type Recipe } from "@minedining/recipe-spec";
import { buildTree, layoutTree } from "./tree";

const dir = new URL("../../../spec/fixtures/", import.meta.url);
const load = (f: string) => JSON.parse(readFileSync(new URL(f, dir), "utf8")) as Recipe;

describe("bracket table over every fixture", () => {
	for (const f of readdirSync(dir).filter((x) => x.endsWith(".recipe.json"))) {
		it(f, () => {
			const r = load(f);
			const t = layoutTree(buildTree(r, generateSteps(r)));
			// the grid is exactly covered: no gaps, no overlaps
			const grid = Array.from({ length: t.rows }, () => Array(t.cols).fill(0));
			for (const c of t.cells) for (let y = c.row; y < c.row + c.rowspan; y++) for (let x = c.col; x < c.col + c.colspan; x++) grid[y][x]++;
			expect(grid.flat().every((v) => v === 1)).toBe(true);
			// every operation appears once (as a cell or a prep row)
			const ops = Object.entries(r.nodes).filter(([, n]) => n.kind === "operation").map(([id]) => id);
			const shown = t.cells.flatMap((c) => (c.node ? (c.node.op === "serve" ? [] : [c.node.op]) : c.leaf?.kind === "prep" ? [c.leaf.op] : []));
			expect([...shown].sort()).toEqual([...ops].sort());
			// every ingredient use appears, with its quantity
			const uses = Object.values(r.nodes).flatMap((n) => (n.kind === "operation" ? n.inputs.filter((i) => r.nodes[i.ref].kind === "ingredient") : []));
			const leaves = t.cells.filter((c) => c.leaf?.kind === "ingredient");
			expect(leaves.length).toBe(uses.length);
			for (const c of leaves) expect(c.leaf?.kind === "ingredient" && c.leaf.quantity.length > 0).toBe(true);
			// every tool is listed once (first use) or by its prep row; every use is shown
			const first = t.cells.flatMap((c) => (c.leaf?.kind === "tool" && !c.leaf.again ? c.leaf.refs : []));
			expect(new Set(first).size).toBe(first.length);
			const tools = Object.entries(r.nodes).filter(([, n]) => n.kind === "tool").map(([id]) => id);
			const prepTools = Object.values(r.nodes).flatMap((n) => (n.kind === "operation" && n.inputs.length === 0 ? n.tools ?? [] : []));
			for (const id of tools) expect(first.includes(id) || prepTools.includes(id)).toBe(true);
		});
	}
});

it("lasagna: béchamel drawn once, referenced once; preheat is a prep row in the bake bracket", () => {
	const r = load("lasagna.recipe.json");
	const t = layoutTree(buildTree(r, generateSteps(r)));
	expect(t.cells.filter((c) => c.node?.op === "make-bechamel")).toHaveLength(1);
	expect(t.cells.filter((c) => c.leaf?.kind === "reference" && c.leaf.ref === "bechamel")).toHaveLength(1);
	const bake = t.cells.find((c) => c.node?.op === "bake")!;
	const prep = t.cells.find((c) => c.leaf?.kind === "prep")!;
	expect(prep.row).toBeGreaterThanOrEqual(bake.row);
	expect(prep.row).toBeLessThan(bake.row + bake.rowspan);
});
