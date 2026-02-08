# IR Remote Client

The `IrRemoteClient` is a utility designed to interact with an IR remote hardware device via HTTP. It enables the Smart CD Player application to discover available commands and send them to the device.

## Features

-   **Command Discovery**: Fetches available commands from the configured `irCommandsUrl`.
-   **Command Filtering**: Automatically filters commands based on the device name derived from the `irSendCommandUrl`.
-   **Command Emission**: Sends commands to the `irSendCommandUrl`.
-   **Mixed Content Handling**: Provides guidance when HTTPS applications attempt to access local HTTP devices.
-   **Auto-Initialization**: Clients are initialized automatically when the application starts (via `DataRepositoryProvider`).

## Configuration

The client is configured via the `PlayerDefinition` object (typically found in `cd-player-definitions.ts` or managed via the UI).

### Key Properties

-   `irCommandsUrl`: The URL to fetch the list of available commands.
    -   Example: `http://192.168.1.100/commands`
    -   Expected JSON Response:
        ```json
        {
          "status": "success",
          "commands": ["Device1Play", "Device1Stop", "Device2Play"]
        }
        ```
-   `irSendCommandUrl`: The URL to send commands to. **Must include the `device` query parameter.**
    -   Example: `http://192.168.1.100/emit?device=Device1`
    -   The client extracts `Device1` from this URL and uses it to filter the commands (e.g., only commands starting with `Device1` will be considered valid for this player).

## Usage

The client is initialized and exposed via the `DataRepositoryContext`.

```typescript
// Accessing the client in a component
const { irRemoteClients } = useContext(DataRepositoryContext);
const client = irRemoteClients[playerIndex];

// Checking if a command is supported
if (client && client.isCommandSupported(PlayerCommand.Play)) {
    // ...
}

// Emitting a complex order
if (client) {
    await client.sendOrder([
        { command: PlayerCommand.Play, delayAfterMs: 1000 },
        { command: PlayerCommand.NextTrack, delayAfterMs: 0 }
    ]);
}
```

## Troubleshooting

### "Could not determine device name" Warning
If you see this warning, it means the `irSendCommandUrl` is missing the `?device=NAME` query parameter. The client requires this to know which commands belong to this player.

### Mixed Content Errors
If the app is running on HTTPS (e.g., Vercel) and the device is on HTTP (local network), the browser will block requests.
-   **Solution**: Use a local proxy or properly configure the browser/device to support secure connections.
