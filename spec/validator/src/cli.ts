import { readFileSync } from "node:fs";
import { validate } from "./validate.js";
import { generateSteps } from "./instructions.js";

// Usage: node dist/src/cli.js [--steps] <file.recipe.json> ...
const args = process.argv.slice(2);
const showSteps = args.includes("--steps");
let failed = false;
for (const file of args.filter((a) => a !== "--steps")) {
	const doc = JSON.parse(readFileSync(file, "utf-8"));
	const issues = validate(doc);
	const errors = issues.filter((i) => i.level === "error");
	console.log(`${errors.length ? "FAIL" : "ok  "} ${file}`);
	for (const i of issues) console.log(`\t${i.level} ${i.code} ${i.path}: ${i.message}`);
	if (errors.length) failed = true;
	else if (showSteps) for (const s of generateSteps(doc)) console.log(`\t${s.n}. ${s.attention === "passive" ? "[passive] " : ""}${s.text}${s.note ? "  — " + s.note : ""}`);
}
process.exit(failed ? 1 : 0);
