#ifndef SET_NETWORK_NAME_SETTINGS_HPP
#define SET_NETWORK_NAME_SETTINGS_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/config/Config.h"

enum NetworkNameSettingsErrors
{
    NETWORK_NAME_TOO_LARGE = 1,
};

class SetNetworkNameSettingsCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }

        Config::setString(CONFIG_KEY_MODULE_NETWORK_NAME, inputData["networkName"]);
        
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        if (strlen(inputData["networkName"]) > CONFIG_MAX_LEN_MODULE_NETWORK_NAME)
        {
            responseContent["errors"]["networkName"] = NETWORK_NAME_TOO_LARGE;
            isValid = false;
        }

        return isValid;
    }
};

#endif