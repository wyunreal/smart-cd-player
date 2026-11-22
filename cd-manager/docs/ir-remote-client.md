# IR Remote Client

The `IrRemoteClient` interacts with the IR remote hardware (ESP32) through the
cd-manager server. The browser never talks to the device directly: the server
resolves the device, serializes requests and proxies them.

## Features

-   **Live command discovery**: `GET /api/remote/commands` reads the device
    command list on every request. There is no command cache and no stale
    fallback.
-   **Non-cacheable command emission**: `POST /api/remote/command` sends a
    sequence with a `requestId`. Commands have side effects and are never
    served from a cache.
-   **Per-device serialization**: all operations against one device run one at
    a time, with short timeouts. This is a queue, not a cache.
-   **No legacy fallback**: the current client always uses the live endpoints.
    The old `/api/proxy-remote` route remains only for old clients during
    migration.

## Configuration

The client is configured via `PlayerDefinition`:

-   `irCommandsUrl`: URL of the device command list.
    Example: `http://smartcdplayer.local/commands`
-   `irSendCommandUrl`: URL used to emit commands.
    Example: `http://smartcdplayer.local/remote`
-   `irDeviceName`: name of the IR device inside the remote controller
    (e.g. `SonyChanger`). If omitted, it is derived from the `device` query
    parameter of `irSendCommandUrl`.
-   `remoteDeviceId` (optional): stable id from the device registry. When set,
    the server can resolve the current address without relying on the hostname.

The device returns commands in the form `<deviceName><commandId>`:

```json
{
  "status": "success",
  "commands": ["SonyChanger0", "SonyChanger1", "SonyChanger7"]
}
```

The client filters by `irDeviceName` and parses the numeric command id.

## Usage

```typescript
const client = createIrRemoteClient(definition);
await client.init();

if (client.isCommandSupported(PlayerCommand.Play)) {
  await client.sendOrder([
    { command: PlayerCommand.Play, delayAfterMs: 0 },
    { command: PlayerCommand.NextTrack, delayAfterMs: 1000 },
  ]);
}
```

`sendOrder` sends the whole sequence in one `POST`. The server applies the
delays and sends each command to the device sequentially.

## Troubleshooting

### The command buttons stay disabled

`init()` returns false until the device responds with a live command list.
Check:

-   `GET /api/remote/commands?url=...` from the browser/server.
-   The device `/commands` endpoint.
-   `irDeviceName` exactly matches the prefix stored on the device.
-   The device is online. There is no cached list to fall back to.

### Commands fail with `DEVICE_UNREACHABLE` / `DEVICE_TIMEOUT`

The manager could not reach the device. Check that the device is powered and on
the same network. There is no circuit breaker: the next command will try again
immediately.

### The old `.local` hostname does not resolve

The server sends a fresh mDNS query on every request. Avahi/D-Bus are no longer
required for the command path. If mDNS is blocked, use the device registry
(Phase 1) or configure a reachable address.

### Mixed content

The browser always calls same-origin `/api/remote/*` routes over HTTPS; the
server performs the HTTP request to the local device. There is no browser
mixed-content request.
