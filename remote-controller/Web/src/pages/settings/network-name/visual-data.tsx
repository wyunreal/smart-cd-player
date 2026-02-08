import DomainVerificationOutlinedIcon from '@mui/icons-material/DomainVerificationOutlined';
import AbcOutlinedIcon from '@mui/icons-material/AbcOutlined';
import { NetworkNameSettingsData } from 'api-client/methods/network-name-settings';

const getVisualData = (data: NetworkNameSettingsData) => [
    {
        category: 'Network name',
        content: [
            {
                icon: <AbcOutlinedIcon />,
                name: 'Name',
                value: data.networkName,
            },
            {
                icon: <DomainVerificationOutlinedIcon />,
                name: 'Module url',
                value: `http://${data.networkName}.local`,
            },
        ],
    },
];

export default getVisualData;
