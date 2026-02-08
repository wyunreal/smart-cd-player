#ifndef COMMON_READING_NOTIFIER_H
#define COMMON_READING_NOTIFIER_H

#include "common/scheduler/TaskScheduler.h"
#include "common/web-server/Notifier.h"
#include "common/entity/Entity.h"

#ifdef MAX_ENTITIES_COUNT

class EntityReader;
class EntityReadingNotifier;

class EntityReadingEvent : public SchedulerEvent
{
public:
    EntityReadingEvent() : SchedulerEvent() {}
    void setEntityReader(EntityReader *aReader) { reader = aReader; }
    void setNotifier(EntityReadingNotifier *aNotifier) { notifier = aNotifier; }
    void startReading(const char *aEntityType, int aEntityChannel, uint32_t aClientId, uint32_t aRequestId, int timespanMs, bool aRawReading);
    void stopReading();
    void execute();

private:
    EntityReader* reader;
    char entityType[MAX_LEN_ENTITY_TYPE + 1];
    int channel;
    uint32_t clientId;
    uint32_t requestId;
    EntityReadingNotifier *notifier;
    int timespanMs;
    bool rawReading;
};

#endif
#endif