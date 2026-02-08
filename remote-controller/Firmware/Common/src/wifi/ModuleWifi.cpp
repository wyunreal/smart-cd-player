#include "ModuleWifi.h"
#include <WiFi.h>
#include <ESPmDNS.h>
#include <DNSServer.h>
#include "../config/Hardware.h"
#include "../config/Config.h"
#include "../moduleId/ModuleId.h"

ModuleWifi ModuleWifi::moduleWifi;
ButtonHandler ModuleWifi::wifiModeButton;
DNSServer dnsServer;
bool connected = false;

WifiState ModuleWifi::getInitialState()
{
    char ssid[CONFIG_MAX_LEN_WIFI_SSID + 1] = "";
    Config::getString(CONFIG_KEY_WIFI_SSID, "", ssid, CONFIG_MAX_LEN_WIFI_SSID);
    if (strlen(ssid) == 0) {
        return WIFI_STATE_CONFIGURATION_ACCESS_POINT;
    } else {
        return WIFI_STATE_STATION;
    }
}

void ModuleWifi::begin()
{
    state = getInitialState();
    wifiModeButton.begin(WIFI_BUTTON_PIN, WIFI_BUTTON_LONG_PRESS_TRIGGER_MS);
    configureWifi();
}

bool ModuleWifi::isConnected()
{
    return connected;
}

void ModuleWifi::configureWifi() {
    switch (state) {
        case WIFI_STATE_CONFIGURATION_ACCESS_POINT:
            enableConfigurationAccessPoint(CONFIG_DEFAULT_WIFI_SSID, CONFIG_DEFAULT_WIFI_PASSWORD);
            break;
        case WIFI_STATE_STATION:
            connectAsStation();
            break;
    }
}

void ModuleWifi::enableConfigurationAccessPoint(const char *ssid, const char *password)
{
    char ssidToUse[CONFIG_MAX_LEN_WIFI_SSID + 1] = "";
    sprintf(ssidToUse, "%s%s", ssid, ModuleId::getRandomPart());
    char passwordToUse[CONFIG_MAX_LEN_WIFI_PASSWORD + 1] = "";
    strcpy(passwordToUse, password);
    if (DEBUG_ENABLED) {
        Serial.println("Enabling AP ...");
        Serial.print("Using SSID: "); Serial.print(ssidToUse);
        Serial.print(" and password: ");
        strlen(passwordToUse) == 0 ? Serial.println("<empty>") : Serial.println(passwordToUse);
    }

    WiFi.mode(WIFI_AP);
    connected = false;
    int retries = 0;
    bool accessPointEnabled = false;
    do {
        accessPointEnabled = WiFi.softAP(ssidToUse, passwordToUse);
        delay(100);
    } while(!accessPointEnabled && retries++ < 3);

    if (accessPointEnabled) {
        IPAddress ip(192, 168, 1, 1);
        IPAddress gateway(192, 168, 1, 1);
        IPAddress subnet(255, 255, 255, 0);
        if (DEBUG_ENABLED) {
            Serial.println("Access point enabled.");
            Serial.println("Configuring TCP/IP:");
            char ipStr[16];
            sprintf(ipStr, "%d.%d.%d.%d", ip[0], ip[1], ip[2], ip[3]);
		    Serial.print(" - IP: "); Serial.println(ipStr);
            sprintf(ipStr, "%d.%d.%d.%d", gateway[0], gateway[1], gateway[2], gateway[3]);
		    Serial.print(" - Gateway: "); Serial.println(ipStr);
            sprintf(ipStr, "%d.%d.%d.%d", subnet[0], subnet[1], subnet[2], subnet[3]);
		    Serial.print(" - Subnet: "); Serial.println(ipStr);
        }

        WiFi.softAPConfig(ip, gateway, subnet);
        
        if(dnsServer.start(53, "*", WiFi.softAPIP())) {
            if (DEBUG_ENABLED) {
                Serial.println("Captive portal enabled !");
            }
        } else {
            if (DEBUG_ENABLED) {
                Serial.println("Error while enabling captive portal.");
            }
        }

        if (onWifiReadyHandler != NULL) {
            onWifiReadyHandler(WiFi.softAPIP());
        }

        if (DEBUG_ENABLED) {
            Serial.println("Wifi Enabled !");
        }
    }
}

