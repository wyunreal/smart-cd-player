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
