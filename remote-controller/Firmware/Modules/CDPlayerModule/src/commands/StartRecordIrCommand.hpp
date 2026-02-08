#ifndef START_RECORD_IR_COMMAND_H
#define START_RECORD_IR_COMMAND_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

enum StartRecordIrErrors
{
    START_RECORD_IR_DEVICE_NAME_INVALID = 1,
    START_RECORD_IR_COMMAND_ID_INVALID = 2,
};

class StartRecordIrCommand : public Command {
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }

        Controller::instance().enableIrLearnMode(inputData["deviceName"], inputData["commandId"]);
        
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        if (strlen(inputData["deviceName"]) == 0 || strlen(inputData["deviceName"]) > DEVICE_NAME_MAX_LEN)
        {
            responseContent["errors"]["deviceName"] = START_RECORD_IR_DEVICE_NAME_INVALID;
            isValid = false;
        }
        if (inputData["commandId"] < 0 || inputData["commandId"] > 255)
        {
            responseContent["errors"]["commandId"] = START_RECORD_IR_COMMAND_ID_INVALID;
            isValid = false;
        }
        

        return isValid;
    }
};

#endif