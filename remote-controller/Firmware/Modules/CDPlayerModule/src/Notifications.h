#ifndef NOTIFICATIONS_H
#define NOTIFICATIONS_H

#include <ArduinoJson.h>
#include "common/web-server/Notifier.h"
#include "common/ir/ir.h"

#define IR_READ_SUCCESS_MESSAGE_LEN 300
#define IR_READ_SUCCESS "irReadSuccess"

#define IR_READ_TIMEOUT_MESSAGE_LEN 150
#define IR_READ_TIMEOUT "irReadTimeout"

class ReadIrCommandSuccessNotifier : public Notifier
{
public:
    void setIrData(const IrSignal* aIrSignal) { irSignal = aIrSignal; }
    virtual void notify();
private:
    const IrSignal* irSignal;
};

class ReadIrCommandTimeoutNotifier : public Notifier
{
public:
    virtual void notify();
};

#endif