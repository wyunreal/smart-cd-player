#ifndef COMMON_ENTITY_READINGS_H
#define COMMON_ENTITY_READINGS_H

#include "ReadingNotifier.h"
#include "ReadingEvent.h"
#include "common/Queue.h"
#include "ReaderScheduleChecker.h"
#include "Config.h"
#include "Entity.h"

#ifdef MAX_ENTITIES_COUNT

#define MAX_LEN_ENTITY_RESPONSE 50
#define MAX_LEN_ENTITY_READING_TYPE MAX_LEN_ENTITY_TYPE

struct Reading
{
    char type[MAX_LEN_ENTITY_READING_TYPE + 1];
    float value;
};

struct Readings
{
    Reading readings[MAX_LEN_READINGS];
    int count;
};

struct ReadingsWithTimestamp
{
    Readings readings;
    unsigned long int timestamp;
};

class EntityReader
{
    friend class EntityReadingEvent;
    friend class SaveCalibrationOffsetCommand;
    friend class CalibratePointCommand;
    friend class GetCalibrationOffsetCommand;
    friend class ReadingResponseBuilder;
    friend class Entity;
public:
    static void begin(EntityReader *aEntityReader);
    static EntityReader &instance() { return *entityReader; }

    void startRealTimeReading(const char* entityType, int entityChannel, uint32_t clientId, uint32_t requestId, int timespanMs, bool rawReading);
    void stopRealTimeReading();

    void loadReadingConfiguration();
    void executeReadingIteration();

    void iterateStoredReading(const char *entityType, int entityChannel, void (*callback)(Readings *readings, const char* entityType, int entityChannel, unsigned long int timestamp));
    void iterateCurrentReadings(void (*callback)(Readings *readings, const char* entityType, int entityChannel, unsigned long int timestamp));

    Range* getSafetyRangeForEntity(const char* entityType, int entityChannel, int readingIndex);
    void iterateSafetyRangesForEntity(const char* entityType, int entityChannel, void (*callback)(Range *range, const char* readingType));    

protected:
    virtual Queue *getReadingsStorage(const char *entityType, int entityChannel) = 0;

    virtual void readEntity(const char* entityType, int entityChannel, char* response) = 0;
    virtual bool areValidReadings(Readings* readings) = 0;

    virtual int getReadingIndex(const char *entityType, const char *readingType) = 0;
    virtual unsigned long int calibrateEntity(const char* entityType, int entityChannel, const char* pointId, const char* pointValue) = 0;
    virtual int getReadingsCount(const char *entityType) = 0;
    virtual void fillReadingType(int index, const char *entityType, char *output) = 0;
    virtual float getReadingValue(int readingIndex, const char *entityType, float value) = 0;
    virtual Range* getSafetyRange(const char* entityType, int readingIndex) = 0;

    virtual int loadEntityReadingConfiguration(ReadingConfig* aReadingConfig) = 0;

    Readings *getAnnotatedReadingValues(const char *entityType, float *values);

private:
    Readings* performEntityReading(const char* entityType, int entityChannel, bool rawReading);
    int parseComaSeparatedFloats(const char* entityType, char *data);
    void addReadings(const char *entityType, int entityChannel, Readings *readings);
    void notifyReadings(const char *entityType, int entityChannel, Readings *readings);

    EntityReadingNotifier notifier;
    EntityReadingEvent readingEvent;
    ReaderScheduleChecker scheduleChecker;

    ReadingConfig readingConfig[MAX_ENTITIES_COUNT];
    bool readingInitialized[MAX_ENTITIES_COUNT];
    int readingConfigCount;
    int currentReadingConfigIndex;

    static EntityReader* entityReader;
};

#endif
#endif