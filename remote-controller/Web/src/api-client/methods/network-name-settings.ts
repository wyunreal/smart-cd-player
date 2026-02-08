import { ApiMethod, SetterResponse } from 'api-client/types';

export type NetworkNameSettingsData = {
    networkName: string;
};

export type GetNetworkNameSettingsSignature =
    () => Promise<NetworkNameSettingsData>;
export type SetNetworkNameSettingsSignature = (
    data: NetworkNameSettingsData,
) => Promise<SetterResponse>;

export const getNetworkNameSettings: ApiMethod<
    GetNetworkNameSettingsSignature
> = (apiSocket) => () => {
    return apiSocket.send({
        handler: 'networkNameSettings',
    }) as unknown as ReturnType<GetNetworkNameSettingsSignature>;
};

export const setNetworkNameSettings: ApiMethod<
    SetNetworkNameSettingsSignature
> = (apiSocket) => (data: NetworkNameSettingsData) => {
    return apiSocket.send({
        handler: 'setNetworkNameSettings',
        ...data,
    }) as unknown as ReturnType<SetNetworkNameSettingsSignature>;
};
