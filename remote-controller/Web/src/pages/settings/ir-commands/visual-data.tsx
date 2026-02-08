import { IrCommandsSettingsData } from 'api-client/methods/ir-commands-settings';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import { Category } from 'component/types';
import {
    CommandGroupId,
    getCommandGroupStatuses,
    getIrCommandGroupIcon,
    getIrCommandGroupName,
} from 'component/features/ir-commands-presentation';

const getVisualData = (data: IrCommandsSettingsData): Category[] => {
    const devices = Object.keys(data.storedCommands).map((deviceName) => {
        const deviceInfo = getCommandGroupStatuses(
            Array.from(data.storedCommands[deviceName].entries()).map(
                (entry) => entry[1],
            ),
        );
        return {
            category: deviceName,
            content: Object.keys(deviceInfo).map((groupKey) => {
                const groupId = parseInt(groupKey) as any as CommandGroupId;
                const groupStatus = deviceInfo[groupId].status;
                const Icon = getIrCommandGroupIcon(groupId);
                return {
                    icon: (
                        <Icon
                            color={
                                groupStatus === 'complete'
                                    ? 'success'
                                    : 'disabled'
                            }
                        />
                    ),
                    name: getIrCommandGroupName(groupId),
                    value:
                        groupStatus === 'incomplete'
                            ? `Missing ${deviceInfo[groupId].missingCommands.length} commands`
                            : 'Group enabled',
                };
            }),
        };
    });
    return devices;
};

export default getVisualData;
