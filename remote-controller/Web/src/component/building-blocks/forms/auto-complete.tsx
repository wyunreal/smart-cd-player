import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import useMediaQuery from '@mui/material/useMediaQuery';
import Autocomplete, {
    AutocompleteChangeReason,
} from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { SyntheticEvent, useEffect, useState } from 'react';
import useTheme from '@mui/material/styles/useTheme';

type Option = {
    label: string;
};

const AutoComplete = <T extends Option>({
    id,
    label,
    options,
    value,
    onChange,
    errors,
    isOptionEqualToValue,
    filterOptions,
    noOptionsText,
}: {
    id: string;
    label: string;
    options: T[];
    value: T | null;
    onChange: (
        event: SyntheticEvent<Element, Event>,
        value: T | null,
        reason: AutocompleteChangeReason,
    ) => void;
    errors?: { [key: string]: string | null };
    isOptionEqualToValue?: (option: T, value: T | null) => boolean;
    filterOptions?: (options: T[], params: any) => T[];
    noOptionsText?: string;
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [dialogOpen, setDialogOpen] = useState(false);
    const [autoCompleteRef, setAutoCompleteRef] =
        useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (autoCompleteRef) {
            const input = autoCompleteRef.querySelector('input');
            if (input) {
                input.focus();
                const handler = setTimeout(() => {
                    input.select();
                }, 0);

                return () => {
                    clearTimeout(handler);
                };
            }
        }
    }, [autoCompleteRef]);

    return isMobile ? (
        <>
            <TextField
                id={id}
                fullWidth
                label={label}
                error={errors && !!errors[id]}
                helperText={errors && errors[id]}
                value={value ? value.label : ''}
                onClick={() => setDialogOpen(true)}
            />
            <Dialog
                fullScreen
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
            >
                <Box sx={{ margin: 2 }}>
                    <Autocomplete
                        disablePortal
                        id={id}
                        open
                        selectOnFocus
                        options={options}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={label}
                                ref={(ref) => {
                                    setAutoCompleteRef(ref);
                                }}
                            />
                        )}
                        onChange={(event, value, reason) => {
                            onChange(event, value, reason);
                            if (value) {
                                setDialogOpen(false);
                            }
                        }}
                        value={value}
                        isOptionEqualToValue={isOptionEqualToValue}
                        filterOptions={filterOptions}
                        noOptionsText={noOptionsText}
                    />
                </Box>
            </Dialog>
        </>
    ) : (
        <Autocomplete
            disablePortal={false}
            fullWidth
            id={id}
            options={options}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={errors && !!errors[id]}
                    helperText={errors && errors[id]}
                />
            )}
            onChange={onChange}
            value={value}
            isOptionEqualToValue={isOptionEqualToValue}
            filterOptions={filterOptions}
            noOptionsText={noOptionsText}
        />
    );
};

export default AutoComplete;
