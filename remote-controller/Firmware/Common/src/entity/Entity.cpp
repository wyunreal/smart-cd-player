#include "Entity.h"
#include "common/moduleId/ModuleId.h"
#include <ArduinoJson.h>
#include "common/entity/Reader.h"

#define DATA_KEY "data"

void getEntityId(const char *entityType, int entityChannel, char *outputId)
{
    sprintf(outputId, "%s-%s-%i", ModuleId::getId(), entityType, entityChannel);
}

bool isAtlasStampType(const char *type)
{
    return strcmp(type, "ph") == 0 ||
           strcmp(type, "ec") == 0 ||
           strcmp(type, "orp") == 0 ||
           strcmp(type, "do") == 0;
}

bool isTemperatureType(const char *type)
{
    return strcmp(type, "temp") == 0;
}

Entity Entity::entity;

void Entity::begin(EntityDataPartition *partitions)
{
    data.begin("entitiesData");
    namePartitions = partitions;
#ifdef MAX_ENTITIES_COUNT
    for (int i = 0; i < MAX_ENTITIES_COUNT; i++)
    {
        strcpy(entityData[i].id, "");
        strcpy(entityData[i].type, "");
        entityData[i].channel = 0;
        strcpy(entityData[i].name, "");
        entityData[i].calibrationDate = 0;
        entityData[i].calibrationPeriod = 0;
        for (int j = 0; j < MAX_LEN_REFERENCE_VALUES; j++)
        {
            entityData[i].calibrationReferenceValues[j] = 0;
        }
        for (int j = 0; j < MAX_LEN_READINGS; j++)
        {
            entityData[i].offsets[j] = 0;
        }
        entityData[i].readingConfig.readingTimespan = DEFAULT_READING_TIMESPAN;
        entityData[i].readingConfig.readingPlotsPerDay = DEFAULT_READING_PLOTS_PER_DAY;
        entityData[i].readingConfig.firstReadingTime = DEFAULT_FIRST_READING_TIME;
        entityData[i].isEnabled = true;
        for (int j = 0; j < MAX_LEN_READINGS; j++)
        {
            entityData[i].safetyRanges[j].min = 0;
            entityData[i].safetyRanges[j].max = 0;
        }
    }
    load();
#endif
}

int Entity::findSlot(const char *type, int channel)
{
#ifdef ENTITY_DATA_PARTITIONS
    int index;
    int i = 0;
    do
    {
        index = namePartitions[i].startIndex;
        if (strcmp(namePartitions[i].type, type) == 0)
        {
            return index + channel;
        }
        i++;
    } while (index > -1);
#endif
    return -1;
}

EntityData *Entity::getDataById(const char *id)
{
#ifdef MAX_ENTITIES_COUNT
    for (int i = 0; i < MAX_ENTITIES_COUNT; i++)
    {
        if (strcmp(id, entityData[i].id) == 0)
        {
            return &entityData[i];
        }
    }
#endif
    return NULL;
}

EntityData *Entity::getDataByTypeAndChannel(const char *type, int channel)
{
#ifdef MAX_ENTITIES_COUNT
    for (int i = 0; i < MAX_ENTITIES_COUNT; i++)
    {
        if (strcmp(type, entityData[i].type) == 0 && entityData[i].channel == channel)
        {
            return &entityData[i];
        }
    }
#endif
    return NULL;
}

EntityData *Entity::getDataByIndex(int index)
{
    return &entityData[index];
}

bool Entity::setName(const char *type, int channel, const char *name)
{
#ifdef MAX_ENTITIES_COUNT
    int index = findSlot(type, channel);
    if (index > -1)
    {
        char id[MAX_LEN_ENTITY_ID + 1];
        getEntityId(type, channel, id);
        strcpy(entityData[index].id, id);
        strcpy(entityData[index].type, type);
        entityData[index].channel = channel;
        strcpy(entityData[index].name, name);
        save();
        return true;
    }
#endif
    return false;
}

bool Entity::setIsEnabled(const char *type, int channel, bool isEnabled)
{
#ifdef MAX_ENTITIES_COUNT
    int index = findSlot(type, channel);
    if (index > -1)
    {
        char id[MAX_LEN_ENTITY_ID + 1];
        getEntityId(type, channel, id);
        strcpy(entityData[index].id, id);
        strcpy(entityData[index].type, type);
        entityData[index].channel = channel;
        entityData[index].isEnabled = isEnabled;
        save();
        return true;
    }
#endif
    return false;
}

bool Entity::setCalibrationDate(const char *type, int channel, unsigned long calibrationDate)
{
#ifdef MAX_ENTITIES_COUNT
    int index = findSlot(type, channel);
    if (index > -1)
    {
        char id[MAX_LEN_ENTITY_ID + 1];
        getEntityId(type, channel, id);
        strcpy(entityData[index].id, id);
        strcpy(entityData[index].type, type);
        entityData[index].channel = channel;
        entityData[index].calibrationDate = calibrationDate;
        save();
        return true;
    }
#endif
    return false;
}

