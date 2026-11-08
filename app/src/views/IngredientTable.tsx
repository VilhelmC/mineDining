import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Operation, Recipe, Step } from "@minedining/recipe-spec";
import { buildTree, layoutTree, type Cell } from "../graph/tree";
import { durationText } from "../format";
import { stepClass, useCook, type Cook } from "../cook/session";

/** The ingredient list as a bracket table: read down, a list; read right, the recipe graph. */
export function IngredientTable({ recipe, steps }: { recipe: Recipe; steps: Step[] }) {
	const cook = useCook();
	const table = useMemo(() => layoutTree(buildTree(recipe, steps)), [recipe, steps]);
	const inner = useRef<HTMLDivElement>(null);
	const [selected, setSelected] = useState<string>();
	const [paths, setPaths] = useState<{ key: string; d: string; strong: boolean }[]>([]);
	const uses = useMemo(
		() => Object.entries(recipe.nodes).flatMap(([op, n]) => (n.kind === "operation" ? (n.tools ?? []).map((t) => ({ tool: t, op })) : [])),
		[recipe],
	);
	// tools of the step being cooked now are drawn strong
	const hot = useMemo(() => new Set(cook?.fg ? ((recipe.nodes[cook.fg.op] as Operation).tools ?? []) : []), [cook?.fg, recipe]);
	useLayoutEffect(() => {
		const el = inner.current;
		if (!el) return;
		const measure = () => {
			const o = el.getBoundingClientRect();
			const out: { key: string; d: string; strong: boolean }[] = [];
			for (const { tool, op } of uses) {
				const chip = el.querySelector(`[data-tool="${tool}"]`);
				const cell = el.querySelector(`[data-op="${op}"]`);
				if (!chip || !cell) continue;
				const a = chip.getBoundingClientRect();
				const b = cell.getBoundingClientRect();
				const x1 = a.left + a.width / 2 - o.left;
				const y1 = a.bottom - o.top;
				const leaf = cell.classList.contains("bt-leaf");
				const x2 = leaf ? b.right - 6 - o.left : b.left + b.width / 2 - o.left;
				const y2 = b.top + (leaf ? b.height / 2 : 4) - o.top;
				const dy = Math.max(24, (y2 - y1) / 2);
				out.push({ key: `${tool}>${op}`, d: `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`, strong: selected === tool || (hot.has(tool) && cook?.fg?.op === op) });
			}
			setPaths(out);
		};
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, [uses, selected, hot, cook?.fg, table]);
	const targets = useMemo(() => new Set(uses.filter((u) => u.tool === selected).map((u) => u.op)), [uses, selected]);
	const byRow = useMemo(() => {
		const rows: Cell[][] = Array.from({ length: table.rows }, () => []);
		for (const c of table.cells) rows[c.row].push(c);
		for (const r of rows) r.sort((a, b) => a.col - b.col);
		return rows;
	}, [table]);
	return (
		<div className="btable-wrap">
			<div className="btable-inner" ref={inner}>
				<ToolChips recipe={recipe} selected={selected} hot={hot} onSelect={(t) => setSelected((x) => (x === t ? undefined : t))} />
				<table className="btable">
					<tbody>
						{byRow.map((cells, i) => (
							<tr key={i}>
								{cells.map((c) => (
									<StepCell key={`${c.row}:${c.col}`} c={c} recipe={recipe} cook={cook} target={!!selected && targets.has(cellOp(c) ?? "")} />
								))}
							</tr>
						))}
					</tbody>
				</table>
				{/* curves run behind the table so labels stay readable; a selected tool's
				    curves are drawn strong and the cells it serves are outlined */}
				<svg className="splines under" aria-hidden="true">
					{[...paths.filter((p) => !p.strong), ...paths.filter((p) => p.strong)].map((p) => (
						<path key={p.key} d={p.d} className={`spline${p.strong ? " strong" : ""}`} />
					))}
				</svg>
			</div>
		</div>
	);
}

/** Tools as chips; each is joined by a curve to every step (cell) that uses it. */
function ToolChips({ recipe, selected, hot, onSelect }: { recipe: Recipe; selected?: string; hot: Set<string>; onSelect: (t: string) => void }) {
	const tools = Object.entries(recipe.nodes).filter(([, n]) => n.kind === "tool") as [string, { name: string; optional?: boolean }][];
	return (
		<div className="tool-chips">
			{tools.map(([id, t]) => (
				<button key={id} data-tool={id} className={`tool-chip${selected === id ? " on" : ""}${hot.has(id) ? " hot" : ""}`} onClick={() => onSelect(id)}>
					{t.name}
					{t.optional && " (optional)"}
				</button>
			))}
		</div>
	);
}

/** Step cells (and prep rows) show cooking progress and tick off on tap. */
const cellOp = (c: Cell) => (c.node && c.node.op !== "serve" ? c.node.op : c.leaf?.kind === "prep" ? c.leaf.op : undefined);

function StepCell({ c, recipe, cook, target }: { c: Cell; recipe: Recipe; cook?: Cook; target: boolean }) {
	const op = cellOp(c);
	const v = op ? cook?.view(op) : undefined;
	const style = v?.progress !== undefined && v.status !== "done" ? ({ "--p": `${Math.min(1, v.progress) * 100}%` } as React.CSSProperties) : undefined;
	return (
		<td
			rowSpan={c.rowspan}
			colSpan={c.colspan}
			className={`${cellClass(c, recipe)} ${stepClass(v)} ${v?.progress !== undefined ? "has-p" : ""}${target ? " tool-target" : ""}`}
			style={style}
			data-op={op}
			onClick={op && cook ? () => cook.toggle(op) : undefined}
			role={op && cook ? "button" : undefined}
			aria-pressed={op && cook ? v?.status === "done" : undefined}
		>
			{v?.status === "done" && <b className="bt-check">✓</b>}
			<CellBody c={c} r={recipe} />
		</td>
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
