import { IrCommandsSettingsData } from 'api-client/methods/ir-commands-settings';
import { NetworkNameSettingsData } from 'api-client/methods/network-name-settings';
import { TimeSettingsData } from 'api-client/methods/time-settings';
import { WifiSettingsData } from 'api-client/methods/wifiSettings';
import React, { createContext, useCallback, useMemo, useState } from 'react';

export type Store = {
    wifiSettings: () => WifiSettingsData | null;
    setWifiSettings: (data: WifiSettingsData | null) => void;
    timeSettings: () => TimeSettingsData | null;
    setTimeSettings: (data: TimeSettingsData | null) => void;
    networkNameSettings: () => NetworkNameSettingsData | null;
    setNetworkNameSettings: (data: NetworkNameSettingsData | null) => void;
    invalidate: () => void;
    irCommands: () => IrCommandsSettingsData | null;
    setIrCommands: (data: IrCommandsSettingsData | null) => void;
};

const context: Store = {
    wifiSettings: () => null,
    setWifiSettings: (data: WifiSettingsData | null) => {},
    timeSettings: () => null,
    setTimeSettings: (data: TimeSettingsData | null) => {},
    networkNameSettings: () => null,
    setNetworkNameSettings: (data: NetworkNameSettingsData | null) => {},
    irCommands: () => null,
    setIrCommands: (data: IrCommandsSettingsData | null) => {},

    invalidate: () => {},
};

const StoreContext = createContext<Store>(context);

const StoreContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [wifiSettings, setWifiSettings] = useState<WifiSettingsData | null>(
        null,
    );
    const [timeSettings, setTimeSettings] = useState<TimeSettingsData | null>(
        null,
    );
    const [networkNameSettings, setNetworkNameSettings] =
        useState<NetworkNameSettingsData | null>(null);

    const [irCommands, setIrCommands] = useState<IrCommandsSettingsData | null>(
        null,
    );

    const invalidate = useCallback(() => {}, []);

    const store: Store = useMemo<Store>(
        () => ({
            wifiSettings: () => wifiSettings,
            setWifiSettings: (data: WifiSettingsData | null) =>
                setWifiSettings(data),
            timeSettings: () => timeSettings,
            setTimeSettings: (data: TimeSettingsData | null) =>
                setTimeSettings(data),
            networkNameSettings: () => networkNameSettings,
            setNetworkNameSettings: (data: NetworkNameSettingsData | null) =>
                setNetworkNameSettings(data),
            irCommands: () => irCommands,
            setIrCommands: (data: IrCommandsSettingsData | null) =>
                setIrCommands(data),

            invalidate,
        }),
        [
            wifiSettings,
            setWifiSettings,
            timeSettings,
            setTimeSettings,
            networkNameSettings,
            setNetworkNameSettings,
            irCommands,

            invalidate,
        ],
    );

    return (
        <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
    );
};

export { StoreContext, StoreContextProvider };
