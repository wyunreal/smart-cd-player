#ifndef GET_CURRENT_TIME_HPP
#define GET_CURRENT_TIME_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/config/Config.h"
#include "common/time/Time.h"

class GetCurrentTimeCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        CurrentTime time;
        bool timeWorking = Time::instance().getTime(time);
        if (timeWorking) {
            responseContent["currentTime"]["dayOfTheMonth"] = time.dayOfTheMonth;
            responseContent["currentTime"]["dayOfTheWeek"] = time.dayOfTheWeek;
            responseContent["currentTime"]["dayOfTheYear"] = time.dayOfTheYear;
            responseContent["currentTime"]["month"] = time.month;
            responseContent["currentTime"]["year"] = time.year;
            responseContent["currentTime"]["hour"] = time.hour;
            responseContent["currentTime"]["minute"] = time.minute;
            responseContent["currentTime"]["second"] = time.second;
            responseContent["currentTime"]["summerTimeInUse"] = time.summerTimeInUse;
        }
        responseContent["configured"] = timeWorking && Config::getBool(CONFIG_KEY_TIME_CONFIGURED, false);

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif