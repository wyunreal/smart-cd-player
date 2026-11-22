import { NextResponse } from "next/server";
import { isRemoteError } from "./remote-errors";

/** Applied to every remote-control response, including errors. */
export const NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export const jsonNoStore = (
  body: unknown,
  init?: ResponseInit,
): NextResponse => {
  const headers = new Headers(NO_STORE_HEADERS);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }
  return NextResponse.json(body, { ...init, headers });
};

export const errorResponse = (
  error: unknown,
  fallbackMessage = "The remote request failed.",
): NextResponse => {
  if (isRemoteError(error)) {
    const headers = new Headers();
    if (error.retryAfterMs) {
      headers.set(
        "Retry-After",
        String(Math.max(1, Math.ceil(error.retryAfterMs / 1000))),
      );
    }
    return jsonNoStore(
      {
        error: error.message,
        code: error.code,
        ...(error.details ?? {}),
      },
      { status: error.status, headers },
    );
  }

  console.error("remote-control: unexpected error", error);
  return jsonNoStore(
    { error: fallbackMessage, code: "INTERNAL_ERROR" },
    { status: 500 },
  );
};
