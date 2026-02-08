import CategorizedDataCards from 'component/building-blocks/cards/categorized-data-cards';
import { Category } from 'component/types';
import { GridContainer, GridItem } from 'layout/utils';

const MainContentWithResponsiveCards = ({
    mainContent,
    mainContentIsFullWidth = true,
    dataCategories,
}: {
    mainContent: React.ReactNode;
    mainContentIsFullWidth?: boolean;
    dataCategories?: Category[];
}) => (
    <>
        <GridItem fullWidth={mainContentIsFullWidth}>{mainContent}</GridItem>
        {dataCategories && dataCategories.length && (
            <GridContainer item>
                {dataCategories.map((section, index) => (
                    <GridItem key={index}>
                        <CategorizedDataCards data={[section]} />
                    </GridItem>
                ))}
            </GridContainer>
        )}
    </>
);

export default MainContentWithResponsiveCards;
