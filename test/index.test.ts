import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const rafMock = {
  queue: new Map<number, FrameRequestCallback>(),
  lastId: 0,

  request(cb: FrameRequestCallback) {
    const id = ++rafMock.lastId;
    rafMock.queue.set(id, cb);
    return id;
  },

  cancel(id: number) {
    rafMock.queue.delete(id);
  },

  tick(timestamp: number) {
    const callbacks = Array.from(rafMock.queue.values());
    rafMock.queue.clear();
    callbacks.forEach((cb) => cb(timestamp));
  },

  reset() {
    rafMock.queue.clear();
    rafMock.lastId = 0;
  },
};

beforeEach(() => {
  rafMock.reset();
  vi.stubGlobal("requestAnimationFrame", rafMock.request);
  vi.stubGlobal("cancelAnimationFrame", rafMock.cancel);
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("raf-signal", () => {
  it("coalesces multiple subscribers into ONE rAF loop", async () => {
    const { subscribe } = await import("../src/index.js");

    const s1 = vi.fn();
    const s2 = vi.fn();
    const s3 = vi.fn();

    subscribe(s1);
    subscribe(s2);
    subscribe(s3);

    expect(rafMock.queue.size).toBe(1);

    rafMock.tick(1000);

    expect(s1).toHaveBeenCalledWith(1000);
    expect(s2).toHaveBeenCalledWith(1000);
    expect(s3).toHaveBeenCalledWith(1000);

    expect(rafMock.queue.size).toBe(1);
  });

  it("starts on first subscribe, stops on last unsubscribe", async () => {
    const { subscribe, getSubscriberCount } = await import("../src/index.js");

    expect(getSubscriberCount()).toBe(0);
    expect(rafMock.queue.size).toBe(0);

    const sub = subscribe(() => {});
    expect(getSubscriberCount()).toBe(1);
    expect(rafMock.queue.size).toBe(1);

    sub.unsubscribe();
    expect(getSubscriberCount()).toBe(0);
    expect(rafMock.queue.size).toBe(0);
  });

  it("once() fires once then auto unsubscribes", async () => {
    const { once, getSubscriberCount } = await import("../src/index.js");

    const cb = vi.fn();
    once(cb);

    expect(getSubscriberCount()).toBe(1);

    rafMock.tick(2000);
    expect(cb).toHaveBeenCalledTimes(1);

    rafMock.tick(3000);
    expect(cb).toHaveBeenCalledTimes(1);

    expect(getSubscriberCount()).toBe(0);
  });

  it("pause/resume works", async () => {
    const { subscribe, pause, resume } = await import("../src/index.js");

    const cb = vi.fn();
    subscribe(cb);

    expect(rafMock.queue.size).toBe(1);

    pause();
    expect(rafMock.queue.size).toBe(0);

    resume();
    expect(rafMock.queue.size).toBe(1);

    rafMock.tick(500);
    expect(cb).toHaveBeenCalledWith(500);
  });

  it("unsubscribe() is idempotent", async () => {
    const { subscribe, getSubscriberCount } = await import("../src/index.js");

    const sub = subscribe(() => {});
    expect(getSubscriberCount()).toBe(1);

    sub.unsubscribe();
    sub.unsubscribe();
    sub.unsubscribe();

    expect(getSubscriberCount()).toBe(0);
  });

  it("propagates timestamp correctly", async () => {
    const { subscribe } = await import("../src/index.js");

    let t1 = 0;
    let t2 = 0;

    subscribe((t) => (t1 = t));
    subscribe((t) => (t2 = t));

    rafMock.tick(1234.56);

    expect(t1).toBe(1234.56);
    expect(t2).toBe(1234.56);
  });
});
