#ifndef START_ENTITY_READING_HPP
#define START_ENTITY_READING_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/entity/Entity.h"
#include "common/entity/Reader.h"
#include "Controller.h"
#include "./EntityMeasurementValidation.h"

#ifdef MAX_ENTITIES_COUNT

class StartEntityReadingCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }

        if (isAtlasStampType(inputData["type"]) || isTemperatureType(inputData["type"]))
        {
            int c = inputData["channel"];
            const char* t = inputData["type"];
            EntityReader::instance().startRealTimeReading(inputData["type"], inputData["channel"], getClientId(), getRequestId(), inputData["timespan"], inputData["rawReading"]);
            return response(COMMAND_RESPONSE_SUCCESS, responseContent);
        }

        responseContent["errors"]["type"] = READING_ENTITY_NOT_FOUND;
        return response(COMMAND_RESPONSE_ERROR, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        if (strlen(inputData["type"]) == 0) {
            responseContent["errors"]["type"] = READING_TYPE_EMPTY;
            isValid = false;
        } else if (strlen(inputData["type"]) > MAX_LEN_ENTITY_TYPE) {
            responseContent["errors"]["type"] = READING_TYPE_TOO_LARGE;
            isValid = false;
        } else if (inputData["timespan"] <= 0) {
            responseContent["errors"]["timespan"] = READING_TIMESPAN_NON_POSITIVE;
            isValid = false;
        } else if (inputData["rawReading"].isNull()) {
            responseContent["errors"]["rawReading"] = READING_RAW_NOT_SET;
            isValid = false;
        }

        return isValid;
    }
};

#endif
#endif