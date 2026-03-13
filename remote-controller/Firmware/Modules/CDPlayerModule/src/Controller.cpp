#include "Controller.h"
#include "SchedulerTasks.h"

Controller Controller::controller;

void Controller::setup(bool initialized)
{
    irRemoteControl.begin();
    irCommandReadLoopTask.setIrRemoteControl(&irRemoteControl);
    TaskScheduler::instance().registerEvent(&irCommandReadTimeoutTask);
    TaskScheduler::instance().registerEvent(&irCommandReadLoopTask);
    disableIrLearnMode(false);

    // S-Link initialization
    slinkController.begin();
    slinkPollTask.setSlinkController(&slinkController);
    TaskScheduler::instance().registerEvent(&slinkPollTask);
    slinkPollTask.enable(true, SLINK_POLL_INTERVAL_MS, false);
}

void Controller::loop(bool initialized)
{
}

void Controller::registerWebHandlers(AsyncWebServer &server)
{
    server.on("/remote", HTTP_GET, [](AsyncWebServerRequest *request) {
        String device = "";
        String command = "";

        if (request->hasParam("device")) {
            device = request->getParam("device")->value();
        }

        if (request->hasParam("command")) {
            command = request->getParam("command")->value();
        }

        if (device.length() > 0 && command.length() > 0) {
            if (Controller::instance().sendIrCommand(device.c_str(), command.c_str())) {
                request->send(200, "application/json", "{\"status\":\"success\"}");
            } else {
                request->send(404, "application/json", "{\"status\":\"failure\", \"message\":\"Bad request: device or command not found.\"}");
            }
        } else {
            request->send(400, "application/json", "{\"status\":\"failure\", \"message\":\"Bad request: missing device or command parameter.\"}");
        }
    });

    server.on("/commands", HTTP_GET, [](AsyncWebServerRequest *request) {
        char responseBuffer[WEB_SERVER_MESSAGE_MAX_LEN + 1];
        DynamicJsonDocument responseContent(1024);
        Controller::instance().getAllRecordedIrCommands(responseContent);
        serializeJson(responseContent, responseBuffer, WEB_SERVER_MESSAGE_MAX_LEN);
        request->send(200, "application/json", responseBuffer);
    });

    server.on("/cdplayer", HTTP_GET, [](AsyncWebServerRequest *request) {
        if (!request->hasParam("command")) {
            request->send(400, "application/json", "{\"status\":\"failure\", \"message\":\"Missing command parameter.\"}");
            return;
        }

        String command = request->getParam("command")->value();

        if (command == "play") {
            Controller::instance().slinkPlay();
        } else if (command == "pause") {
            Controller::instance().slinkPause();
        } else if (command == "stop") {
            Controller::instance().slinkStop();
        } else if (command == "nextTrack") {
            Controller::instance().slinkNextTrack();
        } else if (command == "prevTrack") {
            Controller::instance().slinkPrevTrack();
        } else if (command == "powerOn") {
            Controller::instance().slinkPowerOn();
        } else if (command == "powerOff") {
            Controller::instance().slinkPowerOff();
        } else if (command == "selectDisc" && request->hasParam("disc")) {
            uint16_t disc = request->getParam("disc")->value().toInt();
            Controller::instance().slinkSelectDisc(disc);
        } else if (command == "playDiscTrack" && request->hasParam("disc") && request->hasParam("track")) {
            uint16_t disc = request->getParam("disc")->value().toInt();
            uint8_t track = request->getParam("track")->value().toInt();
            Controller::instance().slinkPlayDiscTrack(disc, track);
        } else if (command == "state") {
            CDPlayerState state = Controller::instance().getSlinkState();
            char responseBuffer[WEB_SERVER_MESSAGE_MAX_LEN + 1];
            DynamicJsonDocument responseContent(512);
            const char *playbackStr;
            switch (state.playbackState) {
                case CD_PLAYING: playbackStr = "playing"; break;
                case CD_PAUSED: playbackStr = "paused"; break;
                case CD_STOPPED: playbackStr = "stopped"; break;
                default: playbackStr = "unknown"; break;
            }
            responseContent["status"] = "success";
            responseContent["playbackState"] = playbackStr;
            responseContent["discNumber"] = state.discNumber;
            responseContent["trackNumber"] = state.trackNumber;
            responseContent["trackMinutes"] = state.trackMinutes;
            responseContent["trackSeconds"] = state.trackSeconds;
            responseContent["powered"] = state.powered;
            serializeJson(responseContent, responseBuffer, WEB_SERVER_MESSAGE_MAX_LEN);
            request->send(200, "application/json", responseBuffer);
            return;
        } else {
            request->send(400, "application/json", "{\"status\":\"failure\", \"message\":\"Unknown command or missing parameters.\"}");
            return;
        }

        request->send(200, "application/json", "{\"status\":\"success\"}");
    });
}

bool Controller::sendIrCommand(const char *deviceName, const char *commandName)
{
    return irRemoteControl.sendCommand(deviceName, commandName);
}

void Controller::enableIrLearnMode(char const *deviceName, byte commandId)
{
    irCommandReadLoopTask.setIrReadParams(deviceName, commandId);
    irCommandReadLoopTask.markReadStartedMillis();

    irCommandReadTimeoutTask.enable(false, IR_LEARN_MODE_TIMEOUT_MS, false);
    irCommandReadLoopTask.enable(true, IR_LEARN_MODE_LOOP_INTERVAL_MS, false);
}

void Controller::disableIrLearnMode(bool notifyTimeout)
{
    irCommandReadTimeoutTask.disable();
    irCommandReadLoopTask.disable();

    if (notifyTimeout)
    {
        irReadTimeoutNotifier.notify();
    }
}

void Controller::getAllRecordedIrCommands(DynamicJsonDocument &responseContent)
{
    JsonArray commands = responseContent.createNestedArray("commands");

    nvs_iterator_t it = Config::iterateKeys();
    while (it)
    {
        char key[16]; // Máximo tamaño de clave permitido por NVS
        Config::getCurrentKeyName(it, key);
        if (key != NULL && key[0] == '_') {
            commands.add(String(key+1));
        }
        Config::iterateNext(it);
    }
    Config::releaseIterator(it);
}

// S-Link wrappers

void Controller::slinkPlay()
{
    slinkController.sendCommand(SLINK_CMD_PLAY);
}

void Controller::slinkPause()
{
    slinkController.sendCommand(SLINK_CMD_PAUSE);
}

void Controller::slinkStop()
{
    slinkController.sendCommand(SLINK_CMD_STOP);
}

void Controller::slinkNextTrack()
{
    slinkController.sendCommand(SLINK_CMD_NEXT_TRACK);
}

void Controller::slinkPrevTrack()
{
    slinkController.sendCommand(SLINK_CMD_PREV_TRACK);
}

void Controller::slinkSelectDisc(uint16_t discNumber)
{
    slinkController.sendCommand(SLINK_CMD_SELECT_DISC, discNumber);
}

void Controller::slinkPlayDiscTrack(uint16_t discNumber, uint8_t trackNumber)
{
    slinkController.sendCommand(SLINK_CMD_PLAY_DISC_TRACK, discNumber, trackNumber);
}

void Controller::slinkPowerOn()
{
    slinkController.sendCommand(SLINK_CMD_POWER_ON);
}

void Controller::slinkPowerOff()
{
    slinkController.sendCommand(SLINK_CMD_POWER_OFF);
}

CDPlayerState Controller::getSlinkState()
{
    return slinkController.getState();
}
