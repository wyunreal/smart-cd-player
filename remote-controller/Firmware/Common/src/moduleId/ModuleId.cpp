#include "ModuleId.h"
#include "../config/Config.h"
#include <WiFi.h>

char ModuleId::moduleId[CONFIG_MAX_LEN_MODULE_ID + 1] = "";
char ModuleId::randomPart[CONFIG_MAX_LEN_MODULE_ID_RANDOM_PART + 1] = "";

char* ModuleId::getId()
{
    if (strlen(moduleId) == 0) {
        Config::getString(CONFIG_KEY_MODULE_ID, "", moduleId, CONFIG_MAX_LEN_MODULE_ID);
        if (strlen(moduleId) == 0) {
            sprintf(randomPart, "%d", esp_random() % 10000);
            sprintf(moduleId, "%s:%s", WiFi.macAddress().c_str(), randomPart);
            Config::setString(CONFIG_KEY_MODULE_ID, moduleId);
            Config::setString(CONFIG_KEY_MODULE_ID_RANDOM_PART, randomPart);
        }
    }
    return moduleId;
}

char* ModuleId::getRandomPart()
{
    if (strlen(randomPart) == 0) {
        Config::getString(CONFIG_KEY_MODULE_ID_RANDOM_PART, "", randomPart, CONFIG_MAX_LEN_MODULE_ID_RANDOM_PART);
    }
    return randomPart;
}
