import type { Step } from "@minedining/recipe-spec";

/**
 * Live scheduler for cooking mode. Pure: (steps, state, now) → what to show.
 *
 * A step is READY when every step in its dependsOn is done. generateSteps()
 * gives one linear order; here the cook may run several steps at once:
 *  - passive steps are STARTED (they then run in the background tray) and
 *    marked done by the cook when the `until` criterion or the timer says so;
 *  - active steps are worked one at a time in the foreground.
 * Among ready steps the foreground suggests passive ones first (start long
 * waits early), then generator order — the same rule as generateSteps().
 *
 * Timers come from params.duration and are keyed to wall-clock start times,
 * so they survive the tab being suspended:
 *  - fixed duration d → one "end" alert at d;
 *  - range {min,max}  → a "check" alert at min and an "end" alert at max;
 *  - no duration      → a stopwatch (elapsed), no alert; the cook taps Done.
 * Steps never complete by themselves: dependents unlock when the cook taps Done.
 * Prep steps (preheat: no inputs, no products) start at their LATEST start:
 * when the estimated time until the step waiting on them can begin is no
 * more than their own duration. The estimate is the larger of
 *  - the critical path: finish times through the graph, using live timers;
 *  - the cook's remaining hands-on work: one cook does active steps in series.
 * Untimed steps count ACTIVE_DEFAULT / PASSIVE_DEFAULT seconds (estimates).
 * Tool conflicts (two running steps on one pan) are not checked (spec §9 q2).
 */

export type Status = "blocked" | "ready" | "running" | "done";
export type AlertKind = "check" | "end" | "start";

export interface OpState {
	/** Wall-clock ms. Passive: when the cook pressed Start. Active: when the step was first shown. */
	startedAt?: number;
	doneAt?: number;
	fired?: AlertKind[];
}

export interface CookState {
	version: 1;
	recipeId: string;
	startedAt: number;
	ops: Record<string, OpState>;
	/** Step the cook chose to bring to the foreground, overriding the suggestion. */
	focus?: string;
}

export interface Timer {
	kind: "countdown" | "stopwatch";
	/** Seconds since start. */
	elapsed: number;
	/** Countdown only: the next target in seconds (min, then max for a range). */
	target?: number;
	/** Countdown only: seconds to the next target; negative when past the last one. */
	remaining?: number;
	/** Past the last target. */
	overdue: boolean;
	/** Range only: past min, before max. */
	inWindow: boolean;
}

export interface Due {
	op: string;
	kind: AlertKind;
}

export const newState = (recipeId: string, now: number): CookState => ({ version: 1, recipeId, startedAt: now, ops: {} });

export function statusOf(step: Step, state: CookState): Status {
	const s = state.ops[step.op];
	if (s?.doneAt !== undefined) return "done";
	if (!step.dependsOn.every((d) => state.ops[d]?.doneAt !== undefined)) return "blocked";
	if (step.attention === "passive" && s?.startedAt !== undefined) return "running";
	return "ready";
}

/** Alert points in seconds from start. */
export function targets(step: Step): { kind: AlertKind; at: number }[] {
	const d = step.params?.duration;
	if (!d) return [];
	if (typeof d.value === "number") return [{ kind: "end", at: d.value }];
	return [
		{ kind: "check", at: d.value.min },
		{ kind: "end", at: d.value.max },
	];
}

export function timer(step: Step, state: CookState, now: number): Timer | undefined {
	const started = state.ops[step.op]?.startedAt;
	if (started === undefined) return undefined;
	const elapsed = (now - started) / 1000;
	const t = targets(step);
	if (!t.length) return { kind: "stopwatch", elapsed, overdue: false, inWindow: false };
	const next = t.find((x) => x.at > elapsed) ?? t[t.length - 1];
	const last = t[t.length - 1].at;
	return {
		kind: "countdown",
		elapsed,
		target: next.at,
		remaining: next.at - elapsed,
		overdue: elapsed >= last,
		inWindow: t.length > 1 && elapsed >= t[0].at && elapsed < last,
	};
}

/**
 * A preparation step consumes and produces nothing (preheat the oven): it only
 * has to be finished before the steps that wait on it through `after`.
 */
export const isPrep = (s: Step) => s.dependsOn.length === 0 && s.produces.length === 0;

/** Estimates for steps without a duration (seconds). */
export const ACTIVE_DEFAULT = 300;
export const PASSIVE_DEFAULT = 600;

