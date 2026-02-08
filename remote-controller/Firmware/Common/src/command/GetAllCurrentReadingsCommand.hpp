#ifndef GET_ALL_CURRENT_READINGS_COMMAND_HPP
#define GET_ALL_CURRENT_READINGS_COMMAND_HPP

#include "common/web-server-command-executor/WebServerCommandExecutor.h"

#ifdef MAX_ENTITIES_COUNT

StaticJsonDocument<750> currentReadingsResponseContentItem;
DynamicJsonDocument* currentReadingsResponseContent;
void getEntityCurrentReadingsIterationCallback(Readings *readings, const char* entityType, int entityChannel, unsigned long int timestamp)
{
    currentReadingsResponseContentItem.clear();
    for(int i = 0; i < readings->count; i++)
    {
        currentReadingsResponseContentItem["values"][readings->readings[i].type] = readings->readings[i].value;
        Range* range = EntityReader::instance().getSafetyRangeForEntity(entityType, entityChannel, i);
        if (range != NULL) {
            currentReadingsResponseContentItem["ranges"][readings->readings[i].type]["max"] = range->max;
            currentReadingsResponseContentItem["ranges"][readings->readings[i].type]["min"] = range->min;
        }
    }

    char id[MAX_LEN_ENTITY_ID + 1];
    getEntityId(entityType, entityChannel, id);
    currentReadingsResponseContentItem["entity"]["id"] = id;
    currentReadingsResponseContentItem["entity"]["type"] = entityType;
    currentReadingsResponseContentItem["entity"]["channel"] = entityChannel;

    EntityData* entity = Entity::instance().getDataByTypeAndChannel(entityType, entityChannel);
    if (entity != NULL) {
        currentReadingsResponseContentItem["name"] = entity->name;
    }
    currentReadingsResponseContentItem["nextCalibrationDate"] = ((uint64_t)Entity::instance().getNextCalibrationDate(entityType, entityChannel) * 1000);

    currentReadingsResponseContentItem["timestamp"] = ((uint64_t)timestamp * 1000);
    (*currentReadingsResponseContent)["readings"].add(currentReadingsResponseContentItem);
}

class GetAllCurrentReadingsCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        responseContent.createNestedArray("readings");

        currentReadingsResponseContent = &responseContent;
        EntityReader::instance().iterateCurrentReadings(getEntityCurrentReadingsIterationCallback);
        
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif
#endif