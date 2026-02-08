#ifndef RESTART_COMMAND_HPP
#define RESTART_COMMAND_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"

class RestartCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }

    virtual void afterExecution() {
        delay(2000);
        ESP.restart();
    }
};

#endif