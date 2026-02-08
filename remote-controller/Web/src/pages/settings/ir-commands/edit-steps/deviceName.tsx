import { ChangeEventHandler, Dispatch, SetStateAction } from 'react';
import TextField from '@mui/material/TextField';
import { GridItem } from 'layout/utils';
import {
    IrCommandsSettingsData,
    LearnMode,
} from 'api-client/methods/ir-commands-settings';
import { Typography } from '@mui/material';
import DataList from 'component/building-blocks/data-list';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import {
    CommandGroupId,
    getCommandGroupStatuses,
    getIrCommandGroupName,
} from 'component/features/ir-commands-presentation';

const alphaRegexp = /^[a-zA-Z]+$/;

const validateDeviceNameField = (
    deviceName: string,
    currentDeviceNames: string[],
) => {
    switch (true) {
        case deviceName === '':
            return 'The device name can not be empty.';
        case deviceName.length > 12:
            return 'The device name should be 12 characters or less.';
        case !alphaRegexp.test(deviceName):
            return 'The device name should include only alphabetic characters: a to z, including capital letters';
        case currentDeviceNames.includes(deviceName):
            return 'A device with this name already exists. Please choose another name.';
        default:
            return null;
    }
};

export const validateDeviceName = (data: IrCommandsSettingsData) => {
    return {
        currentEditDeviceName: validateDeviceNameField(
            data.currentEditDeviceName || '',
            Object.keys(data.storedCommands),
        ),
    };
};

const DeviceNameForm = ({
    data,
    setData,
    errors,
    onNextStep,
}: {
    data: IrCommandsSettingsData;
    setData: Dispatch<SetStateAction<IrCommandsSettingsData>>;
    errors: { [key: string]: string | null };
    onNextStep?: (proceed: boolean) => void;
}) => {
    const handleNewDeviceInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement
    > = (e) => {
        const { value } = e.target;
        setData({
            ...data,
            learnMode: LearnMode.AllCommands,
            currentEditDeviceName: value,
        });
    };

    const currentDeviceNames = Object.keys(data.storedCommands);

    return (
        <>
            {currentDeviceNames.length > 0 && (
                <>
                    <GridItem>
                        <Typography>
                            Select a device to relearn IR commands:
                        </Typography>
                        <DataList
                            items={currentDeviceNames.map((deviceName) => {
                                const commandGroupsStatus =
                                    getCommandGroupStatuses(
                                        Array.from(
                                            data.storedCommands[
                                                deviceName
                                            ].entries(),
                                        ).map(([_, commandId]) => commandId),
                                    );
                                return {
                                    icon: <SettingsRemoteIcon />,
                                    title: deviceName,
                                    description: Object.keys(
                                        commandGroupsStatus,
                                    )
                                        .filter(
                                            (group) =>
                                                commandGroupsStatus[
                                                    parseInt(
                                                        group,
                                                    ) as any as CommandGroupId
                                                ].status === 'complete',
                                        )
                                        .map((group) => {
                                            return getIrCommandGroupName(group);
                                        })
                                        .join(', '),
                                    withTag: false,
                                    withColoredIcon: true,
                                    handler: () => {
                                        setData((data) => ({
                                            ...data,
                                            learnMode: LearnMode.AllCommands,
                                            currentEditDeviceName: deviceName,
                                        }));
                                        onNextStep && onNextStep(false);
                                    },
                                };
                            })}
                        />
                    </GridItem>
                    <GridItem>
                        <Typography>
                            or, enter a new name for a new device:
                        </Typography>
                    </GridItem>
                </>
            )}
            <GridItem>
                <TextField
                    id="deviceName"
                    name="deviceName"
                    label="Device name"
                    type="text"
                    value={
                        currentDeviceNames.includes(
                            data.currentEditDeviceName || '',
                        )
                            ? ''
                            : data.currentEditDeviceName || ''
                    }
                    onChange={handleNewDeviceInputChange}
                    fullWidth
                    error={!!errors.currentEditDeviceName}
                    helperText={errors.currentEditDeviceName}
                />
            </GridItem>
        </>
    );
};
export default DeviceNameForm;
