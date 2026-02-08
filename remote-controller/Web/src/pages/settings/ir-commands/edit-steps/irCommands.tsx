import Info from '@mui/icons-material/Info';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DoneIcon from '@mui/icons-material/Done';
import {
    Button,
    CircularProgress,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { Box, Stack } from '@mui/system';
import useTheme from '@mui/material/styles/useTheme';
import {
    IrCommandId,
    IrCommandRead,
    IrCommandsSettingsData,
    IrReadSuccessNotification,
    LearningState,
    LearnMode,
} from 'api-client/methods/ir-commands-settings';
import IconText from 'component/building-blocks/icon-text';
import { GridItem } from 'layout/utils';
import { useContext, useEffect, useState } from 'react';
import {
    CommandGroupId,
    CommandGroupStatusRecord,
    getAllCommands,
    getCommandGroupId,
    getCommandGroupStatuses,
    getIrCommandGroupIcon,
    getIrCommandGroupName,
    getIrCommandName,
} from 'component/features/ir-commands-presentation';
import Paper from 'component/building-blocks/paper';
import { ApiContext } from 'api-client';
import { NotificationsHandler } from 'api-client/types';

export const validateIrCommandsLearned = (data: IrCommandsSettingsData) => {
    return {};
};

const getAllGroups = (
    groupStatuses: CommandGroupStatusRecord,
): CommandGroupId[] => {
    return Object.keys(groupStatuses).map(
        (groupId) => groupId as any as CommandGroupId,
    );
};

const getIncompleteGroups = (
    groupStatuses: CommandGroupStatusRecord,
): CommandGroupId[] => {
    return Object.keys(groupStatuses)
        .filter(
            (groupId) =>
                groupStatuses[parseInt(groupId) as any as CommandGroupId]
                    .status === 'incomplete',
        )
        .map((groupId) => groupId as any as CommandGroupId);
};

const CommandGroups = ({
    groupIds,
    currentGroupId,
}: {
    groupIds: CommandGroupId[];
    currentGroupId: CommandGroupId;
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    return (
        <>
            <Paper
                sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    flexGrow: 0,
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: isMobile ? 'center' : 'start',
                    }}
                >
                    <Typography>{`Current group: ${getIrCommandGroupName(
                        currentGroupId,
                    )}`}</Typography>
                </Box>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        flexGrow: 1,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexGrow: isMobile ? 1 : 0,
                            justifyContent: 'space-around',
                            gap: 2,
                        }}
                    >
                        {groupIds.map((groupId) => {
                            const Icon = getIrCommandGroupIcon(groupId);
                            return (
                                <Icon
                                    key={groupId}
                                    color={
                                        currentGroupId === groupId
                                            ? 'success'
                                            : 'disabled'
                                    }
                                />
                            );
                        })}
                    </Box>
                </Box>
            </Paper>
        </>
    );
};

