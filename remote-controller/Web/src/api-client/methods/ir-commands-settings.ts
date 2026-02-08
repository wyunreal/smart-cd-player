import { ApiMethod, SetterResponse } from 'api-client/types';

export const enum IrCommandId {
    PowerSwitch,
    Play,
    Pause,
    Stop,
    NextTrack,
    PreviousTrack,
    FastForward,
    FastBackward,
    NextDisk,
    PreviousDisk,
    DiskSelect,
    TrackSelect,
    Number0,
    Number1,
    Number2,
    Number3,
    Number4,
    Number5,
    Number6,
    Number7,
    Number8,
    Number9,
    Enter,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowDown,
    PlayModeContinue,
    PlayModeShuffle,
    PlayModeProgram,
    PlayModeRepeat,
}

export enum LearnMode {
    OnlyMissingCommands,
    AllCommandsFromIncompleteGroups,
    AllCommands,
}

export enum LearningState {
    Info,
    Idle,
    Learning,
    Success,
    Timeout,
}

type StoredCommands = { [deviceName: string]: Set<IrCommandId> };

export type IrCommandsSettingsData = {
    storedCommands: StoredCommands;
    currentEditDeviceName?: string;
    learnMode?: LearnMode;
};

export type GetIrCommandsSettingsSignature =
    () => Promise<IrCommandsSettingsData>;

type StartRecordIrCommandsData = {
    deviceName: string;
    commandId: IrCommandId;
};

export type StartRecordIrCommandsSignature = (
    data: StartRecordIrCommandsData,
) => Promise<SetterResponse>;

export type StopRecordIrCommandsSignature = () => Promise<SetterResponse>;

type GetIrCommandsResponseFromModule = {
    commands: Array<string>;
};

export type IrCommandRead = {
    irType: string;
    irBits: string;
    irValue: string;
};

export type IrReadSuccessNotification = IrCommandRead & {
    requestId: number;
    type: 'irReadSuccess';
};

export type IrReadTimeoutNotification = {
    requestId: number;
    type: 'irReadTimeout';
};

export const getIrCommandsSettings: ApiMethod<GetIrCommandsSettingsSignature> =
    (apiSocket) => async () => {
        const commandsFromModule = (await apiSocket.send({
            handler: 'irCommandsSettings',
        })) as unknown as GetIrCommandsResponseFromModule;

        const commandsMap = commandsFromModule.commands.reduce(
            (map, command) => {
                const match = command.match(/^([a-zA-Z]+)(\d+)$/);
                if (match) {
                    const [, key, number] = match;
                    if (!map[key]) {
                        map[key] = new Set<number>();
                    }
                    map[key].add(Number(number));
                }
                return map;
            },
            {} as Record<string, Set<number>>,
        );

        return { storedCommands: commandsMap };
    };

export const startRecordIrCommands: ApiMethod<StartRecordIrCommandsSignature> =
    (apiSocket) => (data: StartRecordIrCommandsData) => {
        return apiSocket.send({
            handler: 'startRecordIrCommand',
            ...data,
        }) as unknown as ReturnType<StartRecordIrCommandsSignature>;
    };

export const stopRecordIrCommands: ApiMethod<StopRecordIrCommandsSignature> =
    (apiSocket) => () => {
        return apiSocket.send({
            handler: 'stopRecordIrCommand',
        }) as unknown as ReturnType<StopRecordIrCommandsSignature>;
    };
