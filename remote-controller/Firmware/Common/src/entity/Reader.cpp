#include "Reader.h"
#include "common/time/Time.h"
#include "ReadingResponseBuilder.h"

#ifdef MAX_ENTITIES_COUNT

Readings readings;
EntityReader *entityReaderPtr;

EntityReader* EntityReader::entityReader;

void EntityReader::begin(EntityReader *aEntityReader)
{
    entityReader = aEntityReader;
    entityReader->readingEvent.setEntityReader(entityReader);
    entityReader->readingEvent.setNotifier(&entityReader->notifier);
    for(int i = 0; i < MAX_ENTITIES_COUNT; i++) {
        entityReader->readingInitialized[i] = false;
    }for(int i = 0; i < MAX_ENTITIES_COUNT; i++) {
        entityReader->readingInitialized[i] = false;
    }
    TaskScheduler::instance().registerEvent(&entityReader->readingEvent);
}

Readings* EntityReader::getAnnotatedReadingValues(const char *entityType, float *values)
{
    int count = getReadingsCount(entityType);
    for (int i = 0; i < count; i++)
    {
        fillReadingType(i, entityType, readings.readings[i].type);
        readings.readings[i].value = values[i];
    }
    readings.count = count;
    return &readings;
}

int EntityReader::parseComaSeparatedFloats(const char* entityType, char *data)
{
    if (data == NULL)
    {
        return 0;
    }

    char *token = strtok(data, ",");
    int i = 0;
    while (token != NULL)
    {
        if (i >= MAX_LEN_READINGS)
        {
            break;
        }

        fillReadingType(i, entityType, readings.readings[i].type);
        readings.readings[i].value = getReadingValue(i, entityType, atof(token));

        token = strtok(NULL, ",");

        i++;
    }

    readings.count = i;

    return i;
}

struct StoredReadings
{
    float *readings;
    unsigned long int timestamp;
};

StoredReadings *createStoredReadings(Readings *readings)
{
    StoredReadings *storedReadings = new StoredReadings;
    storedReadings->readings = new float[readings->count];
    for (int i = 0; i < readings->count; i++)
    {
        storedReadings->readings[i] = readings->readings[i].value;
    }
    CurrentTime time;
    Time::instance().getTime(time);
    storedReadings->timestamp = time.timestamp;
    return storedReadings;
}

void deleteFirstIfFull(Queue *queue)
{
    if (queue->isFull())
    {
        StoredReadings *readingsToRemove = (StoredReadings *)queue->first();
        if (readingsToRemove != NULL)
        {
            delete[] readingsToRemove->readings;
            delete readingsToRemove;
        }
        queue->consumeFirst();
    }
}

/**
 * @brief Use this function to add readings to the storage.
 * 
 * @param entityType 
 * @param entityChannel 
 * @param readings 
 */
void EntityReader::addReadings(const char *entityType, int entityChannel, Readings *readings)
{
    Queue *queue = getReadingsStorage(entityType, entityChannel);
    if (queue != NULL)
    {
        StoredReadings *storedReadings = createStoredReadings(readings);
        deleteFirstIfFull(queue);
        queue->addLast(storedReadings);
    }
}

const char *foreachEntityType;
int foreachEntityChannel;
void (*foreachCallback)(Readings *readings, const char* entityType, int entityChannel, unsigned long int timestamp);
ReadingResponseBuilder readingResponseBuilder;

void processReading(void *storedReadingsPtr)
{
    StoredReadings *storedReadings = (StoredReadings *)storedReadingsPtr;
    short readingsCount = readingResponseBuilder.getReadingsCount(entityReaderPtr, foreachEntityType);
    for (int i = 0; i < readingsCount; i++)
    {
        readingResponseBuilder.fillReadingType(entityReaderPtr, i, foreachEntityType, readings.readings[i].type);
        readings.readings[i].value = storedReadings->readings[i];
    }
    readings.count = readingsCount;
    foreachCallback(&readings, foreachEntityType, foreachEntityChannel, storedReadings->timestamp);
}

void EntityReader::iterateStoredReading(const char *entityType, int entityChannel, void (*callback)(Readings *readings, const char* entityType, int entityChannel, unsigned long int timestamp))
{
    entityReaderPtr = entityReader;
    Queue *queue = entityReader->getReadingsStorage(entityType, entityChannel);
    if (queue != NULL)
    {
        foreachEntityType = entityType;
        foreachEntityChannel = entityChannel;
        foreachCallback = callback;
        queue->foreach (processReading);
    }
}

