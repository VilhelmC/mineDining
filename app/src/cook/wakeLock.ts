import { useEffect, useState } from "react";

export type WakeState = "unsupported" | "held" | "released" | "error";

/**
 * Keep the screen on while `on`. The browser releases the lock whenever the
 * page is hidden (tab switch, phone locked); it is re-requested on return.
 * Needs a secure context (HTTPS or localhost).
 */
export function useWakeLock(on: boolean): WakeState {
	const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;
	const [state, setState] = useState<WakeState>(supported ? "released" : "unsupported");
	useEffect(() => {
		if (!on || !supported) return;
		let sentinel: WakeLockSentinel | undefined;
		let cancelled = false;
		const acquire = async () => {
			if (document.visibilityState !== "visible" || (sentinel && !sentinel.released)) return;
			try {
				sentinel = await navigator.wakeLock.request("screen");
				if (cancelled) return void sentinel.release();
				setState("held");
				sentinel.addEventListener("release", () => !cancelled && setState("released"));
			} catch {
				setState("error");
			}
		};
		const onVisible = () => void acquire();
		void acquire();
		document.addEventListener("visibilitychange", onVisible);
		return () => {
			cancelled = true;
			document.removeEventListener("visibilitychange", onVisible);
			void sentinel?.release();
		};
	}, [on, supported]);
	return state;
}
