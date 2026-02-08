import { useContext, useEffect } from 'react';
import { TitleContext } from './page-title-context';
import { Actions } from './types';

type PageTitleProps = {
    title?: string;
    useDefault?: boolean;
    actions?: Actions;
    backButtonHandler?: () => void;
    closeButtonHandler?: () => void;
    children: React.ReactNode;
};

const PageTitle = ({
    title,
    useDefault = false,
    actions,
    backButtonHandler,
    closeButtonHandler,
    children,
}: PageTitleProps) => {
    const configure = useContext(TitleContext).configure;
    useEffect(() => {
        configure({
            title: useDefault ? undefined : title,
            actions,
            backButtonHandler: backButtonHandler ?? undefined,
            closeButtonHandler: closeButtonHandler ?? undefined,
        });
    }, [
        configure,
        useDefault,
        title,
        actions,
        backButtonHandler,
        closeButtonHandler,
    ]);

    return <>{children}</>;
};

export default PageTitle;
