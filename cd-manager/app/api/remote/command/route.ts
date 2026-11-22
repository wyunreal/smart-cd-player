import { NextRequest } from "next/server";
import { errorResponse, jsonNoStore } from "@/lib/api-response";
import {
  DeviceSequenceItem,
  sendDeviceSequence,
} from "@/lib/remote-device-client";
import { RemoteError } from "@/lib/remote-errors";
import { isAllowedProxyUrl } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const MAX_SEQUENCE_ITEMS = 20;
const MAX_SEQUENCE_DELAY_MS = 15_000;
const MAX_COMMAND_ID = 30;

type CommandBody = {
  deviceId?: unknown;
  targetUrl?: unknown;
  url?: unknown;
  legacyUrl?: unknown;
  device?: unknown;
  command?: unknown;
  sequence?: unknown;
  requestId?: unknown;
  preferPost?: unknown;
};

const parseSequence = (body: CommandBody): DeviceSequenceItem[] => {
  const raw = body.sequence;
  if (raw !== undefined) {
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new RemoteError(
        "INVALID_REQUEST",
        "sequence must be a non-empty array.",
        400,
      );
    }
    if (raw.length > MAX_SEQUENCE_ITEMS) {
      throw new RemoteError(
        "INVALID_REQUEST",
        `sequence cannot contain more than ${MAX_SEQUENCE_ITEMS} commands.`,
        400,
      );
    }

    const sequence: DeviceSequenceItem[] = raw.map((item, index) => {
      if (!item || typeof item !== "object") {
        throw new RemoteError(
          "INVALID_REQUEST",
          `sequence[${index}] is invalid.`,
          400,
        );
      }
      const candidate = item as Record<string, unknown>;
      const command = candidate.command;
      const delayAfterMs = candidate.delayAfterMs ?? 0;
      if (
        typeof command !== "number" ||
        !Number.isInteger(command) ||
        command < 0 ||
        command > MAX_COMMAND_ID
      ) {
        throw new RemoteError(
          "INVALID_REQUEST",
          `sequence[${index}].command is invalid.`,
          400,
        );
      }
      if (
        typeof delayAfterMs !== "number" ||
        !Number.isFinite(delayAfterMs) ||
        delayAfterMs < 0 ||
        delayAfterMs > MAX_SEQUENCE_DELAY_MS
      ) {
        throw new RemoteError(
          "INVALID_REQUEST",
          `sequence[${index}].delayAfterMs is invalid.`,
          400,
        );
      }
      return { command, delayAfterMs };
    });

    const totalDelay = sequence.reduce(
      (total, item) => total + item.delayAfterMs,
      0,
    );
    if (totalDelay > MAX_SEQUENCE_DELAY_MS) {
      throw new RemoteError(
        "INVALID_REQUEST",
        `The sequence delay cannot exceed ${MAX_SEQUENCE_DELAY_MS} ms.`,
        400,
      );
    }
    return sequence;
  }

  const command = body.command;
  if (
    typeof command !== "number" ||
    !Number.isInteger(command) ||
    command < 0 ||
    command > MAX_COMMAND_ID
  ) {
    throw new RemoteError(
      "INVALID_REQUEST",
      "A command or sequence is required.",
      400,
    );
  }
  return [{ command, delayAfterMs: 0 }];
};

export async function POST(request: NextRequest) {
  // JSON + same-origin is the CSRF boundary for this side-effecting endpoint.
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return errorResponse(
      new RemoteError("INVALID_REQUEST", "Cross-site requests are not allowed.", 403),
    );
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse(
      new RemoteError(
        "INVALID_REQUEST",
        "Content-Type must be application/json.",
        415,
      ),
    );
  }

  let body: CommandBody;
  try {
    body = (await request.json()) as CommandBody;
  } catch {
    return errorResponse(
      new RemoteError("INVALID_REQUEST", "Invalid JSON body.", 400),
    );
  }

  const targetUrl =
    (typeof body.targetUrl === "string" && body.targetUrl.trim()) ||
    (typeof body.url === "string" && body.url.trim()) ||
    (typeof body.legacyUrl === "string" && body.legacyUrl.trim()) ||
    "";

  if (!targetUrl) {
    return errorResponse(
      new RemoteError("INVALID_REQUEST", "Missing targetUrl.", 400),
    );
  }
  if (!isAllowedProxyUrl(targetUrl)) {
    return errorResponse(
      new RemoteError("INVALID_REQUEST", "URL not allowed.", 403),
    );
  }

  const device = typeof body.device === "string" ? body.device.trim() : "";
  if (!device) {
    return errorResponse(
      new RemoteError("INVALID_REQUEST", "Missing device name.", 400),
    );
  }

  let sequence: DeviceSequenceItem[];
  try {
    sequence = parseSequence(body);
  } catch (error) {
    return errorResponse(error);
  }

  const deviceId =
    typeof body.deviceId === "string" && body.deviceId.trim()
      ? body.deviceId.trim()
      : null;
  const requestId =
    typeof body.requestId === "string" && body.requestId.trim()
      ? body.requestId.trim().slice(0, 128)
      : undefined;
  const preferPost =
    body.preferPost === true ||
    process.env.REMOTE_DEVICE_HTTP_POST === "true";

  try {
    const result = await sendDeviceSequence(
      deviceId ? { id: deviceId, url: targetUrl } : { url: targetUrl },
      device,
      sequence,
      requestId,
      { preferPost },
    );

    return jsonNoStore(result, { status: result.ok ? 200 : 207 });
  } catch (error) {
    return errorResponse(error, "Failed to send the remote command.");
  }
}
