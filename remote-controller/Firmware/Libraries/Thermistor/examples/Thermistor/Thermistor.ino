#include <Thermistor.h>

Thermistor thermistor(8); // DrainPin = 8

void setup() {
  Serial.begin(9600);
}

void loop() {
  float temperature = thermistor.readTemperature(A15); // Read temperature from pin A15
  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" C");
  delay(1000);
}
