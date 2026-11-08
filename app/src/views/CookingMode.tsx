import { useCallback, useEffect, useMemo, useState } from "react";
import type { Step, Temperature } from "@minedining/recipe-spec";
import type { Loaded } from "../recipes";
import { href } from "../router";
import { clock } from "../format";
import * as S from "../cook/scheduler";
import { loadSession, saveSession, clearSession } from "../cook/storage";
import { useWakeLock } from "../cook/wakeLock";
import { fireAlert, notificationsSupported, requestNotifications, unlockAudio } from "../cook/alerts";

const NOTIFY_KEY = "minedining.notify";
const readNotify = () => {
	try {
		return localStorage.getItem(NOTIFY_KEY) === "1";
	} catch {
		return false;
	}
};

interface Banner extends S.Due {
	text: string;
}

export function CookingMode({ loaded }: { loaded: Loaded }) {
	const steps = loaded.steps!;
	const recipe = loaded.recipe!;
	const [state, setState] = useState<S.CookState | undefined>(() => loadSession(loaded.id));
	const [started, setStarted] = useState(false); // a tap this page-load (audio needs a gesture)
	const [now, setNow] = useState(() => Date.now());
	const [banners, setBanners] = useState<Banner[]>([]);
	const [notify, setNotify] = useState(readNotify);
	const wake = useWakeLock(started && !!state && !S.finished(steps, state));
	const byOp = useMemo(() => new Map(steps.map((s) => [s.op, s])), [steps]);

	const update = useCallback((f: (s: S.CookState) => S.CookState) => {
		setState((s) => {
			if (!s) return s;
			const next = f(s);
			saveSession(next);
			return next;
		});
	}, []);

	// Clock: 1 s tick, and an immediate catch-up whenever the page becomes visible again.
	useEffect(() => {
		const tick = () => setNow(Date.now());
		const id = setInterval(tick, 1000);
		document.addEventListener("visibilitychange", tick);
		return () => {
			clearInterval(id);
			document.removeEventListener("visibilitychange", tick);
		};
	}, []);

	// Alerts. Not before the cook has tapped Start/Resume: audio is locked until then,
	// so an alert due on the Resume screen waits and fires with sound after the tap.
	useEffect(() => {
		if (!state || !started) return;
		const due = S.dueAlerts(steps, state, now);
		if (!due.length) return;
		for (const d of due) fireAlert(d.kind, byOp.get(d.op)!.text, d.op, notify);
		setBanners((b) => [...b, ...due.map((d) => ({ ...d, text: byOp.get(d.op)!.text }))]);
		update((s) => S.markFired(s, due));
	}, [now, state, started, steps, byOp, notify, update]);

	const fg = state ? S.foreground(steps, state) : undefined;

	// An active step's clock starts when it reaches the foreground.
	useEffect(() => {
		if (fg && fg.attention === "active" && state?.ops[fg.op]?.startedAt === undefined) update((s) => S.start(s, fg.op, Date.now()));
	}, [fg, state, update]);

	const begin = (fresh: boolean) => {
		unlockAudio();
		if (fresh || !state) {
			const s = S.newState(loaded.id, Date.now());
			saveSession(s);
			setState(s);
			setBanners([]);
		}
		setStarted(true);
	};

	const toggleNotify = async () => {
		const want = !notify;
		if (want && (await requestNotifications()) !== "granted") return setNotify(false);
		setNotify(want);
		try {
			localStorage.setItem(NOTIFY_KEY, want ? "1" : "0");
		} catch {
			/* ignore */
		}
	};

	if (!started || !state) {
		return (
			<div className="cook cook-gate">
				<a className="back" href={href({ name: "recipe", id: loaded.id })}>‹ {recipe.meta.title}</a>
				<h1>Cook: {recipe.meta.title}</h1>
				<p className="muted">
					{steps.length} steps · {steps.filter((s) => s.attention === "passive").length} run in the background. The screen stays on while
					cooking. Timers keep time if the phone locks, but cannot ring until you unlock it.
				</p>
				{state && !S.finished(steps, state) ? (
					<>
						<button className="big primary" onClick={() => begin(false)}>Resume</button>
						<button className="big" onClick={() => begin(true)}>Start over</button>
					</>
				) : (
					<button className="big primary" onClick={() => begin(true)}>Start cooking</button>
				)}
			</div>
		);
	}

	const run = S.running(steps, state);
	const others = S.queue(steps, state).filter((s) => s !== fg);
	const doneSteps = steps.filter((s) => S.statusOf(s, state) === "done").sort((a, b) => state.ops[b.op].doneAt! - state.ops[a.op].doneAt!);
	const ack = (op: string) => setBanners((b) => b.filter((x) => x.op !== op));
	const markDone = (op: string) => {
		ack(op);
		update((s) => S.done(s, op, Date.now()));
	};

	return (
		<div className="cook">
			<header className="cook-bar">
				<a className="back" href={href({ name: "recipe", id: loaded.id })}>‹</a>
				<span className="cook-title">{recipe.meta.title}</span>
				<span className={`pill wake-${wake}`} title="Screen wake lock">{wakeLabel[wake]}</span>
				{notificationsSupported() && (
					<button className={`pill ${notify ? "on" : ""}`} onClick={toggleNotify} title="System notification when a timer ends in the background">
						🔔 {notify ? "on" : "off"}
					</button>
				)}
				<span className="pill">{doneSteps.length}/{steps.length}</span>
			</header>

			{banners.length > 0 && (
				<div className="banners">
					{banners.map((b) => (
						<div key={`${b.op}:${b.kind}`} className={`banner ${b.kind}`} onClick={() => ack(b.op)}>
							<strong>{b.kind === "check" ? "Check now" : "Time’s up"}</strong> — {b.text}
							<span className="banner-ok">OK</span>
						</div>
					))}
				</div>
			)}

			{S.finished(steps, state) ? (
				<section className="fg finished">
					<h2>Done</h2>
					<p className="fg-text">Serve: {recipe.outputs.map((o) => (recipe.nodes[o] as { name: string }).name).join(", ")}.</p>
					<button className="big" onClick={() => { clearSession(loaded.id); setState(undefined); setStarted(false); }}>Finish</button>
				</section>
			) : fg ? (
				<Foreground step={fg} state={state} now={now} onStart={() => update((s) => S.focus(S.start(s, fg.op, Date.now()), undefined))} onDone={() => markDone(fg.op)} onRestart={() => update((s) => S.restart(s, fg.op, Date.now()))} />
			) : (
				<section className="fg waiting">
					<p className="fg-label">Waiting</p>
					<p className="fg-text">Nothing to do by hand until a running step is done.</p>
				</section>
			)}

			{others.length > 0 && (
				<section className="also">
					<h3>Also ready</h3>
					<div className="chips">
						{others.map((s) => (
							<button key={s.op} className={`chip ${s.attention}`} onClick={() => update((st) => S.focus(st, s.op))}>
								{s.n}. {short(s.text)}
							</button>
						))}
					</div>
				</section>
			)}

			{run.length > 0 && (
				<section className="tray">
					<h3>Running</h3>
					{run.map((s) => (
						<div key={s.op} className="tray-item">
							<div className="tray-main">
								<div className="tray-text">{s.n}. {short(s.text, 80)}</div>
								{s.params?.until && <div className="muted">until {s.params.until}</div>}
							</div>
							<TimerView step={s} state={state} now={now} small />
							<button className="done-btn" onClick={() => markDone(s.op)}>Done</button>
						</div>
					))}
				</section>
			)}

			{doneSteps.length > 0 && (
				<details className="done-list">
					<summary>Done ({doneSteps.length})</summary>
					{doneSteps.map((s) => (
						<div key={s.op} className="done-item">
							<span>{s.n}. {short(s.text, 70)}</span>
							<button className="link" onClick={() => update((st) => S.undone(st, s.op))}>undo</button>
						</div>
					))}
				</details>
			)}
		</div>
	);
}

