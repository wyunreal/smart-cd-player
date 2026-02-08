#include "ReadingEvent.h"
#include "ReadingNotifier.h"
#include "Reader.h"

#ifdef MAX_ENTITIES_COUNT

void EntityReadingEvent::startReading(const char *aEntityType, int aEntityChannel, uint32_t aClientId, uint32_t aRequestId, int timespanMs, bool aRawReading)
{
    strcpy(entityType, aEntityType);
    channel = aEntityChannel;
    clientId = aClientId;
    requestId = aRequestId;
    rawReading = aRawReading;
    enable(true, timespanMs, true);
}

void EntityReadingEvent::stopReading()
{
    disable();
}

void EntityReadingEvent::execute()
{
    Readings* readings = reader->performEntityReading(entityType, channel, rawReading);
    if (readings != NULL)
    {
        notifier->setEntityData(entityType, channel);
        notifier->setRequestData(clientId, requestId);
        notifier->setReadings(readings->readings, readings->count);
        notifier->notify();
    }
}

#endif