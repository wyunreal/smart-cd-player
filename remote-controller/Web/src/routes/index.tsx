import { Navigate, useRoutes } from 'react-router-dom';
import MainLayout from 'layout/main-layout';
import NetworkNameSettings from 'pages/settings/network-name';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import WifiOutlinedIcon from '@mui/icons-material/WifiOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DomainVerificationOutlinedIcon from '@mui/icons-material/DomainVerificationOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';

import {
    Navigation,
    NavigationOptionGroup,
    NavigationOptionItem,
    NavigationOptionUrl,
} from './types';
import Dashboard from 'pages/dashboard';
import Notifications from 'pages/notifications';
import Settings from 'pages/settings';
import WifiSettings from 'pages/settings/wifi';
import TimeSettings from 'pages/settings/time';
import ConfigureModule from 'pages/settings/configure-module';
import Restart from 'pages/settings/restart';
import Update from 'pages/settings/update';
import IrCommandsSettings from 'pages/settings/ir-commands';

export const HOME_MENU_ID = 'dashboard';
export const NOTIFICATIONS_ID = 'notifications';
export const SETTINGS_ID = 'settings';

const dashboardMenuItems: NavigationOptionItem = {
    id: HOME_MENU_ID,
    label: 'Dashboard',
    type: 'item',
    url: '/dashboard',
    platform: 'all',
    icon: <GridViewOutlinedIcon />,
};

const notificationsMenuItems: NavigationOptionItem = {
    id: NOTIFICATIONS_ID,
    label: 'Notifications',
    type: 'item',
    url: '/notifications',
    platform: 'mobile',
    icon: <NotificationsNoneOutlinedIcon />,
    disabled: true,
};

export const wifiSettings: NavigationOptionItem = {
    id: 'wifi',
    label: 'Wifi connection',
    description: 'Manage how the module connects to the Internet.',
    type: 'item',
    url: '/settings/wifi',
    platform: 'all',
    icon: <WifiOutlinedIcon />,
};
export const timeSettings: NavigationOptionItem = {
    id: 'time',
    label: 'Local time',
    description:
        'Manage required configuration to correctly handle local time.',
    type: 'item',
    url: '/settings/time',
    platform: 'all',
    icon: <AccessTimeIcon />,
};

export const networkNameSettings: NavigationOptionItem = {
    id: 'network-name',
    label: 'Network name',
    description: 'Manage the name used to identify the module on the network.',
    type: 'item',
    url: '/settings/network-name',
    platform: 'all',
    icon: <DomainVerificationOutlinedIcon />,
};

export const updateOption: NavigationOptionItem = {
    id: 'update',
    label: 'Update module',
    description: 'Update the firmware, data and user interface of the module.',
    type: 'item',
    url: '/settings/update',
    platform: 'all',
    icon: <UpgradeIcon />,
};

export const restartOption: NavigationOptionItem = {
    id: 'restart',
    label: 'Restart',
    description: 'Restart the module.',
    type: 'item',
    url: '/settings/restart',
    platform: 'all',
    icon: <RestartAltIcon />,
};

const mainSettings: NavigationOptionItem[] = [
    wifiSettings,
    timeSettings,
    networkNameSettings,
    updateOption,
    restartOption,
];

let cdPlayerSettings: NavigationOptionItem[] = [];
if (
    process.env.REACT_APP_MODULE === 'CDPlayerModule' ||
    process.env.NODE_ENV === 'development'
) {
    cdPlayerSettings = [
        {
            id: 'ir-commands',
            label: 'IR controller',
            description:
                'Configure IR commands for the players you want to control with the remote.',
            type: 'item',
            url: '/settings/ir-commands',
            platform: 'all',
            icon: <SettingsRemoteIcon />,
        },
    ];
}

const settingsMenuItems: NavigationOptionGroup = {
    id: SETTINGS_ID,
    label: 'Settings',
    type: 'group',
    platform: 'all',
    icon: <SettingsOutlinedIcon />,
    url: '/settings',
    children: [...cdPlayerSettings, ...mainSettings],
};

export const menuItems: Navigation = [
    dashboardMenuItems,
    notificationsMenuItems,
    settingsMenuItems,
];

export const getRootRoutes = () => [
    dashboardMenuItems.url,
    notificationsMenuItems.url,
    settingsMenuItems.url,
    '/settings/configure',
];

export const getMobileMainNavigation = () =>
    menuItems.filter(
        (item) =>
            (item.platform === 'all' || item.platform === 'mobile') &&
            !item.disabled,
    );

export const isMobileRootbRoute = (pathname: string) => {
    const routeUrl = pathname === '/' ? '' : pathname;
    return getRootRoutes().filter((path) => path === routeUrl).length > 0;
};

export const isItemSelected = (
    item: NavigationOptionItem,
    currentPathname: string,
) => {
    const currentIndex = currentPathname
        .split('/')
        .findIndex((id) => id === item.id);
    if (
        (currentPathname === '/' && item.id === HOME_MENU_ID) ||
        currentIndex > -1
    ) {
        return true;
    }
    return false;
};

export const route = (route: NavigationOptionUrl) => {
    return route;
};

export default function ThemeRoutes() {
    const mainRoutes = {
        path: '/',
        element: <MainLayout />,
        children: [
            // Main navigation
            {
                path: '/',
                element: <Navigate to={route('/dashboard')} />,
            },
            {
                path: '/dashboard',
                element: <Dashboard />,
            },
            {
                path: '/notifications',
                element: <Notifications />,
            },
            {
                path: '/settings',
                element: <Settings />,
            },

            // Main settings
            {
                path: '/settings/configure',
                element: <ConfigureModule />,
            },
            {
                path: '/settings/wifi',
                element: <WifiSettings />,
            },
            {
                path: '/settings/time',
                element: <TimeSettings />,
            },
            {
                path: '/settings/wifi/no-reboot',
                element: <WifiSettings noReboot />,
            },
            {
                path: '/settings/time/no-reboot',
                element: <TimeSettings noReboot />,
            },
            {
                path: '/settings/network-name',
                element: <NetworkNameSettings />,
            },
            {
                path: '/settings/update',
                element: <Update />,
            },
            {
                path: '/settings/restart',
                element: <Restart />,
            },
        ],
    };

    if (
        process.env.REACT_APP_MODULE === 'CDPlayerModule' ||
        process.env.NODE_ENV === 'development'
    ) {
        mainRoutes.children.push({
            path: '/settings/ir-commands',
            element: <IrCommandsSettings />,
        });
    }

    return useRoutes([mainRoutes]);
}
