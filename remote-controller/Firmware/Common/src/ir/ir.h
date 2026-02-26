#ifndef IR_H
#define IR_H

#include <Arduino.h>
#include <IRrecv.h>
#include <IRsend.h>
#include <IRutils.h>
#include "../config/Config.h"

struct IrSignal
{
    decode_type_t type;
    uint64_t value;
    uint16_t bits;
};

struct IrSendRequest
{
    IrSignal signal;
    bool pending;
    bool result;
};

class IrRemoteControl
{
public:
    void begin();
    void clean();
    bool available();
    IrSignal *getSignal();

    static const char *getIrCommandKey(const char *deviceName, byte commandId);

    bool sendCommand(const char *deviceName, const char *commandName);

private:
    decode_results results;

    IrSignal signal;
    String lastCode = "";
    uint64_t lastValue = 0;
    uint16_t lastBits = 0;
    decode_type_t lastType = UNKNOWN;

    static char irCommandKey[15 + 1]; // Prefferences keys max length for nvs is 15 characters

    static QueueHandle_t irSendQueue;
    static SemaphoreHandle_t irSendDone;
    static bool lastSendResult;

    static void irSendTask(void *param);
    static void executeIrSend(const IrSignal &signal);
};

#endif