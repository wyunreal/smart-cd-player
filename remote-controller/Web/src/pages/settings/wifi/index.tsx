import { ApiContext } from 'api-client';
import { SetterResponse } from 'api-client/types';
import { WifiSettingsData } from 'api-client/methods/wifiSettings';
import useHistoryBack from 'layout/utils/history-back-hook';
import { useContext } from 'react';
import { StoreContext } from 'store';
import Setting from '../../../component/features/setting';
import CurrentSettings from './current-settings';
import StaticIpConfigForm, {
    validateStaticIpFormForm,
} from './edit-steps/staticIpForm';
import WifiConfigForm, {
    validateWifiConfigForm,
} from './edit-steps/wifiConnectionForm';
import EditSuccess from './edit-success';
import SettingsEditSummary from './edit-summary';
import helpTopics from './help-topics';

export const editSteps = [
    {
        title: 'Wifi connection',
        content: WifiConfigForm,
        validator: validateWifiConfigForm,
    },
    {
        title: 'Static IP',
        content: StaticIpConfigForm,
        validator: validateStaticIpFormForm,
    },
];

const WifiSettings = ({ noReboot = false }: { noReboot?: boolean }) => {
    const { api } = useContext(ApiContext);
    const store = useContext(StoreContext);
    const backHandler = useHistoryBack();
    return (
        <Setting<WifiSettingsData, SetterResponse>
            title="Settings"
            api={{
                getter: api.getWifiSettings,
                setter: api.setWifiSettings,
            }}
            dataCache={{
                getter: store.wifiSettings,
                setter: store.setWifiSettings,
            }}
            onBack={backHandler}
            editActionDelegationCondition={(data: WifiSettingsData) =>
                !data.wifiConnection.ssid
            }
            editSteps={editSteps}
            EditSummary={SettingsEditSummary}
            Current={CurrentSettings}
            EditSuccess={noReboot ? undefined : EditSuccess}
            helpTopics={helpTopics}
        />
    );
};

export default WifiSettings;
