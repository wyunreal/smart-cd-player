#include "CaptivePortalHandler.h"
#include <SPIFFS.h>
#include "common/config/Hardware.h"

CaptiveRequestHandler::CaptiveRequestHandler() {}
CaptiveRequestHandler::~CaptiveRequestHandler() {}

bool CaptiveRequestHandler::canHandle(AsyncWebServerRequest *request){
    return true;
}

void CaptiveRequestHandler::handleRequest(AsyncWebServerRequest *request) {
    if (DEBUG_ENABLED) {
        Serial.println(request->host());
        Serial.println(request->url());
    }
    request->send(SPIFFS, "/captive.html");
}
