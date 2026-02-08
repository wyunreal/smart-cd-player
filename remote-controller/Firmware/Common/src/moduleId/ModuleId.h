#ifndef MODULE_ID_H
#define MODULE_ID_H

#include <Arduino.h>
#include <WiFi.h>
#include "../config/Config.h"

class ModuleId {
    public:
    static char* getId();
    static char* getRandomPart();


    private:
    static char moduleId[CONFIG_MAX_LEN_MODULE_ID + 1];
    static char randomPart[CONFIG_MAX_LEN_MODULE_ID_RANDOM_PART + 1];
};

#endif