import { restartOption, timeSettings, wifiSettings } from 'routes';
import { useContext, useEffect, useState } from 'react';
import { ApiContext } from 'api-client';
import DataList from 'component/building-blocks/data-list';
import Box from '@mui/material/Box';
import PageTitle from 'layout/utils/page-title';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import WifiSettingState from '../wifi/setting-state';
import TimeSettingState from '../time/setting-state';
import { GridContainer, GridItem } from 'layout/utils';
import HelpDialog from 'component/features/help-dialog';
import wifiHelpTopics from '../wifi/help-topics';
import timeHelpTopics from '../time/help-topics';
import { WifiSettingsData } from 'api-client/methods/wifiSettings';
import { editSteps as editWifiSteps } from '../wifi';
import { editSteps as editTimeSteps } from '../time';
import WifiSettingsEditSummary from '../wifi/edit-summary';
import TimeSettingsEditSummary from '../time/edit-summary';
import { TimeSettingsData } from 'api-client/methods/time-settings';
import MainIcon from 'component/building-blocks/main-icon';
import EditFlow from 'component/building-blocks/flows/editFlow';
import { SetterResponse } from 'api-client/types';
import { StoreContext } from 'store';

const ConfigureModule = () => {
    const apiContext = useContext(ApiContext);
    const store = useContext(StoreContext);
    const [wifiConfigured, setWifiConfigured] = useState<boolean | undefined>(
        undefined,
    );
    const [timeConfigured, setTimeConfigured] = useState<boolean | undefined>(
        undefined,
    );

    useEffect(() => {
        apiContext.api.getRestartParameters().then((parameters) => {
            setWifiConfigured(parameters.wifiConfigured);
            setTimeConfigured(parameters.timeConfigured);
        });
    });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [isWifiHelpOpen, setIsWifiHelpOpen] = useState(false);
    const [isWifiEditFormOpen, setIsWifiEditFormOpen] = useState(false);

    const [isTimeHelpOpen, setIsTimeHelpOpen] = useState(false);
    const [isTimeEditFormOpen, setIsTimeEditFormOpen] = useState(false);

    return (
        <PageTitle title={'Initial configuration'}>
            <Box>
                <MainIcon Icon={SettingsSuggestOutlinedIcon} />
                {isMobile ? (
                    <DataList
                        items={[
                            {
                                setting: wifiSettings,
                                configured: wifiConfigured,
                            },
                            {
                                setting: timeSettings,
                                configured: timeConfigured,
                            },
                            {
                                setting: restartOption,
                            },
                        ].map(({ setting, configured }) => ({
                            icon: setting.icon,
                            title: setting.label,
                            description: setting.description,
                            url:
                                setting.id !== 'restart'
                                    ? `${setting.url}/no-reboot`
                                    : setting.url,
                            configured,
                            withTag: setting.id !== 'restart',
                            withColoredIcon: true,
                        }))}
                    />
                ) : (
                    <>
                        <Box sx={{ display: 'flex' }}>
                            <GridContainer>
                                <GridItem>
                                    <WifiSettingState
                                        editHandler={() =>
                                            setIsWifiEditFormOpen(true)
                                        }
                                        isConfigured={wifiConfigured}
                                    />
                                </GridItem>
                                <GridItem>
                                    <TimeSettingState
                                        editHandler={() =>
                                            setIsTimeEditFormOpen(true)
                                        }
                                        isConfigured={timeConfigured}
                                    />
                                </GridItem>
                            </GridContainer>
                        </Box>

                        <HelpDialog
                            topics={wifiHelpTopics}
                            isOpen={isWifiHelpOpen}
                            onClose={() => {
                                setIsWifiHelpOpen(false);
                            }}
                            insideDialog={true}
                        />

                        <EditFlow<WifiSettingsData, SetterResponse>
                            title="Wifi settings"
                            isOpen={isWifiEditFormOpen}
                            api={{
                                getter: apiContext.api.getWifiSettings,
                                setter: apiContext.api.setWifiSettings,
                            }}
                            dataCacheSetter={store.setWifiSettings}
                            editSteps={editWifiSteps}
                            EditSummary={WifiSettingsEditSummary}
                            onOpenHelp={() => setIsWifiHelpOpen(true)}
                            onFlowClosed={() => setIsWifiEditFormOpen(false)}
                        />
                        <HelpDialog
                            topics={timeHelpTopics}
                            isOpen={isTimeHelpOpen}
                            onClose={() => {
                                setIsTimeHelpOpen(false);
                            }}
                            insideDialog={true}
                        />
                        <EditFlow<TimeSettingsData, SetterResponse>
                            title="Time settings"
                            isOpen={isTimeEditFormOpen}
                            api={{
                                getter: apiContext.api.getTimeSettings,
                                setter: apiContext.api.setTimeSettings,
                            }}
                            dataCacheSetter={store.setTimeSettings}
                            editSteps={editTimeSteps}
                            EditSummary={TimeSettingsEditSummary}
                            onOpenHelp={() => setIsTimeHelpOpen(true)}
                            onFlowClosed={() => setIsTimeEditFormOpen(false)}
                        />
                    </>
                )}
            </Box>
        </PageTitle>
    );
};

export default ConfigureModule;
