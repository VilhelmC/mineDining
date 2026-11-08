import { useMemo } from "react";
import { ReactFlow, Background, Controls, MarkerType, Position, getNodesBounds, type Edge, type Node as FlowNode, type ReactFlowInstance } from "@xyflow/react";
import { Graph, layout } from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import type { Node, Operation, Recipe } from "@minedining/recipe-spec";
import { quantity } from "@minedining/recipe-spec";
import type { Loaded } from "../recipes";
import { href } from "../router";
import { durationText } from "../format";

const W = 170;
const H = 64;
/** Below this zoom the 12 px node labels are unreadable on a phone. */
const READABLE = 1;

/** Material/operation DAG, laid out left to right. Tools are shown inside their operation (spec §9 q2: not DAG edges). */
export function buildGraph(r: Recipe): { nodes: FlowNode[]; edges: Edge[] } {
	const all = Object.entries(r.nodes) as [string, Node][];
	const shown = all.filter(([, n]) => n.kind !== "tool");
	const edges: Edge[] = [];
	for (const [id, n] of all) {
		if (n.kind !== "operation") continue;
		const op = n as Operation;
		for (const i of op.inputs) edges.push({ id: `${i.ref}>${id}`, source: i.ref, target: id });
		for (const p of op.produces) edges.push({ id: `${id}>${p}`, source: id, target: p });
		for (const a of op.after ?? []) edges.push({ id: `${a}~>${id}`, source: a, target: id, style: { strokeDasharray: "5 4" } });
	}
	const g = new Graph();
	g.setGraph({ rankdir: "LR", nodesep: 18, ranksep: 46 });
	g.setDefaultEdgeLabel(() => ({}));
	for (const [id] of shown) g.setNode(id, { width: W, height: H });
	for (const e of edges) g.setEdge(e.source, e.target);
	layout(g);

	const outputs = new Set(r.outputs);
	const nodes: FlowNode[] = shown.map(([id, n]) => {
		const p = g.node(id);
		return {
			id,
			position: { x: p.x - W / 2, y: p.y - H / 2 },
			data: { label: <Label n={n} r={r} /> },
			sourcePosition: Position.Right,
			targetPosition: Position.Left,
			className: `gn gn-${n.kind}${n.kind === "operation" ? ` gn-${(n as Operation).attention}` : ""}${outputs.has(id) ? " gn-output" : ""}`,
			style: { width: W },
			draggable: false,
			connectable: false,
		};
	});
	return { nodes, edges: edges.map((e) => ({ ...e, markerEnd: { type: MarkerType.ArrowClosed } })) };
}

function Label({ n, r }: { n: Node; r: Recipe }) {
	if (n.kind === "ingredient") return (<><strong>{n.name}</strong><div>{quantity(n.quantity, n.name)}</div></>);
	if (n.kind === "intermediate") return <strong>{n.name}</strong>;
	if (n.kind === "operation") {
		const tools = (n.tools ?? []).map((t) => (r.nodes[t] as { name: string }).name);
		const d = n.params?.duration;
		return (
			<>
				<strong>{n.verb}</strong>
				{d && <span> · {durationText(d)}</span>}
				{tools.length > 0 && <div className="gn-tools">{tools.join(", ")}</div>}
			</>
		);
	}
	return null;
}

export function GraphView({ loaded }: { loaded: Loaded }) {
	const r = loaded.recipe!;
	const { nodes, edges } = useMemo(() => buildGraph(r), [r]);
	// Fit the whole graph when it is readable at that zoom (laptop, iPad);
	// otherwise (portrait phone) open at a readable zoom on the first column, centred vertically.
	const onInit = (rf: ReactFlowInstance) => {
		const el = document.querySelector(".graph");
		if (!el) return;
		const { width, height } = el.getBoundingClientRect();
		const b = getNodesBounds(nodes);
		const fit = Math.min(width / (b.width + 32), height / (b.height + 32));
		if (fit >= READABLE) return void rf.fitView({ padding: 0.05 });
		const zoom = READABLE;
		void rf.setViewport({ x: 16 - b.x * zoom, y: height / 2 - (b.y + b.height / 2) * zoom, zoom });
	};
	return (
		<div className="graph-page">
			<header className="cook-bar">
				<a className="back" href={href({ name: "recipe", id: loaded.id })}>‹</a>
				<span className="cook-title">{r.meta.title}</span>
				<span className="legend"><i className="lg-ing" />ingredient <i className="lg-int" />intermediate <i className="lg-act" />active <i className="lg-pas" />passive</span>
			</header>
			<div className="graph">
				<ReactFlow nodes={nodes} edges={edges} onInit={onInit} colorMode="system" minZoom={0.2} nodesDraggable={false} nodesConnectable={false} proOptions={{ hideAttribution: false }}>
					<Background />
					<Controls showInteractive={false} />
				</ReactFlow>
			</div>
		</div>
	);
}
