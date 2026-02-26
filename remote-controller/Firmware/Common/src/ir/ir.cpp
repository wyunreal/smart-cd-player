#include "ir.h"

#include "../config/Hardware.h"

IRrecv irrecv(IR_RECEIVE_PIN);
IRsend irsend(IR_SEND_PIN);

char IrRemoteControl::irCommandKey[15 + 1];
QueueHandle_t IrRemoteControl::irSendQueue = NULL;
SemaphoreHandle_t IrRemoteControl::irSendDone = NULL;
bool IrRemoteControl::lastSendResult = false;

void IrRemoteControl::begin()
{
    irsend.begin();
    irrecv.enableIRIn();

    irSendQueue = xQueueCreate(1, sizeof(IrSignal));
    irSendDone = xSemaphoreCreateBinary();

    xTaskCreatePinnedToCore(
        irSendTask,
        "irSend",
        4096,
        NULL,
        configMAX_PRIORITIES - 1,  // highest priority to minimize jitter
        NULL,
        1  // core 1 (Arduino core, free from WiFi)
    );
}

void IrRemoteControl::irSendTask(void *param)
{
    IrSignal signal;
    for (;;) {
        if (xQueueReceive(irSendQueue, &signal, portMAX_DELAY) == pdTRUE) {
            executeIrSend(signal);
            xSemaphoreGive(irSendDone);
        }
    }
}

void IrRemoteControl::executeIrSend(const IrSignal &signal)
{
    irrecv.disableIRIn();

    uint16_t repeats = irsend.minRepeats(signal.type);
    irsend.send(signal.type, signal.value, signal.bits, repeats);

    irrecv.enableIRIn();
}

void IrRemoteControl::clean()
{
    irrecv.resume();
}

bool IrRemoteControl::available()
{
    bool decoded = irrecv.decode(&results);
    irrecv.resume();
    return decoded;
}

IrSignal *IrRemoteControl::getSignal()
{
    signal.type = results.decode_type;
    signal.value = results.value;
    signal.bits = results.bits;

    return &signal;
}

const char *IrRemoteControl::getIrCommandKey(const char *deviceName, byte commandId)
{
    strcpy(IrRemoteControl::irCommandKey, "_");
    strcat(IrRemoteControl::irCommandKey, deviceName);
    char commandIdStr[4];
    itoa(commandId, commandIdStr, 10);
    strcat(IrRemoteControl::irCommandKey, commandIdStr);
    return IrRemoteControl::irCommandKey;
}

bool IrRemoteControl::sendCommand(const char *deviceName, const char *commandName)
{
    const char *irCommandKey = IrRemoteControl::getIrCommandKey(deviceName, atoi(commandName));

    IrSignal signal;
    if (!Config::getBytes(irCommandKey, sizeof(IrSignal), &signal))
    {
        return false;
    }

    Serial.printf("Queuing IR command: device=%s, command=%s\n", deviceName, commandName);

    // Send signal to the IR task on core 1 and wait for completion
    xQueueSend(irSendQueue, &signal, portMAX_DELAY);
    xSemaphoreTake(irSendDone, portMAX_DELAY);

    return true;
}