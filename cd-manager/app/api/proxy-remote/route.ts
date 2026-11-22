import { NextRequest, NextResponse } from "next/server";
import {
  errorResponse,
  jsonNoStore,
  NO_STORE_HEADERS,
} from "@/lib/api-response";
import { runExclusive } from "@/lib/device-queue";
import { resolveUrlToIp } from "@/lib/remote-resolver";
import { getDeviceClientKey } from "@/lib/remote-device-client";
import { RemoteError } from "@/lib/remote-errors";
import { isAllowedProxyUrl } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const REMOTE_TIMEOUT_MS = 4_000;

const getErrorCause = (error: unknown): unknown =>
  error instanceof Error
    ? (error as Error & { cause?: unknown }).cause
    : undefined;

type FetchedRemote = {
  response: Response;
  body: string;
};

/**
 * Legacy proxy kept for old clients/firmware during the migration.
 *
 * The important change is that `.local` is resolved to an IPv4 address before
 * the first fetch, using the self-contained resolver (no cache). The old code
 * paid a cold NSS timeout on every first request and then tried
 * `avahi-resolve`, which cannot use the host D-Bus from this container.
 */
const fetchRemote = async (targetUrl: string): Promise<FetchedRemote> => {
  const original = new URL(targetUrl);
  const queueKey = getDeviceClientKey({ url: targetUrl });

  return runExclusive(queueKey, async () => {
    const resolvedUrl = await resolveUrlToIp(targetUrl);

    const doFetch = async (url: string): Promise<FetchedRemote> => {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
      });
      return { response, body: await response.text() };
    };

    try {
      return await doFetch(resolvedUrl);
    } catch (error) {
      // Retry once with a fresh resolution; there is no IP cache, but the
      // mDNS answer can still race with a device that just came online.
      // Only HTTP is rewritten; HTTPS certificates are bound to the hostname.
      if (original.protocol === "http:" && original.hostname.endsWith(".local")) {
        const retryUrl = await resolveUrlToIp(targetUrl);
        return doFetch(retryUrl);
      }
      throw error;
    }
  });
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return jsonNoStore(
      { error: "Missing url parameter", code: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  if (!isAllowedProxyUrl(targetUrl)) {
    return jsonNoStore(
      { error: "URL not allowed", code: "INVALID_REQUEST" },
      { status: 403 },
    );
  }

  try {
    const { response, body } = await fetchRemote(targetUrl);

    if (!response.ok) {
      return jsonNoStore(
        {
          error: `Remote error: ${response.status} ${response.statusText}`,
          code: "DEVICE_ERROR",
        },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/json",
        ...NO_STORE_HEADERS,
      },
    });
  } catch (error) {
    if (error instanceof RemoteError) {
      return errorResponse(error);
    }
    console.error(
      "Proxy error:",
      error,
      getErrorCause(error),
    );
    return errorResponse(
      new RemoteError(
        "DEVICE_UNREACHABLE",
        "Failed to fetch remote url",
        502,
      ),
    );
  }
}
