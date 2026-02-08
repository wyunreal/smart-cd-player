import React from 'react';

type AnimationStarter = (() => void) | undefined;

type AnimationContextProviderProps = {
    startAnimation: AnimationStarter;
    children: React.ReactNode;
};

export const PAGE_TRANSITION_DURATION = 250;

export const AnimationContext =
    React.createContext<AnimationStarter>(undefined);

const AnimationContextProvider = ({
    startAnimation,
    children,
}: AnimationContextProviderProps) => {
    return (
        <AnimationContext.Provider value={startAnimation}>
            {children}
        </AnimationContext.Provider>
    );
};

export default AnimationContextProvider;
