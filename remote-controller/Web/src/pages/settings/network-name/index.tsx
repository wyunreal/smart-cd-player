import { ApiContext } from 'api-client';
import { SetterResponse } from 'api-client/types';
import { useContext } from 'react';
import Setting from '../../../component/features/setting';
import helpTopics from './help-topics';
import { NetworkNameSettingsData } from 'api-client/methods/network-name-settings';
import NetworkNameForm, { validateNetworkName } from './edit-steps/networkName';
import SettingsEditSummary from './edit-summary';
import CurrentSettings from './current-settings';
import { StoreContext } from 'store';
import EditSuccess from './edit-success';
import useHistoryBack from 'layout/utils/history-back-hook';

const NetworkNameSettings = () => {
    const { api } = useContext(ApiContext);
    const store = useContext(StoreContext);
    const backHandler = useHistoryBack();
    return (
        <Setting<NetworkNameSettingsData, SetterResponse>
            title="Settings"
            api={{
                getter: api.getNetworkNameSettings,
                setter: api.setNetworkNameSettings,
            }}
            dataCache={{
                getter: store.networkNameSettings,
                setter: store.setNetworkNameSettings,
            }}
            onBack={backHandler}
            editSteps={[
                {
                    title: 'Network name',
                    content: NetworkNameForm,
                    validator: validateNetworkName,
                },
            ]}
            EditSummary={SettingsEditSummary}
            Current={CurrentSettings}
            EditSuccess={EditSuccess}
            helpTopics={helpTopics}
        />
    );
};

export default NetworkNameSettings;
