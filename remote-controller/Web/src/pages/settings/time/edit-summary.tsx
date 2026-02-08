import { TimeSettingsData } from 'api-client/methods/time-settings';
import BaseCard from 'component/building-blocks/cards/base-card';
import ConfiguredSettings from './configured-settings';

const SettingsEditSummary = ({ data }: { data: TimeSettingsData }) => (
    <BaseCard>
        <ConfiguredSettings data={data} />
    </BaseCard>
);

export default SettingsEditSummary;
