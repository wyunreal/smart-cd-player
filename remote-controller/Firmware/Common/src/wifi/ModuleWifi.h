#ifndef MODULE_WIFI_H
#define MODULE_WIFI_H

#include "../button/ButtonHandler.h"

enum WifiState {
    WIFI_STATE_CONFIGURATION_ACCESS_POINT = 0,
    WIFI_STATE_STATION = 1
};

class ModuleWifi {
    public:
    static ModuleWifi& instance() { return moduleWifi; }
    void begin();
    void handleWifiState();

    void onWifiReady(void(*handler)(IPAddress)) { onWifiReadyHandler = handler; }

    WifiState getCurrentConnectionState() {return state;}
    bool isConnected();

    private:
    WifiState getInitialState();
    void configureWifi();
    void enableAccessPoint(const char *ssid, const char *password);
    void enableConfigurationAccessPoint(const char *ssid, const char *password);
    void connectAsStation();
    void enableMdns();

    WifiState state;
    void (*onWifiReadyHandler)(IPAddress);

    static ModuleWifi moduleWifi;
    static ButtonHandler wifiModeButton;
};

#endif