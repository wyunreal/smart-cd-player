#ifndef STOP_ENTITY_READING_HPP
#define STOP_ENTITY_READING_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/entity/Entity.h"
#include "Controller.h"
#include "./EntityMeasurementValidation.h"

#ifdef MAX_ENTITIES_COUNT

class StopEntityReadingCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }
        EntityReader::instance().stopRealTimeReading();
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        if (strlen(inputData["type"]) == 0)
        {
            responseContent["errors"]["type"] = READING_TYPE_EMPTY;
            isValid = false;
        }
        else if (strlen(inputData["type"]) > MAX_LEN_ENTITY_TYPE)
        {
            responseContent["errors"]["type"] = READING_TYPE_TOO_LARGE;
            isValid = false;
        }

        return isValid;
    }
};

#endif
#endif