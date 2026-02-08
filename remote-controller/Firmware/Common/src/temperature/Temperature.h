#ifndef COMMON_TEMPERATURE_H
#define COMMON_TEMPERATURE_H

float getTemperatureReading(int channel);
bool performTemperatureCalibration(const char* entityType, int entityChannel, const char* pointValue);

#endif
