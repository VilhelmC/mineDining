import type { Duration, Ingredient } from "@minedining/recipe-spec";

/** 75 → "1:15", 3725 → "1:02:05". Negative values are shown as overdue by the caller. */
export function clock(seconds: number): string {
	const s = Math.max(0, Math.floor(seconds));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const ss = String(s % 60).padStart(2, "0");
	return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function durationText(d: Duration): string {
	const one = (s: number) => (s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.round((s / 3600) * 10) / 10} h`);
	return typeof d.value === "number" ? one(d.value) : `${one(d.value.min)}–${one(d.value.max)}`;
}

/** "2 scallion" → "2 scallions": a bare count (no noun) of more than one names the ingredient in the plural. */
export function displayName(n: Ingredient): string {
	const q = n.quantity;
	if (!("unit" in q) || q.unit !== "count" || q.noun) return n.name;
	const v = q.value;
	if (typeof v === "number" && v <= 1) return n.name;
	return /(s|sh|ch|x)$/.test(n.name) ? n.name + "es" : n.name + "s";
}
