#include "ir.h"

#include "../config/Hardware.h"

IRrecv irrecv(IR_RECEIVE_PIN);
IRsend irsend(IR_SEND_PIN);

char IrRemoteControl::irCommandKey[15 + 1];

void IrRemoteControl::begin()
{
    irsend.begin();
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

    uint16_t repeats = irsend.minRepeats(signal.type);
    irsend.send(signal.type, signal.value, signal.bits, repeats);

    return true;
}