void EntityReader::iterateCurrentReadings(void (*callback)(Readings *readings, const char* entityType, int entityChannel, unsigned long int timestamp))
{
#ifdef MAX_ENTITIES_COUNT
    Queue *queue;
    entityReaderPtr = entityReader;
    foreachCallback = callback;
    for(int i = 0; i < readingConfigCount; i ++) {
        foreachEntityType = readingConfig[i].entityType;
        foreachEntityChannel = readingConfig[i].entityChannel;
        queue = entityReader->getReadingsStorage(readingConfig[i].entityType, readingConfig[i].entityChannel);
        void* lastReading = queue->last();
        if (lastReading != NULL) {
            processReading(lastReading);
        }
    }
#endif
}

void EntityReader::startRealTimeReading(const char* entityType, int entityChannel, uint32_t clientId, uint32_t requestId, int timespanMs, bool rawReading)
{
    readingEvent.startReading(entityType, entityChannel, clientId, requestId, timespanMs, rawReading);
}

void EntityReader::stopRealTimeReading()
{
    readingEvent.stopReading();
}

void EntityReader::loadReadingConfiguration()
{
#ifdef MAX_ENTITIES_COUNT
    readingConfigCount = loadEntityReadingConfiguration(readingConfig);
    currentReadingConfigIndex = 0;
#endif
}

unsigned long getTimespan(unsigned long firstReadingTime, unsigned long readingsPerDay)
{
    return (86400 - firstReadingTime) / readingsPerDay;
}

void EntityReader::notifyReadings(const char *entityType, int entityChannel, Readings *readings)
{
    notifier.setEntityData(entityType, entityChannel);
    notifier.setReadings(readings->readings, readings->count);
    notifier.setForAllClients();
    notifier.notify();
}

void EntityReader::executeReadingIteration()
{
#ifdef MAX_ENTITIES_COUNT
    if (readingConfigCount > 0) {
        ReadingConfig* config = &readingConfig[currentReadingConfigIndex];

        Readings* readings;
        if (scheduleChecker.entityReadingShouldBeExecuted(config->entityType, config->entityChannel, config->firstReadingTime, config->readingTimespan)) {
            readings = performEntityReading(config->entityType, config->entityChannel, false);
            if (areValidReadings(readings)) {
                notifyReadings(config->entityType, config->entityChannel, readings);
            }
        }
        if (!readingInitialized[currentReadingConfigIndex] || scheduleChecker.entityReadingShouldBeExecuted(config->entityType, config->entityChannel, config->firstReadingTime, getTimespan(config->firstReadingTime, config->readingPlotsPerDay), true)) {
            readingInitialized[currentReadingConfigIndex] = true;
            readings = performEntityReading(config->entityType, config->entityChannel, false);
            if (areValidReadings(readings)) {
                addReadings(config->entityType, config->entityChannel, readings);
            }
        }

        currentReadingConfigIndex++;
        if (currentReadingConfigIndex >= readingConfigCount) {
            currentReadingConfigIndex = 0;
        }
    }
#endif
}

Readings* EntityReader::performEntityReading(const char* entityType, int entityChannel, bool rawReading)
{
    readings.count = 0;
    char response[MAX_LEN_ENTITY_RESPONSE + 1];
    
    readEntity(entityType, entityChannel, response);
    if (strlen(response) > 0)
    {
        if (parseComaSeparatedFloats(entityType, response) > 0)
        {
            if (!rawReading) {
                EntityData *entityData = Entity::instance().getDataByTypeAndChannel(entityType, entityChannel);
                for (int i = 0; i < readings.count; i++)
                {
                    readings.readings[i].value += (entityData ? entityData->offsets[i] : 0);
                }
            }
        }
    }
    
    return &readings;
}

Range currentRange;
Range* EntityReader::getSafetyRangeForEntity(const char* entityType, int entityChannel, int readingIndex)
{
    currentRange.min = 0;
    currentRange.max = 0;
    EntityData* entity = Entity::instance().getDataByTypeAndChannel(entityType, entityChannel);
    if (entity != NULL) {
        currentRange.min = entity->safetyRanges[readingIndex].min;
        currentRange.max = entity->safetyRanges[readingIndex].max;
    }
    if (currentRange.min == 0 && currentRange.max == 0) {
        Range* defaultRange = EntityReader::instance().getSafetyRange(entityType, readingIndex);
        if (defaultRange != NULL) {
            currentRange.min = defaultRange->min;
            currentRange.max = defaultRange->max;
        } else {
            return NULL;
        }
    }
    return &currentRange;
}

void EntityReader::iterateSafetyRangesForEntity(const char* entityType, int entityChannel, void (*callback)(Range *range, const char* readingType))
{
    char readingType[MAX_LEN_ENTITY_READING_TYPE + 1];
    for(int i = 0; i < getReadingsCount(entityType); i++) {
        Range* range = getSafetyRangeForEntity(entityType, entityChannel, i);
        if (range != NULL) {
            fillReadingType(i, entityType, readingType);
            callback(range, readingType);
        }
    }
}

#endif