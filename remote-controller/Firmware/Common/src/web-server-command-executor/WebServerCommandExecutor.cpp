#include "WebServerCommandExecutor.h"
#include <ArduinoJson.h>
#include "../store/Store.h"
#include "commands/Commands.hpp"
#include "common/web-server/ModuleWebServer.h"
#include "common/config/Hardware.h"

#include "common/command/GetWifiSettingsCommand.hpp"
#include "common/command/SetWifiSettingsCommand.hpp"
#include "common/command/GetNetworkNameSettingsCommand.hpp"
#include "common/command/SetNetworkNameSettingsCommand.hpp"
#include "common/command/GetTimeSettingsCommand.hpp"
#include "common/command/SetTimeSettingsCommand.hpp"
#include "common/command/GetCurrentTimeCommand.hpp"
#include "common/command/GetRestartParametersCommand.hpp"
#include "common/command/RestartCommand.hpp"
#include "common/command/GetModuleIdCommand.hpp"
#include "common/command/GetEntityNamesCommand.hpp"
#include "common/command/SetEntityNamesCommand.hpp"
#include "common/command/SetEntityIsEnabledCommand.hpp"
#include "common/command/StartEntityReadingCommand.hpp"
#include "common/command/StopEntityReadingCommand.hpp"
#include "common/command/CalibratePointCommand.hpp"
#include "common/command/GetCalibrationCommand.hpp"
#include "common/command/GetCalibrationOffsetCommand.hpp"
#include "common/command/SaveCalibrationOffsetCommand.hpp"
#include "common/command/SaveCalibrationDoneCommand.hpp"
#include "common/command/GetEntityReadingConfigurationCommand.hpp"
#include "common/command/SetEntityReadingConfigurationCommand.hpp"
#include "common/command/GetEntityReadingsCommand.hpp"
#include "common/command/GetAllCurrentReadingsCommand.hpp"
#include "../Commands.h"

WebServerCommandExecutor WebServerCommandExecutor::executor;

void WebServerCommandExecutor::begin()
{
    declareCommands(Commands::instance().getCommands());
    commandHandlers = &Commands::instance().getCommands();
    (*commandHandlers)[WIFI_SETTINGS_COMMAND] = new GetWifiSettingsCommand();
    (*commandHandlers)[SET_WIFI_SETTINGS_COMMAND] = new SetWifiSettingsCommand();
    (*commandHandlers)[NETWORK_NAME_SETTINGS_COMMAND] = new GetNetworkNameSettingsCommand();
    (*commandHandlers)[SET_NETWORK_NAME_SETTINGS_COMMAND] = new SetNetworkNameSettingsCommand();
    (*commandHandlers)[CURRENT_TIME_COMMAND] = new GetCurrentTimeCommand();
    (*commandHandlers)[TIME_SETTINGS_COMMAND] = new GetTimeSettingsCommand();
    (*commandHandlers)[SET_TIME_SETTINGS_COMMAND] = new SetTimeSettingsCommand();
    (*commandHandlers)[RESTART_PARAMETERS_COMMAND] = new GetRestartParametersCommand();
    (*commandHandlers)[RESTART_COMMAND] = new RestartCommand();
    (*commandHandlers)[ENTITY_NAMES] = new GetEntityNamesCommand();
    (*commandHandlers)[SET_ENTITY_NAMES] = new SetEntityNamesCommand();

#ifdef MAX_ENTITIES_COUNT
    (*commandHandlers)[SET_ENTITY_ENABLED] = new SetEntityIsEnabledCommand();
    (*commandHandlers)[START_ENTITY_READING] = new StartEntityReadingCommand();
    (*commandHandlers)[STOP_ENTITY_READING] = new StopEntityReadingCommand();
    (*commandHandlers)[CALIBRATE_POINT] = new CalibratePointCommand();
    (*commandHandlers)[GET_CALIBRATION] = new GetCalibrationCommand();
    (*commandHandlers)[GET_OFFSET] = new GetCalibrationOffsetCommand();
    (*commandHandlers)[SAVE_OFFSET] = new SaveCalibrationOffsetCommand();
    (*commandHandlers)[SAVE_CALIBRATION_DONE] = new SaveCalibrationDoneCommand();
    (*commandHandlers)[GET_READING_CONFIGURATION] = new GetEntityReadingConfigurationCommand();
    (*commandHandlers)[SET_READING_CONFIGURATION] = new SetEntityReadingConfigurationCommand();
    (*commandHandlers)[GET_READINGS] = new GetEntityReadingsCommand();
    (*commandHandlers)[GET_CURRENT_READINGS] = new GetAllCurrentReadingsCommand();
#endif

    (*commandHandlers)[MODULE_ID] = new GetModuleIdCommand();
}

Command *WebServerCommandExecutor::getCommandHandler(DynamicJsonDocument *messageJson)
{
    const char *handlerId = (*messageJson)[COMMAND_HANDLER_KEY];
    if (commandHandlers->find(handlerId) != commandHandlers->end())
    {
        return (*commandHandlers)[handlerId];
    }
    return NULL;
}

void WebServerCommandExecutor::execute()
{
    DynamicJsonDocument *messageJson = Store::instance().getInputMessageFromUser();

    if (messageJson)
    {
        if (messageJson->containsKey(COMMAND_CLIENT_ID_KEY) && messageJson->containsKey(COMMAND_REQUEST_ID_KEY) && messageJson->containsKey(COMMAND_HANDLER_KEY))
        {
            uint32_t userId = (*messageJson)[COMMAND_CLIENT_ID_KEY];
            uint32_t requestId = (*messageJson)[COMMAND_REQUEST_ID_KEY];
            Command *command = getCommandHandler(messageJson);
            if (command)
            {
                command->setClientId(userId);
                command->setRequestId(requestId);
                DynamicJsonDocument *response = new DynamicJsonDocument(WEB_SERVER_MESSAGE_MAX_LEN + 1);
                command->execute(*messageJson, *response);
                serializeJson(*response, responseBuffer, WEB_SERVER_MESSAGE_MAX_LEN);
                ModuleWebServer::instance().textClient(command->getClientId(), responseBuffer);
                response->clear();
                command->afterExecution();
                delete response;
            }
        }
        Store::instance().notifyMessageFromUserhandled(messageJson);
    }
}