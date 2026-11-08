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
		const fg = S.foreground(steps, s, t);
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
	produces: [`${op}-out`],
	params: duration === undefined ? undefined : { duration: { value: duration, unit: "s" } },
});

describe("scheduler rules", () => {
	const steps = [step("boil", "passive", [], 600), step("chop", "active"), step("fry", "active", ["chop"]), step("plate", "active", ["boil", "fry"])];

	it("suggests passive work first, then generator order", () => {
		const s = S.newState("x", 0);
		expect(S.queue(steps, s, 0).map((x) => x.op)).toEqual(["boil", "chop"]);
		expect(S.foreground(steps, s, 0)?.op).toBe("boil");
	});

	it("a started passive step runs in the background while active work continues", () => {
		let s = S.start(S.newState("x", 0), "boil", 0);
		expect(S.statusOf(steps[0], s)).toBe("running");
		expect(S.foreground(steps, s, 0)?.op).toBe("chop");
		s = S.done(s, "chop", 1000);
		expect(S.foreground(steps, s, 0)?.op).toBe("fry");
		s = S.done(s, "fry", 2000);
		expect(S.foreground(steps, s, 0)).toBeUndefined(); // waiting on boil
		expect(S.statusOf(steps[3], s)).toBe("blocked");
		s = S.done(s, "boil", 3000);
		expect(S.foreground(steps, s, 0)?.op).toBe("plate");
	});

	it("focus overrides the suggestion while the chosen step is ready", () => {
		const s = S.focus(S.newState("x", 0), "chop");
		expect(S.foreground(steps, s, 0)?.op).toBe("chop");
		expect(S.foreground(steps, S.focus(s, "fry"), 0)?.op).toBe("boil"); // fry is blocked
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

	it("a prep step starts at its latest start: dependent's start minus its duration", () => {
		const prep: Step = { ...step("preheat", "passive", [], 600), produces: [] };
		// three 5-min active steps before bake: bake can start in 15 min; preheat takes 10 → due after 5 min
		const r = [prep, step("a", "active", [], 300), step("b", "active", ["a"], 300), step("c", "active", ["b"], 300), step("bake", "passive", ["c", "preheat"], 1800)];
		let s = S.newState("x", 0);
		expect(S.foreground(r, s, 0)?.op).toBe("a");
		expect(S.queue(r, s, 0).map((x) => x.op)).toEqual(["a", "preheat"]); // offered, last
		s = S.start(s, "a", 0);
		expect(S.prepDue(prep, r, s, 299_000)).toBe(false);
		expect(S.foreground(r, s, 299_000)?.op).toBe("a"); // a is under way: not snatched
		s = S.done(s, "a", 300_000);
		expect(S.prepDue(prep, r, s, 300_000)).toBe(true);
		expect(S.foreground(r, s, 300_000)?.op).toBe("preheat");
		expect(S.dueAlerts(r, s, 300_000)).toContainEqual({ op: "preheat", kind: "start" });
	});

	it("a running timer counts: preheat waits for a long simmer", () => {
		const prep: Step = { ...step("preheat", "passive", [], 900), produces: [] };
		const r = [prep, step("simmer", "passive", [], 1800), step("bake", "passive", ["simmer", "preheat"], 1800)];
		const s = S.start(S.newState("x", 0), "simmer", 0);
		expect(S.foreground(r, s, 0)).toBeUndefined(); // waiting; preheat not yet due
		expect(S.foreground(r, s, 900_000)?.op).toBe("preheat"); // 15 min left = preheat time
	});

	it("plan: lasagna preheats 15 min before baking can start", () => {
		const p = S.plan(generateSteps(load("lasagna.recipe.json")));
		const bake = p.start.get("bake")!;
		const pre = p.start.get("preheat-oven")!;
		expect(bake - pre).toBeGreaterThanOrEqual(900);
		expect(bake - pre).toBeLessThan(900 + 300); // no more than one untimed step early
		expect(p.steps.map((s) => s.n)).toEqual(p.steps.map((_, i) => i + 1));
		expect(p.estimated).toBe(true);
	});

	it("lasagna: preheat is not suggested first", () => {
		const steps = generateSteps(load("lasagna.recipe.json"));
		expect(S.foreground(steps, S.newState("x", 0), 0)?.op).not.toBe("preheat-oven");
	});

	it("until-only passive: stopwatch, no alerts", () => {
		const r = [step("reduce", "passive")];
		const s = S.start(S.newState("x", 0), "reduce", 0);
		expect(S.timer(r[0], s, 90_000)).toMatchObject({ kind: "stopwatch", elapsed: 90 });
		expect(S.dueAlerts(r, s, 10_000_000)).toEqual([]);
	});

	it("check cascades to prerequisites; uncheck cascades to dependents", () => {
		let s = S.check(steps, S.newState("x", 0), "plate", 5);
		expect(steps.every((x) => S.statusOf(x, s) === "done")).toBe(true);
		s = S.uncheck(steps, s, "chop");
		expect(["chop", "fry", "plate"].map((o) => S.statusOf(steps.find((x) => x.op === o)!, s))).toEqual(["ready", "blocked", "blocked"]);
		expect(S.statusOf(steps[0], s)).toBe("done"); // boil untouched
	});

	it("done steps raise no alerts; undo restores", () => {
		let s = S.done(S.start(S.newState("x", 0), "boil", 0), "boil", 100);
		expect(S.dueAlerts(steps, s, 10_000_000)).toEqual([]);
		s = S.undone(s, "boil");
		expect(S.statusOf(steps[0], s)).toBe("running");
	});
});
