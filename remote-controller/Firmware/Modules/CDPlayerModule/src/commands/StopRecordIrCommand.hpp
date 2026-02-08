#ifndef STOP_RECORD_IR_COMMAND_H
#define STOP_RECORD_IR_COMMAND_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/command/Command.h"
#include "Controller.h"

class StopRecordIrCommand : public Command {
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        Controller::instance().disableIrLearnMode(false);
        
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif