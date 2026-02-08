import { TimeZones } from 'index';
import getStubTimeZones from './stubTimeZones';
import { Location } from 'index';

export type TimeZoneRecord = {
    id: number;
    offset: number;
    offsetDisplay: string;
    name: string;
    cities: Location[];
};

const getTimeZones = (): TimeZones => {
    if (process.env.NODE_ENV === 'production') {
        return window.wreefTimeZones;
    } else {
        return getStubTimeZones();
    }
};

export const getAllTimeZones = (): TimeZoneRecord[] => {
    const timeZones = getTimeZones();
    const foundTimeZones = [];
    for (const offsetDisplay in timeZones) {
        const [offset, offsetTimeZones] = timeZones[offsetDisplay];
        for (let i = 0; i < offsetTimeZones.length; i++) {
            const [id, name, locations] = offsetTimeZones[i];
            foundTimeZones.push({
                id,
                offset,
                offsetDisplay,
                name,
                cities: locations,
            });
        }
    }
    return foundTimeZones;
};

export const getTimeZone = (
    timeZoneId: number,
    timeZoneOffsetSeconds: number,
    cityName: string,
): TimeZoneRecord | null => {
    const timeZones = getTimeZones();
    for (const offsetDisplay in timeZones) {
        const [offset, offsetTimeZones] = timeZones[offsetDisplay];
        if (offset === timeZoneOffsetSeconds) {
            for (let i = 0; i < offsetTimeZones.length; i++) {
                const [id, name, locations] = offsetTimeZones[i];
                for (let j = 0; j < locations.length; j++) {
                    const [locationName, left, top] = locations[j];
                    if (locationName === cityName) {
                        return {
                            id,
                            offset,
                            offsetDisplay,
                            name,
                            cities: [[locationName, left, top]],
                        };
                    }
                }
                if (id === timeZoneId) {
                    return {
                        id,
                        offset,
                        offsetDisplay,
                        name,
                        cities: [],
                    };
                }
                if (i === offsetTimeZones.length - 1) {
                    const [id, name] = offsetTimeZones[0];
                    return {
                        id,
                        offset,
                        offsetDisplay,
                        name,
                        cities: [],
                    };
                }
            }
        }
    }
    return null;
};
