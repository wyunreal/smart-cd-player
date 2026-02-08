#include "ModuleWebServer.h"
#include "../config/Hardware.h"
#include "Config.h"
#include "CaptivePortalHandler.h"
#include "common/time-zones/timeZones.h"
#include <Update.h>
#include "../updateInProgress.h"
#include <SPIFFS.h>

ModuleWebServer ModuleWebServer::moduleWebServer;

ModuleWebServer::ModuleWebServer(): server(WEB_SERVER_PORT), webSocket(WEB_SOCKET_PATH) {}

void ModuleWebServer::begin(WebSocketMessageHandler webSocketMessageHandler, RegisterHandlersCallback registerHandlers)
{
	messageBuffer.reserve(WEB_SERVER_MESSAGE_MAX_LEN + 1);
	messageBuffer = "";
	wsMessageHandler = webSocketMessageHandler;

	SPIFFS.begin();

	server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
		AsyncWebServerResponse *response = request->beginResponse(SPIFFS, "/index.html", "text/html");
		response->addHeader("Cache-Control", "no-store");
		request->send(response);
  	});

	server.on("/update", HTTP_POST, [](AsyncWebServerRequest *request) {
		if (Update.hasError()) {
			request->send(500);
		} else {
			request->send(200);
		}
		// restart systems that were stopped
		setUpdateInProgress(false);
	},
	[](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final) {
		if (!index) {
			bool valid = false;
			if (request->hasParam("type", true)) {
				const char* type = request->getParam("type", true)->value().c_str();
				if (strcmp(type, "firmware") == 0 || strcmp(type, "data") == 0) {
					valid = true;
					// stop systems that can influence update
					setUpdateInProgress(true);
					if (!Update.begin(UPDATE_SIZE_UNKNOWN, strcmp(type, "firmware") == 0 ? U_FLASH : U_SPIFFS)) {
						setUpdateInProgress(false);
					}
				}
			}
			if (!valid) {
				request->send(400, "text/plain", "FAIL");
				request->client()->close();
				return;
			}
		}

		if (len) {
			Update.write(data, len);
		}

		if (final) {
			Update.end(true);
		}
	});

	server.serveStatic("/", SPIFFS, "/").setCacheControl("max-age=31536000, immutable");

	server.on(TIME_ZONES_FILE_PATH, HTTP_GET, [](AsyncWebServerRequest *request){
		AsyncWebServerResponse *response = request->beginResponse_P(200, "application/javascript", timezonesFile);
		response->addHeader("Cache-Control", "max-age=31536000, immutable");
		request->send(response);
  	});

	server.onNotFound([](AsyncWebServerRequest *request) {
		request->send(SPIFFS, "/index.html", "text/html");
	});

	webSocket.onEvent(handleWebSocketMessage);
	server.addHandler(&webSocket);

	TaskScheduler::instance().registerEvent(&cleanupClientsTask);
	cleanupClientsTask.enable(true, WEB_SOCKET_CLEANUP_CLIENTS_TASK_INTERVAL);

	server.addHandler(new CaptiveRequestHandler()).setFilter(ON_AP_FILTER);

	// Register module-specific handlers before starting the server
	if (registerHandlers) {
		registerHandlers(server);
	}

	server.begin();

	if (DEBUG_ENABLED){
		Serial.println("HTTP server started !");
	}
}

void ModuleWebServer::cleanupClients()
{
	webSocket.cleanupClients(WEB_SERVER_CONCURRENT_CLIENTS_COUNT);
}

bool ModuleWebServer::textClient(uint32_t clientId, const char* text)
{
	if (clientId == 0 && webSocket.enabled() && webSocket.availableForWriteAll()) {
		webSocket.textAll(text);
		return true;
	} else if (webSocket.enabled() && webSocket.availableForWrite(clientId)) {
		webSocket.text(clientId, text);
		return true;
	}
	return false;
}

void ModuleWebServer::handleWebSocketMessage(AsyncWebSocket * server, AsyncWebSocketClient * client, AwsEventType type, void * arg, uint8_t *data, size_t len){ 
	if(type == WS_EVT_DATA) {
		AwsFrameInfo * info = (AwsFrameInfo*)arg;
		if(info->final && info->index == 0 && info->len == len){ //the whole message is in a single frame and we got all of it's data
			moduleWebServer.messageBuffer = "";
			if(info->opcode == WS_TEXT){
				for(size_t i=0; i < info->len; i++) {
					moduleWebServer.messageBuffer += (char) data[i];
				}
			}
			if (moduleWebServer.wsMessageHandler) {
				moduleWebServer.wsMessageHandler(client, moduleWebServer.messageBuffer);
			}
		} else { //message is comprised of multiple frames or the frame is split into multiple packets
			if (info->index == 0 && info->num == 0) {
				moduleWebServer.messageBuffer = "";
			}
			if(info->opcode == WS_TEXT){
				for(size_t i=0; i < len; i++) {
					moduleWebServer.messageBuffer += (char) data[i];
				}
			}
			if ((info->index + len) == info->len && info->final) {
				if (moduleWebServer.wsMessageHandler) {
					moduleWebServer.wsMessageHandler(client, moduleWebServer.messageBuffer);
				}
			}
		}
	}
}
