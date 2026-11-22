import makeMdns from "multicast-dns";
import { RemoteError } from "./remote-errors";

/**
 * Self-contained `.local` resolver with **no caching**.
 *
 * Every command and every command-list read must reflect the device's current
 * address. The old deployment depended on Avahi/NSS and cached answers; this
 * module sends a fresh mDNS query each time instead.
 *
 * It requires multicast connectivity, which the chart provides with
 * `hostNetwork: true`.
 */

export const MDNS_TIMEOUT_MS = 1_000;
export const MDNS_ATTEMPTS = 2;
export const MDNS_RETRY_DELAY_MS = 200;

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const normalizeHostname = (hostname: string): string =>
  hostname.trim().toLowerCase().replace(/\.$/, "");

const isIPv4 = (value: string): boolean => {
  const parts = value.split(".");
  return (
    parts.length === 4 &&
    parts.every((part) => {
      if (!/^\d{1,3}$/.test(part)) return false;
      const n = Number(part);
      return n >= 0 && n <= 255;
    })
  );
};

export const isLocalHostname = (hostname: string): boolean => {
  const normalized = normalizeHostname(hostname);
  return (
    normalized.endsWith(".local") &&
    normalized.length > ".local".length &&
    /^[a-z0-9.-]+$/.test(normalized) &&
    !normalized.includes("..")
  );
};

const answerToIp = (answer: {
  type?: string;
  name?: string;
  data?: unknown;
}): string | null => {
  if (answer.type !== "A") return null;
  if (typeof answer.data !== "string" || !isIPv4(answer.data)) return null;
  if (typeof answer.name !== "string") return null;
  return answer.data;
};

const queryMdnsOnce = (
  hostname: string,
  timeoutMs: number,
): Promise<string> =>
  new Promise((resolve, reject) => {
    let mdns: ReturnType<typeof makeMdns> | null = null;
    let settled = false;

    const finish = (error: Error | null, ip?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (mdns) {
        try {
          mdns.destroy();
        } catch {
          // The socket may already be closed; nothing else to do.
        }
        mdns.removeAllListeners();
        // Swallow a possible late socket error after the promise settled.
        mdns.on("error", () => {});
      }
      if (error) reject(error);
      else resolve(ip as string);
    };

    const timer = setTimeout(
      () => finish(new Error(`mDNS timeout for ${hostname}`)),
      timeoutMs,
    );

    try {
      mdns = makeMdns({ reuseAddr: true, loopback: false });
      mdns.on("response", (packet) => {
        const answers = [
          ...(packet.answers ?? []),
          ...(packet.additionals ?? []),
        ];
        for (const answer of answers) {
          if (
            normalizeHostname(String(answer.name ?? "")) === hostname &&
            answerToIp(answer)
          ) {
            finish(null, answerToIp(answer) as string);
            return;
          }
        }
      });
      mdns.on("error", (error) => finish(error));
      mdns.query(
        { questions: [{ name: hostname, type: "A" }] },
        (error) => {
          if (error) finish(error);
        },
      );
    } catch (error) {
      finish(error instanceof Error ? error : new Error(String(error)));
    }
  });

const resolveWithMdns = async (hostname: string): Promise<string> => {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MDNS_ATTEMPTS; attempt += 1) {
    try {
      return await queryMdnsOnce(hostname, MDNS_TIMEOUT_MS);
    } catch (error) {
      lastError = error;
      if (attempt < MDNS_ATTEMPTS - 1) {
        await delay(MDNS_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`mDNS resolution failed for ${hostname}`);
};

/**
 * Resolve a `.local` hostname to IPv4. There is no cache: every call sends a
 * fresh mDNS query, so an IP change is picked up immediately.
 */
export const resolveLocalHost = async (hostname: string): Promise<string> => {
  const normalized = normalizeHostname(hostname);
  if (!isLocalHostname(normalized)) {
    throw new RemoteError(
      "INVALID_REQUEST",
      `Not a local mDNS hostname: ${hostname}`,
      400,
    );
  }

  try {
    return await resolveWithMdns(normalized);
  } catch (error) {
    console.warn(
      `remote-resolver: could not resolve ${normalized} via mDNS`,
      error,
    );
    throw new RemoteError(
      "MDNS_RESOLVE_FAILED",
      `Could not resolve ${hostname}.`,
      502,
    );
  }
};

/**
 * Rewrite an HTTP `.local` URL to its IPv4 address. HTTPS URLs keep the
 * hostname because certificates are bound to it.
 */
export const resolveUrlToIp = async (value: string): Promise<string> => {
  const url = new URL(value);
  if (url.protocol !== "http:" || !isLocalHostname(url.hostname)) {
    return value;
  }
  const ip = await resolveLocalHost(url.hostname);
  url.hostname = ip;
  return url.toString();
};
