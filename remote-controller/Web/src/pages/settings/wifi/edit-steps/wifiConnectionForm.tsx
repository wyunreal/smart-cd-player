import { ChangeEventHandler, Dispatch, SetStateAction, useState } from 'react';
import TextField from '@mui/material/TextField';
import { WifiSettingsData } from 'api-client/methods/wifiSettings';
import { GridItem } from 'layout/utils';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

const validateSSID = (ssid: string) => {
    switch (true) {
        case ssid === '':
            return 'SSID can not be empty.';
        case ssid.length > 50:
            return 'SSID should be 50 characters or less.';
        default:
            return null;
    }
};

const validatePassword = (password: string) => {
    switch (true) {
        case password === '':
            return 'Password can not be empty.';
        case password.length > 150:
            return 'Password should be 150 characters or less.';
        default:
            return null;
    }
};

export const validateWifiConfigForm = (data: WifiSettingsData) => {
    return {
        ssid: validateSSID(data.wifiConnection.ssid),
        password: validatePassword(data.wifiConnection.password),
    };
};

const WifiConfigForm = ({
    data,
    setData,
    errors,
}: {
    data: WifiSettingsData;
    setData: Dispatch<SetStateAction<WifiSettingsData>>;
    errors: { [key: string]: string | null };
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const handleInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement
    > = (e) => {
        const { name, value } = e.target;
        setData({
            ...data,
            wifiConnection: {
                ...data.wifiConnection,
                [name]: value,
            },
        });
    };

    return (
        <>
            <GridItem>
                <TextField
                    id="ssid"
                    name="ssid"
                    label="SSID"
                    type="text"
                    value={data.wifiConnection.ssid}
                    onChange={handleInputChange}
                    fullWidth
                    error={!!errors.ssid}
                    helperText={errors.ssid}
                />
            </GridItem>
            <GridItem>
                <Box sx={{ position: 'relative' }}>
                    <TextField
                        id="password"
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={data.wifiConnection.password}
                        onChange={handleInputChange}
                        fullWidth
                        error={!!errors.password}
                        helperText={errors.password}
                    />
                    <IconButton
                        sx={{ position: 'absolute', right: '8px', top: '8px' }}
                        onClick={() => {
                            setShowPassword(!showPassword);
                        }}
                    >
                        {showPassword ? (
                            <VisibilityOffOutlinedIcon />
                        ) : (
                            <VisibilityOutlinedIcon />
                        )}
                    </IconButton>
                </Box>
            </GridItem>
        </>
    );
};
export default WifiConfigForm;
