import React from 'react';
import { PageTitleContextProvider } from 'layout/utils/page-title-context';
import ResponsiveDialog from './responsive-dialog';

type FlowProps = {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
};

const Flow = ({ isOpen, onClose, children }: FlowProps) => (
    <PageTitleContextProvider closeButtonHandler={onClose}>
        <ResponsiveDialog isOpen={isOpen} onClose={onClose}>
            {children}
        </ResponsiveDialog>
    </PageTitleContextProvider>
);

export default Flow;
