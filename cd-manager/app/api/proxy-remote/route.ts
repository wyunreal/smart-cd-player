import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { setDefaultResultOrder } from "node:dns";
import { lookup } from "node:dns/promises";
import { promisify } from "node:util";
import { isAllowedProxyUrl } from "@/lib/security";

const execFileAsync = promisify(execFile);
const REMOTE_TIMEOUT_MS = 8000;

// Prefer IPv4 for local devices. Some mDNS stacks return a link-local IPv6
// address first, which is not routable from the container even though the
// same .local name works from a browser.
setDefaultResultOrder("ipv4first");

const getErrorCause = (error: unknown): unknown =>
  error instanceof Error
    ? (error as Error & { cause?: unknown }).cause
    : undefined;

/**
 * Resolve a .local hostname to an IPv4 address. The container may not have a
 * working NSS/mDNS setup even though the device is on the same network, so
 * fall back to avahi-resolve (avahi-utils is installed in the image).
 */
const resolveLocalHost = async (hostname: string): Promise<string | null> => {
  try {
    const { address } = await lookup(hostname, { family: 4 });
    return address;
  } catch (error) {
    console.warn(
      `proxy-remote: mDNS lookup failed for ${hostname}`,
      error,
      getErrorCause(error),
    );
  }

  try {
    const { stdout } = await execFileAsync(
      "avahi-resolve",
      ["-4", "-n", hostname],
      { timeout: 4000 },
    );
    const address = stdout.trim().split(/\s+/)[1];
    return address || null;
  } catch (error) {
    console.warn(
      `proxy-remote: avahi-resolve failed for ${hostname}`,
      error,
      getErrorCause(error),
    );
    return null;
  }
};

const fetchRemote = async (targetUrl: string): Promise<Response> => {
  try {
    return await fetch(targetUrl, {
      signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    const target = new URL(targetUrl);

    // Only HTTP .local devices can be retried by IP. HTTPS certificates are
    // bound to the hostname, so rewriting the URL would break TLS.
    if (target.protocol !== "http:" || !target.hostname.endsWith(".local")) {
      throw error;
    }

    console.warn(
      `proxy-remote: fetch failed for ${targetUrl}, retrying via IPv4`,
      error,
      getErrorCause(error),
    );

    const address = await resolveLocalHost(target.hostname);
    if (!address) throw error;

    const resolved = new URL(targetUrl);
    resolved.hostname = address;

    return fetch(resolved.toString(), {
      signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
      cache: "no-store",
    });
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  if (!isAllowedProxyUrl(targetUrl)) {
    return NextResponse.json(
      { error: "URL not allowed" },
      { status: 403 },
    );
  }

  try {
    const response = await fetchRemote(targetUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Remote error: ${response.status} ${response.statusText}` },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type");
    const body = await response.text();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error, getErrorCause(error));
    return NextResponse.json(
      { error: "Failed to fetch remote url" },
      { status: 500 },
    );
  }
}
