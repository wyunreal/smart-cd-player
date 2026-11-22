
import { createIrRemoteClient, sendPowerToAllPlayers } from "../client";
import type { IrRemoteClient } from "../client";
import { PlayerCommand, PlayerDefinition } from "../../types";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const COMMANDS_URL = "http://localhost:4000/commands";
const SEND_COMMAND_URL = "http://localhost:4000/remote";

const jsonResponse = (
    body: unknown,
    init: { ok?: boolean; status?: number; statusText?: string } = {},
) => ({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? "",
    json: async () => body,
});

const requestUrl = (callIndex = 0): URL => {
    const [url] = mockFetch.mock.calls[callIndex];
    return new URL(url, "http://localhost");
};

const requestInit = (callIndex = 0): RequestInit =>
    mockFetch.mock.calls[callIndex][1] as RequestInit;

describe("IrRemoteClient", () => {
    const mockDefinition: PlayerDefinition = {
        active: true,
        remoteIndex: 1,
        capacity: 1,
        irCommandsUrl: COMMANDS_URL,
        irSendCommandUrl: SEND_COMMAND_URL,
        irDeviceName: "MyDevice",
    };

    beforeEach(() => {
        mockFetch.mockReset();
    });

    it("fetches commands from the live endpoint and filters by device name", async () => {
        mockFetch.mockResolvedValueOnce(
            jsonResponse({
                commands: [
                    `MyDevice${PlayerCommand.Play}`,
                    `OtherDevice${PlayerCommand.Stop}`,
                    `MyDevice${PlayerCommand.Pause}`,
                ],
            }),
        );

        const client = createIrRemoteClient(mockDefinition);
        await client.init();

        const url = requestUrl();
        expect(url.pathname).toBe("/api/remote/commands");
        expect(url.searchParams.get("url")).toBe(COMMANDS_URL);
        expect(url.searchParams.get("deviceId")).toBeNull();
        expect(url.searchParams.get("_")).toBeTruthy();
        expect(requestInit()).toEqual(
            expect.objectContaining({ cache: "no-store" }),
        );
        expect(client.isCommandSupported(PlayerCommand.Play)).toBe(true);
        expect(client.isCommandSupported(PlayerCommand.Pause)).toBe(true);
        expect(client.isCommandSupported(PlayerCommand.Stop)).toBe(false); // OtherDevice
    });

    it("uses a unique anti-cache nonce on every remote request", async () => {
        mockFetch
            .mockResolvedValueOnce(jsonResponse({ commands: [] }))
            .mockResolvedValueOnce(jsonResponse({ commands: [] }));

        const client = createIrRemoteClient(mockDefinition);
        await client.init();
        await client.init();

        const first = requestUrl(0).searchParams.get("_");
        const second = requestUrl(1).searchParams.get("_");
        expect(first).toBeTruthy();
        expect(second).toBeTruthy();
        expect(first).not.toBe(second);
    });

    it("uses the remote device id in the command-list request when configured", async () => {
        mockFetch.mockResolvedValueOnce(
            jsonResponse({ commands: [`MyDevice${PlayerCommand.Play}`] }),
        );

        const client = createIrRemoteClient({
            ...mockDefinition,
            remoteDeviceId: "device-123",
        });
        await client.init();

        const url = requestUrl();
        expect(url.pathname).toBe("/api/remote/commands");
        expect(url.searchParams.get("deviceId")).toBe("device-123");
        expect(url.searchParams.get("url")).toBe(COMMANDS_URL);
        expect(url.searchParams.get("_")).toBeTruthy();
        expect(requestInit()).toEqual(
            expect.objectContaining({ cache: "no-store" }),
        );
    });

    it("should handle missing configuration gracefully", async () => {
        const badDefinition = { ...mockDefinition, irDeviceName: undefined };
        const client = createIrRemoteClient(badDefinition);

        // Should not crash, just warn and init nothing
        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
        await client.init();

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Could not determine device name"));
        expect(client.isCommandSupported(PlayerCommand.Play)).toBe(false);

        consoleSpy.mockRestore();
    });

    it("derives the device name from the send URL when irDeviceName is missing", async () => {
        mockFetch.mockResolvedValueOnce(
            jsonResponse({
                commands: [
                    `DeviceA${PlayerCommand.PowerSwitch}`,
                    `DeviceA${PlayerCommand.Play}`,
                ],
            }),
        );

        const client = createIrRemoteClient({
            ...mockDefinition,
            irDeviceName: undefined,
            irSendCommandUrl: "http://localhost:4000/remote?device=DeviceA",
        });
        await client.init();

        expect(client.isCommandSupported(PlayerCommand.PowerSwitch)).toBe(true);
        expect(client.isCommandSupported(PlayerCommand.Play)).toBe(true);
    });

    it("should not warn if missing configuration but player is inactive", async () => {
        const inactiveDefinition = { ...mockDefinition, active: false, irDeviceName: undefined };
        const client = createIrRemoteClient(inactiveDefinition);

        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
        await client.init();

        expect(consoleSpy).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it("should handle empty commands list", async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ commands: [] }));

        const client = createIrRemoteClient(mockDefinition);
        await client.init();

        const url = requestUrl();
        expect(url.pathname).toBe("/api/remote/commands");
        expect(url.searchParams.get("url")).toBe(COMMANDS_URL);
        expect(url.searchParams.get("_")).toBeTruthy();
        expect(requestInit()).toEqual(
            expect.objectContaining({ cache: "no-store" }),
        );
        expect(client.isCommandSupported(PlayerCommand.Play)).toBe(false);
    });

    it("sends the whole sequence in one POST command request", async () => {
        mockFetch.mockResolvedValueOnce(
            jsonResponse({ ok: true, requestId: "request-1" }),
        );

        const client = createIrRemoteClient(mockDefinition);
        const sequence = [
            { command: PlayerCommand.Play, delayAfterMs: 10 },
            { command: PlayerCommand.Stop, delayAfterMs: 0 },
        ];

        await client.sendOrder(sequence);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const init = requestInit();
        expect(init.method).toBe("POST");
        expect(init.cache).toBe("no-store");

        const body = JSON.parse(init.body as string);
        expect(body.targetUrl).toBe(SEND_COMMAND_URL);
        expect(body.device).toBe("MyDevice");
        expect(body.sequence).toEqual(sequence);
        expect(body.requestId).toEqual(expect.any(String));

        const url = requestUrl();
        expect(url.pathname).toBe("/api/remote/command");
        // The URL nonce also defeats intermediaries that cache POST by path.
        expect(url.searchParams.get("_")).toBe(body.requestId);
    });

    it("emits the power command (id 0) and keeps a single device param", async () => {
        mockFetch.mockResolvedValueOnce(
            jsonResponse({ ok: true, requestId: "request-1" }),
        );

        const client = createIrRemoteClient({
            ...mockDefinition,
            irDeviceName: undefined,
            irSendCommandUrl: "http://localhost:4000/remote?device=MyDevice",
        });

        await client.sendOrder([
            { command: PlayerCommand.PowerSwitch, delayAfterMs: 0 },
        ]);

        const [, init] = mockFetch.mock.calls[0];
        const body = JSON.parse(init.body);
        const targetUrl = new URL(body.targetUrl);

        expect(targetUrl.searchParams.getAll("device")).toEqual(["MyDevice"]);
        expect(body.device).toBe("MyDevice");
        expect(body.sequence).toEqual([
            { command: PlayerCommand.PowerSwitch, delayAfterMs: 0 },
        ]);
    });

    it("throws when the server rejects the command", async () => {
        mockFetch.mockResolvedValueOnce(
            jsonResponse(
                {
                    ok: false,
                    code: "DEVICE_OFFLINE",
                    error: "The remote device is temporarily unavailable.",
                },
                { status: 503 },
            ),
        );

        const client = createIrRemoteClient(mockDefinition);
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        await expect(
            client.sendOrder([
                { command: PlayerCommand.Play, delayAfterMs: 0 },
            ]),
        ).rejects.toThrow(/DEVICE_OFFLINE/);

        consoleSpy.mockRestore();
    });

    it("should initialize with empty commands on fetch error", async () => {
        mockFetch.mockRejectedValue(new Error("Network error"));

        const client = createIrRemoteClient(mockDefinition);

        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        await expect(client.init()).resolves.not.toThrow();

        expect(client.isCommandSupported(PlayerCommand.Play)).toBe(false);

        consoleSpy.mockRestore();
    });

    describe("canExecuteSequence", () => {
        it("should return true if all commands in sequence are supported", async () => {
            mockFetch.mockResolvedValueOnce(
                jsonResponse({
                    commands: [`MyDevice${PlayerCommand.Play}`, `MyDevice${PlayerCommand.Stop}`],
                }),
            );

            const client = createIrRemoteClient(mockDefinition);
            await client.init();

            const sequence = [
                { command: PlayerCommand.Play, delayAfterMs: 0 },
                { command: PlayerCommand.Stop, delayAfterMs: 0 },
            ];

            expect(client.canExecuteSequence(sequence)).toBe(true);
        });

        it("should return false if any command in sequence is not supported", async () => {
            mockFetch.mockResolvedValueOnce(
                jsonResponse({ commands: [`MyDevice${PlayerCommand.Play}`] }),
            );

            const client = createIrRemoteClient(mockDefinition);
            await client.init();

            const sequence = [
                { command: PlayerCommand.Play, delayAfterMs: 0 },
                { command: PlayerCommand.Stop, delayAfterMs: 0 },
            ];

            expect(client.canExecuteSequence(sequence)).toBe(false);
        });

        it("should return true for empty sequence", async () => {
            mockFetch.mockResolvedValueOnce(jsonResponse({ commands: [] }));

            const client = createIrRemoteClient(mockDefinition);
            await client.init();

            expect(client.canExecuteSequence([])).toBe(true);
        });
    });

    it("should handle relative URLs correctly", async () => {
        const relativeDefinition = {
            ...mockDefinition,
            irCommandsUrl: "/api/commands",
            irSendCommandUrl: "/api/remote",
        };

        mockFetch.mockResolvedValueOnce(
            jsonResponse({ commands: [`MyDevice${PlayerCommand.Play}`] }),
        );

        const client = createIrRemoteClient(relativeDefinition);
        await client.init();

        const url = requestUrl();
        expect(url.pathname).toBe("/api/remote/commands");
        expect(url.searchParams.get("url")).toBe("/api/commands");
        expect(url.searchParams.get("_")).toBeTruthy();
        expect(requestInit()).toEqual(
            expect.objectContaining({ cache: "no-store" }),
        );
        expect(client.isCommandSupported(PlayerCommand.Play)).toBe(true);
    });
});

