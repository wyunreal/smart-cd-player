import { SvgIconComponent } from '@mui/icons-material';
import Box from '@mui/material/Box';
import useTheme from '@mui/material/styles/useTheme';

const MainIcon = ({ Icon }: { Icon: SvgIconComponent }) => {
    const theme = useTheme();
    return (
        <Box
            sx={{
                minWidth: '92px',
                minHeight: '92px',
                [theme.breakpoints.down('md')]: {
                    textAlign: 'center',
                },
                [theme.breakpoints.up('md')]: {
                    marginBottom: 1,
                },
            }}
        >
            <Icon
                color="disabled"
                sx={{
                    minWidth: '92px',
                    minHeight: '92px',
                }}
            />
        </Box>
    );
};

export default MainIcon;
