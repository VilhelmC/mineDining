import { Ajv2020 } from "ajv/dist/2020.js";
import { schema } from "./schema.js";
import type { Recipe, Node, Operation, Input, Measured, NumberOrRange } from "./types.js";

export const SUPPORTED_VERSION = "0.1.0";

export interface Issue {
	level: "error" | "warning";
	code: string;
	path: string;
	message: string;
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
const checkStructure = ajv.compile(schema);

const EPS = 1e-6;
const isMaterial = (n: Node | undefined) => n?.kind === "ingredient" || n?.kind === "intermediate";

/** Structural (JSON Schema) then semantic validation. Semantic checks run only if structure passes. */
export function validate(doc: unknown): Issue[] {
	if (!checkStructure(doc)) {
		return focusNodeErrors(doc, checkStructure.errors ?? []).map((e) => ({
			level: "error",
			code: "structure",
			path: e.instancePath || "/",
			message: `${e.message ?? "invalid"}${e.params ? " " + JSON.stringify(e.params) : ""}`,
		}));
	}
	return validateSemantics(doc as unknown as Recipe);
}

export function validateSemantics(r: Recipe): Issue[] {
	const issues: Issue[] = [];
	const err = (code: string, path: string, message: string) => issues.push({ level: "error", code, path, message });
	const warn = (code: string, path: string, message: string) => issues.push({ level: "warning", code, path, message });
	const nodes = r.nodes as Record<string, Node>;
	const ops = Object.entries(nodes).filter((e): e is [string, Operation] => e[1].kind === "operation");

	// 1 · references resolve to the right kind of node
	const expect = (ref: string, path: string, ok: (n: Node | undefined) => boolean, what: string) => {
		if (!(ref in nodes)) err("ref-missing", path, `'${ref}' is not a node`);
		else if (!ok(nodes[ref])) err("ref-kind", path, `'${ref}' must be ${what}, is ${nodes[ref].kind}`);
	};
	for (const [id, op] of ops) {
		op.inputs.forEach((i, k) => expect(i.ref, `/nodes/${id}/inputs/${k}`, isMaterial, "an ingredient or intermediate"));
		op.produces.forEach((p, k) => expect(p, `/nodes/${id}/produces/${k}`, (n) => n?.kind === "intermediate", "an intermediate"));
		(op.tools ?? []).forEach((t, k) => expect(t, `/nodes/${id}/tools/${k}`, (n) => n?.kind === "tool", "a tool"));
		(op.after ?? []).forEach((a, k) => expect(a, `/nodes/${id}/after/${k}`, (n) => n?.kind === "operation", "an operation"));
		if (op.inputs.length > 0 && op.produces.length === 0) err("op-sink", `/nodes/${id}`, "operation consumes materials but produces nothing");
		if (op.inputs.length === 0 && op.produces.length === 0 && (op.tools ?? []).length === 0)
			err("op-empty", `/nodes/${id}`, "operation has no inputs, products or tools");
		const seen = new Set<string>();
		op.inputs.forEach((i, k) => {
			if (seen.has(i.ref)) err("input-duplicate", `/nodes/${id}/inputs/${k}`, `'${i.ref}' listed twice in one operation`);
			seen.add(i.ref);
		});
	}
	const listed = [...r.outputs.map((o) => ["outputs", o] as const), ...(r.byproducts ?? []).map((o) => ["byproducts", o] as const)];
	listed.forEach(([where, o]) => expect(o, `/${where}`, isMaterial, "an ingredient or intermediate"));
	for (const o of r.outputs) if ((r.byproducts ?? []).includes(o)) err("output-byproduct", "/byproducts", `'${o}' is both output and byproduct`);
	if (issues.some((i) => i.level === "error")) return issues;

	// 2 · every intermediate is produced exactly once
	const producer = new Map<string, string[]>();
	for (const [id, op] of ops) for (const p of op.produces) producer.set(p, [...(producer.get(p) ?? []), id]);
	for (const [id, n] of Object.entries(nodes)) {
		if (n.kind !== "intermediate") continue;
		const by = producer.get(id) ?? [];
		if (by.length === 0) err("intermediate-unproduced", `/nodes/${id}`, "no operation produces this intermediate");
		if (by.length > 1) err("intermediate-multi", `/nodes/${id}`, `produced by ${by.join(", ")}`);
	}

	// 3 · acyclic over material + operation + after edges
	const succ = new Map<string, string[]>();
	const edge = (a: string, b: string) => succ.set(a, [...(succ.get(a) ?? []), b]);
	for (const [id, op] of ops) {
		op.inputs.forEach((i) => edge(i.ref, id));
		op.produces.forEach((p) => edge(id, p));
		(op.after ?? []).forEach((a) => edge(a, id));
	}
	const state = new Map<string, 1 | 2>();
	const visit = (v: string, stack: string[]): boolean => {
		if (state.get(v) === 2) return false;
		if (state.get(v) === 1) {
			err("cycle", `/nodes/${v}`, `cycle: ${[...stack.slice(stack.indexOf(v)), v].join(" → ")}`);
			return true;
		}
		state.set(v, 1);
		for (const w of succ.get(v) ?? []) if (visit(w, [...stack, v])) return true;
		state.set(v, 2);
		return false;
	};
	for (const v of Object.keys(nodes)) if (visit(v, [])) break;

	// 4 · consumption: every material is used up, served, or declared a byproduct
	const consumers = new Map<string, { op: string; input: Input }[]>();
	for (const [id, op] of ops) for (const input of op.inputs) consumers.set(input.ref, [...(consumers.get(input.ref) ?? []), { op: id, input }]);
	const terminal = new Set([...r.outputs, ...(r.byproducts ?? [])]);
	for (const [id, n] of Object.entries(nodes)) {
		if (!isMaterial(n)) continue;
		const uses = consumers.get(id) ?? [];
		const path = `/nodes/${id}`;
		if (terminal.has(id)) {
			if (uses.length) err("terminal-consumed", path, "outputs and byproducts must not also be consumed");
			continue;
		}
		if (uses.length === 0) {
			err("unused", path, `${n.kind} is never consumed and is not an output or byproduct`);
			continue;
		}
		const amt = (u: { input: Input }) => u.input.amount ?? "all";
		const whole = uses.filter((u) => amt(u) === "all");
		const rest = uses.filter((u) => amt(u) === "rest");
		const fractions = uses.map((u) => amt(u)).filter((a): a is { fraction: number } => typeof a === "object" && "fraction" in a);
		const quantities = uses.map((u) => amt(u)).filter((a): a is { quantity: Measured } => typeof a === "object" && "quantity" in a);
		if (uses.length > 1 && whole.length) err("split-ambiguous", path, `used by ${uses.map((u) => u.op).join(", ")}; each use needs a fraction, quantity or "rest"`);
		if (rest.length > 1) err("split-rest", path, `"rest" used ${rest.length} times`);
		const fsum = fractions.reduce((s, f) => s + f.fraction, 0);
		if (fsum > 1 + EPS) err("split-over", path, `fractions sum to ${fsum.toFixed(3)} > 1`);
		if (rest.length === 0 && whole.length === 0 && quantities.length === 0 && fsum < 1 - EPS)
			warn("split-under", path, `fractions sum to ${fsum.toFixed(3)}; the remainder is never used`);
		const total = totalOf(n);
		if (quantities.length && total) {
			const qsum = quantities.reduce((s, q) => s + (q.quantity.unit === total.unit ? hi(q.quantity.value) : NaN), 0);
			if (Number.isNaN(qsum)) warn("split-units", path, "quantity uses differ in unit from the material; cannot check the sum");
			else if (qsum + fsum * hi(total.value) > hi(total.value) + EPS) err("split-over", path, "uses exceed the available amount");
		}
	}

	// 5 · tools used, after-only operations referenced, ranges ordered, 'each' only on counts
	const usedTools = new Set(ops.flatMap(([, op]) => op.tools ?? []));
	const afterTargets = new Set(ops.flatMap(([, op]) => op.after ?? []));
	for (const [id, n] of Object.entries(nodes)) {
		if (n.kind === "tool" && !usedTools.has(id)) warn("tool-unused", `/nodes/${id}`, "tool is not used by any operation");
		if (n.kind === "operation" && n.inputs.length === 0 && n.produces.length === 0 && !afterTargets.has(id))
			warn("op-unanchored", `/nodes/${id}`, "operation has no materials and no operation waits for it (use 'after')");
	}
	walkRanges(r, "", (path) => err("range", path, "min must not exceed max"));
	for (const [id, n] of Object.entries(nodes))
		if (n.kind === "ingredient" && "unit" in n.quantity && n.quantity.each && n.quantity.unit !== "count")
			err("each-not-count", `/nodes/${id}/quantity`, "'each' is only allowed with unit 'count'");
	return issues;
}

const hi = (v: NumberOrRange) => (typeof v === "number" ? v : v.max);

function totalOf(n: Node): Measured | undefined {
	if (n.kind === "ingredient" && "unit" in n.quantity) return n.quantity;
	if (n.kind === "intermediate") return n.yield;
	return undefined;
}

function walkRanges(v: unknown, path: string, bad: (path: string) => void): void {
	if (Array.isArray(v)) v.forEach((x, i) => walkRanges(x, `${path}/${i}`, bad));
	else if (v && typeof v === "object") {
		const o = v as Record<string, unknown>;
		if (typeof o.min === "number" && typeof o.max === "number" && o.min > o.max) bad(path);
		for (const [k, x] of Object.entries(o)) walkRanges(x, `${path}/${k}`, bad);
	}
}

const KIND_DEF: Record<string, string> = { ingredient: "Ingredient", tool: "Tool", intermediate: "Intermediate", operation: "Operation" };

/**
 * A node that fails its oneOf reports errors from every branch. Keep, at the node's own level,
 * only errors from the definition its `kind` names; deeper errors are kept as they are.
 */
function focusNodeErrors(doc: unknown, errors: NonNullable<typeof checkStructure.errors>) {
	const nodes = (doc as { nodes?: Record<string, { kind?: string }> })?.nodes ?? {};
	const kept = errors.filter((e) => {
		const m = /^\/nodes\/([^/]+)(\/kind)?$/.exec(e.instancePath);
		const def = m ? KIND_DEF[nodes[m[1]]?.kind ?? ""] : undefined;
		if (!def) return true;
		if (e.schemaPath === "#/$defs/Node/oneOf") return false;
		return e.schemaPath.startsWith(`#/$defs/${def}/`);
	});
	return kept.length ? kept : errors;
}
