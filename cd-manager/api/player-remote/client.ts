import { PlayerCommand, PlayerDefinition } from "../types";

type CommandResponse = {
    status: "success" | "failure";
    commands: string[];
};

export type IrCommandSequenceItem = {
    command: PlayerCommand;
    delayAfterMs: number;
};

export type IrRemoteClient = {
    init: () => Promise<void>;
    sendOrder: (sequence: IrCommandSequenceItem[]) => Promise<boolean>;
    isCommandSupported: (command: PlayerCommand) => boolean;
    canExecuteSequence: (sequence: IrCommandSequenceItem[]) => boolean;
};

export const createIrRemoteClient = (definition: PlayerDefinition): IrRemoteClient => {
    let availableCommands: Set<number> = new Set();
    let initialized = false;

    const handleNetworkError = (error: unknown, context: string) => {
        let message = `IR Remote Client: Network error while ${context}.`;

        if (error instanceof TypeError) {
            message += " This might be due to Mixed Content (HTTPS calling HTTP) or CORS.";
            message += " Please ensure your browser allows insecure content for this site.";
        }

        console.error(message, error);
    };

    const getDeviceName = (): string | null => {
        if (!definition.irSendCommandUrl) return null;
        try {
            const url = new URL(definition.irSendCommandUrl);
            return url.searchParams.get("device");
        } catch {
            return null;
        }
    };

    const getProxyUrl = (targetUrl: string): string => {
        const params = new URLSearchParams({ url: targetUrl });
        return `/api/proxy-remote?${params.toString()}`;
    };

    const init = async (): Promise<void> => {
        if (!definition.irCommandsUrl) {
            console.warn("IR Remote Client: No irCommandsUrl configured.");
            return;
        }

        // Attempt to extract device name from send URL
        const deviceName = getDeviceName();
        if (!deviceName) {
            if (definition.active) {
                console.warn("IR Remote Client: Could not determine device name from irSendCommandUrl.");
            }
            return;
        }

        try {
            // Use Proxy
            const response = await fetch(getProxyUrl(definition.irCommandsUrl));

            if (!response.ok) {
                throw new Error(`Failed to fetch commands: ${response.status} ${response.statusText}`);
            }

            const data: CommandResponse = await response.json();

            if (data.status === "success" && Array.isArray(data.commands)) {
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

                initialized = true;
            } else {
                console.warn("IR Remote Client: Invalid response format", data);
            }
        } catch (error) {
             handleNetworkError(error, "fetching commands");
        }
    };

    const sendOrder = async (sequence: IrCommandSequenceItem[]): Promise<boolean> => {
        if (!definition.irSendCommandUrl) {
            throw new Error("IR Remote Client: No irSendCommandUrl configured.");
        }

        for (const item of sequence) {
            const commandId = item.command;

            const url = new URL(definition.irSendCommandUrl);
            url.searchParams.append("command", commandId.toString());

            try {
                // Use Proxy
                const response = await fetch(getProxyUrl(url.toString()), {
                    method: "GET",
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
        return sequence.every(item => isCommandSupported(item.command));
    };

    return {
        init,
        sendOrder,
        isCommandSupported,
        canExecuteSequence,
    };
};
