import { WifiSettingsData } from 'api-client/methods/wifiSettings';
import CategorizedDataAccordeon from 'component/building-blocks/categorized-data-accordeon';
import BaseCard from 'component/building-blocks/cards/base-card';
import getVisualData from './visual-data';

const SettingsEditSummary = ({ data }: { data: WifiSettingsData }) => (
    <BaseCard>
        <CategorizedDataAccordeon data={getVisualData(data)} />
    </BaseCard>
);

export default SettingsEditSummary;
