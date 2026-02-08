#ifndef READER_SCHEDULE_CHECKER_H
#define READER_SCHEDULE_CHECKER_H

#include "common/scheduler/DayTimeScheduleChecker.h"
#include "Config.h"

#ifdef MAX_ENTITIES_COUNT

class ReaderScheduleChecker: public DayTimeScheduleChecker
{
public:
    ReaderScheduleChecker();
    bool entityReadingShouldBeExecuted(const char* entityType, int entityChannel, unsigned long firstTimeSeconds, unsigned long periodSeconds, bool isEventVariant = false);
    
protected:
    virtual int deduplicationTimeInSeconds(bool isEventVariant) { return 10; }
    virtual void setLastExecutionTime(int eventId, unsigned long timestamp, bool isEventVariant);
    virtual unsigned long getLastExecutionTime(int eventId, bool isEventVariant);

private:
    int getEntityLastExecutionTimeId(const char *type, int channel);
};

#endif
#endif