import React from 'react';

type DialogContextProviderProps = {
    children: React.ReactNode;
};

type DialogContextType = {
    insideDialog: boolean;
};

export const DialogContext = React.createContext<DialogContextType>({
    insideDialog: false,
});

export const DialogContextProvider = ({
    children,
}: DialogContextProviderProps) => (
    <DialogContext.Provider
        value={{
            insideDialog: true,
        }}
    >
        {children}
    </DialogContext.Provider>
);
