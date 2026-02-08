#include "ModuleController.h"

ModuleController* ModuleController::moduleController = nullptr;

void ModuleController::setInstance(ModuleController* controller)
{
    moduleController = controller;
}

ModuleController& ModuleController::instance()
{
    return *moduleController;
}
