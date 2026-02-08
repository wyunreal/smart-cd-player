import PublicIcon from '@mui/icons-material/Public';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import { TimeZoneRecord } from 'api-client/timeZones';

const getVisualData = (
    data: TimeZoneRecord,
    useDayLightSaving: boolean,
    city: string,
    timeServer: string,
) => [
    {
        category: 'Time zone',
        content: [
            {
                icon: <PublicIcon />,
                name: 'Name',
                value: data.name,
            },
            {
                icon: <WbSunnyOutlinedIcon />,
                name: 'Use daylight saving',
                value: useDayLightSaving ? 'Yes' : 'No',
            },
            {
                icon: <AddOutlinedIcon />,
                name: 'Offset',
                value: data.offsetDisplay,
            },
            {
                icon: <LocationCityOutlinedIcon />,
                name: 'City',
                value: city,
            },
        ],
    },
    {
        category: 'Time server',
        content: [
            {
                icon: <DnsOutlinedIcon />,
                name: 'Address',
                value: timeServer,
            },
        ],
    },
];

export default getVisualData;
