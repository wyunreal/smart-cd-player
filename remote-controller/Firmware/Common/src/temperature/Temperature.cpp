#include "Temperature.h"
#include "Config.h"
#include "common/entity/Entity.h"
#include <Thermistor.h>

Thermistor thermistor;
#ifdef MAX_TEMPERATURE_SENSORS_COUNT
int channels[MAX_TEMPERATURE_SENSORS_COUNT] = {TEMPERATURE_1_PIN, TEMPERATURE_2_PIN, TEMPERATURE_3_PIN, TEMPERATURE_4_PIN};
#else
int channels[] = {};
#endif

float getTemperatureReading(int channel)
{
    #ifdef MAX_TEMPERATURE_SENSORS_COUNT
    return thermistor.readTemperature(channels[channel], TEMPERATURE_NUMBER_OF_SAMPLES);
    #else
    return 0;
    #endif
}

bool performTemperatureCalibration(const char* entityType, int entityChannel, const char* pointValue)
{
    float offsets[MAX_LEN_READINGS];
    float setPointValue = atof(pointValue);
    offsets[0] = setPointValue - getTemperatureReading(entityChannel);
    return Entity::instance().setOffsets(entityType, entityChannel, offsets);
}