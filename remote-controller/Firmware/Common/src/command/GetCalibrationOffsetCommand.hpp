#ifndef GET_CALIBRATION_OFFSET_COMMAND_HPP
#define GET_CALIBRATION_OFFSET_COMMAND_HPP

#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/entity/Entity.h"

#ifdef MAX_ENTITIES_COUNT

#define GET_CALIBRATION_ENTITY_NOT_FOUND 1

class GetCalibrationOffsetCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        EntityData *entityData = Entity::instance().getDataByTypeAndChannel(inputData["type"], inputData["channel"]);
        Readings *readings;

        if (entityData)
        {
            readings = EntityReader::instance().getAnnotatedReadingValues(inputData["type"], entityData->offsets);
        } else {
            float zeroes[MAX_LEN_READINGS] = { 0, 0, 0, 0 };
            readings = EntityReader::instance().getAnnotatedReadingValues(inputData["type"], zeroes);
        }

        responseContent.createNestedArray("offsets");
        JsonArray array = responseContent["offsets"].to<JsonArray>();
        StaticJsonDocument<128> item;
        for (int i = 0; i < readings->count; i++)
        {
            item.clear();
            item["type"] = readings->readings[i].type;
            item["value"] = readings->readings[i].value;
            array.add(item);
        }

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif
#endif