import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Step } from "@minedining/recipe-spec";
import type { Loaded } from "../recipes";
import * as S from "./scheduler";
import { clearSession, loadSession, saveSession } from "./storage";
import { useWakeLock, type WakeState } from "./wakeLock";
import { fireAlert, requestNotifications, unlockAudio } from "./alerts";

/**
 * One cooking session per recipe, shared by every view of that recipe (table,
 * step list, lanes, map), so progress shows wherever the cook is looking.
 * Lives above the routes: alerts keep firing while the cook switches views.
 */

export interface Banner extends S.Due {
	text: string;
}

export interface StepView {
	status: S.Status;
	/** The step the cook should be doing now. */
	current: boolean;
	/** Running or under-way timed step: elapsed share of its duration, 0..1+. */
	progress?: number;
	/** Highlighted by the timeline scrubber. */
	preview: boolean;
}

export interface Cook {
	steps: Step[];
	loaded: Loaded;
	state?: S.CookState;
	/** Session exists and the cook has tapped Start/Resume on this page load (audio unlocked). */
	live: boolean;
	finished: boolean;
	now: number;
	fg?: Step;
	view: (op: string) => StepView | undefined;
	banners: Banner[];
	ack: (op: string) => void;
	wake: WakeState;
	notify: boolean;
	toggleNotify: () => void;
	begin: (fresh: boolean) => void;
	end: () => void;
	start: (op: string) => void;
	done: (op: string) => void;
	restart: (op: string) => void;
	focus: (op: string) => void;
	/** Tick/untick by hand, cascading (scheduler.check / uncheck). Starts a session if none. */
	toggle: (op: string) => void;
	preview?: string;
	setPreview: (op?: string) => void;
}

const Ctx = createContext<Cook | undefined>(undefined);
export const useCook = () => useContext(Ctx);

const NOTIFY_KEY = "minedining.notify";
const readNotify = () => {
	try {
		return localStorage.getItem(NOTIFY_KEY) === "1";
	} catch {
		return false;
	}
};

export function CookProvider({ loaded, children }: { loaded: Loaded; children: ReactNode }) {
	const steps = loaded.steps ?? [];
	const [state, setState] = useState<S.CookState | undefined>(() => (loaded.recipe ? loadSession(loaded.id) : undefined));
	const [live, setLive] = useState(false);
	const [now, setNow] = useState(() => Date.now());
	const [banners, setBanners] = useState<Banner[]>([]);
	const [notify, setNotify] = useState(readNotify);
	const [preview, setPreview] = useState<string>();
	const finished = !!state && S.finished(steps, state);
	const wake = useWakeLock(live && !!state && !finished);
	const byOp = useMemo(() => new Map(steps.map((s) => [s.op, s])), [steps]);

	const update = useCallback((f: (s: S.CookState) => S.CookState) => {
		setState((s) => {
			if (!s) return s;
			const next = f(s);
			saveSession(next);
			return next;
		});
	}, []);

	useEffect(() => {
		if (!state) return;
		const tick = () => setNow(Date.now());
		const id = setInterval(tick, 1000);
		document.addEventListener("visibilitychange", tick);
		return () => {
			clearInterval(id);
			document.removeEventListener("visibilitychange", tick);
		};
	}, [!!state]); // eslint-disable-line react-hooks/exhaustive-deps

	// Alerts wait for the Start/Resume tap: audio is locked until then.
	useEffect(() => {
		if (!state || !live) return;
		const due = S.dueAlerts(steps, state, now);
		if (!due.length) return;
		for (const d of due) fireAlert(d.kind, byOp.get(d.op)!.text, d.op, notify);
		setBanners((b) => [...b, ...due.map((d) => ({ ...d, text: byOp.get(d.op)!.text }))]);
		update((s) => S.markFired(s, due));
	}, [now, state, live, steps, byOp, notify, update]);

	const fg = state && live ? S.foreground(steps, state, now) : undefined;

	// An active step's clock starts when it reaches the foreground.
	useEffect(() => {
		if (fg && fg.attention === "active" && state?.ops[fg.op]?.startedAt === undefined) update((s) => S.start(s, fg.op, Date.now()));
	}, [fg, state, update]);

	const ack = useCallback((op: string) => setBanners((b) => b.filter((x) => x.op !== op)), []);

	const begin = useCallback(
		(fresh: boolean) => {
			unlockAudio();
			if (fresh || !state) {
				const s = S.newState(loaded.id, Date.now());
				saveSession(s);
				setState(s);
				setBanners([]);
			}
			setLive(true);
		},
		[state, loaded.id],
	);

	const value: Cook = {
		steps,
		loaded,
		state,
		live,
		finished,
		now,
		fg,
		view: (op) => {
			if (!state) return undefined;
			const s = byOp.get(op);
			if (!s) return undefined;
			const status = S.statusOf(s, state);
			const t = status !== "done" ? S.timer(s, state, now) : undefined;
			const tg = S.targets(s);
			const progress = t && tg.length ? t.elapsed / tg[tg.length - 1].at : undefined;
			return { status, current: fg?.op === op, progress, preview: preview === op };
		},
		banners,
		ack,
		wake,
		notify,
		toggleNotify: async () => {
			const want = !notify;
			if (want && (await requestNotifications()) !== "granted") return setNotify(false);
			setNotify(want);
			try {
				localStorage.setItem(NOTIFY_KEY, want ? "1" : "0");
			} catch {
				/* ignore */
			}
		},
		begin,
		end: () => {
			clearSession(loaded.id);
			setState(undefined);
			setLive(false);
			setBanners([]);
		},
		start: (op) => {
			ack(op);
			update((s) => S.focus(S.start(s, op, Date.now()), undefined));
		},
		done: (op) => {
			ack(op);
			update((s) => S.done(s, op, Date.now()));
		},
		restart: (op) => update((s) => S.restart(s, op, Date.now())),
		focus: (op) => update((s) => S.focus(s, op)),
		toggle: (op) => {
			unlockAudio();
			setLive(true);
			ack(op);
			setState((s0) => {
				const s = s0 ?? S.newState(loaded.id, Date.now());
				const next = S.statusOf(byOp.get(op)!, s) === "done" ? S.uncheck(steps, s, op) : S.check(steps, s, op, Date.now());
				saveSession(next);
				return next;
			});
		},
		preview,
		setPreview,
	};
	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** CSS classes for a step in any view: st-done, st-current, st-running, st-blocked, st-preview. */
export function stepClass(v: StepView | undefined): string {
	if (!v) return "";
	return [`st-${v.status}`, v.current ? "st-current" : "", v.preview ? "st-preview" : ""].filter(Boolean).join(" ");
}
