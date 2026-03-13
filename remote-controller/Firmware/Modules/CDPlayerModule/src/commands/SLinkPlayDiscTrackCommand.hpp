#ifndef SLINK_PLAY_DISC_TRACK_COMMAND_H
#define SLINK_PLAY_DISC_TRACK_COMMAND_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

enum SLinkPlayDiscTrackErrors
{
    SLINK_PLAY_DISC_TRACK_DISC_INVALID = 1,
    SLINK_PLAY_DISC_TRACK_TRACK_INVALID = 2,
};

class SLinkPlayDiscTrackCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }

        uint16_t discNumber = inputData["discNumber"];
        uint8_t trackNumber = inputData["trackNumber"];
        Controller::instance().slinkPlayDiscTrack(discNumber, trackNumber);
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        uint16_t discNumber = inputData["discNumber"];
        if (discNumber < 1 || discNumber > 400)
        {
            responseContent["errors"]["discNumber"] = SLINK_PLAY_DISC_TRACK_DISC_INVALID;
            isValid = false;
        }
        uint8_t trackNumber = inputData["trackNumber"];
        if (trackNumber < 1 || trackNumber > 99)
        {
            responseContent["errors"]["trackNumber"] = SLINK_PLAY_DISC_TRACK_TRACK_INVALID;
            isValid = false;
        }
        return isValid;
    }
};

#endif