describe("sendPowerToAllPlayers", () => {
    const makeClient = (
        supportsPower: boolean,
        sendOrder = jest.fn().mockResolvedValue(true),
    ): IrRemoteClient => ({
        init: jest.fn().mockResolvedValue(true),
        sendOrder,
        isCommandSupported: (command) =>
            supportsPower && command === PlayerCommand.PowerSwitch,
        canExecuteSequence: () => true,
    });

    it("sends the power toggle to every player that supports it", async () => {
        const first = makeClient(true);
        const unsupported = makeClient(false);
        const last = makeClient(true);

        await sendPowerToAllPlayers([first, null, unsupported, last]);

        const expected = [
            { command: PlayerCommand.PowerSwitch, delayAfterMs: 0 },
        ];
        expect(first.sendOrder).toHaveBeenCalledWith(expected);
        expect(unsupported.sendOrder).not.toHaveBeenCalled();
        expect(last.sendOrder).toHaveBeenCalledWith(expected);
    });

    it("keeps going when one player fails", async () => {
        const failing = makeClient(
            true,
            jest.fn().mockRejectedValue(new Error("offline")),
        );
        const working = makeClient(true);
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();

        await expect(
            sendPowerToAllPlayers([failing, working]),
        ).resolves.toBeUndefined();

        expect(working.sendOrder).toHaveBeenCalledTimes(1);
        consoleSpy.mockRestore();
    });
});
