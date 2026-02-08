import getVisualData from './visual-data';
import {
    CurrentTimeData,
    TimeSettingsData,
} from 'api-client/methods/time-settings';
import TimeZoneMap from 'component/features/time-zone-map';
import { useContext, useEffect, useState } from 'react';
import { ApiContext } from 'api-client';
import CategorizedDataAccordeon from 'component/building-blocks/categorized-data-accordeon';
import MainContentWithResponsiveCards from 'layout/sections/main-content-with-responsive-cards';

const ConfiguredSettings = ({
    data,
    showMap = false,
}: {
    data: TimeSettingsData;
    showMap?: boolean;
}) => {
    const { api } = useContext(ApiContext);
    const timeZone = api.getTimeZone(
        data.timeZoneId,
        data.timeZoneOffsetSeconds,
        data.cityName,
    );

    const [currentTimeData, setCurrentTimeData] = useState<
        CurrentTimeData | undefined
    >();
    useEffect(() => {
        api.getCurrentTime().then((time) => {
            if (time.configured) {
                setCurrentTimeData(time);
            }
        });
    }, [api, setCurrentTimeData]);

    return (
        timeZone &&
        (showMap ? (
            <MainContentWithResponsiveCards
                mainContent={
                    <TimeZoneMap
                        timeZone={timeZone}
                        currentTimeData={currentTimeData}
                        cityName={data.cityName}
                    />
                }
                mainContentIsFullWidth={false}
                dataCategories={getVisualData(
                    timeZone,
                    data.useDayLightSaving,
                    '',
                    data.server,
                )}
            />
        ) : (
            <CategorizedDataAccordeon
                data={getVisualData(
                    timeZone,
                    data.useDayLightSaving,
                    data.cityName,
                    data.server,
                )}
            />
        ))
    );
};

export default ConfiguredSettings;