/** Duration in seconds; `bound` picks the end of a range. Untimed steps get a default. */
export function seconds(s: Step, bound: "min" | "max" = "min"): { s: number; estimated: boolean } {
	const d = s.params?.duration;
	if (!d) return { s: s.attention === "active" ? ACTIVE_DEFAULT : PASSIVE_DEFAULT, estimated: true };
	return { s: typeof d.value === "number" ? d.value : d.value[bound], estimated: false };
}

/** Estimated seconds from `now` until `dep` can start, ignoring prep steps (the ones being placed). */
export function startsIn(dep: Step, steps: Step[], state: CookState, now: number): number {
	const byOp = new Map(steps.map((s) => [s.op, s]));
	const finish = new Map<string, number>();
	const fin = (op: string): number => {
		const hit = finish.get(op);
		if (hit !== undefined) return hit;
		const s = byOp.get(op)!;
		const o = state.ops[op];
		const d = seconds(s).s * 1000;
		let f: number;
		if (o?.doneAt !== undefined) f = now;
		else if (o?.startedAt !== undefined) f = Math.max(now, o.startedAt + d);
		else f = Math.max(now, ...s.dependsOn.filter((x) => !isPrep(byOp.get(x)!)).map(fin)) + d;
		finish.set(op, f);
		return f;
	};
	const deps = dep.dependsOn.filter((x) => !isPrep(byOp.get(x)!));
	const critical = Math.max(now, ...deps.map(fin));
	// hands-on work still to do before dep: every unfinished active ancestor, in series
	const seen = new Set<string>();
	const walk = (op: string) => {
		for (const a of byOp.get(op)!.dependsOn) if (!seen.has(a) && !isPrep(byOp.get(a)!)) (seen.add(a), walk(a));
	};
	walk(dep.op);
	let work = 0;
	for (const a of seen) {
		const s = byOp.get(a)!;
		const o = state.ops[a];
		if (s.attention !== "active" || o?.doneAt !== undefined) continue;
		const d = seconds(s).s * 1000;
		work += o?.startedAt !== undefined ? Math.max(0, o.startedAt + d - now) : d;
	}
	return (Math.max(critical, now + work) - now) / 1000;
}

/** A prep step is due once some step waiting on it could start within the prep's own duration. */
export function prepDue(prep: Step, steps: Step[], state: CookState, now: number): boolean {
	const need = seconds(prep, "max").s;
	return steps.some((d) => d.dependsOn.includes(prep.op) && startsIn(d, steps, state, now) <= need);
}

/**
 * Ready (not yet started) steps, in suggestion order: passive first, then
 * generator order. Prep steps that are not yet due go last (still offered).
 */
export function queue(steps: Step[], state: CookState, now: number): Step[] {
	const ready = steps.filter((s) => statusOf(s, state) === "ready");
	const early = (s: Step) => isPrep(s) && !prepDue(s, steps, state, now);
	const go = ready.filter((s) => !early(s));
	return [...go.filter((s) => s.attention === "passive"), ...go.filter((s) => s.attention === "active"), ...ready.filter(early)];
}

export const running = (steps: Step[], state: CookState) => steps.filter((s) => statusOf(s, state) === "running");

/**
 * The step in the foreground: the cook's choice if still ready; else an active
 * step already under way (a prep step falling due must not snatch the screen
 * mid-chop); else the first suggestion. A prep step not yet due is never
 * suggested: with nothing else to do the cook waits, and the prep stays offered.
 */
export function foreground(steps: Step[], state: CookState, now: number): Step | undefined {
	const q = queue(steps, state, now);
	const chosen = q.find((s) => s.op === state.focus);
	if (chosen) return chosen;
	const underway = q.find((s) => s.attention === "active" && state.ops[s.op]?.startedAt !== undefined);
	if (underway) return underway;
	const first = q[0];
	return first && !(isPrep(first) && !prepDue(first, steps, state, now)) ? first : undefined;
}

export const finished = (steps: Step[], state: CookState) => steps.every((s) => state.ops[s.op]?.doneAt !== undefined);

/** Alerts whose time has come and that have not fired yet. Only started, unfinished steps. */
export function dueAlerts(steps: Step[], state: CookState, now: number): Due[] {
	const out: Due[] = [];
	for (const s of steps) {
		const o = state.ops[s.op];
		if (o?.startedAt === undefined || o.doneAt !== undefined) continue;
		const elapsed = (now - o.startedAt) / 1000;
		for (const t of targets(s)) if (elapsed >= t.at && !o.fired?.includes(t.kind)) out.push({ op: s.op, kind: t.kind });
	}
	// "start now" for prep steps that fell due and have not been started
	for (const s of steps) {
		const o = state.ops[s.op];
		if (isPrep(s) && statusOf(s, state) === "ready" && !o?.fired?.includes("start") && prepDue(s, steps, state, now)) out.push({ op: s.op, kind: "start" });
	}
	return out;
}

