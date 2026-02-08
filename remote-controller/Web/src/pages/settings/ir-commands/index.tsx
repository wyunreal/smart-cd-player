import { ApiContext } from 'api-client';
import { SetterResponse } from 'api-client/types';
import { useContext } from 'react';
import Setting from '../../../component/features/setting';
import helpTopics from './help-topics';
import SettingsEditSummary from './edit-summary';
import CurrentSettings from './current-settings';
import { StoreContext } from 'store';
import useHistoryBack from 'layout/utils/history-back-hook';
import { IrCommandsSettingsData } from 'api-client/methods/ir-commands-settings';
import DeviceNameForm, { validateDeviceName } from './edit-steps/deviceName';
import IrCommandsForm, {
    validateIrCommandsLearned,
} from './edit-steps/irCommands';
import LearnModeForm, { validateLearnMode } from './edit-steps/learnMode';

const IrCommandsSettings = () => {
    const { api } = useContext(ApiContext);
    const store = useContext(StoreContext);
    const backHandler = useHistoryBack();
    return (
        <Setting<IrCommandsSettingsData, SetterResponse>
            title="Settings"
            api={{
                getter: api.getIrCommandsSettings || (() => Promise.reject()),
                setter: () => Promise.resolve({ code: 1 }),
            }}
            dataCache={{
                getter: store.irCommands,
                setter: store.setIrCommands,
            }}
            onBack={backHandler}
            editSteps={[
                {
                    title: 'Device name',
                    content: DeviceNameForm,
                    validator: validateDeviceName,
                },
                {
                    title: 'Learn mode',
                    content: LearnModeForm,
                    validator: validateLearnMode,
                },
                {
                    title: 'IR commands learning',
                    content: IrCommandsForm,
                    validator: validateIrCommandsLearned,
                },
            ]}
            EditSummary={SettingsEditSummary}
            Current={CurrentSettings}
            helpTopics={helpTopics}
        />
    );
};

export default IrCommandsSettings;
