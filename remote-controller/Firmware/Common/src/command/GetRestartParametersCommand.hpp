#ifndef GET_RESTART_PARAMETERS_HPP
#define GET_RESTART_PARAMETERS_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/config/Config.h"
#include "common/moduleId/ModuleId.h"
#include "common/wifi/ModuleWifi.h"

class GetRestartParametersCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        char moduleUrl[CONFIG_MAX_LEN_MODULE_NETWORK_NAME + 20];
        Config::getModuleLocalUrl(moduleUrl);

        char newWifi[CONFIG_MAX_LEN_WIFI_SSID + 1];
        Config::getString(CONFIG_KEY_WIFI_SSID, "", newWifi, CONFIG_MAX_LEN_WIFI_SSID);

        responseContent["moduleUrl"] = moduleUrl;
        responseContent["currentConnectionState"] = ModuleWifi::instance().getCurrentConnectionState();
        responseContent["newWifiSsid"] = newWifi;
        responseContent["wifiConfigured"] = strlen(newWifi) > 0;
        responseContent["timeConfigured"] = Config::getBool(CONFIG_KEY_TIME_CONFIGURED, false);

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif