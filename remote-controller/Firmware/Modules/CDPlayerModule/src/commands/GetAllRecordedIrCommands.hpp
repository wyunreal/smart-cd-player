#ifndef GET_ALL_RECORDED_ID_COMMANDS_H
#define GET_ALL_RECORDED_ID_COMMANDS_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

class GetAllRecordedIrCommands : public Command {
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        Controller::instance().getAllRecordedIrCommands(responseContent);
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif