#ifndef SET_ENTITY_IS_ENABLED_HPP
#define SET_ENTITY_IS_ENABLED_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "Controller.h"

#ifdef MAX_ENTITIES_COUNT

enum SetEntityIsEnabledErrors
{
    SET_ENTITY_IS_ENABLED_TYPE_EMPTY = 1,
    SET_ENTITY_IS_ENABLED_TYPE_TOO_LARGE = 2,
    SET_ENTITY_IS_ENABLED_ENTITY_NOT_FOUND = 3,
};

class SetEntityIsEnabledCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }
        
        if (Entity::instance().setIsEnabled(inputData["type"], inputData["channel"], inputData["isEnabled"]))
        {
            EntityReader::instance().loadReadingConfiguration();
            return response(COMMAND_RESPONSE_SUCCESS, responseContent);
        }

        responseContent["errors"]["id"] = SET_ENTITY_IS_ENABLED_ENTITY_NOT_FOUND;
        return response(COMMAND_RESPONSE_ERROR, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        if (strlen(inputData["type"]) == 0)
        {
            responseContent["errors"]["type"] = SET_ENTITY_IS_ENABLED_TYPE_EMPTY;
            isValid = false;
        }
        else if (strlen(inputData["type"]) > MAX_LEN_ENTITY_TYPE)
        {
            responseContent["errors"]["type"] = SET_ENTITY_IS_ENABLED_TYPE_TOO_LARGE;
            isValid = false;
        }

        return isValid;
    }
};

#endif
#endif