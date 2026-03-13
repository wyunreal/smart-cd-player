#ifndef SLINK_SELECT_DISC_COMMAND_H
#define SLINK_SELECT_DISC_COMMAND_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

enum SLinkSelectDiscErrors
{
    SLINK_SELECT_DISC_NUMBER_INVALID = 1,
};

class SLinkSelectDiscCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }

        uint16_t discNumber = inputData["discNumber"];
        Controller::instance().slinkSelectDisc(discNumber);
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        uint16_t discNumber = inputData["discNumber"];
        if (discNumber < 1 || discNumber > 400)
        {
            responseContent["errors"]["discNumber"] = SLINK_SELECT_DISC_NUMBER_INVALID;
            return false;
        }
        return true;
    }
};

#endif
