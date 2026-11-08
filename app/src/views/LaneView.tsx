import { useMemo } from "react";
import type { Input, Node, Operation, Recipe, Temperature } from "@minedining/recipe-spec";
import { quantity } from "@minedining/recipe-spec";
import { laneLayout, type LaneRow } from "../graph/lanes";
import { durationText } from "../format";
import type { Loaded } from "../recipes";
import { href } from "../router";

/** Lane pitch and dot position (px). The dot sits level with the card's first line. */
const PITCH = 16;
const DOT_Y = 21;

function amountText(i: Input, node: Node): string {
	const name = (node as { name: string }).name;
	const a = i.amount ?? "all";
	if (a === "all") return name;
	if (a === "rest") return `rest of the ${name}`;
	if ("fraction" in a) {
		const f = a.fraction;
		const known: [number, string][] = [[0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"]];
		const hit = known.find(([x]) => Math.abs(x - f) < 0.01);
		return `${hit ? hit[1] : `${Math.round(f * 100)} %`} of the ${name}`;
	}
	return `${quantity(a.quantity, name)} of the ${name}`;
}

function tempText(t: Temperature): string {
	return "heat" in t ? `${t.heat} heat` : typeof t.value === "number" ? `${t.value} °C` : `${t.value.min}–${t.value.max} °C`;
}

function Gutter({ row, lanes }: { row: LaneRow; lanes: number }) {
	const x = (l: number) => 8 + l * PITCH;
	const v = (key: string, l: number, dashed: boolean) => <i key={key} className={`ln v${dashed ? " dashed" : ""}`} style={{ left: x(l), top: 0, bottom: 0 }} />;
	const els = [];
	for (const p of row.passing) els.push(v(`p${p.lane}`, p.lane, p.dashed));
	for (const i of row.inputs) {
		if (i.ends) els.push(<i key={`i${i.op}`} className={`ln v${i.dashed ? " dashed" : ""}`} style={{ left: x(i.lane), top: 0, height: DOT_Y }} />);
		else els.push(v(`t${i.op}`, i.lane, i.dashed));
		if (i.lane !== row.lane) {
			const a = Math.min(x(i.lane), x(row.lane));
			const b = Math.max(x(i.lane), x(row.lane));
			els.push(<i key={`h${i.op}`} className={`ln h${i.dashed ? " dashed" : ""}`} style={{ left: a, width: b - a, top: DOT_Y }} />);
		}
	}
	if (row.continues) els.push(<i key="own" className={`ln v${row.dashed ? " dashed" : ""}`} style={{ left: x(row.lane), top: DOT_Y, bottom: 0 }} />);
	els.push(<i key="dot" className={`dot ${row.step.attention}`} style={{ left: x(row.lane), top: DOT_Y }} />);
	return (
		<div className="gutter" style={{ width: 16 + (lanes - 1) * PITCH }}>
			{els}
		</div>
	);
}

function Card({ row, r }: { row: LaneRow; r: Recipe }) {
	const op = r.nodes[row.step.op] as Operation;
	const p = op.params ?? {};
	const ingredients = op.inputs.filter((i) => r.nodes[i.ref].kind === "ingredient");
	const intermediates = op.inputs.filter((i) => r.nodes[i.ref].kind !== "ingredient");
	const tools = (op.tools ?? []).map((t) => (r.nodes[t] as { name: string }).name);
	const outputs = new Set(r.outputs);
	const name = (id: string) => (r.nodes[id] as { name: string }).name;
	return (
		<div className={`lane-card ${op.attention}`}>
			<div className="lc-head">
				<strong className="lc-verb">{op.verb.replace(/-/g, " ")}</strong>
				{p.duration && <span className="lc-chip">{durationText(p.duration)}</span>}
				{p.temperature && <span className="lc-chip">{tempText(p.temperature)}</span>}
				{op.attention === "passive" && <span className="lc-chip passive">runs by itself</span>}
			</div>
			{intermediates.length > 0 && <div className="lc-from">{intermediates.map((i) => amountText(i, r.nodes[i.ref])).join(" · ")}</div>}
			{ingredients.length > 0 && (
				<ul className="lc-ing">
					{ingredients.map((i) => {
						const m = row.step.mentions.find((x) => x.ref === i.ref);
						return (
							<li key={i.ref}>
								<b>{m?.quantity}</b> {name(i.ref)}
							</li>
						);
					})}
				</ul>
			)}
			{p.until && <div className="lc-until">until {p.until}</div>}
			{op.note && <div className="lc-note">{op.note}</div>}
			{tools.length > 0 && <div className="lc-tools">{tools.join(", ")}</div>}
			{op.produces.length > 0 && (
				<div className="lc-out">
					→ {op.produces.map((x) => <span key={x} className={outputs.has(x) ? "serve" : ""}>{name(x)}</span>)}
				</div>
			)}
		</div>
	);
}

export function GraphHeader({ loaded, view }: { loaded: Loaded; view: "graph" | "map" }) {
	return (
		<header className="cook-bar">
			<a className="back" href={href({ name: "recipe", id: loaded.id })}>‹</a>
			<span className="cook-title">{loaded.recipe!.meta.title}</span>
			<nav className="view-toggle">
				<a className={view === "graph" ? "on" : ""} href={href({ name: "graph", id: loaded.id })}>Lanes</a>
				<a className={view === "map" ? "on" : ""} href={href({ name: "map", id: loaded.id })}>Map</a>
			</nav>
		</header>
	);
}

export function LaneView({ loaded }: { loaded: Loaded }) {
	const recipe = loaded.recipe!;
	const steps = loaded.steps!;
	const layout = useMemo(() => laneLayout(steps, recipe), [steps, recipe]);
	return (
		<div className="cook">
			<GraphHeader loaded={loaded} view="graph" />
			<div className="lanes">
			{layout.rows.map((row) => (
				<div key={row.step.op} className="lane-row">
					<Gutter row={row} lanes={layout.lanes} />
					<Card row={row} r={recipe} />
				</div>
			))}
			</div>
		</div>
	);
}
