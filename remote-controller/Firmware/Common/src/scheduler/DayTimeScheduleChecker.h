#ifndef DAY_TIME_SCHEDULE_CHECKER_H
#define DAY_TIME_SCHEDULE_CHECKER_H

class DayTimeScheduleChecker
{
public:
    bool shouldBeExecuted(int eventId, unsigned long firstTimeSeconds, unsigned long periodSeconds, bool isEventVariant = false);

protected:
    virtual int deduplicationTimeInSeconds(bool isEventVariant) = 0;
    virtual void setLastExecutionTime(int eventId, unsigned long timestamp, bool isEventVariant) = 0;
    virtual unsigned long getLastExecutionTime(int eventId, bool isEventVariant) = 0;
};

#endif