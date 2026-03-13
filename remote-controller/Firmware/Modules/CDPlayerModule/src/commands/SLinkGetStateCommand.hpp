#ifndef SLINK_GET_STATE_COMMAND_H
#define SLINK_GET_STATE_COMMAND_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

class SLinkGetStateCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        CDPlayerState state = Controller::instance().getSlinkState();

        const char *playbackStr;
        switch (state.playbackState)
        {
        case CD_PLAYING:
            playbackStr = "playing";
            break;
        case CD_PAUSED:
            playbackStr = "paused";
            break;
        case CD_STOPPED:
            playbackStr = "stopped";
            break;
        default:
            playbackStr = "unknown";
            break;
        }

        responseContent["playbackState"] = playbackStr;
        responseContent["discNumber"] = state.discNumber;
        responseContent["trackNumber"] = state.trackNumber;
        responseContent["trackMinutes"] = state.trackMinutes;
        responseContent["trackSeconds"] = state.trackSeconds;
        responseContent["powered"] = state.powered;

        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif
