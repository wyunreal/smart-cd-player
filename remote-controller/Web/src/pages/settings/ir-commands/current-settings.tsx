import CategorizedData from '../../../component/building-blocks/cards/categorized-data-cards';
import { GridItem } from 'layout/utils';
import getVisualData from './visual-data';
import { IrCommandsSettingsData } from 'api-client/methods/ir-commands-settings';
import EmptyCaseCard from 'component/building-blocks/cards/empty-case-card';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';

const CurrentSettings = ({
    data,
    editHandler,
}: {
    data: IrCommandsSettingsData;
    editHandler?: () => void;
}) => {
    const categorizedData = getVisualData(data);
    return (
        <>
            {categorizedData.length > 0 ? (
                categorizedData.map((section, index) => (
                    <GridItem key={index}>
                        <CategorizedData data={[section]} />
                    </GridItem>
                ))
            ) : (
                <GridItem>
                    <EmptyCaseCard
                        title="Devices"
                        Icon={SettingsRemoteIcon}
                        content="There are no stored devices yet. Please start learning IR commands for a device by clicking the Edit button."
                        action={
                            editHandler
                                ? {
                                      action: {
                                          caption: 'Configure the first device',
                                          handler: editHandler,
                                      },
                                      type: 'primary',
                                      shape: 'button',
                                  }
                                : undefined
                        }
                    />
                </GridItem>
            )}
        </>
    );
};

export default CurrentSettings;
