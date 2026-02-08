#ifndef MODULE_WEB_SERVER_H
#define MODULE_WEB_SERVER_H

#include <ESPAsyncWebServer.h>
#include "CleanupClientsTask.h"

typedef void (*WebSocketMessageHandler)(AsyncWebSocketClient * client, String& message);
typedef void (*RegisterHandlersCallback)(AsyncWebServer& server);

class ModuleWebServer {
    public:
    static ModuleWebServer& instance() {return moduleWebServer; }
    void begin(WebSocketMessageHandler webSocketMessageHandler, RegisterHandlersCallback registerHandlers = nullptr);
    void cleanupClients();
    bool textClient(uint32_t clientId, const char* text);

    private:
    ModuleWebServer();
    static void handleWebSocketMessage(AsyncWebSocket * server, AsyncWebSocketClient * client, AwsEventType type, void * arg, uint8_t *data, size_t len);

    AsyncWebServer server;
    AsyncWebSocket webSocket;
    WebSocketMessageHandler wsMessageHandler;

    String messageBuffer;

    CleanupClientsTask cleanupClientsTask;

    static ModuleWebServer moduleWebServer;
};

#endif