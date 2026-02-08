#ifndef ENTITY_READING_NOTIFIER_H
#define ENTITY_READING_NOTIFIER_H

#include "common/web-server/Notifier.h"
#include "common/entity/Entity.h"

#ifdef MAX_ENTITIES_COUNT

#define MEASUREMENT_MESSAGE_LEN 400
#define NOTIFICATION_MEASUREMENT "entityMeasurement"

struct Reading;

class EntityReadingNotifier : public Notifier
{
public:
    EntityReadingNotifier() : Notifier() {}
    void setEntityData(const char *aEntityType, int aChannel);
    void setReadings(Reading *aReadings, int aCount);
    virtual void notify();

private:
    const char* entityType;
    int channel;
    Reading *readings;
    int count;
};

#endif
#endif