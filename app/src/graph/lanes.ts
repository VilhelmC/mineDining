import type { Operation, Recipe, Step } from "@minedining/recipe-spec";

/**
 * Lane layout: one row per operation, top to bottom; each operation's result
 * travels down a vertical lane in a left gutter until its last consumer, as
 * in `git log --graph`. Width grows with the number of branches open at once,
 * not with the recipe, so it fits a phone.
 *
 * Row order: depth-first from the final operations, dependencies before
 * dependents, in the order the recipe lists them. A branch is drawn as a
 * contiguous block (all of the ragù, then all of the béchamel), and a step
 * needed only late (preheat) lands just above the step that waits for it.
 */

export interface LaneIn {
	op: string;
	lane: number;
	/** Ordering only (`after`), no material: drawn dashed. */
	dashed: boolean;
	/** This row is the input's last consumer: its lane stops here. */
	ends: boolean;
}

export interface LaneRow {
	step: Step;
	lane: number;
	inputs: LaneIn[];
	/** Lanes passing straight through this row (results on their way to a later row). */
	passing: { lane: number; dashed: boolean }[];
	/** This row's own lane continues down to a later consumer. */
	continues: boolean;
	/** Own lane is ordering-only (prep step): drawn dashed. */
	dashed: boolean;
}

export interface LaneLayout {
	rows: LaneRow[];
	lanes: number;
}

export function order(steps: Step[]): Step[] {
	const byOp = new Map(steps.map((s) => [s.op, s]));
	const used = new Set(steps.flatMap((s) => s.dependsOn));
	const out: Step[] = [];
	const seen = new Set<string>();
	const visit = (s: Step) => {
		if (seen.has(s.op)) return;
		seen.add(s.op);
		for (const d of s.dependsOn) visit(byOp.get(d)!);
		out.push(s);
	};
	for (const s of steps) if (!used.has(s.op)) visit(s);
	for (const s of steps) visit(s); // unreachable from a final step: should not happen in a valid recipe
	return out;
}

export function laneLayout(steps: Step[], r: Recipe): LaneLayout {
	const rows = order(steps);
	const rowOf = new Map(rows.map((s, i) => [s.op, i]));
	const lastUse = new Map<string, number>();
	for (const s of rows) for (const d of s.dependsOn) lastUse.set(d, Math.max(lastUse.get(d) ?? -1, rowOf.get(s.op)!));
	const isAfter = (consumer: string, dep: string) => {
		const op = r.nodes[consumer] as Operation;
		return (op.after ?? []).includes(dep) && !op.inputs.some((i) => (r.nodes[dep] as Operation).produces.includes(i.ref));
	};
	const busyUntil: number[] = []; // lane → last row it is occupied
	const laneOf = new Map<string, number>();
	const out: LaneRow[] = [];
	rows.forEach((s, row) => {
		const inputs: LaneIn[] = s.dependsOn.map((d) => ({ op: d, lane: laneOf.get(d)!, dashed: isAfter(s.op, d), ends: lastUse.get(d) === row }));
		const reuse = inputs.find((i) => i.ends && !i.dashed) ?? inputs.find((i) => i.ends);
		let lane = reuse?.lane ?? -1;
		if (lane < 0) {
			lane = busyUntil.findIndex((u) => u < row);
			if (lane < 0) lane = busyUntil.length;
		}
		const until = lastUse.get(s.op) ?? row;
		busyUntil[lane] = until;
		laneOf.set(s.op, lane);
		const inputOps = new Set(s.dependsOn);
		const passing = rows
			.slice(0, row)
			.filter((p) => !inputOps.has(p.op) && (lastUse.get(p.op) ?? -1) > row)
			.map((p) => ({ lane: laneOf.get(p.op)!, dashed: rows.slice(row + 1).every((c) => !c.dependsOn.includes(p.op) || isAfter(c.op, p.op)) }));
		const dashedOwn = s.produces.length === 0;
		out.push({ step: s, lane, inputs, passing, continues: until > row, dashed: dashedOwn });
	});
	return { rows: out, lanes: Math.max(1, busyUntil.length) };
}