// --- transitions (return a new state) ---

const put = (state: CookState, op: string, patch: Partial<OpState>): CookState => ({
	...state,
	ops: { ...state.ops, [op]: { ...state.ops[op], ...patch } },
});

/** Start a step's clock (passive: it moves to the background; active: its timer starts). Idempotent. */
export const start = (state: CookState, op: string, now: number) =>
	state.ops[op]?.startedAt !== undefined ? state : put(state, op, { startedAt: now, fired: (state.ops[op]?.fired ?? []).filter((k) => k === "start") });

export const restart = (state: CookState, op: string, now: number) => put(state, op, { startedAt: now, fired: [] });

export function done(state: CookState, op: string, now: number): CookState {
	const s = put(state, op, { doneAt: now, startedAt: state.ops[op]?.startedAt ?? now });
	return s.focus === op ? { ...s, focus: undefined } : s;
}

/** Undo a Done (mis-tap). Dependents that were started stay started. */
export function undone(state: CookState, op: string): CookState {
	const { doneAt: _, ...rest } = state.ops[op] ?? {};
	return { ...state, ops: { ...state.ops, [op]: rest } };
}

export const focus = (state: CookState, op: string | undefined): CookState => ({ ...state, focus: op });

function closure(steps: Step[], op: string, next: (s: Step) => string[]): Set<string> {
	const byOp = new Map(steps.map((s) => [s.op, s]));
	const out = new Set<string>();
	const walk = (o: string) => {
		for (const x of next(byOp.get(o)!)) if (!out.has(x)) (out.add(x), walk(x));
	};
	walk(op);
	return out;
}
export const ancestors = (steps: Step[], op: string) => closure(steps, op, (s) => s.dependsOn);
export const descendants = (steps: Step[], op: string) => closure(steps, op, (s) => steps.filter((d) => d.dependsOn.includes(s.op)).map((d) => d.op));

/** Tick a step off by hand: it and every unfinished prerequisite are done. */
export function check(steps: Step[], state: CookState, op: string, now: number): CookState {
	let s = state;
	for (const o of [...ancestors(steps, op), op]) if (s.ops[o]?.doneAt === undefined) s = done(s, o, now);
	return s;
}

/** Untick by hand: it and every step built on it are not done. */
export function uncheck(steps: Step[], state: CookState, op: string): CookState {
	let s = state;
	for (const o of [op, ...descendants(steps, op)]) if (s.ops[o]?.doneAt !== undefined) s = undone(s, o);
	return s;
}

export function markFired(state: CookState, due: Due[]): CookState {
	let s = state;
	for (const d of due) s = put(s, d.op, { fired: [...(s.ops[d.op]?.fired ?? []), d.kind] });
	return s;
}

// --- plan: the schedule cook mode would suggest, simulated on a virtual clock ---

export interface Plan {
	/** Steps in planned start order, renumbered 1..n. */
	steps: Step[];
	/** Planned start, seconds from the beginning. */
	start: Map<string, number>;
	/** Estimated total time, seconds. */
	total: number;
	/** Some step durations were defaults, not from the recipe. */
	estimated: boolean;
}

export function plan(steps: Step[]): Plan {
	let s = newState("plan", 0);
	let t = 0;
	const start = new Map<string, number>();
	const tick = 30_000;
	for (let guard = 0; guard < 100_000 && !finished(steps, s); guard++) {
		const fg = foreground(steps, s, t);
		if (fg) {
			start.set(fg.op, t / 1000);
			s = start_(s, fg.op, t);
			if (fg.attention === "active") {
				t += seconds(fg).s * 1000;
				s = done(s, fg.op, t);
			}
			continue;
		}
		const run = running(steps, s);
		const next = Math.min(...run.map((r) => s.ops[r.op].startedAt! + seconds(r).s * 1000));
		if (run.length && next <= t) {
			const r = run.find((x) => s.ops[x.op].startedAt! + seconds(x).s * 1000 === next)!;
			s = done(s, r.op, t);
		} else t = run.length ? Math.min(next, t + tick) : t + tick; // wake for a prep falling due
	}
	const order = [...steps].sort((a, b) => start.get(a.op)! - start.get(b.op)! || a.n - b.n).map((x, i) => ({ ...x, n: i + 1 }));
	return { steps: order, start, total: t / 1000, estimated: steps.some((x) => seconds(x).estimated) };
}
const start_ = (st: CookState, op: string, now: number) => start(st, op, now);
