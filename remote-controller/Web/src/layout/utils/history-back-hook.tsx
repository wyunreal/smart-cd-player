import {
    AnimationContext,
    PAGE_TRANSITION_DURATION,
} from 'layout/main-layout/mobile/page-transition-context';
import { useContext } from 'react';
import { useNavigate } from 'react-router';

const useHistoryBack = () => {
    const startAnimation = useContext(AnimationContext);
    const navigate = useNavigate();

    return () => {
        if (startAnimation) {
            startAnimation();
            setTimeout(() => {
                navigate(-1);
            }, PAGE_TRANSITION_DURATION);
        } else {
            navigate(-1);
        }
    };
};

export default useHistoryBack;
