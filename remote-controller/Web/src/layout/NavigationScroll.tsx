import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PAGE_TRANSITION_DURATION } from './main-layout/mobile/page-transition-context';

const NavigationScroll = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    const { pathname } = location;

    useEffect(() => {
        const handler = setTimeout(() => {
            window.scrollTo({
                top: 0,
                left: 0,
            });
        }, PAGE_TRANSITION_DURATION);

        return () => clearTimeout(handler);
    }, [pathname]);

    return children || null;
};

export default NavigationScroll;
