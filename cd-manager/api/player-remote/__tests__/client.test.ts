
import { createIrRemoteClient } from "../client";
import { PlayerCommand, PlayerDefinition } from "../../types";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const COMMANDS_URL = "http://localhost:4000/commands";
const SEND_COMMAND_URL = "http://localhost:4000/remote?device=MyDevice";

describe("IrRemoteClient", () => {
    const mockDefinition: PlayerDefinition = {
        active: true,
        remoteIndex: 1,
        capacity: 1,
        irCommandsUrl: COMMANDS_URL,
        irSendCommandUrl: SEND_COMMAND_URL,
        // deviceName removed
    };

    beforeEach(() => {
        mockFetch.mockClear();
    });

    it("should fetch commands on init and filter by deviceName from URL", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: "success",
                // 5 is Play, 7 is Stop
                commands: [
                    `MyDevice${PlayerCommand.Play}`,
                    `OtherDevice${PlayerCommand.Stop}`,
                    `MyDevice${PlayerCommand.Pause}`
                ]
            }),
        });

        const client = createIrRemoteClient(mockDefinition);
        await client.init();

        const expectedUrl = `/api/proxy-remote?url=${encodeURIComponent(COMMANDS_URL)}`;
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
        expect(client.isCommandSupported(PlayerCommand.Play)).toBe(true);
        expect(client.isCommandSupported(PlayerCommand.Pause)).toBe(true);
        expect(client.isCommandSupported(PlayerCommand.Stop)).toBe(false); // OtherDevice
    });

    it("should handle missing configuration gracefully", async () => {
        const badDefinition = { ...mockDefinition, irSendCommandUrl: undefined };
        const client = createIrRemoteClient(badDefinition);

        // Should not crash, just warn and init nothing
        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
        await client.init();

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Could not determine device name"));
        expect(client.isCommandSupported(PlayerCommand.Play)).toBe(false);

        consoleSpy.mockRestore();
    });

    it("should not warn if missing configuration but player is inactive", async () => {
        const inactiveDefinition = { ...mockDefinition, active: false, irSendCommandUrl: undefined };
        const client = createIrRemoteClient(inactiveDefinition);

        const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
        await client.init();

        expect(consoleSpy).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });


    it("should handle empty commands list", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: "success",
                commands: []
            }),
        });

        const client = createIrRemoteClient(mockDefinition);
        await client.init();

        const expectedUrl = `/api/proxy-remote?url=${encodeURIComponent(COMMANDS_URL)}`;
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
        expect(client.isCommandSupported(PlayerCommand.Play)).toBe(false);
    });

    it("should emit command sequence with correct URL and delays", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
        });

        const client = createIrRemoteClient(mockDefinition);
        const sequence = [
            { command: PlayerCommand.Play, delayAfterMs: 10 },
            { command: PlayerCommand.Stop, delayAfterMs: 0 }
        ];

        await client.sendOrder(sequence);

        expect(mockFetch).toHaveBeenCalledTimes(2);
        
        // First call
        const firstCall = mockFetch.mock.calls[0][0];
        expect(firstCall).toContain("/api/proxy-remote");
        expect(firstCall).toContain(encodeURIComponent(SEND_COMMAND_URL));
        expect(firstCall).toContain(`command%3D${PlayerCommand.Play}`);
        
        // Second call
        const secondCall = mockFetch.mock.calls[1][0];
        expect(secondCall).toContain("/api/proxy-remote");
        expect(secondCall).toContain(`command%3D${PlayerCommand.Stop}`);
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
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    status: "success",
                    commands: [`MyDevice${PlayerCommand.Play}`, `MyDevice${PlayerCommand.Stop}`]
                }),
            });

            const client = createIrRemoteClient(mockDefinition);
            await client.init();

            const sequence = [
                { command: PlayerCommand.Play, delayAfterMs: 0 },
                { command: PlayerCommand.Stop, delayAfterMs: 0 }
            ];

            expect(client.canExecuteSequence(sequence)).toBe(true);
        });

        it("should return false if any command in sequence is not supported", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    status: "success",
                    commands: [`MyDevice${PlayerCommand.Play}`]
                }),
            });

            const client = createIrRemoteClient(mockDefinition);
            await client.init();

            const sequence = [
                { command: PlayerCommand.Play, delayAfterMs: 0 },
                { command: PlayerCommand.Stop, delayAfterMs: 0 }
            ];

            expect(client.canExecuteSequence(sequence)).toBe(false);
        });

        it("should return true for empty sequence", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    status: "success",
                    commands: []
                }),
            });

            const client = createIrRemoteClient(mockDefinition);
            await client.init();

            expect(client.canExecuteSequence([])).toBe(true);
        });
    });
});
