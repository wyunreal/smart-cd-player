#ifndef CONTROLLER_H
#define CONTROLLER_H

#include "common/module-controller/ModuleController.h"
#include "Config.h"
#include "Notifications.h"
#include "SchedulerTasks.h"
#include "slink/SLink.h"
#include "SLinkSchedulerTasks.h"

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

    // S-Link CD player control
    void slinkPlay();
    void slinkPause();
    void slinkStop();
    void slinkNextTrack();
    void slinkPrevTrack();
    void slinkSelectDisc(uint16_t discNumber);
    void slinkPlayDiscTrack(uint16_t discNumber, uint8_t trackNumber);
    void slinkPowerOn();
    void slinkPowerOff();
    CDPlayerState getSlinkState();

private:
    static Controller controller;
    IrRemoteControl irRemoteControl;

    IrCommandReadLoopTask irCommandReadLoopTask;
    IrCommandReadTimeoutTask irCommandReadTimeoutTask;
    ReadIrCommandTimeoutNotifier irReadTimeoutNotifier;

    // S-Link
    SLinkController slinkController;
    SLinkPollTask slinkPollTask;
};

#endif
