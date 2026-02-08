import useTheme from '@mui/material/styles/useTheme';
import Box from '@mui/material/Box';
import MenuList from './MenuList';
import { drawerWidth, marginTop } from 'layout/constants';

const Sidebar = () => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                marginTop: `${marginTop}px`,
                background: theme.palette.background.default,
                color: theme.palette.text.primary,
            }}
            color="inherit"
        >
            <Box sx={{ px: 2, width: drawerWidth }}>
                <MenuList />
            </Box>
        </Box>
    );
};

export default Sidebar;
