#ifndef SET_ENTITY_READING_CONFIGURATION_COMMAND_HPP
#define SET_ENTITY_READING_CONFIGURATION_COMMAND_HPP

#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/entity/Entity.h"

#ifdef MAX_ENTITIES_COUNT

enum SetEntityReadingConfigurationErrors
{
    SET_ENTITY_READING_CONFIGURATION_TYPE_EMPTY = 1,
    SET_ENTITY_READING_CONFIGURATION_TYPE_TOO_LARGE = 2,
    SET_ENTITY_READING_CONFIGURATION_READING_TIMESPAN_INVALID = 3,
    SET_ENTITY_READING_CONFIGURATION_READING_PLOTS_PER_DAY_INVALID = 4,
    SET_ENTITY_READING_CONFIGURATION_FIRST_READING_TIME_INVALID = 5,
    SET_ENTITY_READING_CONFIGURATION_RANGE_EMPTY = 6,
    SET_ENTITY_READING_CONFIGURATION_ENTITY_NOT_FOUND = 7,
};

class SetEntityReadingConfigurationCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        if (!validateData(inputData, responseContent)) {
            return response(COMMAND_RESPONSE_ERROR, responseContent);
        }
        if (Entity::instance().setReadingConfiguration(inputData["type"], inputData["channel"], ((unsigned long)inputData["readingTimespan"]) / 1000, inputData["readingPlotsPerDay"], ((unsigned long)inputData["firstReadingTime"]) / 1000)) {
            int count = inputData["ranges"].as<JsonArray>().size();
            Range ranges[count];
            for (int i = 0; i < count; i++) {
                ranges[i].min = inputData["ranges"][i]["min"];
                ranges[i].max = inputData["ranges"][i]["max"];
            }
            if (Entity::instance().setSafetyRanges(inputData["type"], inputData["channel"], ranges, count)) {
                EntityReader::instance().loadReadingConfiguration();
                return response(COMMAND_RESPONSE_SUCCESS, responseContent);
            }
        }

        responseContent["errors"]["id"] = SET_ENTITY_READING_CONFIGURATION_ENTITY_NOT_FOUND;
        return response(COMMAND_RESPONSE_ERROR, responseContent);
    }

private:
    bool validateData(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        bool isValid = true;
        if (strlen(inputData["type"]) == 0)
        {
            responseContent["errors"]["type"] = SET_ENTITY_READING_CONFIGURATION_TYPE_EMPTY;
            isValid = false;
        }
        else if (strlen(inputData["type"]) > MAX_LEN_ENTITY_TYPE)
        {
            responseContent["errors"]["type"] = SET_ENTITY_READING_CONFIGURATION_TYPE_TOO_LARGE;
            isValid = false;
        }
        else if (inputData["readingTimespan"] <= 0)
        {
            responseContent["errors"]["readingTimespan"] = SET_ENTITY_READING_CONFIGURATION_READING_TIMESPAN_INVALID;
            isValid = false;
        }
        else if (inputData["readingPlotsPerDay"] <= 0)
        {
            responseContent["errors"]["readingPlotsPerDay"] = SET_ENTITY_READING_CONFIGURATION_READING_PLOTS_PER_DAY_INVALID;
            isValid = false;
        }
        else if (inputData["firstReadingTime"] < 0)
        {
            responseContent["errors"]["firstReadingTime"] = SET_ENTITY_READING_CONFIGURATION_FIRST_READING_TIME_INVALID;
            isValid = false;
        }
        else if (inputData["ranges"].as<JsonArray>().size() == 0)
        {
            responseContent["errors"]["range"] = SET_ENTITY_READING_CONFIGURATION_RANGE_EMPTY;
            isValid = false;
        }

        return isValid;
    }
};

#endif
#endif