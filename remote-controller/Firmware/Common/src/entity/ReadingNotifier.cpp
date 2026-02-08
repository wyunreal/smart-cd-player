#include "ReadingNotifier.h"
#include "Reader.h"
#include <ArduinoJson.h>

#ifdef MAX_ENTITIES_COUNT

void EntityReadingNotifier::setEntityData(const char *aEntityType, int aChannel)
{
    entityType = aEntityType;
    channel = aChannel;
}

void EntityReadingNotifier::setReadings(Reading *aReadings, int aCount)
{
    readings = aReadings;
    count = aCount;
}

void EntityReadingNotifier::notify()
{
    DynamicJsonDocument notification(MEASUREMENT_MESSAGE_LEN + 1);
    notification["type"] = NOTIFICATION_MEASUREMENT;

    char id[MAX_LEN_ENTITY_ID + 1];
    getEntityId(entityType, channel, id);

    notification["entity"]["id"] = id;
    notification["entity"]["type"] = entityType;
    notification["entity"]["channel"] = channel;

    for (int i = 0; i < count; i++)
    {
        notification["values"][i]["type"] = readings[i].type;
        notification["values"][i]["value"] = readings[i].value;
    }

    send(notification);
}

#endif