import React, { useCallback, useReducer } from 'react';
import { Actions } from './types';

type TitleData = {
    title?: string;
    actions?: Actions;
    backButtonHandler?: () => void;
    closeButtonHandler?: () => void;
};

type TitleContextType = TitleData & {
    configure: (data: TitleData) => void;
};

type PageTitleContextProviderProps = {
    closeButtonHandler?: () => void;
    children: React.ReactNode;
};

export const TitleContext = React.createContext<TitleContextType>({
    configure: () => {},
});

const reducer = (state: TitleData, action: TitleData) => {
    const { title, actions } = state;
    return {
        ...(title ? { title } : {}),
        ...(actions ? { actions } : {}),
        ...action,
    };
};

export const PageTitleContextProvider = ({
    closeButtonHandler,
    children,
}: PageTitleContextProviderProps) => {
    const [data, dispatch] = useReducer(reducer, {
        ...(closeButtonHandler ? { closeButtonHandler } : {}),
    });
    const configureCallback = useCallback(
        (titleData: TitleData) => dispatch(titleData),
        [dispatch],
    );
    return (
        <TitleContext.Provider
            value={{
                ...data,
                configure: configureCallback,
            }}
        >
            {children}
        </TitleContext.Provider>
    );
};
