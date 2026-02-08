import { styled } from '@mui/material/styles';
import BottomNavigationTabs from './navigation';
import { getMobileMainNavigation, isMobileRootbRoute } from 'routes';
import TitleBar from '../../utils/mobile/title-bar';
import { PageTitleContextProvider } from 'layout/utils/page-title-context';
import { useOutlet, useLocation } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import React from 'react';
import AnimationContextProvider, {
    PAGE_TRANSITION_DURATION,
} from './page-transition-context';

const Main = styled('main')(({ theme }) => ({
    backgroundColor: theme.palette.section.background,
    width: '100%',
    flexGrow: 1,
    padding: 16,
    minHeight: 'calc(100vh - 114px)',
    [theme.breakpoints.up('sm')]: {
        padding: 24,
        minHeight: 'calc(100vh - 122px)',
    },
    marginBottom: 56,
}));

const Mobilelayout = () => {
    const location = useLocation();
    const outlet = useOutlet();
    const [currentPathName, setCurrentPathName] = React.useState<string | null>(
        null,
    );
    const [currentOutlet, setCurrentOutlet] = React.useState(outlet);
    const [isRouting, setIsRouting] = React.useState(false);

    React.useEffect(() => {
        if (currentPathName !== location.pathname) {
            setIsRouting(false);
            const timeout = setTimeout(() => {
                setCurrentOutlet(outlet);
                setCurrentPathName(location.pathname);
                setIsRouting(true);
            }, PAGE_TRANSITION_DURATION);
            return () => clearTimeout(timeout);
        }
    }, [currentPathName, location.pathname, currentOutlet, outlet]);

    return (
        <PageTitleContextProvider>
            <AnimationContextProvider
                startAnimation={() => {
                    setIsRouting(false);
                }}
            >
                <TitleBar showAvatar />
                <Main>
                    <CSSTransition
                        key={location.key}
                        in={isRouting}
                        timeout={PAGE_TRANSITION_DURATION}
                        classNames={
                            isMobileRootbRoute(location.pathname)
                                ? 'tab'
                                : 'flow'
                        }
                        unmountOnExit
                    >
                        {currentOutlet}
                    </CSSTransition>
                </Main>
                <BottomNavigationTabs
                    items={getMobileMainNavigation()}
                    notificationsBadge={4}
                />
            </AnimationContextProvider>
        </PageTitleContextProvider>
    );
};

export default Mobilelayout;
