import type { Step } from "@minedining/recipe-spec";
import { useCook, type Cook } from "../cook/session";
import * as S from "../cook/scheduler";
import { clock } from "../format";
import { short, TimerView } from "./Timer";

const wakeLabel: Record<string, string> = { held: "☀ on", released: "☀ off", unsupported: "☀ n/a", error: "☀ err" };

/**
 * The cooking bar: the primary place to follow and drive the process.
 *  - It shows one step: the current one (the step to do now, or while waiting
 *    the running step that ends first), or one the cook browsed to with ‹ ›
 *    or the timeline. Its button always acts on that step: Done, Start, Undo.
 *  - Other running steps are listed with their timers and their own Done.
 *  - The timeline is the plan; its knob marks where the process is now
 *    (planned start of the current step plus its elapsed time) and moves with
 *    time. Dragging it selects the step the plan has at that time; Now returns.
 */
export function CookBar() {
	const c = useCook();
	if (!c?.state || c.finished) return null;
	const { steps, state, now, live, cur } = c;
	const plan = c.loaded.plan!;
	const total = Math.max(plan.total, 1);
	const shown = steps.find((s) => s.op === c.cursor) ?? cur;
	const browsing = !!c.cursor && c.cursor !== cur?.op;
	const idx = shown ? steps.indexOf(shown) : -1;
	const go = (d: number) => {
		const next = steps[Math.min(steps.length - 1, Math.max(0, (idx < 0 ? 0 : idx) + d))];
		c.setCursor(next.op === cur?.op ? undefined : next.op);
		document.getElementById(`step-${next.op}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
	};
	const others = S.running(steps, state).filter((s) => s.op !== shown?.op);
	const doneCount = steps.filter((s) => S.statusOf(s, state) === "done").length;
	const at = (t: number) => steps.filter((s) => plan.start.get(s.op)! <= t).pop();
	const knob = browsing && shown ? plan.start.get(shown.op)! : c.position;

	return (
		<>
			{c.banners.length > 0 && (
				<div className="banners">
					{c.banners.map((b) => (
						<div key={`${b.op}:${b.kind}`} className={`banner ${b.kind}`} onClick={() => c.ack(b.op)}>
							<strong>{b.kind === "check" ? "Check now" : b.kind === "start" ? "Start now" : "Time’s up"}</strong> — {b.text}
							<span className="banner-ok">OK</span>
						</div>
					))}
				</div>
			)}
			<div className="cookbar">
				{!live ? (
					<button className="big primary wide" onClick={() => c.begin(false)}>Resume cooking</button>
				) : (
					<>
						<div className="cb-row">
							<button className="cb-nav" aria-label="Previous step" disabled={idx <= 0} onClick={() => go(-1)}>‹</button>
							{shown ? <Shown c={c} s={shown} browsing={browsing} /> : <div className="cb-main muted">Nothing to do or running</div>}
							<button className="cb-nav" aria-label="Next step" disabled={idx >= steps.length - 1} onClick={() => go(1)}>›</button>
						</div>
						{others.length > 0 && (
							<div className="cb-timers">
								{others.map((s) => (
									<span key={s.op} className="cb-timer">
										<button className="link" onClick={() => c.setCursor(s.op === cur?.op ? undefined : s.op)}>{s.n}. {short(s.text, 16)}</button>
										<TimerView step={s} state={state} now={now} small />
										<button className="cb-mini" onClick={() => c.done(s.op)}>Done</button>
									</span>
								))}
							</div>
						)}
					</>
				)}
				<div className="timeline">
					<div className="tl-track">
						{steps.map((s) => {
							const a = plan.start.get(s.op)! / total;
							const w = (s.attention === "active" ? S.seconds(s).s : 0) / total;
							const v = c.view(s.op);
							return <i key={s.op} className={`tl-step ${s.attention} ${v ? `st-${v.status}` : ""}${shown?.op === s.op ? " tl-shown" : ""}`} style={{ left: `${a * 100}%`, width: s.attention === "active" ? `${Math.max(w * 100, 0.8)}%` : undefined }} />;
						})}
						<i className="tl-now" style={{ left: `${(c.position / total) * 100}%` }} />
					</div>
					<input
						className={`tl-range${browsing ? " browsing" : ""}`}
						type="range"
						aria-label="Timeline: where the process is; drag to select a step"
						min={0}
						max={total}
						step={10}
						value={knob}
						onChange={(e) => {
							const s = at(Number(e.target.value));
							c.setCursor(s && s.op !== cur?.op ? s.op : undefined);
						}}
					/>
					<div className="tl-legend">
						<span>
							{doneCount}/{steps.length} done · {clock((now - state.startedAt) / 1000)} in · plan {clock(c.position)} of {clock(total)}
						</span>
						<span className="cb-pills">
							{browsing && <button className="pill on" onClick={() => c.setCursor(undefined)}>Now</button>}
							<span className={`pill wake-${c.wake}`}>{wakeLabel[c.wake]}</span>
							<button className={`pill ${c.notify ? "on" : ""}`} onClick={c.toggleNotify}>🔔 {c.notify ? "on" : "off"}</button>
							<button className="pill" onClick={c.end}>end</button>
						</span>
					</div>
				</div>
			</div>
		</>
	);
}

/** The step in the bar, its state, and the one action that fits it. */
function Shown({ c, s, browsing }: { c: Cook; s: Step; browsing: boolean }) {
	const state = c.state!;
	const st = S.statusOf(s, state);
	const waitingFor = st === "blocked" ? c.steps.filter((d) => s.dependsOn.includes(d.op) && S.statusOf(d, state) !== "done") : [];
	const after = () => c.setCursor(undefined);
	let label: string;
	let act: () => void;
	if (st === "done") {
		label = "Undo";
		act = () => (c.toggle(s.op), after());
	} else if (st === "running") {
		label = "Done";
		act = () => (c.done(s.op), after());
	} else if (st === "ready") {
		label = s.attention === "passive" ? "Start" : "Done";
		act = () => (s.attention === "passive" ? c.start(s.op) : c.done(s.op), after());
	} else {
		label = "Done";
		act = () => (c.toggle(s.op), after()); // cascades to its prerequisites
	}
	const status =
		st === "done" ? "done" : st === "running" ? (s.params?.until ? `running · until ${s.params.until}` : "running") : st === "ready" ? (s.attention === "passive" ? "ready to start" : browsing ? "ready" : "now") : `waits for ${waitingFor.map((d) => d.n).join(", ")}`;
	return (
		<>
			<button className="cb-main" onClick={() => document.getElementById(`step-${s.op}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}>
				<span className="cb-step">
					{s.n}. {short(s.text, 70)}
				</span>
				<span className={`cb-status st-${st}`}>
					{browsing ? "selected · " : ""}
					{status}
					{st !== "done" && <TimerView step={s} state={state} now={c.now} small />}
				</span>
			</button>
			<button className={`cb-btn${st === "done" ? " ghost" : ""}`} onClick={act} title={st === "blocked" ? "Also marks the steps it waits for as done" : undefined}>
				{label}
			</button>
		</>
	);
}
