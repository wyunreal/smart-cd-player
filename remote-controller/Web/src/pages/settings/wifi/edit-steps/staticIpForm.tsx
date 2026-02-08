import { ChangeEventHandler, Dispatch, SetStateAction } from 'react';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import { WifiSettingsData } from 'api-client/methods/wifiSettings';
import { GridItem } from 'layout/utils';

const validIpRegexp =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const validSubnetMask =
    /^(((255\.){3}(255|254|252|248|240|224|192|128|0+))|((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|((255|254|252|248|240|224|192|128|0+)(\.0+){3}))$/;

const validateIp = (ip: string) => {
    switch (true) {
        case ip === '':
            return 'IP address can not be empty.';
        case !validIpRegexp.test(ip):
            return 'IP address format is incorrect. A valid IP address should be 4 integer numbers separated by ".", for example 192.168.1.10 or 10.0.0.15';
        default:
            return null;
    }
};

const validateGateway = (gateway: string, ip: string) => {
    switch (true) {
        case gateway === '':
            return 'Gateway IP address can not be empty.';
        case !validIpRegexp.test(gateway):
            return 'The gateway IP address format is incorrect. A valid gateway IP address should be 4 integer numbers separated by ".", for example 192.168.1.1 or 10.0.0.1';
        case validIpRegexp.test(ip) &&
            ip.substring(0, ip.indexOf('.')) !==
                gateway.substring(0, gateway.indexOf('.')):
            return 'The IP address and the gateway IP address should belong to the same network.';
        default:
            return null;
    }
};

const validateSubnet = (subnet: string) => {
    switch (true) {
        case subnet === '':
            return 'Subnet mask can not be empty.';
        case !validSubnetMask.test(subnet):
            return 'The subnet mask format is incorrect. A valid subnet mask should be like 255.255.255.0 for 192.168.1.* networks or 255.0.0.0 for 10.x.y.z networks.';
        default:
            return null;
    }
};

export const validateStaticIpFormForm = (data: WifiSettingsData) => {
    return data.staticIp.useStaticIp
        ? {
              ip: validateIp(data.staticIp.ip || ''),
              gateway: validateGateway(
                  data.staticIp.gateway || '',
                  data.staticIp.ip || '',
              ),
              subnet: validateSubnet(data.staticIp.subnet || ''),
          }
        : { ip: null, gateway: null, subnet: null };
};

const sanitizeValues = (
    name: string,
    value: string,
): string | number | boolean => {
    switch (name) {
        case 'useStaticIp':
            return value === '1' ? true : false;
        default:
            return value;
    }
};

const StaticIpConfigForm = ({
    data,
    setData,
    errors,
}: {
    data: WifiSettingsData;
    setData: Dispatch<SetStateAction<WifiSettingsData>>;
    errors: { [key: string]: string | null };
}) => {
    const handleInputChange: ChangeEventHandler<
        HTMLInputElement | HTMLTextAreaElement
    > = (e) => {
        const { name, value } = e.target;
        const sanitizedValue = sanitizeValues(name, value);
        setData({
            ...data,
            staticIp: {
                ...data.staticIp,
                [name]: sanitizedValue,
            },
        });
    };

    return (
        <>
            <GridItem>
                <FormControl>
                    <FormLabel>Use static IP configuration</FormLabel>
                    <RadioGroup
                        name="useStaticIp"
                        value={data.staticIp.useStaticIp ? '1' : '0'}
                        onChange={handleInputChange}
                        row
                    >
                        <FormControlLabel
                            key="true"
                            value={'1'}
                            control={<Radio size="small" />}
                            label="Yes"
                        />
                        <FormControlLabel
                            key="false"
                            value={'0'}
                            control={<Radio size="small" />}
                            label="No"
                        />
                    </RadioGroup>
                </FormControl>
            </GridItem>
            <GridItem>
                <TextField
                    id="ip"
                    name="ip"
                    label="IP address"
                    type="text"
                    value={data.staticIp.ip || ''}
                    onChange={handleInputChange}
                    fullWidth
                    error={!!errors.ip}
                    helperText={errors.ip}
                    disabled={!data.staticIp.useStaticIp}
                />
            </GridItem>
            <GridItem>
                <TextField
                    id="gateway"
                    name="gateway"
                    label="Gateway IP address"
                    type="text"
                    value={data.staticIp.gateway || ''}
                    onChange={handleInputChange}
                    fullWidth
                    error={!!errors.gateway}
                    helperText={errors.gateway}
                    disabled={!data.staticIp.useStaticIp}
                />
            </GridItem>
            <GridItem>
                <TextField
                    id="subnet"
                    name="subnet"
                    label="Subnet mask"
                    type="text"
                    value={data.staticIp.subnet || ''}
                    onChange={handleInputChange}
                    fullWidth
                    error={!!errors.subnet}
                    helperText={errors.subnet}
                    disabled={!data.staticIp.useStaticIp}
                />
            </GridItem>
        </>
    );
};
export default StaticIpConfigForm;
