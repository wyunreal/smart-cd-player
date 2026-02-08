import { ApiMethod, SetterResponse } from 'api-client/types';

export type RestartModuleSignature = () => Promise<SetterResponse>;

export const RestartModule: ApiMethod<RestartModuleSignature> =
    (apiSocket) => () => {
        return apiSocket.send({
            handler: 'restart',
        }) as unknown as ReturnType<RestartModuleSignature>;
    };
