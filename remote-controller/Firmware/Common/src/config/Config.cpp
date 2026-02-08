#include "Config.h"
#include "../moduleId/ModuleId.h"

Preferences Config::configData;
uint8_t Config::started = 0;

Preferences& Config::data()
{
    if(!started) {
        configData.begin("config");
        started = 1;
    }
    return configData;
}

size_t Config::getString(const char* key, const char *defaultValue, char* output, size_t maxLen)
{
    if (data().isKey(key)) {
        return data().getString(key, output, maxLen);
    } else {
        return strlen(strcpy(output, defaultValue));
    }
}

void Config::setString(const char* key, const char *value)
{
    data().putString(key, value);
}

int8_t Config::getChar(const char* key, int8_t defaultValue)
{
    if (data().isKey(key)) {
        return data().getChar(key, defaultValue);
    } else {
        return defaultValue;
    }
}

void Config::setChar(const char* key, const int8_t value)
{
    data().putChar(key, value);
}

int32_t Config::getLong(const char* key, int32_t defaultValue)
{
    if (data().isKey(key)) {
        return data().getLong(key, defaultValue);
    } else {
        return defaultValue;
    }
}

void Config::setLong(const char* key, const int32_t value)
{
    data().putLong(key, value);
}

bool Config::getBool(const char* key, bool defaultValue)
{
    if (data().isKey(key)) {
        return data().getChar(key, defaultValue) == true;
    } else {
        return defaultValue;
    }
}

void Config::setBool(const char* key, bool value)
{
    data().putChar(key, value == true);
}

size_t Config::getBytes(const char* key, const int32_t size, void* out)
{
    if (data().isKey(key)) {
        return data().getBytes(key, out, size);
    } else {
        return 0;
    }
}

void Config::setBytes(const char* key, const int32_t size, void* value)
{
    data().putBytes(key, value, size);
}

size_t Config::getModuleName(char* output)
{
    getString(CONFIG_KEY_MODULE_NETWORK_NAME, "", output, CONFIG_MAX_LEN_MODULE_NETWORK_NAME);
    if (strlen(output) == 0)
    {
        sprintf(output, "%s%s", CONFIG_DEFAULT_MODULE_NETWORK_NAME, ModuleId::getRandomPart());
    }
    return strlen(output);
}

size_t Config::getModuleLocalUrl(char* output)
{
    char networkName[CONFIG_MAX_LEN_MODULE_NETWORK_NAME + 1];
    getModuleName(networkName);
    sprintf(output, "http://%s.local", networkName);
    return strlen(output);
}

void Config::remove(const char* key)
{
    if (data().isKey(key)) {
        data().remove(key);
    }
}

void Config::factoryReset()
{
    char moduleId[CONFIG_MAX_LEN_MODULE_ID + 1];
    char moduleIdRandomPart[CONFIG_MAX_LEN_MODULE_ID_RANDOM_PART + 1];
    getString(CONFIG_KEY_MODULE_ID, "", moduleId, CONFIG_MAX_LEN_MODULE_ID);
    getString(CONFIG_KEY_MODULE_ID_RANDOM_PART, "", moduleIdRandomPart, CONFIG_MAX_LEN_MODULE_ID_RANDOM_PART);
    data().clear();
    setString(CONFIG_KEY_MODULE_ID, moduleId);
    setString(CONFIG_KEY_MODULE_ID_RANDOM_PART, moduleIdRandomPart);
}

nvs_iterator_t Config::iterateKeys()
{
    return nvs_entry_find("nvs", "config", NVS_TYPE_ANY);
}

void Config::getCurrentKeyName(nvs_iterator_t it, char* output)
{
    nvs_entry_info_t info;
    nvs_entry_info(it, &info);
    strcpy(output, info.key);
}

void Config::iterateNext(nvs_iterator_t &it)
{
    it = nvs_entry_next(it);
}

void Config::releaseIterator(nvs_iterator_t it)
{
    nvs_release_iterator(it);
}