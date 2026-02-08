#ifndef GET_MODULE_ID_HPP
#define GET_MODULE_ID_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/moduleId/ModuleId.h"
#include "Config.h"

class GetModuleIdCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        responseContent["id"] = ModuleId::getId();
        responseContent["type"] = MODULE_TYPE;

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif