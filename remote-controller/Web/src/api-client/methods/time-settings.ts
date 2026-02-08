import { ApiMethod, SetterResponse } from 'api-client/types';

export type CurrentTime = {
    dayOfTheMonth: number;
    dayOfTheWeek: number;
    dayOfTheYear: number;
    month: number;
    year: number;
    hour: number;
    minute: number;
    second: number;
    summerTimeInUse: boolean;
};

export type CurrentTimeData = {
    currentTime?: CurrentTime;
    configured: boolean;
};

export type TimeSettingsData = {
    configured: boolean;
    server: string;
    timeZoneId: number;
    timeZoneOffsetSeconds: number;
    cityName: string;
    useDayLightSaving: boolean;
};

export type GetTimeSettingsSignature = () => Promise<TimeSettingsData>;
export type GetCurrentTimeSignature = () => Promise<CurrentTimeData>;
export type SetTimeSettingsSignature = (
    data: TimeSettingsData,
) => Promise<SetterResponse>;

export const getCurrentTime: ApiMethod<GetCurrentTimeSignature> =
    (apiSocket) => () => {
        return apiSocket.send({
            handler: 'currentTime',
        }) as unknown as ReturnType<GetCurrentTimeSignature>;
    };

export const getTimeSettings: ApiMethod<GetTimeSettingsSignature> =
    (apiSocket) => () => {
        return apiSocket.send({
            handler: 'timeSettings',
        }) as unknown as ReturnType<GetTimeSettingsSignature>;
    };

export const setTimeSettings: ApiMethod<SetTimeSettingsSignature> =
    (apiSocket) => (data: TimeSettingsData) => {
        return apiSocket.send({
            handler: 'setTimeSettings',
            ...data,
        }) as unknown as ReturnType<SetTimeSettingsSignature>;
    };
