import { useOutlet } from 'react-router-dom';
import useScrollTrigger from '@mui/material/useScrollTrigger';

// material-ui
import { styled, useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import { menuItems } from 'routes';

// project imports
import Header from './Header';
import Sidebar from './Sidebar';
import { drawerWidth } from 'layout/constants';
import TitleBar from './title-bar';
import { PageTitleContextProvider } from 'layout/utils/page-title-context';

// styles
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme }) => ({
        backgroundColor: theme.palette.section.background,
        minHeight: 'calc(100vh - 66px)',

        flexGrow: 1,
        padding: '10px',
        marginTop: '66px',
        borderRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        [theme.breakpoints.down('md')]: {
            borderRadius: 0,
        },
        [theme.breakpoints.up('sm')]: {
            padding: 20,
        },
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
        width: `calc(100% - ${drawerWidth}px)`,
        [theme.breakpoints.up('md')]: {
            marginRight: 20,
            width: `calc(100% - ${drawerWidth}px)`,
        },
    }),
);

const DesktopLayout = () => {
    const theme = useTheme();
    const scrollTrigger = useScrollTrigger({
        threshold: 1,
        disableHysteresis: true,
    });

    const outlet = useOutlet();

    const notificationsEnabled = menuItems.some(
        (item) => item.id === 'notifications' && !item.disabled,
    );

    return (
        <Box
            sx={{
                display: 'flex',
            }}
        >
            <CssBaseline />
            <PageTitleContextProvider>
                <AppBar
                    enableColorOnDark
                    position="fixed"
                    color="inherit"
                    elevation={0}
                    sx={{
                        bgcolor: theme.palette.background.default,
                    }}
                >
                    <Toolbar
                        sx={{
                            boxShadow: scrollTrigger ? 4 : 0,
                            marginLeft: '-8px',
                        }}
                    >
                        <Header notificationsEnabled={notificationsEnabled} />
                    </Toolbar>
                </AppBar>

                <Sidebar />
                <Main theme={theme}>
                    <TitleBar />
                    <Box
                        sx={{
                            overflowY: 'auto',
                            height: 'calc(100vh - 160px)',

                            msOverflowStyle: 'none',
                            scrollbarWidth: 'none' /* for Firefox */,
                            '&::-webkit-scrollbar': {
                                display: 'none',
                            },
                        }}
                    >
                        {outlet}
                    </Box>
                </Main>
            </PageTitleContextProvider>
        </Box>
    );
};

export default DesktopLayout;
