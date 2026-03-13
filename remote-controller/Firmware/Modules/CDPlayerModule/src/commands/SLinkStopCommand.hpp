#ifndef SLINK_STOP_COMMAND_H
#define SLINK_STOP_COMMAND_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

class SLinkStopCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        Controller::instance().slinkStop();
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif
