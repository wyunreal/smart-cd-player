#ifndef MODULE_TIME_H
#define MODULE_TIME_H

#include <time.h>
#include "../config/Config.h"

struct CurrentTime {
    int second;
    int minute;
    int hour;
    int month;
    int year;
    int dayOfTheMonth;
    int dayOfTheWeek;
    int dayOfTheYear;
    time_t timestamp;
    bool summerTimeInUse;
};

class Time {
    public:
    static Time& instance() {return timeInstance; }
    void begin();
    bool getTime(struct CurrentTime &t);

    private:
    static Time timeInstance;
    static char ntpServer[CONFIG_MAX_LEN_TIME_SERVER + 1];
};

#endif