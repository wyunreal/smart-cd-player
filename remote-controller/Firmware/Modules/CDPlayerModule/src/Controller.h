#ifndef CONTROLLER_H
#define CONTROLLER_H

#include "common/module-controller/ModuleController.h"
#include "Config.h"
#include "Notifications.h"
#include "SchedulerTasks.h"

class Controller : public ModuleController
{
public:
    static Controller &instance() { return controller; }

    void enableIrLearnMode(const char *deviceName, byte commandId);
    void disableIrLearnMode(bool notifyTimeout = false);
    void getAllRecordedIrCommands(DynamicJsonDocument &responseContent);

    void setup(bool initialized) override;
    void loop(bool initialized) override;
    void registerWebHandlers(AsyncWebServer &server) override;

    bool sendIrCommand(const char *deviceName, const char *commandName);

private:
    static Controller controller;
    IrRemoteControl irRemoteControl;

    IrCommandReadLoopTask irCommandReadLoopTask;
    IrCommandReadTimeoutTask irCommandReadTimeoutTask;
    ReadIrCommandTimeoutNotifier irReadTimeoutNotifier;
};

#endif