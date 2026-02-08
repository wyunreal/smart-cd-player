#ifndef MODULE_CONTROLLER_H
#define MODULE_CONTROLLER_H

#include <ESPAsyncWebServer.h>

class ModuleController
{
public:
    static void setInstance(ModuleController* controller);
    static ModuleController& instance();

    virtual void setup(bool initialized) = 0;
    virtual void loop(bool initialized) = 0;
    virtual void registerWebHandlers(AsyncWebServer &server) {};

protected:
    ModuleController() {}
    virtual ~ModuleController() {}

private:
    static ModuleController* moduleController;
};

#endif