bool Entity::setCalibrationPeriod(const char *type, int channel, unsigned int calibrationPeriodInDays)
{
#ifdef MAX_ENTITIES_COUNT
    int index = findSlot(type, channel);
    if (index > -1)
    {
        char id[MAX_LEN_ENTITY_ID + 1];
        getEntityId(type, channel, id);
        strcpy(entityData[index].id, id);
        strcpy(entityData[index].type, type);
        entityData[index].channel = channel;
        entityData[index].calibrationPeriod = calibrationPeriodInDays;
        save();
        return true;
    }
#endif
    return false;
}

bool Entity::setCalibrationReferenceValues(const char *type, int channel, const float *values)
{
#ifdef MAX_ENTITIES_COUNT
    int index = findSlot(type, channel);
    if (index > -1)
    {
        char id[MAX_LEN_ENTITY_ID + 1];
        getEntityId(type, channel, id);
        strcpy(entityData[index].id, id);
        strcpy(entityData[index].type, type);
        entityData[index].channel = channel;
        for (int i = 0; i < MAX_LEN_REFERENCE_VALUES; i++)
        {
            entityData[index].calibrationReferenceValues[i] = values[i];
        }
        save();
        return true;
    }
#endif
    return false;
}

bool Entity::setOffsets(const char *type, int channel, float *offsets)
{
#ifdef MAX_ENTITIES_COUNT
    int index = findSlot(type, channel);
    if (index > -1)
    {
        char id[MAX_LEN_ENTITY_ID + 1];
        getEntityId(type, channel, id);
        strcpy(entityData[index].id, id);
        strcpy(entityData[index].type, type);
        entityData[index].channel = channel;
        for (int i = 0; i < MAX_LEN_READINGS; i++)
        {
            entityData[index].offsets[i] = offsets[i];
        }
        save();
        return true;
    }
#endif
    return false;
}

bool Entity::setReadingConfiguration(const char *type, int channel, unsigned long readingTimespan, unsigned long readingPlotsPerDay, unsigned long firstReadingTime)
{
#ifdef MAX_ENTITIES_COUNT
    int index = findSlot(type, channel);
    if (index > -1)
    {
        char id[MAX_LEN_ENTITY_ID + 1];
        getEntityId(type, channel, id);
        strcpy(entityData[index].id, id);
        strcpy(entityData[index].type, type);
        entityData[index].channel = channel;
        entityData[index].readingConfig.readingTimespan = readingTimespan;
        entityData[index].readingConfig.readingPlotsPerDay = readingPlotsPerDay;
        entityData[index].readingConfig.firstReadingTime = firstReadingTime;
        save();
        return true;
    }
#endif
    return false;
}

unsigned long Entity::getNextCalibrationDate(const char *type, int channel)
{
#ifdef MAX_ENTITIES_COUNT
    int index = findSlot(type, channel);
    if (index > -1)
    {
        if (entityData[index].calibrationDate > 0)
        {
            return entityData[index].calibrationDate + (entityData[index].calibrationPeriod > 0 ? entityData[index].calibrationPeriod : DEFAULT_RECALIBRATION_INTERVAL_IN_DAYS) * 24 * 60 * 60;
        }
        else
        {
            return 0;
        }
    }
#endif
    return 0;
}

bool Entity::setSafetyRanges(const char *type, int channel, Range *ranges, int rangesCount)
{
#ifdef MAX_ENTITIES_COUNT
    int index = findSlot(type, channel);
    if (index > -1)
    {
        char id[MAX_LEN_ENTITY_ID + 1];
        getEntityId(type, channel, id);
        strcpy(entityData[index].id, id);
        strcpy(entityData[index].type, type);
        entityData[index].channel = channel;
        for (int i = 0; i < rangesCount; i++)
        {
            entityData[index].safetyRanges[i] = ranges[i];
        }
        save();
        return true;
    }
#endif
    return false;
}

