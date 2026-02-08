import { Dispatch, SetStateAction, SyntheticEvent } from 'react';
import { GridItem } from 'layout/utils';
import {
    AutocompleteChangeReason,
    createFilterOptions,
} from '@mui/material/Autocomplete';
import { TimeSettingsData } from 'api-client/methods/time-settings';
import AutoComplete from 'component/building-blocks/forms/auto-complete';

const serversList = [
    'pool.ntp.org',
    'europe.pool.ntp.org',
    'asia.pool.ntp.org',
    'ru.pool.ntp.org',
    'cronos.cenam.mx',
    'hora.roa.es',
    'minuto.roa.es',
    'time.google.com',
    'time.cloudflare.com',
    'time.facebook.com',
    'time.windows.com',
    'time.apple.com',
    'time.euro.apple.com',
];

type ServerOption = {
    label: string;
};

export const validateTimeServerForm = (data: TimeSettingsData) => {
    return {
        server:
            data.server === ''
                ? 'You need to select or enter a time server url.'
                : null,
    };
};

const TimeServerForm = ({
    data,
    setData,
    errors,
}: {
    data: TimeSettingsData;
    setData: Dispatch<SetStateAction<TimeSettingsData>>;
    errors: { [key: string]: string | null };
}) => {
    const handleServerChange = (
        event: SyntheticEvent<Element, Event>,
        value: ServerOption | null,
        reason: AutocompleteChangeReason,
    ) => {
        if (value) {
            setData({
                ...data,
                server: value.label,
            });
        }
    };

    return (
        <GridItem>
            <AutoComplete<ServerOption>
                id="server"
                options={serversList.map((server) => ({ label: server }))}
                label="Time server"
                errors={errors}
                onChange={handleServerChange}
                value={{ label: data.server }}
                isOptionEqualToValue={(
                    option: ServerOption,
                    value: ServerOption | null,
                ) => option.label === value?.label}
                noOptionsText="Enter an NTP server URL"
                filterOptions={(options, params) => {
                    const filtered = createFilterOptions<ServerOption>()(
                        options,
                        params,
                    );

                    const { inputValue } = params;
                    const isExisting = options.some(
                        (option) => inputValue === option.label,
                    );
                    if (inputValue !== '' && !isExisting) {
                        filtered.push({ label: inputValue });
                    }

                    return filtered;
                }}
            />
        </GridItem>
    );
};
export default TimeServerForm;
