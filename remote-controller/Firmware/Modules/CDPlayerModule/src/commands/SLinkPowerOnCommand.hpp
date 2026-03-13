#ifndef SLINK_POWER_ON_COMMAND_H
#define SLINK_POWER_ON_COMMAND_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

class SLinkPowerOnCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        Controller::instance().slinkPowerOn();
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif
