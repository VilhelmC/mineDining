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
 * Tool conflicts (two running steps on one pan) are not checked (spec §9 q2).
 */

export type Status = "blocked" | "ready" | "running" | "done";
export type AlertKind = "check" | "end";

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

/** Ready (not yet started) steps, in suggestion order: passive first, then generator order. */
export function queue(steps: Step[], state: CookState): Step[] {
	const ready = steps.filter((s) => statusOf(s, state) === "ready");
	return [...ready.filter((s) => s.attention === "passive"), ...ready.filter((s) => s.attention === "active")];
}

export const running = (steps: Step[], state: CookState) => steps.filter((s) => statusOf(s, state) === "running");

/** The step in the foreground: the cook's choice if still ready, else the first suggestion. */
export function foreground(steps: Step[], state: CookState): Step | undefined {
	const q = queue(steps, state);
	return q.find((s) => s.op === state.focus) ?? q[0];
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
	return out;
}

// --- transitions (return a new state) ---

const put = (state: CookState, op: string, patch: Partial<OpState>): CookState => ({
	...state,
	ops: { ...state.ops, [op]: { ...state.ops[op], ...patch } },
});

/** Start a step's clock (passive: it moves to the background; active: its timer starts). Idempotent. */
export const start = (state: CookState, op: string, now: number) => (state.ops[op]?.startedAt !== undefined ? state : put(state, op, { startedAt: now, fired: [] }));

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

export function markFired(state: CookState, due: Due[]): CookState {
	let s = state;
	for (const d of due) s = put(s, d.op, { fired: [...(s.ops[d.op]?.fired ?? []), d.kind] });
	return s;
}
