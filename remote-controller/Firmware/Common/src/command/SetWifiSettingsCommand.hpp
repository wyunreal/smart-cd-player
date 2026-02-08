#ifndef SET_WIFI_SETTINGS_HPP
#define SET_WIFI_SETTINGS_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/config/Config.h"


enum WifiSettingsErrors
{
    WIFI_SETTINGS_ERROR_MODE_INVALID = 1,
    WIFI_SETTINGS_ERROR_SSID_EMPTY = 2,
    WIFI_SETTINGS_ERROR_PASSWORD_EMPTY = 3,
    WIFI_SETTINGS_ERROR_INVALID_USE_OF_STATIC_IP = 4,
    WIFI_SETTINGS_ERROR_INVALID_ADDRESS = 5,
};

class SetWifiSettingsCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }

        Config::setString(CONFIG_KEY_WIFI_SSID, inputData["wifiConnection"]["ssid"]);
        Config::setString(CONFIG_KEY_WIFI_PASSWORD, inputData["wifiConnection"]["password"]);

        Config::setChar(CONFIG_KEY_USE_STATIC_IP, inputData["staticIp"]["useStaticIp"]);
        if ((bool)inputData["staticIp"]["useStaticIp"])
        {
            Config::setString(CONFIG_KEY_STATIC_IP, inputData["staticIp"]["ip"]);
            Config::setString(CONFIG_KEY_STATIC_GATEWAY, inputData["staticIp"]["gateway"]);
            Config::setString(CONFIG_KEY_STATIC_SUBNET, inputData["staticIp"]["subnet"]);
        }
        else
        {
            Config::remove(CONFIG_KEY_STATIC_IP);
            Config::remove(CONFIG_KEY_STATIC_GATEWAY);
            Config::remove(CONFIG_KEY_STATIC_SUBNET);
        }

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        if ((int)inputData["wifiConnection"]["mode"] != WIFI_MODE_ACCESS_POINT && (int)inputData["wifiConnection"]["mode"] != WIFI_MODE_STATION)
        {
            responseContent["errors"]["wifiConnection"]["mode"] = WIFI_SETTINGS_ERROR_MODE_INVALID;
            isValid = false;
        }
        if (strlen(inputData["wifiConnection"]["ssid"]) == 0)
        {
            responseContent["errors"]["wifiConnection"]["ssid"] = WIFI_SETTINGS_ERROR_SSID_EMPTY;
            isValid = false;
        }
        if (strlen(inputData["wifiConnection"]["password"]) == 0)
        {
            responseContent["errors"]["wifiConnection"]["password"] = WIFI_SETTINGS_ERROR_PASSWORD_EMPTY;
            isValid = false;
        }

        if ((int)inputData["wifiConnection"]["mode"] == WIFI_MODE_ACCESS_POINT && (bool)inputData["staticIp"]["useStaticIp"] == true)
        {
            responseContent["errors"]["staticIp"]["useStaticIp"] = WIFI_SETTINGS_ERROR_INVALID_USE_OF_STATIC_IP;
            isValid = false;
        }
        if ((bool)inputData["staticIp"]["useStaticIp"] == true)
        {
            IPAddress ip;
            if (!ip.fromString((const char *)inputData["staticIp"]["ip"]))
            {
                responseContent["errors"]["staticIp"]["ip"] = WIFI_SETTINGS_ERROR_INVALID_ADDRESS;
                isValid = false;
            }
            if (!ip.fromString((const char *)inputData["staticIp"]["gateway"]))
            {
                responseContent["errors"]["staticIp"]["gateway"] = WIFI_SETTINGS_ERROR_INVALID_ADDRESS;
                isValid = false;
            }
            if (!ip.fromString((const char *)inputData["staticIp"]["subnet"]))
            {
                responseContent["errors"]["staticIp"]["subnet"] = WIFI_SETTINGS_ERROR_INVALID_ADDRESS;
                isValid = false;
            }
        }

        return isValid;
    }
};

#endif