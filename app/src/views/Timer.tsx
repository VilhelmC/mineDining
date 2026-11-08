import type { Step } from "@minedining/recipe-spec";
import * as S from "../cook/scheduler";
import { clock } from "../format";

export function TimerView(p: { step: Step; state: S.CookState; now: number; small?: boolean; onRestart?: () => void }) {
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
			{p.onRestart && (
				<button className="link" onClick={p.onRestart}>
					restart
				</button>
			)}
		</div>
	);
}

export function short(t: string, n = 48): string {
	const s = t.replace(/ → .*$/, "").replace(/\.$/, "");
	return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
