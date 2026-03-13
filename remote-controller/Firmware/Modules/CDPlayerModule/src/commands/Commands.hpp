#ifndef COMMANDS_HPP
#define COMMANDS_HPP

#include "common/command/Command.h"
#include "StartRecordIrCommand.hpp"
#include "StopRecordIrCommand.hpp"
#include "GetAllRecordedIrCommands.hpp"
#include "SLinkPlayCommand.hpp"
#include "SLinkPauseCommand.hpp"
#include "SLinkStopCommand.hpp"
#include "SLinkNextTrackCommand.hpp"
#include "SLinkPrevTrackCommand.hpp"
#include "SLinkSelectDiscCommand.hpp"
#include "SLinkPlayDiscTrackCommand.hpp"
#include "SLinkPowerOnCommand.hpp"
#include "SLinkPowerOffCommand.hpp"
#include "SLinkGetStateCommand.hpp"

void declareCommands(std::map<String, Command *> &commands)
{
        commands["startRecordIrCommand"] = new StartRecordIrCommand();
        commands["stopRecordIrCommand"] = new StopRecordIrCommand();
        commands["irCommandsSettings"] = new GetAllRecordedIrCommands();

        commands["slinkPlay"] = new SLinkPlayCommand();
        commands["slinkPause"] = new SLinkPauseCommand();
        commands["slinkStop"] = new SLinkStopCommand();
        commands["slinkNextTrack"] = new SLinkNextTrackCommand();
        commands["slinkPrevTrack"] = new SLinkPrevTrackCommand();
        commands["slinkSelectDisc"] = new SLinkSelectDiscCommand();
        commands["slinkPlayDiscTrack"] = new SLinkPlayDiscTrackCommand();
        commands["slinkPowerOn"] = new SLinkPowerOnCommand();
        commands["slinkPowerOff"] = new SLinkPowerOffCommand();
        commands["slinkGetState"] = new SLinkGetStateCommand();
}

#endif
