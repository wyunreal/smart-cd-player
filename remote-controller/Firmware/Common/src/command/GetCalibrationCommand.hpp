#ifndef GET_CALIBRATION_COMMAND_HPP
#define GET_CALIBRATION_COMMAND_HPP

#include "common/web-server-command-executor/WebServerCommandExecutor.h"
#include "common/entity/Entity.h"

class GetCalibrationCommand : public Command
{
public:
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &responseContent)
    {
        char id[MAX_LEN_ENTITY_ID + 1];
        getEntityId(inputData["type"], inputData["channel"], id);

        EntityData* entityData = Entity::instance().getDataById(id);

        if (entityData) {
            for(int i = 0; i < MAX_LEN_REFERENCE_VALUES; i++) {
                responseContent["references"][i] = entityData->calibrationReferenceValues[i];
            }

            return response(COMMAND_RESPONSE_SUCCESS, responseContent);
        }

        for(int i = 0; i < MAX_LEN_REFERENCE_VALUES; i++) {
            responseContent["references"][i] = 0;
        }
        
        return response(COMMAND_RESPONSE_SUCCESS, responseContent);
    }
};

#endif