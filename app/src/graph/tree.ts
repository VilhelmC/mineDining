import type { Input, Operation, Recipe, Step } from "@minedining/recipe-spec";
import { quantity } from "@minedining/recipe-spec";
import { displayName } from "../format";

/**
 * Bracket table: the recipe DAG as a nested ingredient list (tabular recipe
 * notation). Read down, column 0 is an ingredient list. Read right, each
 * operation is a cell spanning the rows of what it combines, nesting toward
 * the dish in the last column. Column of an operation = its height (longest
 * path down to a leaf), so the dish is always rightmost.
 *
 * The DAG is not a tree. Rules:
 *  - an intermediate used by several operations is drawn in full at its
 *    first use (depth-first, in input order) and as a reference row after;
 *  - an ordering-only dependency with no inputs (preheat) is a "prep" row;
 *  - several outputs are joined by a final "serve" cell.
 * Tools are not rows: the view draws them as chips joined to their steps.
 */

export type Leaf =
	| { kind: "ingredient"; ref: string; name: string; quantity: string; optional: boolean }
	| { kind: "reference"; ref: string; text: string }
	| { kind: "prep"; op: string; text: string };

export interface TreeNode {
	/** Operation id, or "serve" for the synthetic join of several outputs. */
	op: string;
	/** Amount of this node's product taken by its parent, when not all of it ("⅔"). */
	share?: string;
	children: (TreeNode | Leaf)[];
	height: number;
}

export interface Cell {
	row: number;
	col: number;
	rowspan: number;
	colspan: number;
	leaf?: Leaf;
	node?: TreeNode;
}

export interface BracketTable {
	rows: number;
	cols: number;
	cells: Cell[];
}

const isLeaf = (x: TreeNode | Leaf): x is Leaf => "kind" in x;

export function fraction(f: number): string {
	const known: [number, string][] = [[0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"]];
	const hit = known.find(([x]) => Math.abs(x - f) < 0.01);
	return hit ? hit[1] : `${Math.round(f * 100)} %`;
}

export function shareText(i: Input): string | undefined {
	const a = i.amount ?? "all";
	if (a === "all") return undefined;
	if (a === "rest") return "rest";
	if ("fraction" in a) return fraction(a.fraction);
	return quantity(a.quantity);
}

export function buildTree(r: Recipe, steps: Step[]): TreeNode {
	const nodes = r.nodes;
	const producer = new Map<string, string>();
	for (const [id, n] of Object.entries(nodes)) if (n.kind === "operation") for (const p of n.produces) producer.set(p, id);
	const mention = new Map(steps.flatMap((s) => s.mentions.map((m) => [`${s.op}:${m.ref}`, m.quantity] as const)));
	const drawn = new Set<string>();
	const name = (id: string) => (nodes[id] as { name: string }).name;

	const grow = (opId: string, share?: string): TreeNode => {
		drawn.add(opId);
		const op = nodes[opId] as Operation;
		const children: (TreeNode | Leaf)[] = [];
		for (const i of op.inputs) {
			const n = nodes[i.ref];
			if (n.kind === "ingredient") {
				children.push({ kind: "ingredient", ref: i.ref, name: displayName(n), quantity: mention.get(`${opId}:${i.ref}`) ?? "", optional: !!n.optional });
				continue;
			}
			const p = producer.get(i.ref)!;
			const s = shareText(i);
			if (drawn.has(p)) children.push({ kind: "reference", ref: i.ref, text: `${s === "rest" ? "rest of the" : s ? `${s} of the` : "the"} ${name(i.ref)}` });
			else children.push(grow(p, s));
		}
		for (const a of op.after ?? []) {
			if (drawn.has(a)) continue;
			const dep = nodes[a] as Operation;
			if (dep.inputs.length === 0) {
				drawn.add(a);
				const t = dep.params?.temperature;
				const temp = !t ? "" : "heat" in t ? ` · ${t.heat} heat` : typeof t.value === "number" ? ` ${t.value} °C` : ` ${t.value.min}–${t.value.max} °C`;
				const tools = (dep.tools ?? []).map(name).join(", ");
				children.push({ kind: "prep", op: a, text: `${dep.verb} ${tools}${temp}`.trim() });
			} else children.push(grow(a));
		}
		const height = 1 + Math.max(0, ...children.map((c) => (isLeaf(c) ? 0 : c.height)));
		return { op: opId, share, children, height };
	};

	const roots = r.outputs.map((o) => grow(producer.get(o)!));
	if (roots.length === 1) return roots[0];
	return { op: "serve", children: roots, height: 1 + Math.max(...roots.map((x) => x.height)) };
}

export function layoutTree(root: TreeNode): BracketTable {
	const cells: Cell[] = [];
	let row = 0;
	const place = (n: TreeNode, parentCol: number): number => {
		const start = row;
		for (const c of n.children) {
			if (isLeaf(c)) {
				cells.push({ row, col: 0, rowspan: 1, colspan: n.height, leaf: c });
				row++;
			} else place(c, n.height);
		}
		if (row === start) row++; // operation with no children: give it a row
		cells.push({ row: start, col: n.height, rowspan: row - start, colspan: parentCol - n.height, node: n });
		return row - start;
	};
	place(root, root.height + 1);
	return { rows: row, cols: root.height + 1, cells };
}
