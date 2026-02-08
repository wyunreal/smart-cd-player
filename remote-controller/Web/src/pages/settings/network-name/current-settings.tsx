import CategorizedData from '../../../component/building-blocks/cards/categorized-data-cards';
import { GridItem } from 'layout/utils';
import getVisualData from './visual-data';
import { NetworkNameSettingsData } from 'api-client/methods/network-name-settings';

const CurrentSettings = ({ data }: { data: NetworkNameSettingsData }) => (
    <>
        {getVisualData(data).map((section, index) => (
            <GridItem key={index}>
                <CategorizedData data={[section]} />
            </GridItem>
        ))}
    </>
);

export default CurrentSettings;
