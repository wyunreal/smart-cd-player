import { NetworkNameSettingsData } from 'api-client/methods/network-name-settings';
import CategorizedDataAccordeon from 'component/building-blocks/categorized-data-accordeon';
import BaseCard from 'component/building-blocks/cards/base-card';
import getVisualData from './visual-data';

const SettingsEditSummary = ({ data }: { data: NetworkNameSettingsData }) => (
    <BaseCard>
        <CategorizedDataAccordeon data={getVisualData(data)} />
    </BaseCard>
);

export default SettingsEditSummary;
