import type { CookState } from "./scheduler";

// Per-device convenience: a cooking session survives a reload or a killed tab.
const key = (recipeId: string) => `minedining.cook.${recipeId}`;

export function loadSession(recipeId: string): CookState | undefined {
	try {
		const raw = localStorage.getItem(key(recipeId));
		const s = raw ? (JSON.parse(raw) as CookState) : undefined;
		return s?.version === 1 && s.recipeId === recipeId ? s : undefined;
	} catch {
		return undefined;
	}
}

export function saveSession(s: CookState): void {
	try {
		localStorage.setItem(key(s.recipeId), JSON.stringify(s));
	} catch {
		/* storage unavailable: the session lives in memory only */
	}
}

export function clearSession(recipeId: string): void {
	try {
		localStorage.removeItem(key(recipeId));
	} catch {
		/* ignore */
	}
}
