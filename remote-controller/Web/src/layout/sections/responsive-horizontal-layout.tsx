import { GridContainer } from 'layout/utils';
import PageTitle from 'layout/utils/page-title';
import { Actions } from 'layout/utils/types';

type ResposniveCardsProps = {
    title: string;
    titleActions?: Actions;
    backButtonHandler?: () => void;
    children: React.ReactNode;
};

const ResponsiveHorizontalLayout = ({
    title,
    titleActions = [],
    backButtonHandler = undefined,
    children,
}: ResposniveCardsProps) => {
    return (
        <PageTitle
            title={title}
            actions={titleActions}
            backButtonHandler={backButtonHandler}
        >
            <GridContainer>{children}</GridContainer>
        </PageTitle>
    );
};

export default ResponsiveHorizontalLayout;
