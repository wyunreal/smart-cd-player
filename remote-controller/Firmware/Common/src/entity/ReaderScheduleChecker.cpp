#include "ReaderScheduleChecker.h"

#ifdef MAX_ENTITIES_COUNT

#ifdef ENTITY_DATA_PARTITIONS
#ifdef MAX_ENTITIES_COUNT
    EntityDataPartition lastReadingExecutionTimePartitions[] = ENTITY_DATA_PARTITIONS;
    unsigned long lastReadingExecutionTime[MAX_ENTITIES_COUNT];
    unsigned long lastReadingExecutionTimeVariant[MAX_ENTITIES_COUNT];
#endif
#endif

ReaderScheduleChecker::ReaderScheduleChecker()
{
#ifdef MAX_ENTITIES_COUNT
    for (int i = 0; i < MAX_ENTITIES_COUNT; i++) {
        lastReadingExecutionTime[i] = 0;
        lastReadingExecutionTimeVariant[i] = 0;
    }
#endif
}

int ReaderScheduleChecker::getEntityLastExecutionTimeId(const char *type, int channel)
{
#ifdef ENTITY_DATA_PARTITIONS
    int index;
    int i = 0;
    do
    {
        index = lastReadingExecutionTimePartitions[i].startIndex;
        if (strcmp(lastReadingExecutionTimePartitions[i].type, type) == 0)
        {
            return index + channel;
        }
        i++;
    } while (index > -1);
#endif
    return -1;
}

bool ReaderScheduleChecker::entityReadingShouldBeExecuted(const char* entityType, int entityChannel, unsigned long firstTimeSeconds, unsigned long periodSeconds, bool isEventVariant)
{
    int eventId = getEntityLastExecutionTimeId(entityType, entityChannel);
    if (eventId > -1) {
        return shouldBeExecuted(eventId, firstTimeSeconds, periodSeconds, isEventVariant);
    }
    return false;
}

unsigned long ReaderScheduleChecker::getLastExecutionTime(int eventId, bool isEventVariant)
{
    return isEventVariant ? lastReadingExecutionTimeVariant[eventId] : lastReadingExecutionTime[eventId];
}

void ReaderScheduleChecker::setLastExecutionTime(int eventId, unsigned long timestamp, bool isEventVariant)
{
    if (isEventVariant) {
        lastReadingExecutionTimeVariant[eventId] = timestamp;
    } else {
        lastReadingExecutionTime[eventId] = timestamp;
    }
}

#endif