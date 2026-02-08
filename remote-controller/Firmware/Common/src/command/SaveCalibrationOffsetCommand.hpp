#ifndef SAVE_CALIBRATION_OFFSET_HPP
#define SAVE_CALIBRATION_OFFSET_HPP

#include <ArduinoJson.h>
#include "common/web-server-command-executor/WebServerCommandExecutor.h"

#ifdef MAX_ENTITIES_COUNT

enum SaveCalibrationOffsetErrors
{
    SAVE_CALIBRATION_OFFSET_TYPE_EMPTY = 1,
    SAVE_CALIBRATION_OFFSET_TYPE_TOO_LARGE = 2,
    SAVE_CALIBRATION_OFFSET_ENTITY_NOT_FOUND = 3,
};

class SaveCalibrationOffsetCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent))
        {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }

        float offsets[MAX_LEN_READINGS];
        for (int i = 0; i < MAX_LEN_READINGS; i++)
        {
            offsets[i] = 0;
        }

        JsonArray offsetsJson = inputData["offsets"].as<JsonArray>();
        int readingIndex;
        for (int i = 0; i < offsetsJson.size(); i++)
        {
            readingIndex = EntityReader::instance().getReadingIndex(inputData["type"], offsetsJson[i]["type"]);
            offsets[readingIndex] = offsetsJson[i]["value"];
        }
        if (Entity::instance().setOffsets(inputData["type"], inputData["channel"], offsets))
        {
            return response(COMMAND_RESPONSE_SUCCESS, responseContent);
        }

        responseContent["errors"]["id"] = SAVE_CALIBRATION_OFFSET_ENTITY_NOT_FOUND;
        return response(COMMAND_RESPONSE_ERROR, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        if (strlen(inputData["type"]) == 0)
        {
            responseContent["errors"]["type"] = SAVE_CALIBRATION_OFFSET_TYPE_EMPTY;
            isValid = false;
        }
        else if (strlen(inputData["type"]) > MAX_LEN_ENTITY_TYPE)
        {
            responseContent["errors"]["type"] = SAVE_CALIBRATION_OFFSET_TYPE_TOO_LARGE;
            isValid = false;
        }

        return isValid;
    }
};

#endif
#endif