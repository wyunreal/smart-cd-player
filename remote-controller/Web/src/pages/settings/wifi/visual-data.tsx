import { WifiSettingsData } from 'api-client/methods/wifiSettings';
import WifiIcon from '@mui/icons-material/Wifi';
import SettingsEthernetOutlinedIcon from '@mui/icons-material/SettingsEthernetOutlined';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { Category } from 'component/types';

const getVisualData = (data: WifiSettingsData): Category[] => [
    {
        category: 'Connection',
        content: [
            {
                icon: <WifiIcon />,
                name: 'SSID',
                value: data.wifiConnection.ssid,
            },
            {
                icon: <SettingsEthernetOutlinedIcon />,
                name: 'Password',
                type: 'password',
                value: data.wifiConnection.password,
            },
        ],
    },
    {
        category: 'Static Ip',
        content: [
            ...(!data.staticIp.useStaticIp
                ? [
                      {
                          icon: <CloseOutlinedIcon />,
                          name: 'Enabled',
                          value: 'No',
                      },
                  ]
                : []),
            {
                icon: <LinkRoundedIcon />,
                name: 'IP',
                value: data.staticIp.ip || '',
            },
            {
                icon: <LinkRoundedIcon />,
                name: 'Gateway',
                value: data.staticIp.gateway || '',
            },
            {
                icon: <LinkRoundedIcon />,
                name: 'Subnet mask',
                value: data.staticIp.subnet || '',
            },
        ],
    },
];

export default getVisualData;
