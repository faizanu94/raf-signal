export type RafCallback = (time: number) => void;

export interface RafSubscription {
  unsubscribe(): void;
}

let rafId: number | null = null;
const listeners = new Map<number, RafCallback>();
let nextId = 1;

const hasWindow = () =>
  typeof window !== "undefined" &&
  typeof window.requestAnimationFrame === "function" &&
  typeof window.cancelAnimationFrame === "function";

function loop(timestamp: number) {
  for (const cb of listeners.values()) {
    cb(timestamp);
  }

  if (listeners.size === 0 || !hasWindow()) {
    rafId = null;
    return;
  }

  rafId = window.requestAnimationFrame(loop);
}

function ensureLoopRunning() {
  if (!hasWindow()) {
    return;
  }
  if (rafId == null && listeners.size > 0) {
    rafId = window.requestAnimationFrame(loop);
  }
}

export function subscribe(callback: RafCallback): RafSubscription {
  const id = nextId++;
  listeners.set(id, callback);
  ensureLoopRunning();

  let active = true;

  return {
    unsubscribe() {
      if (!active) {
        return;
      }
      active = false;

      listeners.delete(id);

      if (listeners.size === 0 && rafId != null && hasWindow()) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}

export function once(callback: RafCallback): void {
  let sub: RafSubscription | null = null;

  sub = subscribe((time) => {
    if (sub) {
      sub.unsubscribe();
      sub = null;
    }
    callback(time);
  });
}

export function pause(): void {
  if (rafId != null && hasWindow()) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
}

export function resume(): void {
  ensureLoopRunning();
}

export function getSubscriberCount(): number {
  return listeners.size;
}
