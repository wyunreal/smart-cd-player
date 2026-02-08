#include "Thermistor.h"
#include <Arduino.h>

#define DEFAULT_SAMPLES_COUNT 5

Thermistor::Thermistor() {
  drainPin = 0;
  nominalResistance = 10000; // Resistance at 25 C
  temperatureNominal = 25; // temp. for nominal resistance (almost always 25 C)
  bCoeficient = 3950; // The beta coefficient of the thermistor (usually 3000-4000)
  seriesResistorValue = 10000; // Resistance of 'other' resistor
}

Thermistor::Thermistor(int aDrainPin) {
  drainPin = aDrainPin;
  nominalResistance = 10000; // Resistance at 25 C
  temperatureNominal = 25; // temp. for nominal resistance (almost always 25 C)
  bCoeficient = 3950; // The beta coefficient of the thermistor (usually 3000-4000)
  seriesResistorValue = 10000; // Resistance of 'other' resistor

  pinMode(drainPin, OUTPUT);
  digitalWrite(drainPin, HIGH);
}

Thermistor::Thermistor(int aNominalResistance, int aTemperatureNominal, int aBCoeficient, int aSeriesResistorValue) {
  drainPin = 0;
  nominalResistance = aNominalResistance;
  temperatureNominal = aTemperatureNominal;
  bCoeficient = aBCoeficient;
  seriesResistorValue = aSeriesResistorValue;
}

Thermistor::Thermistor(int aDrainPin, int aNominalResistance, int aTemperatureNominal, int aBCoeficient, int aSeriesResistorValue) {
  drainPin = aDrainPin;
  nominalResistance = aNominalResistance;
  temperatureNominal = aTemperatureNominal;
  bCoeficient = aBCoeficient;
  seriesResistorValue = aSeriesResistorValue;

  pinMode(drainPin, OUTPUT);
  digitalWrite(drainPin, HIGH);
}

float Thermistor::readTemperature(int aAnalogPin) {
  return readTemperature(aAnalogPin, DEFAULT_SAMPLES_COUNT);
}

float Thermistor::readTemperature(int aAnalogPin, int numberOfSamples) {
  float average;
  int samples[numberOfSamples];

  // getting analog readings
  if (drainPin > 0) {
    digitalWrite(drainPin, LOW);
    delay(100);
  }
  for (int i = 0; i < numberOfSamples; i++) {
   samples[i] = analogRead(aAnalogPin);
   delay(10);
  }
  if (drainPin > 0) {
    digitalWrite(drainPin, HIGH);
  }
  average = 0;
  for (int i = 0; i < numberOfSamples; i++) {
     average += samples[i];
  }
  average /= numberOfSamples;

  // convert the value to resistance
  #ifdef ARDUINO_ARCH_ESP32
  average = 4095 / average - 1;
  #else
  average = 1023 / average - 1;
  #endif
  average = seriesResistorValue / average;
  float steinhart;
  steinhart = average / nominalResistance;          // (R/Ro)
  steinhart = log(steinhart);                       // ln(R/Ro)
  steinhart /= bCoeficient;                         // 1/B * ln(R/Ro)
  steinhart += 1.0 / (temperatureNominal + 273.15); // + (1/To)
  steinhart = 1.0 / steinhart;                      // Invert
  steinhart -= 273.15;                              // convert to C

  return steinhart;
}

