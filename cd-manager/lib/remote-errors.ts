/**
 * Error model shared by the remote-control server modules. Keeping a typed
 * error lets the route layer return a stable `code` to the browser without
 * leaking internal details.
 */
export type RemoteErrorCode =
  | "INVALID_REQUEST"
  | "DEVICE_NOT_FOUND"
  | "DEVICE_OFFLINE"
  | "DEVICE_TIMEOUT"
  | "DEVICE_UNREACHABLE"
  | "DEVICE_ERROR"
  | "INVALID_DEVICE_RESPONSE"
  | "MDNS_RESOLVE_FAILED"
  | "QUEUE_TIMEOUT"
  | "QUEUE_FULL"
  | "INTERNAL_ERROR";

export type RemoteErrorOptions = {
  retryAfterMs?: number;
  /** Extra fields safe to expose to the browser (never a stack trace). */
  details?: Record<string, unknown>;
};

export class RemoteError extends Error {
  readonly code: RemoteErrorCode;
  readonly status: number;
  readonly retryAfterMs?: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: RemoteErrorCode,
    message: string,
    status = 500,
    options: RemoteErrorOptions = {},
  ) {
    super(message);
    this.name = "RemoteError";
    this.code = code;
    this.status = status;
    this.retryAfterMs = options.retryAfterMs;
    this.details = options.details;
  }
}

export const isRemoteError = (value: unknown): value is RemoteError =>
  value instanceof RemoteError;
