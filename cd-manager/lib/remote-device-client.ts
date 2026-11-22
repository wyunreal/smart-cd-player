import http from "node:http";
import https from "node:https";
import { randomUUID } from "node:crypto";
import { runExclusive } from "./device-queue";
import { isRemoteError, RemoteError } from "./remote-errors";
import { resolveUrlToIp } from "./remote-resolver";

/**
 * Server-side HTTP client for the ESP32 remote controller.
 *
 * All requests are serialized per device by `runExclusive`, use one connection
 * at a time (`agent: false`, `Connection: close`) and have a short timeout.
 * That is deliberate: the ESP32's AsyncWebServer is small and concurrent
 * `/commands` requests can leave TCP connections stuck.
 */

export type RemoteDeviceEndpoint = {
  /** Stable device id, if known. Used as the serialization key. */
  id?: string;
  /** Full URL of the endpoint, including path. */
  url: string;
  /** Optional resolved IPv4 address; overrides `.local` resolution. */
  ip?: string;
  capabilities?: {
    post?: boolean;
    requestId?: boolean;
  };
};

export type DeviceSequenceItem = {
  command: number;
  delayAfterMs: number;
};

export type DeviceCommandResult = {
  command: number;
  ok: boolean;
  status: number;
  durationMs: number;
  requestId: string;
  error?: string;
  code?: string;
};

export type DeviceSequenceResult = {
  ok: boolean;
  requestId: string;
  results: DeviceCommandResult[];
  error?: string;
  code?: string;
};

export type DeviceCommandsResult = {
  commands: string[];
  status: number;
  durationMs: number;
};

export type DeviceRequestOptions = {
  timeoutMs?: number;
  queueMaxWaitMs?: number;
  preferPost?: boolean;
};

export const DEFAULT_COMMANDS_TIMEOUT_MS = 4_000;
export const DEFAULT_COMMAND_TIMEOUT_MS = 3_000;
export const MAX_DEVICE_RESPONSE_BYTES = 64 * 1024;
export const MAX_SEQUENCE_DELAY_MS = 15_000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const getEndpointKey = (endpoint: RemoteDeviceEndpoint): string => {
  if (endpoint.id?.trim()) return `device:${endpoint.id.trim()}`;
  try {
    return `origin:${new URL(endpoint.url).origin}`;
  } catch {
    return `url:${endpoint.url}`;
  }
};

export const getDeviceClientKey = (endpoint: RemoteDeviceEndpoint): string =>
  getEndpointKey(endpoint);

const normalizeDeviceError = (error: unknown): RemoteError => {
  if (isRemoteError(error)) return error;
  if (error instanceof Error) {
    if (error.name === "AbortError" || error.message.includes("timeout")) {
      return new RemoteError(
        "DEVICE_TIMEOUT",
        "The remote device did not respond in time.",
        504,
      );
    }
    return new RemoteError(
      "DEVICE_UNREACHABLE",
      "Could not reach the remote device.",
      502,
    );
  }
  return new RemoteError(
    "DEVICE_UNREACHABLE",
    "Could not reach the remote device.",
    502,
  );
};

const isHtml = (body: string): boolean =>
  /^\s*</.test(body) || /<html[\s>]/i.test(body);

type HttpTextResult = {
  status: number;
  body: string;
  durationMs: number;
};

const requestText = (
  url: URL,
  method: "GET" | "POST",
  timeoutMs: number,
): Promise<HttpTextResult> =>
  new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const startedAt = Date.now();
    let settled = false;

    const finish = (error: Error | null, result?: HttpTextResult) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve(result as HttpTextResult);
    };

    const request = transport.request(
      url,
      {
        method,
        agent: false,
        headers: {
          Accept: "application/json",
          Connection: "close",
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        let size = 0;

        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_DEVICE_RESPONSE_BYTES) {
            request.destroy(
              new RemoteError(
                "INVALID_DEVICE_RESPONSE",
                "The remote device response was too large.",
                502,
              ),
            );
            return;
          }
          chunks.push(chunk);
        });

        response.on("end", () => {
          finish(null, {
            status: response.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
            durationMs: Date.now() - startedAt,
          });
        });

        response.on("error", (error) => finish(error));
      },
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(
        new RemoteError(
          "DEVICE_TIMEOUT",
          "The remote device did not respond in time.",
          504,
        ),
      );
    });
    request.on("error", (error) => finish(normalizeDeviceError(error)));
    request.end();
  });

const buildRequestUrl = async (
  endpoint: RemoteDeviceEndpoint,
): Promise<URL> => {
  const original = new URL(endpoint.url);
  if (original.protocol !== "http:" && original.protocol !== "https:") {
    throw new RemoteError(
      "INVALID_REQUEST",
      "The remote device URL must use http or https.",
      400,
    );
  }

  if (endpoint.ip) {
    original.hostname = endpoint.ip;
  } else {
    const resolved = await resolveUrlToIp(endpoint.url);
    return new URL(resolved);
  }

  return original;
};

const parseJson = (body: string): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(body);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const parseCommandsResponse = (body: string): string[] => {
  const parsed = parseJson(body);
  if (!parsed || !Array.isArray(parsed.commands)) {
    throw new RemoteError(
      "INVALID_DEVICE_RESPONSE",
      "The remote device did not return a command list.",
      502,
    );
  }

  const commands = parsed.commands.filter(
    (command): command is string => typeof command === "string",
  );
  if (commands.length !== parsed.commands.length) {
    throw new RemoteError(
      "INVALID_DEVICE_RESPONSE",
      "The remote device returned an invalid command list.",
      502,
    );
  }
  return commands;
};

type ParsedCommandResponse = {
  supported: boolean;
  ok: boolean;
  error?: string;
};

