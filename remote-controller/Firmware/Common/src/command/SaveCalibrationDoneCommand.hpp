#ifndef SAVE_CALIBRATION_DONE_HPP
#define SAVE_CALIBRATION_DONE_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/entity/Entity.h"
#include "common/time/Time.h"

enum SaveCalibrationDoneErrors
{
    SAVE_CALIBRATION_DONE_DATE_INVALID = 1,
    SAVE_CALIBRATION_DONE_TYPE_EMPTY = 2,
    SAVE_CALIBRATION_DONE_TYPE_TOO_LARGE = 3,
    SAVE_CALIBRATION_DONE_ENTITY_NOT_FOUND = 4,
};

class SaveCalibrationDoneCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }

        CurrentTime time;
        bool currentTimeObtained = Time::instance().getTime(time);

        if (currentTimeObtained && Entity::instance().setCalibrationDate(inputData["type"], inputData["channel"], time.timestamp)) {
            JsonArray references = inputData["references"];
            float referenceValues[MAX_LEN_REFERENCE_VALUES];
            for (int i = 0; i < MAX_LEN_REFERENCE_VALUES; i++) {
                referenceValues[i] = i < references.size() ? references.getElement(i).as<float>() : 0;
            }
            if (Entity::instance().setCalibrationReferenceValues(inputData["type"], inputData["channel"], referenceValues)) {
                return response(COMMAND_RESPONSE_SUCCESS, responseContent);
            }
        }

        responseContent["errors"]["id"] = SAVE_CALIBRATION_DONE_ENTITY_NOT_FOUND;
        return response(COMMAND_RESPONSE_ERROR, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        if (strlen(inputData["type"]) == 0)
        {
            responseContent["errors"]["type"] = SAVE_CALIBRATION_DONE_TYPE_EMPTY;
            isValid = false;
        }
        else if (strlen(inputData["type"]) > MAX_LEN_ENTITY_TYPE)
        {
            responseContent["errors"]["type"] = SAVE_CALIBRATION_DONE_TYPE_TOO_LARGE;
            isValid = false;
        }

        return isValid;
    }
};

#endif