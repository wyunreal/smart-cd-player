import {
    Dispatch,
    SetStateAction,
    SyntheticEvent,
    useContext,
    useEffect,
    useState,
} from 'react';
import { Location } from 'index';
import { GridItem } from 'layout/utils';
import { TimeSettingsData } from 'api-client/methods/time-settings';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { ApiContext } from 'api-client';
import { TimeZoneRecord } from 'api-client/timeZones';
import { AutocompleteChangeReason, createFilterOptions } from '@mui/material';
import AutoComplete from 'component/building-blocks/forms/auto-complete';

type TimeZoneAutoCompleteOption = TimeZoneRecord & {
    label: string;
};

type CityOption = {
    label: string;
};

const validateTimeZoneId = (id: number) => {
    return id <= 0 ? 'You need to select a timezone.' : null;
};

const validateCityName = (cityName: string) => {
    return cityName === '' ? 'You need to select or enter a city name.' : null;
};

export const validateTimeZoneConfigForm = (data: TimeSettingsData) => {
    return {
        timeZoneOffsetSeconds: null,
        timeZoneId: validateTimeZoneId(data.timeZoneId),
        cityName: validateCityName(data.cityName),
        useDayLightSaving: null,
    };
};

const getTimeZoneCities = (timeZone: TimeZoneAutoCompleteOption | null) =>
    timeZone
        ? timeZone.cities.map((city: Location) => {
              const [name] = city;
              return { label: name };
          })
        : [];

const TimeZoneConfigForm = ({
    data,
    setData,
    errors,
}: {
    data: TimeSettingsData;
    setData: Dispatch<SetStateAction<TimeSettingsData>>;
    errors: { [key: string]: string | null };
}) => {
    const { api } = useContext(ApiContext);
    const [timeZones, setTimeZones] = useState<
        TimeZoneAutoCompleteOption[] | null
    >(null);
    const [selectedTimeZone, setSelectedTimeZone] =
        useState<TimeZoneAutoCompleteOption | null>(null);

    useEffect(() => {
        if (!timeZones) {
            setTimeZones(
                api
                    .getAllTimeZones()
                    .map((timeZone) => ({ label: timeZone.name, ...timeZone })),
            );
        }
    }, [api, setTimeZones, timeZones]);

    useEffect(() => {
        const currentZone = timeZones?.find(
            (zone) => zone.id === data.timeZoneId,
        );
        setSelectedTimeZone(
            currentZone ? { ...currentZone, label: currentZone.name } : null,
        );
    }, [setSelectedTimeZone, timeZones, data]);

    const handleTimeZoneChange = (
        event: SyntheticEvent<Element, Event>,
        value: TimeZoneAutoCompleteOption | null,
        reason: AutocompleteChangeReason,
    ) => {
        if (value) {
            setData({
                ...data,
                configured: true,
                timeZoneId: value.id,
                timeZoneOffsetSeconds: value.offset,
                cityName: '',
            });
            setSelectedTimeZone(value);
        }
    };

    const handleCityChange = (
        event: SyntheticEvent<Element, Event>,
        value: CityOption | null,
        reason: AutocompleteChangeReason,
    ) => {
        if (value) {
            setData({
                ...data,
                cityName: value.label,
            });
        }
    };

    const handleUseDayLightSavingChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setData({
            ...data,
            useDayLightSaving: event.target.checked,
        });
    };

    return (
        <>
            <GridItem>
                <AutoComplete<TimeZoneAutoCompleteOption>
                    id="timezones"
                    options={timeZones || []}
                    label="Time zone"
                    onChange={handleTimeZoneChange}
                    value={selectedTimeZone}
                    isOptionEqualToValue={(
                        option: TimeZoneAutoCompleteOption,
                        value: TimeZoneAutoCompleteOption | null,
                    ) => option.id === value?.id}
                    noOptionsText="No timezones found with your input"
                />
            </GridItem>
            <GridItem>
                <AutoComplete<CityOption>
                    id="cityName"
                    options={getTimeZoneCities(selectedTimeZone)}
                    label="City"
                    onChange={handleCityChange}
                    value={{ label: data.cityName }}
                    filterOptions={(options: CityOption[], params: any) => {
                        const filtered = createFilterOptions<CityOption>()(
                            options,
                            params,
                        );

                        const { inputValue } = params;
                        const isExisting = options.some(
                            (option) => inputValue === option,
                        );
                        if (inputValue !== '' && !isExisting) {
                            filtered.push({ label: inputValue });
                        }

                        return filtered;
                    }}
                    isOptionEqualToValue={(
                        option: CityOption,
                        value: CityOption | null,
                    ) => option.label === value?.label}
                    noOptionsText="Enter your city name"
                />
            </GridItem>
            <GridItem>
                <FormControlLabel
                    control={
                        <Switch
                            onChange={handleUseDayLightSavingChange}
                            checked={data.useDayLightSaving}
                        />
                    }
                    label="Use daylight saving"
                />
            </GridItem>
        </>
    );
};
export default TimeZoneConfigForm;
