#ifndef SET_ENTITY_NAMES_HPP
#define SET_ENTITY_NAMES_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/entity/Entity.h"

enum EntityNamesErrors
{
    NAME_EMPTY = 1,
    NAME_TOO_LARGE = 2,
    ID_EMPTY = 3,
    ID_TOO_LARGE = 4,
    TYPE_EMPTY = 5,
    TYPE_TOO_LARGE = 6,
};

class SetEntityNamesCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }

        JsonArray array = inputData["names"].as<JsonArray>();

        for (int i = 0; i < array.size(); i++)
        {
            Entity::instance().setName(array[i]["type"], array[i]["channel"], array[i]["name"]);
        }

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        JsonArray array = inputData["names"].as<JsonArray>();
        for (int i = 0; i < array.size(); i++)
        {
            if (strlen(array[i]["id"]) == 0)
            {
                responseContent["errors"]["id"] = ID_EMPTY;
                isValid = false;
            }
            else if (strlen(array[i]["id"]) > MAX_LEN_ENTITY_ID)
            {
                responseContent["errors"]["id"] = ID_TOO_LARGE;
                isValid = false;
            }
            else if (strlen(array[i]["type"]) == 0)
            {
                responseContent["errors"]["type"] = TYPE_EMPTY;
                isValid = false;
            }
            else if (strlen(array[i]["type"]) > MAX_LEN_ENTITY_TYPE)
            {
                responseContent["errors"]["type"] = TYPE_TOO_LARGE;
                isValid = false;
            }
            else if (strlen(array[i]["name"]) == 0)
            {
                responseContent["errors"]["name"] = NAME_EMPTY;
                isValid = false;
            }
            else if (strlen(array[i]["name"]) > MAX_LEN_ENTITY_NAME)
            {
                responseContent["errors"]["name"] = NAME_TOO_LARGE;
                isValid = false;
            }
        }

        return isValid;
    }
};

#endif