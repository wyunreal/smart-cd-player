#ifndef GET_ENTITY_NAMES_HPP
#define GET_ENTITY_NAMES_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/entity/Entity.h"

class GetEntityNamesCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        EntityData *data;
        StaticJsonDocument<128> item;
        responseContent.createNestedArray("names");
        JsonArray array = responseContent["names"].to<JsonArray>();
        #ifdef MAX_ENTITIES_COUNT
        for (int i = 0; i < MAX_ENTITIES_COUNT; i++)
        {
            data = Entity::instance().getDataByIndex(i);
            if (strlen(data->id) > 0 && strlen(data->name) > 0 && strlen(data->type) > 0)
            {
                item.clear();
                item["id"] = data->id;
                item["type"] = data->type;
                item["channel"] = data->channel;
                item["name"] = data->name;
                array.add(item);
            }
        }
        #endif

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif