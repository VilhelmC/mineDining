import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { generateSteps, type Recipe } from "@minedining/recipe-spec";
import { laneLayout, order } from "./lanes";
import { plan } from "../cook/scheduler";

const dir = new URL("../../../spec/fixtures/", import.meta.url);
const load = (f: string) => JSON.parse(readFileSync(new URL(f, dir), "utf8")) as Recipe;

describe("lane layout over every fixture", () => {
	for (const f of readdirSync(dir).filter((x) => x.endsWith(".recipe.json"))) {
		it(f, () => {
			const r = load(f);
			const steps = generateSteps(r);
			const p = plan(steps);
			const { rows, lanes } = laneLayout(p.steps, r, p.start);
			expect(rows.length).toBe(steps.length);
			const at = new Map(rows.map((x, i) => [x.step.op, i]));
			for (const [i, x] of rows.entries()) {
				for (const d of x.step.dependsOn) expect(at.get(d)!).toBeLessThan(i); // dependencies above
				// no two lines in one lane on one row
				const occupied = [x.lane, ...x.passing.map((p) => p.lane), ...x.inputs.filter((p) => !p.ends).map((p) => p.lane)];
				const through = [...x.passing.map((p) => p.lane), ...x.inputs.filter((p) => !p.ends).map((p) => p.lane)];
				expect(new Set(through).size).toBe(through.length);
				expect(through).not.toContain(x.lane);
				expect(occupied.every((l) => l < lanes)).toBe(true);
			}
			expect(lanes).toBeLessThanOrEqual(5); // fits a phone with a 16 px lane pitch
		});
	}
});

it("lasagna: branches are contiguous; with a plan, preheat sits where it starts in time", () => {
	const steps = generateSteps(load("lasagna.recipe.json"));
	const ops = order(steps).map((s) => s.op);
	expect(ops.indexOf("bake") - ops.indexOf("preheat-oven")).toBe(1);
	const p = plan(steps);
	const timed = order(p.steps, p.start).map((s) => s.op);
	expect(timed.indexOf("preheat-oven")).toBeLessThan(timed.indexOf("top"));
	expect(ops.indexOf("make-bechamel") - ops.indexOf("make-roux")).toBe(1);
});