void ModuleWifi::connectAsStation()
{
    char ssid[CONFIG_MAX_LEN_WIFI_SSID + 1] = "";
    Config::getString(CONFIG_KEY_WIFI_SSID, CONFIG_DEFAULT_WIFI_SSID, ssid, CONFIG_MAX_LEN_WIFI_SSID);
    char password[CONFIG_MAX_LEN_WIFI_PASSWORD + 1] = "";
    Config::getString(CONFIG_KEY_WIFI_PASSWORD, CONFIG_DEFAULT_WIFI_PASSWORD, password, CONFIG_MAX_LEN_WIFI_PASSWORD);
    if (DEBUG_ENABLED) {
        Serial.println("Connecting to AP ...");
        Serial.print("Using SSID: "); Serial.println(ssid);
    }

    WiFi.mode(WIFI_STA);
    connected = false;
    WiFi.setAutoReconnect(true);
    if (Config::getBool(CONFIG_KEY_USE_STATIC_IP, false)) {
        char staticIp[CONFIG_MAX_LEN_STATIC_IP_DATA + 1] = "";
        Config::getString(CONFIG_KEY_STATIC_IP, "", staticIp, CONFIG_MAX_LEN_STATIC_IP_DATA);
        char staticGateway[CONFIG_MAX_LEN_STATIC_IP_DATA + 1] = "";
        Config::getString(CONFIG_KEY_STATIC_GATEWAY, "", staticGateway, CONFIG_MAX_LEN_STATIC_IP_DATA);
        char staticSubnet[CONFIG_MAX_LEN_STATIC_IP_DATA + 1] = "";
        Config::getString(CONFIG_KEY_STATIC_SUBNET, "", staticSubnet, CONFIG_MAX_LEN_STATIC_IP_DATA);

        if(strlen(staticIp) > 0 && strlen(staticGateway) > 0 && strlen(staticSubnet) > 0) {
            IPAddress ip;
            ip.fromString(staticIp);
            IPAddress gateway;
            gateway.fromString(staticGateway);
            IPAddress subnet;
            subnet.fromString(staticSubnet);
            if (WiFi.config(ip, gateway, subnet)) {
                if (DEBUG_ENABLED) {
                    Serial.println("Configuring TCP/IP:");
                    Serial.print(" - IP: "); Serial.println(staticIp);
                    Serial.print(" - Gateway: "); Serial.println(staticGateway);
                    Serial.print(" - Subnet: "); Serial.println(staticSubnet);
                }
            } else {
                if (DEBUG_ENABLED) {
                    Serial.println("Failed to configure TCP/IP.");
                }
            }
            dnsServer.stop();
        }
    }

    WiFi.begin(ssid, password);

    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries++ < 100) {
        delay(250);
    }

    if (WiFi.status() == WL_CONNECTED) {
        if (DEBUG_ENABLED) {
            Serial.println("Wifi connected !");
        }
        enableMdns();
        if (onWifiReadyHandler != NULL) {
            onWifiReadyHandler(WiFi.localIP());
        }
        connected = true;
    } else {
        if (DEBUG_ENABLED) {
            Serial.println("Failed to connect to Wifi !");
        }
    }
}

void ModuleWifi::enableMdns()
{
    char moduleName[CONFIG_MAX_LEN_MODULE_NETWORK_NAME + 1] = "";
    Config::getString(CONFIG_KEY_MODULE_NETWORK_NAME, "", moduleName, CONFIG_MAX_LEN_MODULE_NETWORK_NAME);
    if (strlen(moduleName) == 0) {
        sprintf(moduleName, "%s%s", CONFIG_DEFAULT_MODULE_NETWORK_NAME, ModuleId::getRandomPart());
    }
    if (MDNS.begin(moduleName)) {
        if (DEBUG_ENABLED) {
            Serial.print("mDNS started using name: "); Serial.println(moduleName);
        }
    } else {
        if (DEBUG_ENABLED) {
            Serial.print("Error starting mDNS using name: "); Serial.println(moduleName);
        }
    }
}

void ModuleWifi::handleWifiState()
{
    if (state == WIFI_STATE_CONFIGURATION_ACCESS_POINT) {
        dnsServer.processNextRequest();
    } else {
        if (wifiModeButton.getState() == BUTTON_STATE_LONG_PRESSED) {
            if(state != WIFI_STATE_CONFIGURATION_ACCESS_POINT) {
                state = WIFI_STATE_CONFIGURATION_ACCESS_POINT;
                configureWifi();
            }
        }
    }
}