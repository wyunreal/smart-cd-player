import { ChangeEventHandler, Dispatch, SetStateAction } from 'react';
import TextField from '@mui/material/TextField';
import { GridItem } from 'layout/utils';
import { NetworkNameSettingsData } from 'api-client/methods/network-name-settings';

const alphaNumericRegexp = /^[a-z0-9_]+$/;

const validateNetworkNameField = (networkName: string) => {
    switch (true) {
        case networkName === '':
            return 'The network name can not be empty.';
        case networkName.length > 50:
            return 'The network name should be 50 characters or less.';
        case networkName.length < 10:
            return 'The network name should be 10 characters or more.';
        case !alphaNumericRegexp.test(networkName):
            return 'The network name should include only alphanumeric characters: 0 to 9 and a to z, all lowercase';
        default:
            return null;
    }
};

export const validateNetworkName = (data: NetworkNameSettingsData) => {
    return {
        networkName: validateNetworkNameField(data.networkName),
    };
};

const NetworkNameForm = ({
    data,
    setData,
    errors,
}: {
    data: NetworkNameSettingsData;
    setData: Dispatch<SetStateAction<NetworkNameSettingsData>>;
    errors: { [key: string]: string | null };
}) => {
    const handleInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement
    > = (e) => {
        const { value } = e.target;
        setData({
            ...data,
            networkName: value,
        });
    };

    return (
        <>
            <GridItem>
                <TextField
                    id="networkName"
                    name="networkName"
                    label="Network name"
                    type="text"
                    value={data.networkName}
                    onChange={handleInputChange}
                    fullWidth
                    error={!!errors.networkName}
                    helperText={errors.networkName}
                />
            </GridItem>
        </>
    );
};
export default NetworkNameForm;
