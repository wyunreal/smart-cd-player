#include "CleanupClientsTask.h"
#include "ModuleWebServer.h"

void CleanupClientsTask::execute()
{
    ModuleWebServer::instance().cleanupClients();
}