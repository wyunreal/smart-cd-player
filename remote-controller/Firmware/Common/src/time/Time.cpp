#include "Time.h"

Time Time::timeInstance;
char Time::ntpServer[CONFIG_MAX_LEN_TIME_SERVER + 1];

void Time::begin()
{
    Config::getString(CONFIG_KEY_TIME_SERVER, CONFIG_DEFAULT_TIME_SERVER, ntpServer, CONFIG_MAX_LEN_TIME_SERVER);
    int32_t timeZone = Config::getLong(CONFIG_KEY_TIME_ZONE_OFFSET_SECONDS, CONFIG_DEFAULT_TIME_ZONE);
    bool useDaylightOffset = Config::getBool(CONFIG_KEY_USE_DAYLIGHT_OFFSET, CONFIG_DEFAULT_USE_DAYLIGHT_OFFSET);
    configTime(timeZone, useDaylightOffset ? 3600 : 0, ntpServer);
}

bool Time::getTime(struct CurrentTime &t)
{
    struct tm tm;
    bool result = getLocalTime(&tm);
    t.dayOfTheMonth = tm.tm_mday;
    t.dayOfTheWeek = tm.tm_wday;
    t.dayOfTheYear = tm.tm_yday;
    t.month = tm.tm_mon;
    t.year = tm.tm_year + 1900;
    t.hour = tm.tm_hour;
    t.minute = tm.tm_min;
    t.second = tm.tm_sec;
    t.summerTimeInUse = tm.tm_isdst == 1;

    time_t timestamp;
    time(&timestamp);
    t.timestamp = timestamp;    
    
    return result;
}