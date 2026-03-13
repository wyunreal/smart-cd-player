#ifndef SLINK_POWER_OFF_COMMAND_H
#define SLINK_POWER_OFF_COMMAND_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

class SLinkPowerOffCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        Controller::instance().slinkPowerOff();
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif
