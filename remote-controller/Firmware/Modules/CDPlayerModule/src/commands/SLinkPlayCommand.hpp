#ifndef SLINK_PLAY_COMMAND_H
#define SLINK_PLAY_COMMAND_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

class SLinkPlayCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        Controller::instance().slinkPlay();
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif
