#ifndef SLINK_PAUSE_COMMAND_H
#define SLINK_PAUSE_COMMAND_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

class SLinkPauseCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        Controller::instance().slinkPause();
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif
