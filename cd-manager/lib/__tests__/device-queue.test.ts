/**
 * @jest-environment node
 */

import {
  __resetDeviceQueues,
  getQueueDepth,
  runExclusive,
} from "../device-queue";

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("device-queue", () => {
  beforeEach(() => {
    __resetDeviceQueues();
  });

  it("serializes operations for the same device", async () => {
    const firstRelease = deferred<void>();
    const events: string[] = [];

    const first = runExclusive("device:a", async () => {
      events.push("first:start");
      await firstRelease.promise;
      events.push("first:end");
      return 1;
    });
    const second = runExclusive("device:a", async () => {
      events.push("second:start");
      return 2;
    });

    await tick();
    expect(events).toEqual(["first:start"]);
    expect(getQueueDepth("device:a")).toBe(2);

    firstRelease.resolve();
    await expect(first).resolves.toBe(1);
    await expect(second).resolves.toBe(2);
    await tick();
    expect(events).toEqual(["first:start", "first:end", "second:start"]);
    expect(getQueueDepth("device:a")).toBe(0);
  });

  it("allows different devices to run in parallel", async () => {
    const release = deferred<void>();
    const events: string[] = [];

    const first = runExclusive("device:a", async () => {
      events.push("a:start");
      await release.promise;
      events.push("a:end");
    });
    const second = runExclusive("device:b", async () => {
      events.push("b:start");
    });

    await second;
    expect(events).toContain("a:start");
    expect(events).toContain("b:start");
    release.resolve();
    await first;
  });

  it("rejects when the queue is full", async () => {
    const release = deferred<void>();
    const first = runExclusive("device:a", async () => {
      await release.promise;
    }, { maxDepth: 1 });

    await expect(
      runExclusive("device:a", async () => undefined, { maxDepth: 1 }),
    ).rejects.toMatchObject({ code: "QUEUE_FULL" });

    release.resolve();
    await first;
  });

  it("cancels a queued task that waits too long", async () => {
    const release = deferred<void>();
    let secondRan = false;

    const first = runExclusive("device:a", async () => {
      await release.promise;
    });
    const second = runExclusive(
      "device:a",
      async () => {
        secondRan = true;
      },
      { maxWaitMs: 20 },
    );

    await expect(second).rejects.toMatchObject({ code: "QUEUE_TIMEOUT" });
    release.resolve();
    await first;
    await tick();

    // The timed-out caller must not run its command later.
    expect(secondRan).toBe(false);
    expect(getQueueDepth("device:a")).toBe(0);
  });
});
