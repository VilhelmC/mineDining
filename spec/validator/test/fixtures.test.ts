import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { validate, SUPPORTED_VERSION } from "../src/validate.js";
import { generateSteps } from "../src/instructions.js";
import type { Recipe } from "../src/types.js";

const dir = new URL("../../../fixtures/", import.meta.url);
const load = (f: string): Recipe => JSON.parse(readFileSync(new URL(f, dir), "utf-8"));
const files = readdirSync(dir).filter((f) => f.endsWith(".recipe.json"));
const codes = (r: unknown) => validate(r).filter((i) => i.level === "error").map((i) => i.code);

test("there are fixtures", () => assert.ok(files.length >= 5));

for (const f of files) {
	test(`${f} validates without errors or warnings`, () => assert.deepEqual(validate(load(f)), []));

	test(`${f}: nothing implicit — every ingredient mention carries its quantity`, () => {
		const r = load(f);
		const steps = generateSteps(r);
		const ops = Object.values(r.nodes).filter((n) => n.kind === "operation");
		assert.equal(steps.length, ops.length);
		for (const s of steps) {
			const op = r.nodes[s.op];
			assert.ok(op.kind === "operation");
			for (const input of op.inputs) {
				const node = r.nodes[input.ref];
				if (node.kind !== "ingredient") continue;
				const m = s.mentions.find((x) => x.ref === input.ref);
				assert.ok(m && m.quantity.length > 0, `step ${s.n} mentions ${input.ref} without a quantity`);
				assert.ok(s.text.includes(`the ${node.name} (${m.quantity})`), `step ${s.n}: "${s.text}"`);
			}
		}
	});
}

test("passive operations are started early (rice before the stir-fry prep)", () => {
	const steps = generateSteps(load("stir-fry-with-rice.recipe.json"));
	const at = (op: string) => steps.findIndex((s) => s.op === op);
	assert.ok(at("cook-rice") < at("slice-chicken"));
});

test("a shared intermediate is split by fraction and rest", () => {
	const text = generateSteps(load("lasagna.recipe.json")).map((s) => s.text).join("\n");
	assert.match(text, /two thirds of the béchamel/);
	assert.match(text, /the rest of the béchamel/);
});

const crepes = () => load("crepes.recipe.json") as any;

test("rejects: wrong schema version", () => {
	const r = crepes();
	r.schemaVersion = "0.0.9";
	assert.deepEqual([...new Set(codes(r))], ["structure"]);
});
test("rejects: dangling reference", () => {
	const r = crepes();
	r.nodes["whisk-batter"].inputs.push({ ref: "sugar" });
	assert.ok(codes(r).includes("ref-missing"));
});
test("rejects: cycle", () => {
	const r = crepes();
	r.nodes["whisk-batter"].inputs.push({ ref: "rested-batter", amount: { fraction: 0.1 } });
	r.nodes["cook-crepes"].inputs[0].amount = "rest";
	assert.ok(codes(r).includes("cycle"));
});
test("rejects: unused ingredient", () => {
	const r = crepes();
	r.nodes["sugar"] = { kind: "ingredient", name: "sugar", quantity: { value: 10, unit: "g" } };
	assert.ok(codes(r).includes("unused"));
});
test("rejects: two whole uses of one material", () => {
	const r = crepes();
	r.nodes["melt-butter"].inputs.push({ ref: "milk" });
	assert.ok(codes(r).includes("split-ambiguous"));
});
test("rejects: intermediate produced twice", () => {
	const r = crepes();
	r.nodes["melt-butter"].produces.push("batter");
	assert.ok(codes(r).includes("intermediate-multi"));
});
test("rejects: fractions over 1", () => {
	const r = load("lasagna.recipe.json") as any;
	r.nodes["top"].inputs[1].amount = { fraction: 0.5 };
	assert.ok(codes(r).includes("split-over"));
});

import { migrate } from "../src/migrate.js";
test("migrate: current version passes through; unknown version throws", () => {
	const r = crepes();
	assert.deepEqual(migrate(r), r);
	assert.throws(() => migrate({ ...r, schemaVersion: "0.0.1" }), /no migration/);
});
test("the current version is frozen in schema/archive and matches the live schema", () => {
	const live = readFileSync(new URL("../../../schema/recipe.schema.json", import.meta.url), "utf-8");
	const archived = readFileSync(new URL(`../../../schema/archive/recipe.schema.${SUPPORTED_VERSION}.json`, import.meta.url), "utf-8");
	assert.equal(archived, live, "schema changed without a version bump");
});
test("src/schema.ts is in sync with spec/schema/recipe.schema.json (run npm run gen-types)", async () => {
	const { schema } = await import("../src/schema.js");
	const file = JSON.parse(readFileSync(new URL("../../../schema/recipe.schema.json", import.meta.url), "utf-8"));
	assert.deepEqual(schema, file);
});
test("the package entry imports no Node built-ins (browser-safe)", () => {
	for (const f of ["validate", "instructions", "migrate", "schema", "index"]) {
		const src = readFileSync(new URL(`../../src/${f}.ts`, import.meta.url), "utf-8");
		assert.doesNotMatch(src, /from "node:/, `${f}.ts imports a node: module`);
	}
});
