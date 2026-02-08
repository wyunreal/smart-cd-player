import { ApiContext } from 'api-client';
import { TimeSettingsData } from 'api-client/methods/time-settings';
import { SetterResponse } from 'api-client/types';
import useHistoryBack from 'layout/utils/history-back-hook';
import { useContext } from 'react';
import { StoreContext } from 'store';
import Setting from '../../../component/features/setting';
import CurrentSettings from './current-settings';
import TimeServerForm, {
    validateTimeServerForm,
} from './edit-steps/timeServer';
import TimeZoneConfigForm, {
    validateTimeZoneConfigForm,
} from './edit-steps/timeZoneForm';
import EditSuccess from './edit-success';
import SettingsEditSummary from './edit-summary';
import helpTopics from './help-topics';

export const editSteps = [
    {
        title: 'Time zone',
        content: TimeZoneConfigForm,
        validator: validateTimeZoneConfigForm,
    },
    {
        title: 'Server',
        content: TimeServerForm,
        validator: validateTimeServerForm,
    },
];

const TimeSettings = ({ noReboot = false }: { noReboot?: boolean }) => {
    const { api } = useContext(ApiContext);
    const store = useContext(StoreContext);
    const backHandler = useHistoryBack();
    return (
        <Setting<TimeSettingsData, SetterResponse>
            title="Settings"
            api={{
                getter: api.getTimeSettings,
                setter: api.setTimeSettings,
            }}
            dataCache={{
                getter: store.timeSettings,
                setter: store.setTimeSettings,
            }}
            onBack={backHandler}
            editActionDelegationCondition={(data: TimeSettingsData) =>
                !data.configured
            }
            editSteps={editSteps}
            EditSummary={SettingsEditSummary}
            Current={CurrentSettings}
            EditSuccess={noReboot ? undefined : EditSuccess}
            helpTopics={helpTopics}
        />
    );
};

export default TimeSettings;
