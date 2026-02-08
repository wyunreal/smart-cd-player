#ifndef CAPTIVE_PORTAL_HANDLER_H
#define CAPTIVE_PORTAL_HANDLER_H

#include <ESPAsyncWebServer.h>

class CaptiveRequestHandler : public AsyncWebHandler {
public:
  CaptiveRequestHandler();
  virtual ~CaptiveRequestHandler();

  bool canHandle(AsyncWebServerRequest *request);

  void handleRequest(AsyncWebServerRequest *request);
};

#endif