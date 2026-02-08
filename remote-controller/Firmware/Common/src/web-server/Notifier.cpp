#include "Notifier.h"
#include "common/web-server/ModuleWebServer.h"
#include "common/web-server-command-executor/WebServerCommandExecutor.h"

void Notifier::send(DynamicJsonDocument &notificationData)
{
    notificationData["requestId"] = requestId;
    serializeJson(notificationData, WebServerCommandExecutor::instance().responseBuffer, WEB_SERVER_MESSAGE_MAX_LEN);
    ModuleWebServer::instance().textClient(clientId, WebServerCommandExecutor::instance().responseBuffer);
    notificationData.clear();
}