import { RemoteError } from "./remote-errors";

/**
 * Serialize operations per device. The ESP32 web server is tiny: concurrent
 * `/commands` requests can wedge it, and a sequence must not be interleaved
 * with another player's sequence.
 *
 * Each key has its own promise chain with:
 * - concurrency 1
 * - bounded queue depth
 * - a bounded wait before the task starts (the task itself owns its timeout)
 * - cancellation when the caller gives up waiting
 */

export const DEFAULT_QUEUE_MAX_WAIT_MS = 15_000;
export const DEFAULT_QUEUE_MAX_DEPTH = 20;

type QueueState = {
  tail: Promise<void>;
  depth: number;
};

const queues = new Map<string, QueueState>();

export type RunExclusiveOptions = {
  maxWaitMs?: number;
  maxDepth?: number;
};

export const getQueueDepth = (key: string): number =>
  queues.get(key)?.depth ?? 0;

export const runExclusive = <T>(
  key: string,
  task: () => Promise<T>,
  options: RunExclusiveOptions = {},
): Promise<T> => {
  const maxWaitMs = options.maxWaitMs ?? DEFAULT_QUEUE_MAX_WAIT_MS;
  const maxDepth = options.maxDepth ?? DEFAULT_QUEUE_MAX_DEPTH;

  let state = queues.get(key);
  if (!state) {
    state = { tail: Promise.resolve(), depth: 0 };
    queues.set(key, state);
  }

  if (state.depth >= maxDepth) {
    return Promise.reject(
      new RemoteError(
        "QUEUE_FULL",
        `Too many pending operations for ${key}.`,
        503,
        { retryAfterMs: 1_000 },
      ),
    );
  }

  const current = state;
  current.depth += 1;

  return new Promise<T>((resolve, reject) => {
    let cancelled = false;
    let started = false;
    let settled = false;

    const settle = (
      outcome: { value: T } | { error: unknown },
    ) => {
      if (settled) return;
      settled = true;
      clearTimeout(waitTimer);
      if ("error" in outcome) reject(outcome.error);
      else resolve(outcome.value);
    };

    const waitTimer = setTimeout(() => {
      if (started) return;
      cancelled = true;
      settle({
        error: new RemoteError(
          "QUEUE_TIMEOUT",
          `Timed out waiting for ${key}.`,
          503,
          { retryAfterMs: 1_000 },
        ),
      });
    }, maxWaitMs);

    const run = current.tail
      .catch(() => {
        // A previous task may have failed; the queue must keep moving.
      })
      .then(async () => {
        if (cancelled) return;
        started = true;
        clearTimeout(waitTimer);
        try {
          const value = await task();
          settle({ value });
        } catch (error) {
          settle({ error });
        }
      })
      .finally(() => {
        current.depth -= 1;
        if (current.depth <= 0 && queues.get(key) === current) {
          queues.delete(key);
        }
      });

    current.tail = run;
  });
};

/** Test hook. */
export const __resetDeviceQueues = (): void => {
  queues.clear();
};
