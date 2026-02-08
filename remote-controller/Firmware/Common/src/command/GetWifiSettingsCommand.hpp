#ifndef GET_WIFI_SETTINGS_HPP
#define GET_WIFI_SETTINGS_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/config/Config.h"

class GetWifiSettingsCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        char ssid[CONFIG_MAX_LEN_WIFI_SSID + 1];
        char password[CONFIG_MAX_LEN_WIFI_PASSWORD + 1];
        Config::getString(CONFIG_KEY_WIFI_SSID, "", ssid, CONFIG_MAX_LEN_WIFI_SSID);
        responseContent["wifiConnection"]["ssid"] = ssid;
        Config::getString(CONFIG_KEY_WIFI_PASSWORD, "", password, CONFIG_MAX_LEN_WIFI_PASSWORD);
        responseContent["wifiConnection"]["password"] = password;

        char ip[CONFIG_MAX_LEN_STATIC_IP_DATA + 1];
        responseContent["staticIp"]["useStaticIp"] = Config::getChar(CONFIG_KEY_USE_STATIC_IP, 0);
        Config::getString(CONFIG_KEY_STATIC_IP, "", ip, CONFIG_MAX_LEN_STATIC_IP_DATA);
        responseContent["staticIp"]["ip"] = ip;
        Config::getString(CONFIG_KEY_STATIC_GATEWAY, "", ip, CONFIG_MAX_LEN_STATIC_IP_DATA);
        responseContent["staticIp"]["gateway"] = ip;
        Config::getString(CONFIG_KEY_STATIC_SUBNET, "", ip, CONFIG_MAX_LEN_STATIC_IP_DATA);
        responseContent["staticIp"]["subnet"] = ip;

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif