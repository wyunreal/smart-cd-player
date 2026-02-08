import { ThemeProvider } from '@mui/material/styles';
import { theme, darkTheme } from 'theme/theme';
import CssBaseline from '@mui/material/CssBaseline';
import StyledEngineProvider from '@mui/material/StyledEngineProvider';
import useMediaQuery from '@mui/material/useMediaQuery';
import Routes from 'routes';
import NavigationScroll from 'layout/NavigationScroll';

const App = () => {
    const isDarkModeEnabled = useMediaQuery('(prefers-color-scheme: dark)');

    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={isDarkModeEnabled ? darkTheme : theme}>
                <CssBaseline enableColorScheme />
                <NavigationScroll>
                    <Routes />
                </NavigationScroll>
            </ThemeProvider>
        </StyledEngineProvider>
    );
};

export default App;
