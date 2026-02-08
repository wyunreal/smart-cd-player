import { ApiMethod, SetterResponse } from 'api-client/types';

export type WifiConnectionData = {
    ssid: string;
    password: string;
};

export type StaticIpData = {
    useStaticIp: boolean;
    ip?: string;
    gateway?: string;
    subnet?: string;
};

export type WifiSettingsData = {
    wifiConnection: WifiConnectionData;
    staticIp: StaticIpData;
};

type StaticIpServerData = {
    useStaticIp: 0 | 1;
    ip?: string;
    gateway?: string;
    subnet?: string;
};

type WifiSettingsServerData = {
    wifiConnection: WifiConnectionData;
    staticIp: StaticIpServerData;
};

export type GetWifiSettingsSignature = () => Promise<WifiSettingsData>;
export type SetWifiSettingsSignature = (
    data: WifiSettingsData,
) => Promise<SetterResponse>;

export const getWifiSettings: ApiMethod<GetWifiSettingsSignature> =
    (apiSocket) => () => {
        return apiSocket.send({
            handler: 'wifiSettings',
        }) as unknown as ReturnType<GetWifiSettingsSignature>;
    };

const prepareForWrite = (data: WifiSettingsData): WifiSettingsServerData => ({
    wifiConnection: data.wifiConnection,
    staticIp: {
        ...data.staticIp,
        useStaticIp: data.staticIp.useStaticIp ? 1 : 0,
    },
});

export const setWifiSettings: ApiMethod<SetWifiSettingsSignature> =
    (apiSocket) => (data: WifiSettingsData) => {
        return apiSocket.send({
            handler: 'setWifiSettings',
            ...prepareForWrite(data),
        }) as unknown as ReturnType<SetWifiSettingsSignature>;
    };
