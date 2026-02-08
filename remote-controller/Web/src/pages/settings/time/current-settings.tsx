import { TimeSettingsData } from 'api-client/methods/time-settings';
import { GridItem } from 'layout/utils';
import ConfiguredSettings from './configured-settings';
import SettingState from './setting-state';

const CurrentSettings = ({
    data,
    editHandler,
}: {
    data: TimeSettingsData;
    editHandler?: () => void;
}) => {
    return data.configured ? (
        <ConfiguredSettings data={data} showMap />
    ) : (
        <GridItem>
            <SettingState editHandler={editHandler} isConfigured={false} />
        </GridItem>
    );
};

export default CurrentSettings;
