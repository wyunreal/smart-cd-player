#ifndef GET_NETWORK_NAME_SETTINGS_HPP
#define GET_NETWORK_NAME_SETTINGS_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/config/Config.h"
#include "common/moduleId/ModuleId.h"

class GetNetworkNameSettingsCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        char networkName[CONFIG_MAX_LEN_MODULE_NETWORK_NAME + 1];
        Config::getString(CONFIG_KEY_MODULE_NETWORK_NAME, "", networkName, CONFIG_MAX_LEN_MODULE_NETWORK_NAME);
        if (strlen(networkName) == 0)
        {
            sprintf(networkName, "%s%s", CONFIG_DEFAULT_MODULE_NETWORK_NAME, ModuleId::getRandomPart());
        }
        responseContent["networkName"] = networkName;

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif