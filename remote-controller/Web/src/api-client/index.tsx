import React, { createContext, useCallback, useRef } from 'react';
import {
    getNetworkNameSettings,
    setNetworkNameSettings,
} from './methods/network-name-settings';
import { getWifiSettings, setWifiSettings } from './methods/wifiSettings';
import connect from './socket';
import isModuleAlive from './modulePing';
import { getAllTimeZones, getTimeZone } from './timeZones';
import { Api, Notification, NotificationsHandler } from './types';
import { RestartModule } from './methods/restart-module';
import { getRestartParameters } from './methods/restart-parameters';
import {
    getCurrentTime,
    getTimeSettings,
    setTimeSettings,
} from './methods/time-settings';
import {
    getIrCommandsSettings,
    startRecordIrCommands,
    stopRecordIrCommands,
} from './methods/ir-commands-settings';

type NotificationsObserverRecord = {
    observerId: string;
    types: string[];
    observer: NotificationsHandler;
};

type NotificationsObservers = NotificationsObserverRecord[];

type ApiContextType = {
    api: Api;
    registerNotificationsObserver: (
        observerId: string,
        types: string[],
        observer: NotificationsHandler,
    ) => void;
    unregisterNotificationsObserver: (observerId: string) => void;
};

const apiSocket = connect();

const api: Api = {
    isModuleAlive,
    getAllTimeZones,
    getTimeZone,
    getWifiSettings: getWifiSettings(apiSocket),
    setWifiSettings: setWifiSettings(apiSocket),
    getCurrentTime: getCurrentTime(apiSocket),
    getTimeSettings: getTimeSettings(apiSocket),
    setTimeSettings: setTimeSettings(apiSocket),
    getNetworkNameSettings: getNetworkNameSettings(apiSocket),
    setNetworkNameSettings: setNetworkNameSettings(apiSocket),
    getRestartParameters: getRestartParameters(apiSocket),
    restartModule: RestartModule(apiSocket),
};

if (
    process.env.REACT_APP_MODULE === 'CDPlayerModule' ||
    process.env.NODE_ENV === 'development'
) {
    api.getIrCommandsSettings = getIrCommandsSettings(apiSocket);
    api.startRecordIrCommands = startRecordIrCommands(apiSocket);
    api.stopRecordIrCommands = stopRecordIrCommands(apiSocket);
}

const ApiContext = createContext<ApiContextType>({
    api,
    registerNotificationsObserver: () => {},
    unregisterNotificationsObserver: () => {},
});

type ApiContextProviderProps = { children: React.ReactNode };

const ApiContextProvider = ({ children }: ApiContextProviderProps) => {
    const observers = useRef<NotificationsObservers>([]);

    const registerNotificationsObserver = useCallback(
        (
            observerId: string,
            types: string[],
            observer: NotificationsHandler,
        ) => {
            observers.current.push({ observerId, types, observer });
        },
        [],
    );

    const unregisterNotificationsObserver = useCallback((id: string) => {
        observers.current = observers.current.filter(
            ({ observerId }) => observerId !== id,
        );
    }, []);

    apiSocket.onNotification((notification: Notification) => {
        const type = notification.type || '';
        const observerRecords = observers.current
            ? observers.current.filter(({ types }) => types.includes(type))
            : [];
        observerRecords.forEach(({ observer }) => {
            observer(notification);
        });
    });

    return (
        <ApiContext.Provider
            value={{
                api,
                registerNotificationsObserver,
                unregisterNotificationsObserver,
            }}
        >
            {children}
        </ApiContext.Provider>
    );
};

export { ApiContext, ApiContextProvider };
