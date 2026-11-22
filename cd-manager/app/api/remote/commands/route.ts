import { NextRequest } from "next/server";
import { errorResponse, jsonNoStore } from "@/lib/api-response";
import { fetchDeviceCommands } from "@/lib/remote-device-client";
import { RemoteError } from "@/lib/remote-errors";
import { isAllowedProxyUrl } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * Read the device command list **live**. No server-side cache and no stale
 * fallback: if the device is offline, the UI stays disabled until it returns.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("deviceId")?.trim() || null;
  const targetUrl = searchParams.get("url")?.trim() || null;

  if (!targetUrl) {
    return errorResponse(
      new RemoteError(
        "INVALID_REQUEST",
        deviceId
          ? "The device registry is not enabled yet; include the device URL."
          : "Missing url parameter.",
        400,
      ),
    );
  }

  if (!isAllowedProxyUrl(targetUrl)) {
    return errorResponse(
      new RemoteError("INVALID_REQUEST", "URL not allowed.", 403),
    );
  }

  try {
    const fetched = await fetchDeviceCommands(
      deviceId
        ? { id: deviceId, url: targetUrl }
        : { url: targetUrl },
    );

    return jsonNoStore({
      deviceId,
      commands: fetched.commands,
    });
  } catch (error) {
    return errorResponse(error, "Failed to fetch the remote command list.");
  }
}
