import { ApiMethod } from 'api-client/types';

export const WIFI_STATE_CONFIGURATION_ACCESS_POINT = 0;
export const WIFI_STATE_STATION = 1;

export type ConnectionState = 0 | 1;

export type RestartParametersData = {
    moduleUrl: string;
    currentConnectionState: ConnectionState;
    newWifiSsid: string;
    wifiConfigured: boolean;
    timeConfigured: boolean;
};

export type GetRestartPatrametersSignature =
    () => Promise<RestartParametersData>;

export const getRestartParameters: ApiMethod<GetRestartPatrametersSignature> =
    (apiSocket) => () => {
        return apiSocket.send({
            handler: 'restartParameters',
        }) as unknown as ReturnType<GetRestartPatrametersSignature>;
    };
