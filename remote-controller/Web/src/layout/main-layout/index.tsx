import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Mobilelayout from './mobile';
import DesktopLayout from './desktop';
import { useContext, useEffect, useState } from 'react';
import { ApiContext } from 'api-client';
import {
    ConnectionState,
    WIFI_STATE_CONFIGURATION_ACCESS_POINT,
    WIFI_STATE_STATION,
} from 'api-client/methods/restart-parameters';
import FullScreenSpinner from 'component/building-blocks/full-screen-spinner';
import { CenteredContainer } from 'layout/utils';
import { Navigate, useLocation } from 'react-router';
import { route } from 'routes';

const shouldCheckConnectionState = (currentPath: string) => currentPath === '/';

const MainLayoutContent = ({ isMobileDevice }: { isMobileDevice: boolean }) =>
    isMobileDevice ? <Mobilelayout /> : <DesktopLayout />;

const MainLayout = () => {
    const theme = useTheme();

    const apiContext = useContext(ApiContext);
    const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));
    const [wifiMode, setWifiMode] = useState<ConnectionState | null>(null);
    const location = useLocation();

    useEffect(() => {
        if (shouldCheckConnectionState(location.pathname)) {
            apiContext.api.getRestartParameters().then((parameters) => {
                setWifiMode(parameters.currentConnectionState);
            });
        }
    });

    if (!shouldCheckConnectionState(location.pathname)) {
        return <MainLayoutContent isMobileDevice={matchDownMd} />;
    }

    switch (wifiMode) {
        case WIFI_STATE_STATION:
            return <MainLayoutContent isMobileDevice={matchDownMd} />;
        case WIFI_STATE_CONFIGURATION_ACCESS_POINT:
            return <Navigate to={route('/settings/configure')} />;
        default:
            return (
                <CenteredContainer>
                    <FullScreenSpinner />
                </CenteredContainer>
            );
    }
};

export default MainLayout;
