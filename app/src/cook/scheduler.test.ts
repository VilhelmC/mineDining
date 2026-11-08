import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { generateSteps, validate, type Recipe, type Step } from "@minedining/recipe-spec";
import * as S from "./scheduler";

const dir = new URL("../../../spec/fixtures/", import.meta.url);
const fixtures = readdirSync(dir).filter((f) => f.endsWith(".recipe.json"));
const load = (f: string) => JSON.parse(readFileSync(new URL(f, dir), "utf8")) as Recipe;

/** Drive a whole recipe: start every passive step, finish whatever is foreground or running. */
function cookThrough(steps: Step[]) {
	let s = S.newState("x", 0);
	let t = 0;
	for (let guard = 0; guard < 1000 && !S.finished(steps, s); guard++) {
		t += 1000;
		const fg = S.foreground(steps, s);
		if (fg?.attention === "passive") s = S.start(s, fg.op, t);
		else if (fg) s = S.done(s, fg.op, t);
		else {
			const r = S.running(steps, s);
			expect(r.length).toBeGreaterThan(0); // never stuck: something is ready or running
			s = S.done(s, r[0].op, t);
		}
		for (const st of steps) {
			const status = S.statusOf(st, s);
			if (status === "done" || status === "running") for (const d of st.dependsOn) expect(S.statusOf(steps.find((x) => x.op === d)!, s)).toBe("done");
		}
	}
	return s;
}

describe("scheduler over every fixture", () => {
	for (const f of fixtures) {
		it(`${f}: valid, completes, respects dependsOn`, () => {
			const r = load(f);
			expect(validate(r).filter((i) => i.level === "error")).toEqual([]);
			const steps = generateSteps(r);
			expect(S.finished(steps, cookThrough(steps))).toBe(true);
		});
	}
});

const step = (op: string, attention: Step["attention"], dependsOn: string[] = [], duration?: number | { min: number; max: number }): Step => ({
	n: 0,
	op,
	attention,
	text: op,
	mentions: [],
	dependsOn,
	produces: [],
	params: duration === undefined ? undefined : { duration: { value: duration, unit: "s" } },
});

describe("scheduler rules", () => {
	const steps = [step("boil", "passive", [], 600), step("chop", "active"), step("fry", "active", ["chop"]), step("plate", "active", ["boil", "fry"])];

	it("suggests passive work first, then generator order", () => {
		const s = S.newState("x", 0);
		expect(S.queue(steps, s).map((x) => x.op)).toEqual(["boil", "chop"]);
		expect(S.foreground(steps, s)?.op).toBe("boil");
	});

	it("a started passive step runs in the background while active work continues", () => {
		let s = S.start(S.newState("x", 0), "boil", 0);
		expect(S.statusOf(steps[0], s)).toBe("running");
		expect(S.foreground(steps, s)?.op).toBe("chop");
		s = S.done(s, "chop", 1000);
		expect(S.foreground(steps, s)?.op).toBe("fry");
		s = S.done(s, "fry", 2000);
		expect(S.foreground(steps, s)).toBeUndefined(); // waiting on boil
		expect(S.statusOf(steps[3], s)).toBe("blocked");
		s = S.done(s, "boil", 3000);
		expect(S.foreground(steps, s)?.op).toBe("plate");
	});

	it("focus overrides the suggestion while the chosen step is ready", () => {
		const s = S.focus(S.newState("x", 0), "chop");
		expect(S.foreground(steps, s)?.op).toBe("chop");
		expect(S.foreground(steps, S.focus(s, "fry"))?.op).toBe("boil"); // fry is blocked
	});

	it("fixed duration: one end alert, wall-clock based", () => {
		let s = S.start(S.newState("x", 0), "boil", 0);
		expect(S.dueAlerts(steps, s, 599_000)).toEqual([]);
		expect(S.dueAlerts(steps, s, 3_600_000)).toEqual([{ op: "boil", kind: "end" }]); // long suspension: still fires once on return
		s = S.markFired(s, S.dueAlerts(steps, s, 600_000));
		expect(S.dueAlerts(steps, s, 700_000)).toEqual([]);
		const t = S.timer(steps[0], s, 660_000)!;
		expect(t.overdue).toBe(true);
	});

	it("range: check alert at min, end alert at max", () => {
		const r = [step("bake", "passive", [], { min: 1200, max: 1500 })];
		let s = S.start(S.newState("x", 0), "bake", 0);
		expect(S.dueAlerts(r, s, 1_199_000)).toEqual([]);
		const atMin = S.dueAlerts(r, s, 1_200_000);
		expect(atMin).toEqual([{ op: "bake", kind: "check" }]);
		s = S.markFired(s, atMin);
		const t = S.timer(r[0], s, 1_300_000)!;
		expect(t.inWindow).toBe(true);
		expect(t.remaining).toBe(200);
		expect(S.dueAlerts(r, s, 1_500_000)).toEqual([{ op: "bake", kind: "end" }]);
	});

	it("until-only passive: stopwatch, no alerts", () => {
		const r = [step("reduce", "passive")];
		const s = S.start(S.newState("x", 0), "reduce", 0);
		expect(S.timer(r[0], s, 90_000)).toMatchObject({ kind: "stopwatch", elapsed: 90 });
		expect(S.dueAlerts(r, s, 10_000_000)).toEqual([]);
	});

	it("done steps raise no alerts; undo restores", () => {
		let s = S.done(S.start(S.newState("x", 0), "boil", 0), "boil", 100);
		expect(S.dueAlerts(steps, s, 10_000_000)).toEqual([]);
		s = S.undone(s, "boil");
		expect(S.statusOf(steps[0], s)).toBe("running");
	});
});
