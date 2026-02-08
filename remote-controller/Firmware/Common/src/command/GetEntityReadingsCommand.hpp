#ifndef GET_ENTITY_READINGS_COMMAND_HPP
#define GET_ENTITY_READINGS_COMMAND_HPP

#include "common/web-server-command-executor/WebServerCommandExecutor.h"

#ifdef MAX_ENTITIES_COUNT

StaticJsonDocument<256> entityReadingsResponseContentItem;
DynamicJsonDocument *entityReadingsResponseContent;
void getEntityReadingsIterationCallback(Readings *readings, const char *entityType, int entityChannel, unsigned long int timestamp)
{
    entityReadingsResponseContentItem.clear();
    for (int i = 0; i < readings->count; i++)
    {
        entityReadingsResponseContentItem["values"][readings->readings[i].type] = readings->readings[i].value;
    }
    entityReadingsResponseContentItem["timestamp"] = ((uint64_t)timestamp * 1000);
    (*entityReadingsResponseContent)["readings"].add(entityReadingsResponseContentItem);
}

void getEntityReadingSafetyRangeCallback(Range *range, const char *readingType)
{
    (*entityReadingsResponseContent)["ranges"][String(readingType)]["max"] = range->max;
    (*entityReadingsResponseContent)["ranges"][String(readingType)]["min"] = range->min;
}

class GetEntityReadingsCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        responseContent["id"] = inputData["id"];
        responseContent["type"] = inputData["type"];
        responseContent["channel"] = inputData["channel"];
        responseContent.createNestedArray("readings");

        entityReadingsResponseContent = &responseContent;
        EntityReader::instance().iterateStoredReading(inputData["type"], inputData["channel"], getEntityReadingsIterationCallback);

        EntityData *entity = Entity::instance().getDataByTypeAndChannel(inputData["type"], inputData["channel"]);
        if (entity != NULL)
        {
            responseContent["name"] = entity->name;
        }
        responseContent["nextCalibrationDate"] = ((uint64_t)Entity::instance().getNextCalibrationDate(inputData["type"], inputData["channel"]) * 1000);

        EntityReader::instance().iterateSafetyRangesForEntity(inputData["type"], inputData["channel"], getEntityReadingSafetyRangeCallback);

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif
#endif