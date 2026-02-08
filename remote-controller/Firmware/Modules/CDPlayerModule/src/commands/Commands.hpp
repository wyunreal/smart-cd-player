#ifndef COMMANDS_HPP
#define COMMANDS_HPP

#include "common/command/Command.h"
#include "StartRecordIrCommand.hpp"
#include "StopRecordIrCommand.hpp"
#include "GetAllRecordedIrCommands.hpp"

void declareCommands(std::map<String, Command *> &commands)
{
        commands["startRecordIrCommand"] = new StartRecordIrCommand();
        commands["stopRecordIrCommand"] = new StopRecordIrCommand();
        commands["irCommandsSettings"] = new GetAllRecordedIrCommands();
}

#endif