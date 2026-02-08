import CategorizedDataAccordeon from 'component/building-blocks/categorized-data-accordeon';
import BaseCard from 'component/building-blocks/cards/base-card';
import getVisualData from './visual-data';
import { useContext, useState } from 'react';
import { ApiContext } from 'api-client';
import { IrCommandsSettingsData } from 'api-client/methods/ir-commands-settings';
import FullScreenSpinner from 'component/building-blocks/full-screen-spinner';

const SettingsEditSummary = () => {
    const [updatedData, setUpdatedData] = useState<
        IrCommandsSettingsData | undefined
    >(undefined);
    const { api } = useContext(ApiContext);
    api.getIrCommandsSettings &&
        api.getIrCommandsSettings().then((data) => setUpdatedData(data));
    return updatedData ? (
        <BaseCard>
            <CategorizedDataAccordeon data={getVisualData(updatedData)} />
        </BaseCard>
    ) : (
        <FullScreenSpinner />
    );
};

export default SettingsEditSummary;
