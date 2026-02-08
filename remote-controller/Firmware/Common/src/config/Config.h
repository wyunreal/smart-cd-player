#ifndef COMMON_CONFIG_H
#define COMMON_CONFIG_H

#include <Preferences.h>
#include "nvs.h"
#include "nvs_flash.h"

enum WifiMode
{
    WIFI_MODE_ACCESS_POINT = 0,
    WIFI_MODE_STATION = 1,
};

#define CONFIG_KEY_MODULE_ID "id"
#define CONFIG_MAX_LEN_MODULE_ID 25
#define CONFIG_KEY_MODULE_ID_RANDOM_PART "id-random-part"
#define CONFIG_MAX_LEN_MODULE_ID_RANDOM_PART 6

#define CONFIG_KEY_WIFI_SSID "wifi-ssid"
#define CONFIG_MAX_LEN_WIFI_SSID 50
#define CONFIG_DEFAULT_WIFI_SSID "WHome"

#define CONFIG_KEY_WIFI_PASSWORD "wifi-password"
#define CONFIG_MAX_LEN_WIFI_PASSWORD 150
#define CONFIG_DEFAULT_WIFI_PASSWORD ""

#define CONFIG_KEY_USE_STATIC_IP "use-static-ip"
#define CONFIG_MAX_LEN_STATIC_IP_DATA 15
#define CONFIG_KEY_STATIC_IP "static-ip"
#define CONFIG_KEY_STATIC_GATEWAY "static-gateway"
#define CONFIG_KEY_STATIC_SUBNET "static-subnet"

#define CONFIG_KEY_MODULE_NETWORK_NAME "network-name"
#define CONFIG_MAX_LEN_MODULE_NETWORK_NAME 50
#define CONFIG_DEFAULT_MODULE_NETWORK_NAME "whome"

#define CONFIG_KEY_TIME_CONFIGURED "time-configured"
#define CONFIG_KEY_TIME_SERVER "time-server"
#define CONFIG_MAX_LEN_TIME_SERVER 100
#define CONFIG_DEFAULT_TIME_SERVER "pool.ntp.org"
#define CONFIG_KEY_TIME_ZONE_ID "time-zone-id"
#define CONFIG_KEY_TIME_ZONE_OFFSET_SECONDS "time-zone"
#define CONFIG_KEY_CITY_NAME "city"
#define CONFIG_MAX_LEN_CITY_NAME 100
#define CONFIG_DEFAULT_CITY_NAME ""
#define CONFIG_DEFAULT_TIME_ZONE 0
#define CONFIG_KEY_USE_DAYLIGHT_OFFSET "use-dayl-offset"
#define CONFIG_DEFAULT_USE_DAYLIGHT_OFFSET 1

class Config
{
public:
    static size_t getString(const char *key, const char *defaultValue, char *output, size_t maxLen);
    static void setString(const char *key, const char *value);

    static int8_t getChar(const char *key, int8_t defaultValue);
    static void setChar(const char *key, int8_t value);

    static int32_t getLong(const char *key, int32_t defaultValue);
    static void setLong(const char *key, const int32_t value);

    static bool getBool(const char *key, bool defaultValue);
    static void setBool(const char *key, bool value);

    static size_t getModuleName(char *output);
    static size_t getModuleLocalUrl(char *output);

    static size_t getBytes(const char* key, const int32_t size, void* out);
    static void setBytes(const char* key, const int32_t size, void* value);

    static void remove(const char *key);

    static void factoryReset();

    static nvs_iterator_t iterateKeys();
    static void getCurrentKeyName(nvs_iterator_t it, char* output);
    static void iterateNext(nvs_iterator_t &it);
    static void releaseIterator(nvs_iterator_t it);

private:
    static Preferences &data();
    static Preferences configData;
    static uint8_t started;
};

#endif