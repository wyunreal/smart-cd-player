# Remote-control hardening (Phase 0)

This document describes the server-side transport used by the web UI to talk to
the ESP32 IR remote controller.

## Why

The original path resolved `smartcdplayer.local` on every request through
Avahi/NSS. On a cold mDNS cache the first lookup failed after ~5 s, and
`avahi-resolve` cannot use the host D-Bus from the container. Commands were sent
with `GET`, which is cacheable by browsers/proxies, and multiple players could
send concurrent `/commands` requests that wedged the ESP32 web server.

Phase 0 replaces that path with:

- a self-contained mDNS resolver that queries **on every request**;
- a per-device request queue with timeouts;
- `POST` for command emission from the browser to the manager;
- `no-store` headers on every remote-control response.

**There is no command cache, no IP cache, no stale fallback and no circuit
breaker.** If the remote is offline, the UI stays disabled; it never sends a
stale command list or a command to a cached address.

The manager→device request still defaults to `GET` for compatibility with the
current firmware. It is a direct server-to-LAN request, not a browser request;
it is never cached by the manager. Set `REMOTE_DEVICE_HTTP_POST=true` when the
firmware exposes `POST /remote`.

## Endpoints

### `GET /api/remote/commands`

Query:

- `url`: full URL of the device `/commands` endpoint.
- `deviceId` (optional): stable device id; kept for the device registry phase.

Every request reads the device live. There is no `refresh`, `stale` or
`lastUpdated` field:

```json
{
  "deviceId": null,
  "commands": ["SonyChanger0", "SonyChanger1"]
}
```

If the device is offline, the endpoint returns an error; the UI does not get a
cached list.

### `POST /api/remote/command`

Request:

```json
{
  "targetUrl": "http://smartcdplayer.local/remote",
  "device": "SonyChanger",
  "sequence": [
    { "command": 1, "delayAfterMs": 0 },
    { "command": 3, "delayAfterMs": 250 }
  ],
  "requestId": "uuid"
}
```

- `targetUrl` (or `url`/`legacyUrl`) is required for the current configuration.
- `deviceId` is optional until the registry is deployed.
- The whole sequence is serialized per device and executed with the requested
  delays.
- Responses:
  - `200` all commands succeeded.
  - `207` at least one command failed; body has `ok: false` and `results`.
  - `400/403/415` validation/CSRF/content-type.
  - `503` queue timeout.
  - `504` device timeout.

Every response, including errors and unauthenticated `401`s, carries:

```text
Cache-Control: no-store, no-cache, must-revalidate, max-age=0
Pragma: no-cache
Expires: 0
```

The browser also adds a unique anti-cache nonce (`_`) to every remote-control
request URL, so even a proxy that ignores the headers cannot reuse a response
for a URL it has never seen. This hardening is scoped to `/api/remote/*` and
`/api/proxy-remote`; the rest of the web app keeps normal HTTP caching.

### Legacy `GET /api/proxy-remote`

Kept only for old clients during migration. It resolves `.local` with the
self-contained resolver on every request and serializes requests. The current
web client does **not** use it and has no legacy fallback: every command goes
through `POST /api/remote/command`.

## Resolution and queues

- `lib/remote-resolver.ts` sends a fresh mDNS query on every call. No positive,
  negative or stale cache.
- `lib/device-queue.ts` allows one operation per device at a time. This is not a
  cache: it prevents concurrent requests from wedging the ESP32.
- `lib/remote-device-client.ts` uses short timeouts and closes connections after
  each request. It does not open a circuit breaker, so a command is never
  blocked by a previous failure.

## Environment

- `REMOTE_DEVICE_HTTP_POST=true`: use `POST /remote` on the device. Leave unset
  for the current firmware (GET only).
- `ALLOWED_PROXY_ORIGINS`: comma-separated allowlist for non-`.local` device
  URLs. `.local` is always allowed by `isAllowedProxyUrl`.

## Not in Phase 0

- Device registry/heartbeat and zero-config UDP discovery (Phase 1).
- Firmware changes (`/info`, `/health`, POST `/remote`, mDNS re-init).
- UI status/error presentation; the buttons may stay disabled until commands
  are available.
