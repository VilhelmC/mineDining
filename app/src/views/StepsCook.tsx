import type { Temperature } from "@minedining/recipe-spec";
import { useCook } from "../cook/session";
import { clock } from "../format";
import { TimerView } from "./Timer";

function tempText(t: Temperature): string {
	return "heat" in t ? `${t.heat} heat` : typeof t.value === "number" ? `${t.value} °C` : `${t.value.min}–${t.value.max} °C`;
}

/**
 * The step list, which is also the cooking interface. Before cooking: the
 * planned list with start times. While cooking: each step shows its state;
 * the current step opens into a large card; running steps carry their timer.
 */
export function StepsCook() {
	const c = useCook()!;
	const { steps, state, live, now, fg } = c;
	const plan = c.loaded.plan;
	return (
		<section className="steps-cook">
			{!state && (
				<button className="big primary wide" onClick={() => c.begin(true)}>
					Start cooking
				</button>
			)}
			{state && !live && !c.finished && (
				<div className="actions">
					<button className="big primary" onClick={() => c.begin(false)}>Resume cooking</button>
					<button className="big" onClick={() => c.begin(true)}>Start over</button>
				</div>
			)}
			{state && c.finished && (
				<div className="fg finished">
					<p className="fg-text">Done. Serve: {c.loaded.recipe!.outputs.map((o) => (c.loaded.recipe!.nodes[o] as { name: string }).name).join(", ")}.</p>
					<button className="big" onClick={c.end}>Finish</button>
				</div>
			)}
			<ol className="steps live">
				{steps.map((s) => {
					const v = c.view(s.op);
					const st = v?.status;
					const at = <span className="at">{clock(plan?.start.get(s.op) ?? 0)}</span>;
					if (live && fg?.op === s.op) {
						const passive = s.attention === "passive";
						const temp = s.params?.temperature;
						return (
							<li key={s.op} className={`fg ${s.attention}`} id={`step-${s.op}`}>
								<p className="fg-label">
									{at} Step {s.n} · {passive ? "start, then it runs by itself" : "hands on"}
									{temp && <span className="temp"> · {tempText(temp)}</span>}
								</p>
								<p className="fg-text">{s.text}</p>
								{s.note && <p className="fg-note">{s.note}</p>}
								{!passive && <TimerView step={s} state={state!} now={now} onRestart={() => c.restart(s.op)} />}
								<button className="big primary" onClick={() => (passive ? c.start(s.op) : c.done(s.op))}>
									{passive ? `Start${s.params?.duration ? " timer" : ""}` : "Done"}
								</button>
							</li>
						);
					}
					return (
						<li key={s.op} className={`step-row ${st ? `st-${st}` : ""} ${v?.preview ? "st-preview" : ""}`} id={`step-${s.op}`}>
							<button className="tick" aria-label={st === "done" ? "Mark not done" : "Mark done"} onClick={() => c.toggle(s.op)}>
								{st === "done" ? "✓" : ""}
							</button>
							<div className="step-body">
								<div>
									{at} <span className={`badge ${s.attention}`}>{s.attention}</span> {s.text}
								</div>
								{s.note && st !== "done" && <div className="muted small">{s.note}</div>}
								{live && st === "running" && (
									<div className="step-run">
										{s.params?.until && <span className="muted">until {s.params.until}</span>}
										<TimerView step={s} state={state!} now={now} small />
										<button className="done-btn" onClick={() => c.done(s.op)}>Done</button>
									</div>
								)}
								{live && st === "ready" && (
									<button className="link" onClick={() => (s.attention === "passive" ? c.start(s.op) : c.focus(s.op))}>
										{s.attention === "passive" ? "start now" : "do this now"}
									</button>
								)}
							</div>
						</li>
					);
				})}
			</ol>
		</section>
	);
}
