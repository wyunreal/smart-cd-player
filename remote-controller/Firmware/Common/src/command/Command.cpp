#include "Command.h"
#include "common/config/Hardware.h"

Commands Commands::commands;

DynamicJsonDocument * Command::response(CommandResponseCode responseCode, DynamicJsonDocument& response)
{
    response[COMMAND_RESPONSE_CODE_KEY] = responseCode;
    response[COMMAND_REQUEST_ID_KEY] = requestId;
    return &response;
}

std::map<String, Command*>& Commands::getCommands()
{
    return commandHandlers;
}