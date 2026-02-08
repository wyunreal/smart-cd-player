#include "moduleId/ModuleId.h"
#include "config/Hardware.h"
#include "wifi/ModuleWifi.h"
#include "scheduler/TaskScheduler.h"
#include "web-server/ModuleWebServer.h"
#include "time/Time.h"
#include "web-server-command-executor/WebServerCommandExecutor.h"
#include "store/Store.h"
#include "common/entity/Entity.h"
#include "common/module-controller/ModuleController.h"
#include "Controller.h"
#include "Config.h"
#include "updateInProgress.h"

bool initialized = false;

#ifdef ENTITY_DATA_PARTITIONS
EntityDataPartition partitions[] = ENTITY_DATA_PARTITIONS;
#else
EntityDataPartition partitions[] = {};
#endif

void webSocketMessageHandler(AsyncWebSocketClient *client, String &message)
{
	Store::instance().queueInputMessageFromUser(client->id(), message);
}

void onWifiConnected(IPAddress ip)
{
	if (DEBUG_ENABLED)
	{
		char ipStr[16];
		sprintf(ipStr, "%d.%d.%d.%d", ip[0], ip[1], ip[2], ip[3]);
		Serial.print("Local ip: ");
		Serial.println(ipStr);
	}

	Time::instance().begin();
	ModuleWebServer::instance().begin(&webSocketMessageHandler, [](AsyncWebServer& server) {
		// Register module-specific web handlers before server starts
		ModuleController::instance().registerWebHandlers(server);
	});
	
	initialized = true;
}

void setup(void)
{
	if (DEBUG_ENABLED)
	{
		Serial.begin(DEBUG_SERIAL_BAUDS);
		Serial.print("WReef module starting, module id: ");
		Serial.println(ModuleId::getId());
	}

	Store::instance().begin();
	WebServerCommandExecutor::instance().begin();

	// Initialize the module's controller and register it
	ModuleController::setInstance(&Controller::instance());

	ModuleWifi::instance().onWifiReady(&onWifiConnected);
	ModuleWifi::instance().begin();

	ModuleController::instance().setup(initialized);

	Entity::instance().begin(partitions);

#ifdef MAX_ENTITIES_COUNT
	EntityReader::instance().loadReadingConfiguration();
#endif
}

void loop(void)
{
	if (!isUpdateInProgress()) {
		TaskScheduler::instance().execute();
		WebServerCommandExecutor::instance().execute();
		ModuleWifi::instance().handleWifiState();
		ModuleController::instance().loop(initialized && ModuleWifi::instance().isConnected());
#ifdef MAX_ENTITIES_COUNT
		EntityReader::instance().executeReadingIteration();
#endif
	}
}