const wakeLabel: Record<string, string> = { held: "☀ on", released: "☀ off", unsupported: "☀ n/a", error: "☀ err" };

function short(t: string, n = 48): string {
	const s = t.replace(/ → .*$/, "").replace(/\.$/, "");
	return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function Foreground(p: { step: Step; state: S.CookState; now: number; onStart: () => void; onDone: () => void; onRestart: () => void }) {
	const { step } = p;
	const passive = step.attention === "passive";
	const temp = step.params?.temperature;
	return (
		<section className={`fg ${step.attention}`}>
			<p className="fg-label">
				Step {step.n} · {passive ? "start, then it runs by itself" : "hands on"}
				{temp && <span className="temp"> · {tempText(temp)}</span>}
			</p>
			<p className="fg-text">{step.text}</p>
			{step.note && <p className="fg-note">{step.note}</p>}
			{!passive && <TimerView step={step} state={p.state} now={p.now} onRestart={p.onRestart} />}
			{passive ? (
				<button className="big primary" onClick={p.onStart}>Start{step.params?.duration ? " timer" : ""}</button>
			) : (
				<button className="big primary" onClick={p.onDone}>Done</button>
			)}
		</section>
	);
}

function tempText(t: Temperature): string {
	return "heat" in t ? `${t.heat} heat` : typeof t.value === "number" ? `${t.value} °C` : `${t.value.min}–${t.value.max} °C`;
}

function TimerView(p: { step: Step; state: S.CookState; now: number; small?: boolean; onRestart?: () => void }) {
	const t = S.timer(p.step, p.state, p.now);
	if (!t || (t.kind === "stopwatch" && p.step.attention === "active")) return null;
	const cls = `timer ${p.small ? "small" : ""} ${t.overdue ? "overdue" : t.inWindow ? "window" : ""}`;
	let main: string;
	let sub = "";
	if (t.kind === "stopwatch") {
		main = clock(t.elapsed);
		sub = "elapsed";
	} else if (t.overdue) {
		main = "+" + clock(t.elapsed - t.target!);
		sub = "over";
	} else {
		main = clock(t.remaining!);
		sub = t.inWindow ? "check now · to max" : typeof p.step.params!.duration!.value === "number" ? "left" : "to first check";
	}
	return (
		<div className={cls}>
			<span className="timer-main">{main}</span>
			<span className="timer-sub">{sub}</span>
			{p.onRestart && <button className="link" onClick={p.onRestart}>restart</button>}
		</div>
	);
}
