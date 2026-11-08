import { useCook } from "../cook/session";
import * as S from "../cook/scheduler";
import { clock } from "../format";
import { short, TimerView } from "./Timer";

const wakeLabel: Record<string, string> = { held: "☀ on", released: "☀ off", unsupported: "☀ n/a", error: "☀ err" };

/**
 * Sticky cooking bar (bottom) and alert banners (top). The bar carries the
 * current step, running timers and a timeline of the plan: a marker at the
 * planned time of the current step; dragging it previews which step the plan
 * has at that time, highlighted in whatever view is on screen.
 */
export function CookBar() {
	const c = useCook();
	if (!c?.state || c.finished) return null;
	const { steps, state, now, fg, live } = c;
	const plan = c.loaded.plan!;
	const total = Math.max(plan.total, 1);
	const run = S.running(steps, state);
	const pending = steps.filter((s) => S.statusOf(s, state) !== "done");
	const pos = fg ? plan.start.get(fg.op)! : Math.min(...pending.map((s) => plan.start.get(s.op)!), total);
	const doneCount = steps.length - pending.length;
	const at = (t: number) => steps.filter((s) => plan.start.get(s.op)! <= t).pop();
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
							<a className="cb-current" href={fg ? `#step-${fg.op}` : undefined} onClick={(e) => { e.preventDefault(); document.getElementById(`step-${fg?.op}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>
								{fg ? `${fg.n}. ${short(fg.text, 60)}` : run.length ? "Waiting for a running step" : "—"}
							</a>
							{fg && (
								<button className="cb-btn" onClick={() => (fg.attention === "passive" ? c.start(fg.op) : c.done(fg.op))}>
									{fg.attention === "passive" ? "Start" : "Done"}
								</button>
							)}
						</div>
						{run.length > 0 && (
							<div className="cb-timers">
								{run.map((s) => (
									<span key={s.op} className="cb-timer">
										{short(s.text, 18)} <TimerView step={s} state={state} now={now} small />
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
							return <i key={s.op} className={`tl-step ${s.attention} ${v ? `st-${v.status}` : ""}`} style={{ left: `${a * 100}%`, width: s.attention === "active" ? `${Math.max(w * 100, 0.8)}%` : undefined }} />;
						})}
						<i className="tl-now" style={{ left: `${(pos / total) * 100}%` }} />
					</div>
					<input
						type="range"
						aria-label="Preview the plan"
						min={0}
						max={total}
						step={30}
						value={c.preview ? plan.start.get(c.preview)! : pos}
						onChange={(e) => c.setPreview(at(Number(e.target.value))?.op)}
						onPointerUp={() => c.setPreview(undefined)}
						onTouchEnd={() => c.setPreview(undefined)}
						onBlur={() => c.setPreview(undefined)}
					/>
					<div className="tl-legend">
						<span>{c.preview ? `plan ${clock(plan.start.get(c.preview)!)} · ${short(steps.find((s) => s.op === c.preview)!.text, 34)}` : `${doneCount}/${steps.length} done · ${clock((now - state.startedAt) / 1000)} in`}</span>
						<span className="cb-pills">
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
