import { PlayerCommand, PlayerDefinition } from "../types";

type CommandResponse = {
    status: "success" | "failure";
    commands: string[];
};

export type IrRemoteClient = {
    init: () => Promise<void>;
    emit: (command: PlayerCommand) => Promise<boolean>;
    isCommandSupported: (command: PlayerCommand) => boolean;
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
            const response = await fetch(definition.irCommandsUrl);

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

    const emit = async (command: PlayerCommand): Promise<boolean> => {
        if (!definition.irSendCommandUrl) {
            throw new Error("IR Remote Client: No irSendCommandUrl configured.");
        }

        const commandId = command;

        const url = new URL(definition.irSendCommandUrl);
        url.searchParams.append("command", commandId.toString());

        try {
            const response = await fetch(url.toString(), {
                method: "GET",
                mode: "cors",
            });

            if (!response.ok) {
                throw new Error(`Failed to emit command: ${response.status} ${response.statusText}`);
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

    return {
        init,
        emit,
        isCommandSupported,
    };
};
