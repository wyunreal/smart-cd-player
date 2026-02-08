#include "DayTimeScheduleChecker.h"
#include "common/time/Time.h"

#define DAY_SECONDS 86400

bool DayTimeScheduleChecker::shouldBeExecuted(int eventId, unsigned long firstTimeSeconds, unsigned long periodSeconds, bool isEventVariant)
{
    CurrentTime time;
    Time::instance().getTime(time);

    unsigned long currentDayStartSeconds = time.timestamp - (time.timestamp % DAY_SECONDS);
    unsigned long currentDaySeconds = time.timestamp % DAY_SECONDS;
    unsigned long lastExecutionTime = this->getLastExecutionTime(eventId, isEventVariant);

    bool currentTimeInLastExecutionSlot = lastExecutionTime <= time.timestamp && time.timestamp < lastExecutionTime + this->deduplicationTimeInSeconds(isEventVariant);

    if (lastExecutionTime > 0 && currentTimeInLastExecutionSlot) {
        return false;
    }

    unsigned long currentSlotSeconds = firstTimeSeconds;
    while(currentSlotSeconds + this->deduplicationTimeInSeconds(isEventVariant) < DAY_SECONDS)
    {
        if (currentSlotSeconds < currentDaySeconds && currentDaySeconds < currentSlotSeconds + this->deduplicationTimeInSeconds(isEventVariant) - 1)
        {
            this->setLastExecutionTime(eventId, currentDayStartSeconds + currentSlotSeconds, isEventVariant);
            return true;
        }
        currentSlotSeconds += periodSeconds;
    }
    return false;
   
}

