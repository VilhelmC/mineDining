import type { Recipe, Node, Operation, Input, Measured, Quantity, NumberOrRange, Duration, Temperature } from "./types.js";

export interface Step {
	n: number;
	op: string;
	attention: "active" | "passive";
	text: string;
	note?: string;
	/** Every ingredient this step mentions, with the quantity string printed for it. */
	mentions: { ref: string; quantity: string }[];
	/** Operation ids that must finish before this step can start (material and `after` edges). */
	dependsOn: string[];
	/** The operation's parameters, for timers and temperature display. */
	params?: Operation["params"];
	/** Ids of the materials this step produces. */
	produces: string[];
}

/**
 * Follow-along steps from the DAG. Order: topological; among ready operations,
 * passive ones first (start the long waits early), then declaration order.
 * Nothing implicit: every ingredient mention carries its quantity.
 */
export function generateSteps(r: Recipe): Step[] {
	const nodes = r.nodes as Record<string, Node>;
	const ops = Object.entries(nodes).filter((e): e is [string, Operation] => e[1].kind === "operation");
	const producerOf = new Map<string, string>();
	for (const [id, op] of ops) for (const p of op.produces) producerOf.set(p, id);
	const deps = new Map<string, Set<string>>(
		ops.map(([id, op]) => [
			id,
			new Set([...op.inputs.map((i) => producerOf.get(i.ref)).filter((x): x is string => !!x), ...(op.after ?? [])]),
		]),
	);
	const done = new Set<string>();
	const steps: Step[] = [];
	while (done.size < ops.length) {
		const ready = ops.filter(([id]) => !done.has(id) && [...deps.get(id)!].every((d) => done.has(d)));
		if (ready.length === 0) throw new Error("cycle: no operation is ready");
		const [id, op] = ready.find(([, o]) => o.attention === "passive") ?? ready[0];
		done.add(id);
		steps.push({ ...renderStep(steps.length + 1, id, op, nodes), dependsOn: [...deps.get(id)!] });
	}
	return steps;
}

function renderStep(n: number, id: string, op: Operation, nodes: Record<string, Node>): Omit<Step, "dependsOn"> {
	const mentions: Step["mentions"] = [];
	const objects = op.inputs.map((i) => renderInput(i, nodes, mentions));
	const tools = (op.tools ?? []).map((t) => `the ${(nodes[t] as { name: string }).name}`);
	let text = capitalise(op.verb.replace(/-/g, op.verb === "stir-fry" ? "-" : " "));
	if (objects.length) {
		text += ` ${list(objects)}`;
		if (tools.length) text += ` using ${list(tools)}`;
	} else if (tools.length) text += ` ${list(tools)}`;
	const p = op.params ?? {};
	if (p.temperature) text += ` ${temperature(p.temperature)}`;
	if (p.duration) text += ` for ${duration(p.duration)}`;
	if (p.until) text += `${p.duration ? "," : ""} until ${p.until}`;
	const made = op.produces.map((x) => (nodes[x] as { name: string }).name);
	if (made.length) text += ` → ${list(made)}`;
	return { n, op: id, attention: op.attention, text: text + ".", note: op.note, mentions, params: op.params, produces: op.produces };
}

function renderInput(i: Input, nodes: Record<string, Node>, mentions: Step["mentions"]): string {
	const node = nodes[i.ref];
	const amount = i.amount ?? "all";
	if (node.kind === "ingredient") {
		const q = scaleQuantity(node.quantity, amount);
		const qs = quantity(q, node.name);
		mentions.push({ ref: i.ref, quantity: qs });
		return `the ${node.name} (${qs})${node.optional ? ", optional" : ""}`;
	}
	const name = (node as { name: string }).name;
	if (amount === "all") return `the ${name}`;
	if (amount === "rest") return `the rest of the ${name}`;
	if ("fraction" in amount) {
		const y = node.kind === "intermediate" && node.yield ? ` (≈ ${quantity(scaleQuantity(node.yield, amount), name)})` : "";
		return `${fraction(amount.fraction)} of the ${name}${y}`;
	}
	return `${quantity(amount.quantity, name)} of the ${name}`;
}

function scaleQuantity(q: Quantity, amount: Input["amount"]): Quantity {
	if (!("unit" in q) || amount === undefined || amount === "all" || amount === "rest") return q;
	if ("quantity" in amount) return amount.quantity;
	const f = amount.fraction;
	const v = typeof q.value === "number" ? q.value * f : { min: q.value.min * f, max: q.value.max * f };
	return { ...q, value: v, source: undefined };
}

export function quantity(q: Quantity, name = ""): string {
	if (!("unit" in q)) return q.unquantified === "to-taste" ? "to taste" : "as needed";
	const m = q as Measured;
	let s: string;
	if (m.unit === "count") {
		s = num(m.value);
		if (m.noun) s += ` ${single(m.value) ? m.noun : plural(m.noun)}`;
		if (m.each) s += ` of ${num(m.each.value)} ${m.each.unit}`;
	} else s = `${num(m.value)} ${m.unit}`;
	if (m.source && m.source.text !== s) s += ` · ${m.source.text}`;
	return s;
}

function num(v: NumberOrRange): string {
	const r = (x: number) => String(Math.round(x * 100) / 100);
	return typeof v === "number" ? r(v) : `${r(v.min)}–${r(v.max)}`;
}
const single = (v: NumberOrRange) => typeof v === "number" && v === 1;
const plural = (w: string) => (/(s|sh|ch|x)$/.test(w) ? w + "es" : w + "s");
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function list(xs: string[]): string {
	return xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}
function fraction(f: number): string {
	const known: [number, string][] = [[0.25, "a quarter"], [1 / 3, "a third"], [0.5, "half"], [0.67, "two thirds"], [2 / 3, "two thirds"], [0.75, "three quarters"]];
	const hit = known.find(([x]) => Math.abs(x - f) < 0.01);
	return hit ? hit[1] : `${Math.round(f * 100)} %`;
}
function duration(d: Duration): string {
	const one = (s: number) => (s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.round((s / 3600) * 10) / 10} h`);
	return typeof d.value === "number" ? one(d.value) : `${one(d.value.min)}–${one(d.value.max)}`;
}
function temperature(t: Temperature): string {
	return "heat" in t ? `over ${t.heat.replace("-", "–")} heat` : `at ${num(t.value)} °C`;
}
