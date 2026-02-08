import Box from '@mui/material/Box';
import LogoSection from '../LogoSection';
import NotificationSection from '../NotificationSection';

const Header = ({
    notificationsEnabled,
}: {
    notificationsEnabled: boolean;
}) => (
    <>
        <Box
            sx={{
                display: 'flex',
            }}
        >
            <Box
                component="span"
                sx={{
                    flexGrow: 1,
                }}
            >
                <LogoSection />
            </Box>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        {notificationsEnabled && <NotificationSection />}
    </>
);

export default Header;
