import type { AlertKind } from "./scheduler";

/**
 * Timer alerts: sound (Web Audio), vibration where supported (not iOS Safari),
 * and a system notification when the page is hidden and permission is granted.
 * The visual alert is the UI's job. Nothing here can fire while the phone is
 * locked and the page suspended; overdue timers show on return.
 */

let ctx: AudioContext | undefined;

/** Call from a tap (browsers only allow audio after a user gesture). */
export function unlockAudio(): void {
	try {
		ctx ??= new AudioContext();
		if (ctx.state === "suspended") void ctx.resume();
	} catch {
		/* no audio */
	}
}

function beep(times: number, freq: number): void {
	if (!ctx) return;
	const t0 = ctx.currentTime;
	for (let i = 0; i < times; i++) {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.frequency.value = freq;
		osc.type = "sine";
		const t = t0 + i * 0.35;
		gain.gain.setValueAtTime(0.0001, t);
		gain.gain.exponentialRampToValueAtTime(0.6, t + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
		osc.connect(gain).connect(ctx.destination);
		osc.start(t);
		osc.stop(t + 0.3);
	}
}

export const notificationsSupported = () => typeof Notification !== "undefined";

export async function requestNotifications(): Promise<NotificationPermission | "unsupported"> {
	if (!notificationsSupported()) return "unsupported";
	if (Notification.permission !== "default") return Notification.permission;
	return Notification.requestPermission();
}

async function notify(title: string, body: string, tag: string): Promise<void> {
	if (!notificationsSupported() || Notification.permission !== "granted") return;
	try {
		const reg = await navigator.serviceWorker?.getRegistration();
		if (reg) await reg.showNotification(title, { body, tag, requireInteraction: true });
		else new Notification(title, { body, tag });
	} catch {
		/* best effort */
	}
}

export function fireAlert(kind: AlertKind, stepText: string, op: string, wantNotify: boolean): void {
	if (kind === "check") {
		beep(2, 660);
		navigator.vibrate?.([150, 100, 150]);
	} else {
		beep(4, 880);
		navigator.vibrate?.([300, 150, 300, 150, 300]);
	}
	if (wantNotify && document.visibilityState === "hidden") {
		void notify(kind === "check" ? "Check now" : "Timer done", stepText, `${op}:${kind}`);
	}
}
