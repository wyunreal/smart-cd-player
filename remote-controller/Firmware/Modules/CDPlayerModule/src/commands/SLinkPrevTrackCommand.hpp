#ifndef SLINK_PREV_TRACK_COMMAND_H
#define SLINK_PREV_TRACK_COMMAND_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

class SLinkPrevTrackCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        Controller::instance().slinkPrevTrack();
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif
