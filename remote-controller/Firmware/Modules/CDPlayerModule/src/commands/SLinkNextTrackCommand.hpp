#ifndef SLINK_NEXT_TRACK_COMMAND_H
#define SLINK_NEXT_TRACK_COMMAND_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

class SLinkNextTrackCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        Controller::instance().slinkNextTrack();
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif
