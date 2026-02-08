#ifndef START_ENTITY_CALIBRATE_HPP
#define START_ENTITY_CALIBRATE_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/entity/Entity.h"
#include "common/command/EntityMeasurementValidation.h"
#include "common/entity/Reader.h"

#ifdef MAX_ENTITIES_COUNT

enum EntityCalibrationErrors
{
    CALIBRATE_TYPE_EMPTY = 1,
    CALIBRATE_TYPE_TOO_LARGE = 2,
    CALIBRATE_OPERATION_FAILED = 3,
};

class CalibratePointCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }

        unsigned long int nextCalibrationDate = EntityReader::instance().calibrateEntity(inputData["type"], inputData["channel"], inputData["pointId"], inputData["pointValue"]);
        if (nextCalibrationDate > 0) {
            responseContent["nextCalibrationDate"] = ((uint64_t)nextCalibrationDate * 1000);
            return response(COMMAND_RESPONSE_SUCCESS, responseContent);
        }

        responseContent["errors"]["id"] = CALIBRATE_OPERATION_FAILED;
        return response(COMMAND_RESPONSE_ERROR, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        if (strlen(inputData["type"]) == 0)
        {
            responseContent["errors"]["type"] = CALIBRATE_TYPE_EMPTY;
            isValid = false;
        }
        else if (strlen(inputData["type"]) > MAX_LEN_ENTITY_TYPE)
        {
            responseContent["errors"]["type"] = CALIBRATE_TYPE_TOO_LARGE;
            isValid = false;
        }

        return isValid;
    }
};

#endif
#endif