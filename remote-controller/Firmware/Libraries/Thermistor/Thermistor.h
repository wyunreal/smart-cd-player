#ifndef THERMISTOR_H
#define THERMISTOR_H

class Thermistor {
  private:
    int drainPin;
    int nominalResistance;
    int temperatureNominal;
    int bCoeficient;
    int seriesResistorValue;
  public:
    Thermistor();
    Thermistor(int aDrainPin);
    Thermistor(int aNominalResistance, int aTemperatureNominal, int aBCoeficient, int aSeriesResistorValue);
    Thermistor(int aDrainPin, int aNominalResistance, int aTemperatureNominal, int aBCoeficient, int aSeriesResistorValue);

    float readTemperature(int aAnalogPin);
    float readTemperature(int aAnalogPin, int numberOfSamples);
};

#endif
