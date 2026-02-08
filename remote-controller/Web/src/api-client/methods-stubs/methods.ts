import { InternalMessage, MessageHandlerId } from 'api-client/types';
import { WIFI_STATE_CONFIGURATION_ACCESS_POINT } from '../methods/restart-parameters';
import { IrCommandId } from 'api-client/methods/ir-commands-settings';

const getStubResponseByHandler = (handler: MessageHandlerId) => {
    switch (handler) {
        case 'wifiSettings':
            return {
                wifiConnection: {
                    ssid: 'wifi',
                    password: 'password',
                },
                staticIp: { useStaticIp: 0, ip: '', gateway: '', subnet: '' },
                code: 1,
                requestId: 1,
            };
        case 'setWifiSettings':
            return { code: 1, requestId: 1 };
        case 'timeSettings':
            return {
                configured: true,
                server: 'some.ntp.server',
                timeZoneId: 35,
                timeZoneOffsetSeconds: 3600,
                cityName: 'Madrid',
                useDayLightSaving: true,
                code: 1,
                requestId: 1,
            };
        case 'currentTime':
            return {
                currentTime: {
                    dayOfTheMonth: 3,
                    dayOfTheWeek: 1,
                    dayOfTheYear: 2,
                    month: 1,
                    year: 2023,
                    hour: 18,
                    minute: 59,
                    second: 45,
                    summerTimeInUse: false,
                },
                configured: true,
                code: 1,
                requestId: 1,
            };
        case 'setTimeSettings':
            return { code: 1, requestId: 1 };
        case 'networkNameSettings':
            return { networkName: 'module', code: 1, requestId: 1 };
        case 'setNetworkNameSettings':
            return { code: 1, requestId: 1 };
        case 'restartParameters':
            return {
                moduleUrl: 'http://localhost:3000/',
                currentConnectionState: WIFI_STATE_CONFIGURATION_ACCESS_POINT,
                newWifiSsid: 'newWifi',
                wifiConfigured: true,
                timeConfigured: true,
                code: 1,
                requestId: 1,
            };
        case 'restart':
            return { code: 1, requestId: 1 };
        case 'irCommandsSettings':
            return {
                code: 1,
                requestId: 1,
                commands: [
                    `Sony${IrCommandId.PowerSwitch}`,
                    `Sony${IrCommandId.Play}`,
                    `Sony${IrCommandId.Pause}`,
                    `Sony${IrCommandId.Stop}`,
                    `Sony${IrCommandId.DiskSelect}`,
                    `Sony${IrCommandId.TrackSelect}`,
                    `Sony${IrCommandId.Enter}`,
                    `Sony${IrCommandId.Number0}`,
                    `Sony${IrCommandId.Number1}`,
                    `Sony${IrCommandId.Number2}`,
                    `Sony${IrCommandId.Number3}`,
                    `Sony${IrCommandId.Number4}`,
                    `Sony${IrCommandId.Number5}`,
                    `Sony${IrCommandId.Number6}`,
                    `Sony${IrCommandId.Number7}`,
                    `Sony${IrCommandId.Number8}`,
                    `Sony${IrCommandId.Number9}`,
                    `Technics${IrCommandId.PowerSwitch}`,
                    `Technics${IrCommandId.Play}`,
                    `Technics${IrCommandId.Pause}`,
                    `Technics${IrCommandId.Stop}`,
                    `Technics${IrCommandId.DiskSelect}`,
                    `Technics${IrCommandId.TrackSelect}`,
                    `Technics${IrCommandId.Enter}`,
                ],
            };
        case 'startRecordIrCommand':
            return { code: 1, requestId: 1 };
        case 'stopRecordIrCommand':
            return { code: 1, requestId: 1 };
        default:
            return null;
    }
};

const getStubResponse = (
    handler: MessageHandlerId,
    requestId: number,
    request: InternalMessage,
) => {
    const response = getStubResponseByHandler(handler);
    if (response) {
        if (typeof response === 'function') {
            const callableResponse = response as (
                req: InternalMessage,
            ) => object;
            return JSON.stringify({ ...callableResponse(request), requestId });
        } else {
            response.requestId = requestId;
            return JSON.stringify(response);
        }
    }
    return null;
};

export default getStubResponse;
