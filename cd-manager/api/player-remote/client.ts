import { PlayerCommand, PlayerDefinition } from "../types";

type CommandResponse = {
    status?: "success" | "failure";
    commands: string[];
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
        let message = `IR Remote Client: Network error while ${context}.`;

        if (error instanceof TypeError) {
            message += " This might be due to Mixed Content (HTTPS calling HTTP) or CORS.";
            message += " Please ensure your browser allows insecure content for this site.";
        }

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

    const getProxyUrl = (targetUrl: string): string => {
        const params = new URLSearchParams({ url: targetUrl });
        return `/api/proxy-remote?${params.toString()}`;
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

        try {
            // Use Proxy
            const response = await fetch(getProxyUrl(definition.irCommandsUrl), {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch commands: ${response.status} ${response.statusText}`);
            }

            const data: CommandResponse = await response.json();

            // Check for success or missing status, but commands array must exist
            if ((!data.status || data.status === "success") && Array.isArray(data.commands)) {
                availableCommands.clear();

                data.commands.forEach((cmdString) => {
                    // Format expected: `${deviceName}${commandId}`
                    if (cmdString.startsWith(deviceName)) {
                        const idPart = cmdString.slice(deviceName.length);
                        const commandId = parseInt(idPart, 10);

                        if (!isNaN(commandId)) {
                            availableCommands.add(commandId);
                        }
                    }
                });
                return true;
            }

            console.warn("IR Remote Client: Invalid response format", data);
            return false;
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

        for (const item of sequence) {
            const commandId = item.command;

            const url = new URL(definition.irSendCommandUrl);
            if (deviceName) {
                url.searchParams.set("device", deviceName);
            }
            url.searchParams.set("command", commandId.toString());

            try {
                // Use Proxy
                const response = await fetch(getProxyUrl(url.toString()), {
                    method: "GET",
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error(`Failed to emit command: ${response.status} ${response.statusText}`);
                }
                
                // Wait for the specified duration before next command (or finishing)
                if (item.delayAfterMs > 0) {
                     await new Promise(resolve => setTimeout(resolve, item.delayAfterMs));
                }

            } catch (error) {
                handleNetworkError(error, "emitting command");
                throw error;
            }
        }

        return true;
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
