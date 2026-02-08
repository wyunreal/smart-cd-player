#ifndef SCHEDULER_TASKS_H
#define SCHEDULER_TASKS_H

#include "./common/scheduler/TaskScheduler.h"
#include "common/ir/ir.h"
#include "Config.h"
#include "Notifications.h"

#define IR_LEARN_MODE_MIN_READ_TIME_MS 500

class IrCommandReadTimeoutTask : public SchedulerEvent
{
public:
    virtual void execute();
};

class IrCommandReadLoopTask : public SchedulerEvent
{
public:
    void setIrRemoteControl(IrRemoteControl* irCtrl) { irRemoteControl = irCtrl; }
    void setIrReadParams(const char *deviceName, byte commandId);
    void markReadStartedMillis();
    virtual void execute();

private:
    IrRemoteControl* irRemoteControl;

    unsigned long readStartMillis;

    char irDeviceName[DEVICE_NAME_MAX_LEN + 1];
    byte irCommandId;

    ReadIrCommandSuccessNotifier irReadSuccessNotifier;
};

#endif