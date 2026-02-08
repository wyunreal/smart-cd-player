#include "SchedulerTasks.h"

#include "Controller.h"

void IrCommandReadTimeoutTask::execute()
{
    Controller::instance().disableIrLearnMode(true);
}

void IrCommandReadLoopTask::setIrReadParams(const char *deviceName, byte commandId)
{
    strcpy(irDeviceName, deviceName);
    irCommandId = commandId;
}

void IrCommandReadLoopTask::markReadStartedMillis()
{
    readStartMillis = millis();
}

void IrCommandReadLoopTask::execute()
{
    if (irRemoteControl->available())
    {
        IrSignal *signal = irRemoteControl->getSignal();
        if (signal->type == UNKNOWN || millis() - readStartMillis < IR_LEARN_MODE_MIN_READ_TIME_MS)
        {
            return;
        }

        Config::setBytes(IrRemoteControl::getIrCommandKey(irDeviceName, irCommandId), sizeof(IrSignal), signal);
        irReadSuccessNotifier.setIrData(signal);
        irReadSuccessNotifier.notify();
        Controller::instance().disableIrLearnMode(false);
        irRemoteControl->clean();
    }
}