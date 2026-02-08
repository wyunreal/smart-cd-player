#ifndef SET_TIME_SETTINGS_HPP
#define SET_TIME_SETTINGS_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/config/Config.h"

enum TimeSettingsErrors
{
    TIME_SETTINGS_ERROR_SERVER_INVALID = 1,
    TIME_SETTINGS_ERROR_TIME_ZONE_OFFSET_INVALID = 2,
    TIME_SETTINGS_ERROR_CITY_NAME_INVALID = 3,
};

class SetTimeSettingsCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }

        Config::setString(CONFIG_KEY_TIME_SERVER, inputData["server"]);
        Config::setString(CONFIG_KEY_CITY_NAME, inputData["cityName"]);
        Config::setLong(CONFIG_KEY_TIME_ZONE_ID, inputData["timeZoneId"]);
        Config::setLong(CONFIG_KEY_TIME_ZONE_OFFSET_SECONDS, inputData["timeZoneOffsetSeconds"]);
        Config::setBool(CONFIG_KEY_USE_DAYLIGHT_OFFSET, inputData["useDayLightSaving"]);
        Config::setBool(CONFIG_KEY_TIME_CONFIGURED, true);

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        if (strlen(inputData["server"]) == 0)
        {
            responseContent["errors"]["server"] = TIME_SETTINGS_ERROR_SERVER_INVALID;
            isValid = false;
        }
        if (strlen(inputData["cityName"]) == 0)
        {
            responseContent["errors"]["cityName"] = TIME_SETTINGS_ERROR_CITY_NAME_INVALID;
            isValid = false;
        }
        if ((long)inputData["timeZoneOffsetSeconds"] < -43200 || (long)inputData["timeZoneOffsetSeconds"] > 50400)
        {
            responseContent["errors"]["timeZoneOffsetSeconds"] = TIME_SETTINGS_ERROR_TIME_ZONE_OFFSET_INVALID;
            isValid = false;
        }

        return isValid;
    }
};

#endif