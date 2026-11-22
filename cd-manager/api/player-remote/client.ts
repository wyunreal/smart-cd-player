import { PlayerCommand, PlayerDefinition } from "../types";

type CommandResponse = {
    status?: "success" | "failure";
    commands: string[];
};

type CommandApiResponse = {
    ok?: boolean;
    requestId?: string;
    code?: string;
    error?: string;
};

export type IrCommandSequenceItem = {
    command: PlayerCommand;
    delayAfterMs: number;
};

export type IrRemoteClient = {
    /** Returns true when the command list was fetched successfully. */
    init: () => Promise<boolean>;
    sendOrder: (sequence: IrCommandSequenceItem[]) => Promise<boolean>;
    isCommandSupported: (command: PlayerCommand) => boolean;
    canExecuteSequence: (sequence: IrCommandSequenceItem[]) => boolean;
};
export const createIrRemoteClient = (definition: PlayerDefinition): IrRemoteClient => {
    const availableCommands: Set<number> = new Set();

    const handleNetworkError = (error: unknown, context: string) => {
        const message = `IR Remote Client: Network error while ${context}.`;
        console.error(message, error);
    };

    const getDeviceName = (): string | null => {
        const configured = definition.irDeviceName?.trim();
        if (configured) {
            return configured;
        }

        // Older configurations put the device in the send URL
        // (`.../remote?device=Sony`); keep accepting that shape.
        if (!definition.irSendCommandUrl) {
            return null;
        }

        try {
            const url = new URL(definition.irSendCommandUrl, "http://localhost");
            return url.searchParams.get("device")?.trim() || null;
        } catch {
            return null;
        }
    };

    const createRequestId = (): string => {
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            return crypto.randomUUID();
        }
        return `cmd-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    };

    const timeoutSignal = (ms: number): AbortSignal | undefined => {
        if (typeof AbortSignal === "undefined") return undefined;
        if (typeof AbortSignal.timeout === "function") {
            return AbortSignal.timeout(ms);
        }
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
    };

    const getCommandsApiUrl = (): string | null => {
        if (!definition.irCommandsUrl) return null;
        const params = new URLSearchParams();
        if (definition.remoteDeviceId) {
            params.set("deviceId", definition.remoteDeviceId);
        }
        params.set("url", definition.irCommandsUrl);
        // Unique URL per read. `no-store` is the primary defence, but a
        // misconfigured CDN cannot serve a cached body for a URL it has never
        // seen before.
        params.set("_", createRequestId());
        return `/api/remote/commands?${params.toString()}`;
    };

    const applyCommands = (commands: string[], deviceName: string) => {
        availableCommands.clear();
        commands.forEach((cmdString) => {
            // Format expected: `${deviceName}${commandId}`
            if (cmdString.startsWith(deviceName)) {
                const idPart = cmdString.slice(deviceName.length);
                const commandId = parseInt(idPart, 10);

                if (!isNaN(commandId)) {
                    availableCommands.add(commandId);
                }
            }
        });
    };

    const parseCommandList = (data: unknown): string[] | null => {
        if (!data || typeof data !== "object") return null;
        const commands = (data as CommandResponse).commands;
        if (!Array.isArray(commands)) return null;
        return commands.filter(
            (command): command is string => typeof command === "string",
        );
    };

    const init = async (): Promise<boolean> => {
        if (!definition.irCommandsUrl) {
            console.warn("IR Remote Client: No irCommandsUrl configured.");
            return false;
        }

        // Attempt to extract device name from send URL
        const deviceName = getDeviceName();
        if (!deviceName) {
            if (definition.active) {
                console.warn("IR Remote Client: Could not determine device name from irSendCommandUrl.");
            }
            return false;
        }

        const commandsUrl = getCommandsApiUrl();
        if (!commandsUrl) return false;

        try {
            const response = await fetch(commandsUrl, {
                cache: "no-store",
                signal: timeoutSignal(6000),
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch commands: ${response.status} ${response.statusText}`,
                );
            }

            const data: CommandResponse = await response.json();
            const commands = parseCommandList(data);
            if (!commands) {
                console.warn("IR Remote Client: Invalid command list response", data);
                return false;
            }

            applyCommands(commands, deviceName);
            return true;
        } catch (error) {
            handleNetworkError(error, "fetching commands");
            return false;
        }
    };

    const sendOrder = async (sequence: IrCommandSequenceItem[]): Promise<boolean> => {
        if (!definition.irSendCommandUrl) {
            throw new Error("IR Remote Client: No irSendCommandUrl configured.");
        }

        const deviceName = getDeviceName();
        if (!deviceName) {
            throw new Error(
                "IR Remote Client: Could not determine the device name.",
            );
        }

        const requestId = createRequestId();
        const totalDelay = sequence.reduce(
            (total, item) => total + Math.max(0, item.delayAfterMs),
            0,
        );
        const timeoutMs = Math.min(120_000, totalDelay + 15_000);
        // The body already carries a unique requestId; the query nonce also
        // makes the URL unique so no intermediary can cache a POST response
        // keyed by path.
        const commandUrl = `/api/remote/command?_=${encodeURIComponent(requestId)}`;

        try {
            const response = await fetch(commandUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    targetUrl: definition.irSendCommandUrl,
                    deviceId: definition.remoteDeviceId,
                    device: deviceName,
                    sequence,
                    requestId,
                }),
                cache: "no-store",
                signal: timeoutSignal(timeoutMs),
            });

            const data = (await response.json().catch(() => null)) as
                | CommandApiResponse
                | null;

            if (!data) {
                throw new Error(
                    "IR Remote Client: invalid response from the command endpoint.",
                );
            }

            if (!response.ok || data.ok === false) {
                const code = data?.code ? ` (${data.code})` : "";
                const message = data?.error ?? response.statusText;
                throw new Error(
                    `IR Remote Client: command failed${code}: ${message}`,
                );
            }

            return true;
        } catch (error) {
            handleNetworkError(error, "emitting command");
            throw error;
        }
    };

    const isCommandSupported = (command: PlayerCommand): boolean => {
        return availableCommands.has(command);
    };

    const canExecuteSequence = (sequence: IrCommandSequenceItem[]): boolean => {
        const supported = sequence.every(item => isCommandSupported(item.command));
        if (!supported) {
            const unsupported = sequence.filter(item => !isCommandSupported(item.command));
            console.warn("IR Remote Client: Sequence not supported. Unsupported commands:", unsupported);
        }
        return supported;
    };

    return {
        init,
        sendOrder,
        isCommandSupported,
        canExecuteSequence,
    };
};

/**
 * Broadcast the power toggle to every player with an IR client.
 *
 * The remotes only expose a single PowerSwitch (toggle) command, so when the
 * players are off this turns them all on, and when they are on it turns them
 * all off.
 */
export const sendPowerToAllPlayers = async (
    clients: (IrRemoteClient | null)[],
): Promise<void> => {
    await Promise.all(
        clients.map(async (client) => {
            if (!client?.isCommandSupported(PlayerCommand.PowerSwitch)) {
                return;
            }

            try {
                await client.sendOrder([
                    { command: PlayerCommand.PowerSwitch, delayAfterMs: 0 },
                ]);
            } catch (error) {
                console.error("Failed to send power command", error);
            }
        }),
    );
};
