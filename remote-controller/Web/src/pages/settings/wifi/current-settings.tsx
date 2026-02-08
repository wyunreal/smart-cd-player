import CategorizedData from '../../../component/building-blocks/cards/categorized-data-cards';
import { GridItem } from 'layout/utils';
import getVisualData from './visual-data';
import { WifiSettingsData } from 'api-client/methods/wifiSettings';
import SettingState from './setting-state';

const CurrentSettings = ({
    data,
    editHandler,
}: {
    data: WifiSettingsData;
    editHandler?: () => void;
}) => {
    return (
        <>
            {data.wifiConnection.ssid ? (
                getVisualData(data).map((section, index) => (
                    <GridItem key={index}>
                        <CategorizedData data={[section]} />
                    </GridItem>
                ))
            ) : (
                <GridItem>
                    <SettingState
                        editHandler={editHandler}
                        isConfigured={false}
                    />
                </GridItem>
            )}
        </>
    );
};

export default CurrentSettings;
