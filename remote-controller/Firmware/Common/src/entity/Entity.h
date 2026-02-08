#ifndef ENTITY_H
#define ENTITY_H

#include "common/moduleId/ModuleId.h"
#include "Config.h"
#include <Preferences.h>

#define MAX_LEN_ENTITY_TYPE 10
#define MAX_LEN_ENTITY_CHANNEL 3
#define MAX_LEN_ENTITY_ID CONFIG_MAX_LEN_MODULE_ID + MAX_LEN_ENTITY_TYPE + MAX_LEN_ENTITY_CHANNEL
#define MAX_LEN_ENTITY_NAME 16
#define MAX_LEN_REFERENCE_VALUES 3
#define MAX_LEN_READINGS 4

void getEntityId(const char *entityType, int entityChannel, char *outputId);

bool isAtlasStampType(const char *type);
bool isTemperatureType(const char *type);

#define ENTITY_DATA_BUFFER_SIZE 256
#define ENTITY_DATA_DOCUMENT_SIZE 384

#define DEFAULT_READING_TIMESPAN 15
#define DEFAULT_READING_PLOTS_PER_DAY 48
#define DEFAULT_FIRST_READING_TIME 0

struct ReadingConfig
{
    char entityType[MAX_LEN_ENTITY_TYPE + 1];
    int entityChannel;
    unsigned long readingTimespan;
    unsigned long firstReadingTime;
    unsigned long readingPlotsPerDay;
};

struct Range
{
    float min;
    float max;
};

struct EntityData
{
    char id[MAX_LEN_ENTITY_ID + 1];
    char type[MAX_LEN_ENTITY_TYPE + 1];
    uint8_t channel;
    char name[MAX_LEN_ENTITY_NAME + 1];
    unsigned long calibrationDate;
    unsigned int calibrationPeriod;
    float calibrationReferenceValues[MAX_LEN_REFERENCE_VALUES];
    float offsets[MAX_LEN_READINGS];
    ReadingConfig readingConfig;
    Range safetyRanges[MAX_LEN_READINGS];
    bool isEnabled;
};

struct EntityDataPartition
{
    char type[MAX_LEN_ENTITY_TYPE + 1];
    int startIndex;
};

#define definePartitions(...)                       \
    {                                               \
        __VA_ARGS__, EntityDataPartition { "", -1 } \
    }
#define partition(X, Y) \
    EntityDataPartition { X, Y }

class Entity
{
public:
    static Entity &instance() { return entity; }

    void begin(EntityDataPartition *partitions);

    EntityData *getDataById(const char *id);
    EntityData *getDataByIndex(int index);
    EntityData *getDataByTypeAndChannel(const char *type, int channel);
    bool setIsEnabled(const char *type, int channel, bool isEnabled);
    bool setName(const char *type, int channel, const char *name);
    bool setCalibrationDate(const char *type, int channel, unsigned long calibrationDate);
    bool setCalibrationPeriod(const char *type, int channel, unsigned int calibrationPeriodInDays);
    bool setCalibrationReferenceValues(const char *type, int channel, const float *values);
    bool setOffsets(const char *type, int channel, float *offsets);
    bool setReadingConfiguration(const char *type, int channel, unsigned long readingTimespan, unsigned long readingPlotsPerDay, unsigned long firstReadingTime);
    bool setSafetyRanges(const char *type, int channel, Range *ranges, int rangesCount);

    unsigned long getNextCalibrationDate(const char* type, int channel);

private:
    int findSlot(const char *type, int channel);
    void save();
    void load();
#ifdef MAX_ENTITIES_COUNT
    EntityData entityData[MAX_ENTITIES_COUNT];
#else
    EntityData entityData[1];
#endif
    EntityDataPartition *namePartitions;
    Preferences data;

    static Entity entity;
};

#endif