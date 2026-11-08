import { SUPPORTED_VERSION } from "./validate.js";

type Doc = { schemaVersion?: string; [k: string]: unknown };
type Step = { from: string; to: string; run: (doc: Doc) => Doc };

/** One step per schema revision, in order. See spec/VERSIONING.md. */
const STEPS: Step[] = [];

/** Bring a document of any known version to the current version. Throws if no path exists. */
export function migrate(input: Doc): Doc {
	let doc = structuredClone(input);
	while (doc.schemaVersion !== SUPPORTED_VERSION) {
		const step = STEPS.find((s) => s.from === doc.schemaVersion);
		if (!step) throw new Error(`no migration from schemaVersion ${String(doc.schemaVersion)} to ${SUPPORTED_VERSION}`);
		doc = { ...step.run(doc), schemaVersion: step.to };
	}
	return doc;
}
