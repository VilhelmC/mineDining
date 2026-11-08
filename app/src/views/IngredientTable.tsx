import { useMemo } from "react";
import type { Operation, Recipe, Step } from "@minedining/recipe-spec";
import { buildTree, layoutTree, type Cell } from "../graph/tree";
import { durationText } from "../format";

/** The ingredient list as a bracket table: read down, a list; read right, the recipe graph. */
export function IngredientTable({ recipe, steps }: { recipe: Recipe; steps: Step[] }) {
	const table = useMemo(() => layoutTree(buildTree(recipe, steps)), [recipe, steps]);
	const byRow = useMemo(() => {
		const rows: Cell[][] = Array.from({ length: table.rows }, () => []);
		for (const c of table.cells) rows[c.row].push(c);
		for (const r of rows) r.sort((a, b) => a.col - b.col);
		return rows;
	}, [table]);
	return (
		<div className="btable-wrap">
			<table className="btable">
				<tbody>
					{byRow.map((cells, i) => (
						<tr key={i}>
							{cells.map((c) => (
								<td key={`${c.row}:${c.col}`} rowSpan={c.rowspan} colSpan={c.colspan} className={cellClass(c, recipe)}>
									<CellBody c={c} r={recipe} />
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function cellClass(c: Cell, r: Recipe): string {
	if (c.leaf) return `bt-leaf bt-${c.leaf.kind}`;
	if (c.node!.op === "serve") return "bt-op bt-serve";
	return `bt-op bt-${(r.nodes[c.node!.op] as Operation).attention}`;
}

function CellBody({ c, r }: { c: Cell; r: Recipe }) {
	const l = c.leaf;
	if (l?.kind === "ingredient")
		return (
			<>
				<b>{l.quantity}</b> {l.name}
				{l.optional && <span className="muted"> (optional)</span>}
			</>
		);
	if (l?.kind === "reference") return <>↑ {l.text}</>;
	if (l?.kind === "prep") return <>{l.text}</>;
	const n = c.node!;
	if (n.op === "serve") return <span className="bt-verb">serve together</span>;
	const op = r.nodes[n.op] as Operation;
	const made = op.produces.map((x) => (r.nodes[x] as { name: string }).name).join(", ");
	return (
		<span title={made ? `→ ${made}` : undefined}>
			<span className="bt-verb">{op.verb.replace(/-/g, " ")}</span>
			{op.params?.duration && <span className="bt-dur">{durationText(op.params.duration)}</span>}
			{n.share && <span className="bt-share">{n.share === "rest" ? "rest" : n.share}</span>}
		</span>
	);
}
