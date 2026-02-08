import ReconnectingWebSocket from 'reconnecting-websocket';
import {
    GetNetworkNameSettingsSignature,
    SetNetworkNameSettingsSignature,
} from './methods/network-name-settings';
import { RestartModuleSignature } from './methods/restart-module';
import { GetRestartPatrametersSignature } from './methods/restart-parameters';
import {
    GetCurrentTimeSignature,
    GetTimeSettingsSignature,
    SetTimeSettingsSignature,
} from './methods/time-settings';
import {
    GetWifiSettingsSignature,
    SetWifiSettingsSignature,
} from './methods/wifiSettings';
import { TimeZoneRecord } from './timeZones';

import connect from 'api-client/socket';
import {
    GetIrCommandsSettingsSignature,
    StartRecordIrCommandsSignature,
    StopRecordIrCommandsSignature,
} from './methods/ir-commands-settings';

export type MessageHandlerId =
    // General
    | 'wifiSettings'
    | 'setWifiSettings'
    | 'timeSettings'
    | 'currentTime'
    | 'setTimeSettings'
    | 'networkNameSettings'
    | 'setNetworkNameSettings'
    | 'restartParameters'
    | 'restart'
    // IR remote devices
    | 'irCommandsSettings'
    | 'startRecordIrCommand'
    | 'stopRecordIrCommand';

export const RESPONSE_CODE_ERROR = 0;
export const RESPONSE_CODE_SUCCESS = 1;

export interface SetterResponse {
    code: 0 | 1;
}

export type ApiMethod<T> = (apiSocket: ReturnType<typeof connect>) => T;

export type Api = {
    // General
    isModuleAlive: (moduleHost: string) => Promise<boolean>;
    getAllTimeZones: () => TimeZoneRecord[];
    getTimeZone: (
        timeZoneId: number,
        timeZoneOffsetSeconds: number,
        cityName: string,
    ) => TimeZoneRecord | null;
    getWifiSettings: GetWifiSettingsSignature;
    setWifiSettings: SetWifiSettingsSignature;
    getCurrentTime: GetCurrentTimeSignature;
    getTimeSettings: GetTimeSettingsSignature;
    setTimeSettings: SetTimeSettingsSignature;
    getNetworkNameSettings: GetNetworkNameSettingsSignature;
    setNetworkNameSettings: SetNetworkNameSettingsSignature;
    getRestartParameters: GetRestartPatrametersSignature;
    restartModule: RestartModuleSignature;
    // IR devices
    getIrCommandsSettings?: GetIrCommandsSettingsSignature;
    startRecordIrCommands?: StartRecordIrCommandsSignature;
    stopRecordIrCommands?: StopRecordIrCommandsSignature;
};

export interface Notification {
    type: string;
    requestId: number;
}

export type ApiSocket = {
    addEventListener: ReconnectingWebSocket['addEventListener'];
    send: ReconnectingWebSocket['send'];
};

export interface Message {
    handler: MessageHandlerId;
    type?: string;
}

export interface InternalMessage extends Message {
    requestId: number;
}

export type NotificationsHandler = (notification: Notification) => void;