const parseCommandResponse = (body: string): ParsedCommandResponse => {
  const parsed = parseJson(body);
  if (!parsed) {
    return {
      supported: false,
      ok: false,
      error: "The remote device returned a non-JSON response.",
    };
  }

  const status = parsed.status;
  const explicitOk = parsed.ok;
  const requestId = parsed.requestId;
  const supported =
    typeof status === "string" ||
    typeof explicitOk === "boolean" ||
    typeof requestId === "string";
  const ok =
    status === "success" ||
    explicitOk === true ||
    (status === undefined && explicitOk === undefined && Boolean(requestId));

  return {
    supported,
    ok,
    error: ok
      ? undefined
      : typeof parsed.message === "string"
        ? parsed.message
        : "The remote device rejected the command.",
  };
};

export const fetchDeviceCommands = async (
  endpoint: RemoteDeviceEndpoint,
  options: DeviceRequestOptions = {},
): Promise<DeviceCommandsResult> => {
  const key = getEndpointKey(endpoint);

  return runExclusive(
    key,
    async () => {
      try {
        const url = await buildRequestUrl(endpoint);
        const response = await requestText(
          url,
          "GET",
          options.timeoutMs ?? DEFAULT_COMMANDS_TIMEOUT_MS,
        );

        if (response.status < 200 || response.status >= 300) {
          throw new RemoteError(
            "DEVICE_ERROR",
            `The remote device returned HTTP ${response.status}.`,
            502,
            { details: { status: response.status } },
          );
        }

        const commands = parseCommandsResponse(response.body);
        return {
          commands,
          status: response.status,
          durationMs: response.durationMs,
        };
      } catch (error) {
        const normalized = normalizeDeviceError(error);
        throw normalized;
      }
    },
    { maxWaitMs: options.queueMaxWaitMs },
  );
};

const parseRequestId = (value: unknown): string => {
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 128);
  }
  return randomUUID();
};

export const sendDeviceSequence = async (
  endpoint: RemoteDeviceEndpoint,
  device: string,
  sequence: DeviceSequenceItem[],
  requestId: string = randomUUID(),
  options: DeviceRequestOptions = {},
): Promise<DeviceSequenceResult> => {
  const deviceName = device.trim();
  if (!deviceName) {
    throw new RemoteError(
      "INVALID_REQUEST",
      "A device name is required.",
      400,
    );
  }
  if (!Array.isArray(sequence) || sequence.length === 0) {
    throw new RemoteError(
      "INVALID_REQUEST",
      "At least one command is required.",
      400,
    );
  }

  const key = getEndpointKey(endpoint);

  const normalizedRequestId = parseRequestId(requestId);
  const preferPost =
    options.preferPost ??
    endpoint.capabilities?.post ??
    process.env.REMOTE_DEVICE_HTTP_POST === "true";

  return runExclusive(
    key,
    async () => {
      const results: DeviceCommandResult[] = [];
      let ok = true;

      // Resolve once per sequence. This is not a cache: the answer is scoped
      // to this request and discarded afterwards. Re-resolving every command
      // in a long sequence would add seconds without making it "hotter".
      const baseUrl = await buildRequestUrl(endpoint);

      for (let index = 0; index < sequence.length; index += 1) {
        const item = sequence[index];
        const commandRequestId = `${normalizedRequestId}:${index}`;
        const startedAt = Date.now();

        try {
          const url = new URL(baseUrl.toString());
          url.searchParams.set("device", deviceName);
          url.searchParams.set("command", String(item.command));
          url.searchParams.set("requestId", commandRequestId);

          let response = await requestText(
            url,
            preferPost ? "POST" : "GET",
            options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS,
          );
          let parsed = parseCommandResponse(response.body);

          // Older firmware only registers GET /remote. The ESPAsyncWebServer
          // fallback serves index.html for unknown routes, so a POST can
          // return 200 with HTML. Only fall back when the response is clearly
          // not a valid command response; never retry a network error because
          // a POST may already have triggered the IR command.
          if (
            preferPost &&
            !parsed.supported &&
            (response.status === 404 ||
              response.status === 405 ||
              isHtml(response.body))
          ) {
            response = await requestText(
              url,
              "GET",
              options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS,
            );
            parsed = parseCommandResponse(response.body);
          }

          const commandOk =
            response.status >= 200 && response.status < 300 && parsed.ok;
          const result: DeviceCommandResult = {
            command: item.command,
            ok: commandOk,
            status: response.status,
            durationMs: Date.now() - startedAt,
            requestId: commandRequestId,
            error: commandOk ? undefined : parsed.error,
            code: commandOk
              ? undefined
              : parsed.supported
                ? "DEVICE_ERROR"
                : "INVALID_DEVICE_RESPONSE",
          };
          results.push(result);

          if (!commandOk) {
            ok = false;
            break;
          }
        } catch (error) {
          const normalized = normalizeDeviceError(error);
          results.push({
            command: item.command,
            ok: false,
            status: normalized.status,
            durationMs: Date.now() - startedAt,
            requestId: commandRequestId,
            error: normalized.message,
            code: normalized.code,
          });
          ok = false;
          break;
        }

        // The delay separates two IR commands. Waiting after the last command
        // only delays the HTTP response (the old client did wait, but there is
        // nothing to separate).
        if (index < sequence.length - 1 && item.delayAfterMs > 0) {
          await sleep(Math.min(item.delayAfterMs, MAX_SEQUENCE_DELAY_MS));
        }
      }

      return {
        ok,
        requestId: normalizedRequestId,
        results,
        error: ok ? undefined : results.find((result) => !result.ok)?.error,
        code: ok ? undefined : results.find((result) => !result.ok)?.code,
      };
    },
    { maxWaitMs: options.queueMaxWaitMs },
  );
};

