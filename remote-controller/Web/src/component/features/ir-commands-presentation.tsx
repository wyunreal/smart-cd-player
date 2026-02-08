import { IrCommandId } from 'api-client/methods/ir-commands-settings';
import { IconType } from 'component/types';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import GamesOutlinedIcon from '@mui/icons-material/GamesOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import AlbumOutlinedIcon from '@mui/icons-material/AlbumOutlined';
import DialpadOutlinedIcon from '@mui/icons-material/DialpadOutlined';
import PlaylistPlayOutlinedIcon from '@mui/icons-material/PlaylistPlayOutlined';

export enum CommandGroupId {
    Playback,
    TrackControl,
    DiskControl,
    Navigation,
    FreeSelection,
    PlayMode,
}

const IrCommandsGroups: Record<CommandGroupId, IrCommandId[]> = {
    [CommandGroupId.Playback]: [
        IrCommandId.PowerSwitch,
        IrCommandId.Play,
        IrCommandId.Pause,
        IrCommandId.Stop,
    ],
    [CommandGroupId.TrackControl]: [
        IrCommandId.NextTrack,
        IrCommandId.PreviousTrack,
        IrCommandId.FastForward,
        IrCommandId.FastBackward,
    ],
    [CommandGroupId.DiskControl]: [
        IrCommandId.NextDisk,
        IrCommandId.PreviousDisk,
    ],
    [CommandGroupId.Navigation]: [
        IrCommandId.ArrowLeft,
        IrCommandId.ArrowRight,
        IrCommandId.ArrowUp,
        IrCommandId.ArrowDown,
    ],
    [CommandGroupId.FreeSelection]: [
        IrCommandId.Enter,
        IrCommandId.DiskSelect,
        IrCommandId.TrackSelect,
        IrCommandId.Number0,
        IrCommandId.Number1,
        IrCommandId.Number2,
        IrCommandId.Number3,
        IrCommandId.Number4,
        IrCommandId.Number5,
        IrCommandId.Number6,
        IrCommandId.Number7,
        IrCommandId.Number8,
        IrCommandId.Number9,
    ],
    [CommandGroupId.PlayMode]: [
        IrCommandId.PlayModeContinue,
        IrCommandId.PlayModeShuffle,
        IrCommandId.PlayModeProgram,
        IrCommandId.PlayModeRepeat,
    ],
};

export const getCommandGroupId = (commandId: IrCommandId): CommandGroupId => {
    for (const groupId in IrCommandsGroups) {
        const groupKey = groupId as any as CommandGroupId;
        if (IrCommandsGroups[groupKey].includes(commandId)) {
            return groupKey;
        }
    }
    throw new Error(`Command ID ${commandId} does not belong to any group.`);
};

export const getAllCommands = (): IrCommandId[] => {
    return Object.values(IrCommandsGroups).flat();
};

export const getIrCommandName = (commandId: IrCommandId): string => {
    switch (commandId) {
        case IrCommandId.PowerSwitch:
            return 'Power';
        case IrCommandId.Play:
            return 'Play';
        case IrCommandId.Pause:
            return 'Pause';
        case IrCommandId.Stop:
            return 'Stop';
        case IrCommandId.NextTrack:
            return 'Next track';
        case IrCommandId.PreviousTrack:
            return 'Previous track';
        case IrCommandId.FastForward:
            return 'Fast forward';
        case IrCommandId.FastBackward:
            return 'Fast backward';
        case IrCommandId.NextDisk:
            return 'Next disk';
        case IrCommandId.PreviousDisk:
            return 'Previous disk';
        case IrCommandId.DiskSelect:
            return 'Disk select';
        case IrCommandId.TrackSelect:
            return 'Track select';
        case IrCommandId.Number0:
            return 'Number 0';
        case IrCommandId.Number1:
            return 'Number 1';
        case IrCommandId.Number2:
            return 'Number 2';
        case IrCommandId.Number3:
            return 'Number 3';
        case IrCommandId.Number4:
            return 'Number 4';
        case IrCommandId.Number5:
            return 'Number 5';
        case IrCommandId.Number6:
            return 'Number 6';
        case IrCommandId.Number7:
            return 'Number 7';
        case IrCommandId.Number8:
            return 'Number 8';
        case IrCommandId.Number9:
            return 'Number 9';
        case IrCommandId.Enter:
            return 'Enter';
        case IrCommandId.ArrowLeft:
            return 'Arrow left';
        case IrCommandId.ArrowRight:
            return 'Arrow right';
        case IrCommandId.ArrowUp:
            return 'Arrow up';
        case IrCommandId.ArrowDown:
            return 'Arrow down';
        case IrCommandId.PlayModeContinue:
            return 'Continue';
        case IrCommandId.PlayModeShuffle:
            return 'Shuffle';
        case IrCommandId.PlayModeProgram:
            return 'Program';
        case IrCommandId.PlayModeRepeat:
            return 'Repeat';
    }
};

const getGroupId = (group: any) => parseInt(group) as any as CommandGroupId;

export const getIrCommandGroupName = (
    commandGroup: CommandGroupId | string,
): string => {
    const commandGroupId = getGroupId(commandGroup);
    switch (commandGroupId) {
        case CommandGroupId.Playback:
            return 'Playback';
        case CommandGroupId.TrackControl:
            return 'Track Control';
        case CommandGroupId.DiskControl:
            return 'Disk Control';
        case CommandGroupId.FreeSelection:
            return 'Free Selection';
        case CommandGroupId.PlayMode:
            return 'Play Mode';
        case CommandGroupId.Navigation:
            return 'Navigation';
    }
};

export const getIrCommandGroupIcon = (
    commandGroup: CommandGroupId | string,
): IconType => {
    const commandGroupId = getGroupId(commandGroup);
    switch (commandGroupId) {
        case CommandGroupId.Playback:
            return PlayArrowOutlinedIcon;
        case CommandGroupId.TrackControl:
            return SwapHorizOutlinedIcon;
        case CommandGroupId.DiskControl:
            return AlbumOutlinedIcon;
        case CommandGroupId.FreeSelection:
            return DialpadOutlinedIcon;
        case CommandGroupId.PlayMode:
            return PlaylistPlayOutlinedIcon;
        case CommandGroupId.Navigation:
            return GamesOutlinedIcon;
    }
};

export type CommandGroupStatusRecord = Record<
    CommandGroupId,
    {
        status: 'complete' | 'incomplete';
        missingCommands: IrCommandId[];
    }
>;

export const getCommandGroupStatuses = (
    commands: IrCommandId[],
): CommandGroupStatusRecord => {
    const statuses: CommandGroupStatusRecord = {} as any;

    for (const groupId in IrCommandsGroups) {
        const groupKey = groupId as unknown as CommandGroupId;
        const groupCommands = IrCommandsGroups[groupKey];
        const missingCommands = groupCommands.filter(
            (command) => !commands.includes(command),
        );

        statuses[groupKey] = {
            status: missingCommands.length === 0 ? 'complete' : 'incomplete',
            missingCommands,
        };
    }

    return statuses;
};