void Entity::save()
{
#ifdef MAX_ENTITIES_COUNT
    DynamicJsonDocument entitiesJson(MAX_ENTITIES_COUNT * ENTITY_DATA_DOCUMENT_SIZE);
    entitiesJson.clear();
    for (int i = 0; i < MAX_ENTITIES_COUNT; i++)
    {
        if (strlen(entityData[i].id) > 0)
        {
            JsonObject entityJson = entitiesJson.createNestedObject();
            entityJson["id"] = entityData[i].id;
            entityJson["type"] = entityData[i].type;
            entityJson["channel"] = entityData[i].channel;
            entityJson["name"] = entityData[i].name;
            entityJson["calDate"] = entityData[i].calibrationDate;
            entityJson["calRefValues"].createNestedArray();
            for (int j = 0; j < MAX_LEN_REFERENCE_VALUES; j++)
            {
                entityJson["calRefValues"].add(entityData[i].calibrationReferenceValues[j]);
            }
            entityJson["offsets"].createNestedArray();
            for (int j = 0; j < EntityReader::instance().getReadingsCount(entityData[i].type); j++)
            {
                entityJson["offsets"].add(entityData[i].offsets[j]);
            }
            entityJson["readTSpan"] = entityData[i].readingConfig.readingTimespan;
            entityJson["readPDay"] = entityData[i].readingConfig.readingPlotsPerDay;
            entityJson["readFTime"] = entityData[i].readingConfig.firstReadingTime;
            entityJson["isEnabled"] = entityData[i].isEnabled;
            entityJson["sRanges"].createNestedArray();
            for (int j = 0; j < EntityReader::instance().getReadingsCount(entityData[i].type); j++)
            {
                if (entityData[i].safetyRanges[j].min != 0 || entityData[i].safetyRanges[j].max != 0)
                {
                    entityJson["sRanges"][j]["min"] = entityData[i].safetyRanges[j].min;
                    entityJson["sRanges"][j]["max"] = entityData[i].safetyRanges[j].max;
                }
            }
        }
    }
    char entitiesJsonBuffer[MAX_ENTITIES_COUNT * ENTITY_DATA_BUFFER_SIZE];
    serializeJson(entitiesJson, entitiesJsonBuffer, MAX_ENTITIES_COUNT * ENTITY_DATA_BUFFER_SIZE);
    data.putBytes(DATA_KEY, entitiesJsonBuffer, strlen(entitiesJsonBuffer));
#endif
}

void Entity::load()
{
#ifdef MAX_ENTITIES_COUNT
    size_t size;
    char entitiesJsonBuffer[MAX_ENTITIES_COUNT * ENTITY_DATA_BUFFER_SIZE];
    if (data.isKey(DATA_KEY))
    {
        size = data.getBytes(DATA_KEY, entitiesJsonBuffer, MAX_ENTITIES_COUNT * ENTITY_DATA_BUFFER_SIZE);
        entitiesJsonBuffer[size] = '\0';
    }
    else
    {
        strcpy(entitiesJsonBuffer, "[]");
        size = 2;
    }

    DynamicJsonDocument entitiesJson(MAX_ENTITIES_COUNT * ENTITY_DATA_DOCUMENT_SIZE);
    deserializeJson(entitiesJson, entitiesJsonBuffer, size + 1);
    JsonArray entitiesJsonArray = entitiesJson.as<JsonArray>();

    int i = 0;
    int index;
    for (JsonVariant entity : entitiesJsonArray)
    {
        index = findSlot(entity["type"], entity["channel"]);
        if (index > -1)
        {
            strcpy(entityData[index].id, entity["id"].isNull() ? "" : (const char *)entity["id"]);
            strcpy(entityData[index].type, entity["type"].isNull() ? "" : (const char *)entity["type"]);
            entityData[index].channel = entity["channel"].isNull() ? 0 : entity["channel"];
            strcpy(entityData[index].name, entity["name"].isNull() ? "" : (const char *)entity["name"]);
            entityData[index].calibrationDate = entity["calDate"].isNull() ? 0 : entity["calDate"];
            entityData[index].calibrationPeriod = entity["calPeriod"].isNull() ? 0 : entity["calPeriod"];
            for (int j = 0; j < MAX_LEN_REFERENCE_VALUES; j++)
            {
                entityData[index].calibrationReferenceValues[j] = entity["calRefValues"][j].isNull() ? 0 : entity["calRefValues"][j];
            }
            for (int j = 0; j < MAX_LEN_READINGS; j++)
            {
                entityData[index].offsets[j] = entity["offsets"][j].isNull() ? 0 : entity["offsets"][j];
            }
            entityData[index].readingConfig.readingTimespan = entity["readTSpan"].isNull() ? DEFAULT_READING_TIMESPAN : entity["readTSpan"];
            entityData[index].readingConfig.readingPlotsPerDay = entity["readPDay"].isNull() ? DEFAULT_READING_PLOTS_PER_DAY : entity["readPDay"];
            entityData[index].readingConfig.firstReadingTime = entity["readFTime"].isNull() ? DEFAULT_FIRST_READING_TIME : entity["readFTime"];
            entityData[index].isEnabled = entity["isEnabled"].isNull() ? true : entity["isEnabled"];
            Range *defaultRange;
            for (int j = 0; j < MAX_LEN_READINGS; j++)
            {
                defaultRange = EntityReader::instance().getSafetyRange(entityData[index].type, j);
                if (defaultRange != NULL)
                {
                    entityData[index].safetyRanges[j].min = entity["sRanges"][j].isNull() ? defaultRange->min : entity["sRanges"][j]["min"];
                    entityData[index].safetyRanges[j].max = entity["sRanges"][j].isNull() ? defaultRange->max : entity["sRanges"][j]["max"];
                }
            }
        }
    }
#endif
}