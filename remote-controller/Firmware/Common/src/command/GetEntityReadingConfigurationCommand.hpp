#ifndef GET_ENTITY_READING_CONFIGURATION_COMMAND_HPP
#define GET_ENTITY_READING_CONFIGURATION_COMMAND_HPP

#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/entity/Entity.h"
#include <ArduinoJson.h>

#ifdef MAX_ENTITIES_COUNT

StaticJsonDocument<128> entityReadingsConfigurationSafetyRangesItem;
JsonArray entityReadingsConfigurationSafetyRanges;
void getEntityReadingConfigurationSafetyRangeCallback(Range* range, const char* readingType)
{
    entityReadingsConfigurationSafetyRangesItem.clear();
    entityReadingsConfigurationSafetyRangesItem["type"] = String(readingType);
    entityReadingsConfigurationSafetyRangesItem["max"] = range->max;
    entityReadingsConfigurationSafetyRangesItem["min"] = range->min;
    entityReadingsConfigurationSafetyRanges.add(entityReadingsConfigurationSafetyRangesItem);
}

class GetEntityReadingConfigurationCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        EntityData *entityData = Entity::instance().getDataByTypeAndChannel(inputData["type"], inputData["channel"]);

        responseContent["id"] = inputData["id"];
        responseContent["type"] = inputData["type"];
        responseContent["channel"] = inputData["channel"];

        if (entityData) {
            responseContent["readingTimespan"] = entityData->readingConfig.readingTimespan * 1000;
            responseContent["readingPlotsPerDay"] = entityData->readingConfig.readingPlotsPerDay;
            responseContent["firstReadingTime"] = entityData->readingConfig.firstReadingTime * 1000;
        } else {
            responseContent["readingTimespan"] = DEFAULT_READING_TIMESPAN * 1000;
            responseContent["readingPlotsPerDay"] = DEFAULT_READING_PLOTS_PER_DAY;
            responseContent["firstReadingTime"] = DEFAULT_FIRST_READING_TIME * 1000;
        }

        entityReadingsConfigurationSafetyRanges = responseContent.createNestedArray("ranges");
        EntityReader::instance().iterateSafetyRangesForEntity(inputData["type"], inputData["channel"], getEntityReadingConfigurationSafetyRangeCallback);
        
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif
#endif