const CommandLearningProcess = ({
    learningState,
    commandId,
    onStartLearningCommand,
    onCancelLearningCommand,
    onNextLearningCommand,
}: {
    learningState: LearningState;
    commandId: IrCommandId;
    onStartLearningCommand: () => void;
    onCancelLearningCommand: () => void;
    onNextLearningCommand: () => void;
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    return (
        <GridItem>
            <Box
                sx={{
                    display: 'flex',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexGrow: 1,
                    }}
                >
                    <Box
                        sx={{
                            width: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            mr: 2,
                        }}
                    >
                        {learningState === LearningState.Idle && (
                            <SettingsRemoteIcon />
                        )}
                        {learningState === LearningState.Learning && (
                            <CircularProgress size={24} />
                        )}
                        {learningState === LearningState.Success && (
                            <DoneIcon color="success" />
                        )}
                        {learningState === LearningState.Timeout && (
                            <WarningAmberOutlinedIcon color="error" />
                        )}
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                        }}
                    >
                        <Typography>
                            {learningState === LearningState.Idle
                                ? 'Learn command'
                                : learningState === LearningState.Learning
                                ? 'Learning command'
                                : learningState === LearningState.Success
                                ? isMobile
                                    ? 'Success'
                                    : 'Command acquired'
                                : 'Timeout'}
                        </Typography>
                        <Paper
                            sx={{
                                paddingY: 0,
                                paddingX: 1,
                                marginTop: '-1px',
                            }}
                        >
                            <strong>{getIrCommandName(commandId)}</strong>
                        </Paper>
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box
                        sx={{
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        {learningState === LearningState.Idle && (
                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="contained"
                                    onClick={onStartLearningCommand}
                                >
                                    {isMobile ? 'Start' : 'Start learning'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={onNextLearningCommand}
                                >
                                    Skip
                                </Button>
                            </Stack>
                        )}
                        {learningState === LearningState.Learning && (
                            <Button
                                variant="outlined"
                                onClick={onCancelLearningCommand}
                            >
                                Cancel
                            </Button>
                        )}
                        {learningState === LearningState.Success && (
                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="contained"
                                    onClick={onNextLearningCommand}
                                >
                                    {isMobile ? 'Next' : 'Next command'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={onStartLearningCommand}
                                >
                                    Retry
                                </Button>
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Box>
        </GridItem>
    );
};

const CommandLearnData = ({ data }: { data: IrCommandRead | null }) => {
    return (
        <GridItem>
            <Box
                sx={{
                    display: 'flex',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexGrow: 1,
                    }}
                >
                    <Box
                        sx={{
                            width: '24px',
                            mr: 2,
                        }}
                    />
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            minHeight: '72px',
                        }}
                    >
                        {data !== null && (
                            <>
                                <Stack direction="row" spacing={1}>
                                    <Typography>
                                        <strong>Protocol:</strong>
                                    </Typography>
                                    <Typography>{data.irType}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <Typography>
                                        <strong>Bits:</strong>
                                    </Typography>
                                    <Typography>{data.irBits}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <Typography>
                                        <strong>Value:</strong>
                                    </Typography>
                                    <Typography>{data.irValue}</Typography>
                                </Stack>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </GridItem>
    );
};

const IrCommandsForm = ({
    data,
    setData,
    onCancelPolicyChanged,
}: {
    data: IrCommandsSettingsData;
    setData: React.Dispatch<React.SetStateAction<IrCommandsSettingsData>>;
    onCancelPolicyChanged?: (cancel: boolean) => void;
}) => {
    const {
        api,
        registerNotificationsObserver,
        unregisterNotificationsObserver,
    } = useContext(ApiContext);

    const groupStatuses = getCommandGroupStatuses(
        Array.from(data.storedCommands[data.currentEditDeviceName || ''] || []),
    );
    const groupsToLearn =
        data.learnMode === LearnMode.AllCommands
            ? getAllGroups(groupStatuses)
            : getIncompleteGroups(groupStatuses);

    const commandsToLearn =
        data.learnMode === LearnMode.AllCommands
            ? getAllCommands()
            : getAllCommands().filter((commandId) => {
                  if (
                      data.learnMode ===
                      LearnMode.AllCommandsFromIncompleteGroups
                  ) {
                      const groupId = getCommandGroupId(commandId);
                      return groupsToLearn.includes(groupId);
                  } else {
                      const allCurrentCommands = Array.from(
                          data.storedCommands[
                              data.currentEditDeviceName || ''
                          ] || [],
                      );
                      return !allCurrentCommands.includes(commandId);
                  }
              });

    const [learningState, setLearningState] = useState<LearningState>(
        LearningState.Info,
    );
    const [currentCommand, setCurrentCommand] = useState<IrCommandId | null>(
        commandsToLearn.length > 0 ? commandsToLearn[0] : null,
    );

    const [readCommandData, setReadCommandData] =
        useState<IrCommandRead | null>(null);

    const processFinished = () => {
        return currentCommand === null && commandsToLearn.length > 0;
    };

    const handleStartLearningProcess = () => {
        setLearningState(LearningState.Idle);
    };

    const handleIrReadSuccess: NotificationsHandler = (notification) => {
        const irReadNotification: IrReadSuccessNotification =
            notification as IrReadSuccessNotification;

        setReadCommandData({
            irType: irReadNotification.irType,
            irBits: irReadNotification.irBits,
            irValue: irReadNotification.irValue,
        });
        setLearningState(LearningState.Success);
        unregisterNotificationsObserver('irReadSuccess');
        unregisterNotificationsObserver('irReadTimeout');
    };

    const handleIrReadTimeout: NotificationsHandler = () => {
        setLearningState(LearningState.Success);
        unregisterNotificationsObserver('irReadSuccess');
        unregisterNotificationsObserver('irReadTimeout');
    };

    const handleStartLearningCurrentCommand = () => {
        if (
            !data.currentEditDeviceName ||
            currentCommand === null ||
            !api.startRecordIrCommands
        ) {
            return;
        }

        api.startRecordIrCommands({
            deviceName: data.currentEditDeviceName,
            commandId: currentCommand,
        }).then(() => {
            setReadCommandData(null);
            registerNotificationsObserver(
                'irReadSuccess',
                ['irReadSuccess'],
                handleIrReadSuccess,
            );
            registerNotificationsObserver(
                'irReadTimeout',
                ['irReadTimeout'],
                handleIrReadTimeout,
            );
            setLearningState(LearningState.Learning);
        });
    };

    const handleCancelLearningCurrentCommand = () => {
        api.stopRecordIrCommands &&
            api.stopRecordIrCommands().then(() => {
                unregisterNotificationsObserver('irReadSuccess');
                unregisterNotificationsObserver('irReadTimeout');
                setLearningState(LearningState.Idle);
            });
    };

    const handleNextLearningCommand = () => {
        setReadCommandData(null);
        const currentIndex = commandsToLearn.indexOf(currentCommand!);
        if (currentIndex >= 0 && currentIndex < commandsToLearn.length - 1) {
            setCurrentCommand(commandsToLearn[currentIndex + 1]);
            setLearningState(LearningState.Idle);
        } else {
            setCurrentCommand(null);
        }
    };

    useEffect(() => {
        if (learningState === LearningState.Learning) {
            onCancelPolicyChanged && onCancelPolicyChanged(false);
        } else {
            onCancelPolicyChanged && onCancelPolicyChanged(true);
        }
    }, [learningState, onCancelPolicyChanged]);

    // Render logic

    if (commandsToLearn.length === 0) {
        return (
            <GridItem>
                <IconText
                    Icon={WarningAmberOutlinedIcon}
                    text={`All IR commands have already been learned for the selected device: ${data.currentEditDeviceName}. Please select another device, or create a new one.`}
                />
            </GridItem>
        );
    }

    if (learningState === LearningState.Info) {
        return (
            <>
                <GridItem>
                    <IconText
                        Icon={Info}
                        text="Please use your remote control to teach the commands to the
                system by pressing the corresponding buttons on the remote while
                pointing it to the IR receiver of your Smart Home Controller
                device."
                    />
                </GridItem>
                <GridItem>
                    <Box paddingLeft={4}>
                        <Button
                            variant="contained"
                            onClick={handleStartLearningProcess}
                        >
                            Start Learning
                        </Button>
                    </Box>
                </GridItem>
            </>
        );
    }

    if (processFinished()) {
        return (
            <GridItem>
                <IconText
                    Icon={DoneAllOutlinedIcon}
                    text={`IR command learning process is complete for device: ${data.currentEditDeviceName}. You can now use the learned commands.`}
                />
            </GridItem>
        );
    }

    return (
        <>
            <GridItem>
                <CommandGroups
                    groupIds={groupsToLearn}
                    currentGroupId={getCommandGroupId(currentCommand!)}
                />
            </GridItem>
            <GridItem>
                <Stack spacing={2}>
                    <CommandLearningProcess
                        learningState={learningState}
                        commandId={currentCommand!}
                        onStartLearningCommand={
                            handleStartLearningCurrentCommand
                        }
                        onCancelLearningCommand={
                            handleCancelLearningCurrentCommand
                        }
                        onNextLearningCommand={handleNextLearningCommand}
                    />
                    <CommandLearnData data={readCommandData} />
                </Stack>
            </GridItem>
        </>
    );
};
export default IrCommandsForm;
