#ifndef GET_TIME_SETTINGS_HPP
#define GET_TIME_SETTINGS_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/config/Config.h"
#include "common/time/Time.h"

class GetTimeSettingsCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        char timeServer[CONFIG_MAX_LEN_TIME_SERVER + 1];
        Config::getString(CONFIG_KEY_TIME_SERVER, CONFIG_DEFAULT_TIME_SERVER, timeServer, CONFIG_MAX_LEN_TIME_SERVER);
        responseContent["server"] = timeServer;
        responseContent["timeZoneId"] = Config::getLong(CONFIG_KEY_TIME_ZONE_ID, 0);
        responseContent["timeZoneOffsetSeconds"] = Config::getLong(CONFIG_KEY_TIME_ZONE_OFFSET_SECONDS, 0);
        char cityName[CONFIG_MAX_LEN_CITY_NAME + 1];
        Config::getString(CONFIG_KEY_CITY_NAME, CONFIG_DEFAULT_CITY_NAME, cityName, CONFIG_MAX_LEN_CITY_NAME);
        responseContent["cityName"] = cityName;
        responseContent["useDayLightSaving"] = Config::getBool(CONFIG_KEY_USE_DAYLIGHT_OFFSET, false);

        responseContent["configured"] = Config::getBool(CONFIG_KEY_TIME_CONFIGURED, false);

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif