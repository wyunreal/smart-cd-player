# Thermistor Library

This library will help you on using a thermistor to get temperature readings. 

# So ... what exactly is a thermistor ?

A thermistor is an element with an electrical resistance that changes in response to temperature. This name is derived from the more descriptive term “thermally sensitive resistor”, the original name for these devices.

Thermistors were first discovered by Michael Faraday in 1833, although commercially useful thermistors weren’t manufactured until 1930. They’re now widely used in a variety of electronic applications, most often as temperature sensors. Additional uses of thermistors include current limiters, current protectors, and heating elements. 

# First, some theory ...

To measure the temperature, we need to measure the resistance. However, a microcontroller does not have a resistance-meter built in. Instead, it only has a voltage reader known as a analog-digital-converter.

Arduino can not read resistance directly, but it can read voltage, so we need to convert resistance into a voltage reading on an analog pin of the arduino. This can be done adding another resistor and connecting them in series. Now you just measure the voltage in the middle, as the resistance changes, the voltage changes too.

# Ok, how can I connect a thermistor to Arduino ?

Say the fixed resistor is 10K and the variable resistor is called R - the voltage output (Vo) is:

```
Vo = R / (R + 10K) * Vcc
```

Where Vcc is the power supply voltage (3.3V or 5V)

Now we want to connect it up to a microcontroller. Remember that when you measure a voltage (Vi) into an Arduino ADC, you'll get a number.

```
ADC value = Vi * 1023 / Varef
```

So now we combine the two (Vo = Vi) and get:

```
ADC value = R / (R + 10K) * Vcc * 1023 / Varef
```

What is nice is that if you notice, if Vcc (logic voltage) is the same as the ARef, analog reference voltage, the values cancel out!

```
ADC value = R / (R + 10K) * 1023
```

It doesn't matter what voltage you're running under. Handy!

Finally, what we really want to do is get that R (the unknown resistance). So we do a little math to move the R to one side:

```
R = 10K / (1023/ADC - 1) 
```

As shown in the diagram: connect one end of the 10K resistor to 5V, connect the other end of the 10K 1% resistor to one pin of the thermistor and the other pin of the thermistor to ground. Then connect Analog 0 pin to the 'center' of the two.

![Connection diagram](https://github.com/wyunreal/ThermistorLibrary/blob/master/ThermistorConnection.png)

Once connected, the library does the rest, converting the measured voltage, into resistance, then into temperature !

# Finally, how can I use the library ?

First, download and extract the ZIP, then copy the Thermistor folder to your Arduino IDE libraries folder. Then try following sketch:

```C++
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

```

# Source

Thanks to **Adafruit** for following great article:
https://learn.adafruit.com/thermistor/using-a-thermistor
