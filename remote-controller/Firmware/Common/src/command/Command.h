#ifndef COMMON_COMMAND_H
#define COMMON_COMMAND_H

#include <ArduinoJson.h>
#include <map>
#include "Config.h"

enum CommandResponseCode
{
    COMMAND_RESPONSE_ERROR = 0,
    COMMAND_RESPONSE_SUCCESS = 1,
};

class Command
{
public:
    uint32_t getClientId() { return clientId; }
    void setClientId(uint32_t aClientId) { clientId = aClientId; }
    uint32_t getRequestId() { return requestId; }
    void setRequestId(uint32_t aRequestId) { requestId = aRequestId; }
    virtual DynamicJsonDocument *execute(DynamicJsonDocument &inputData, DynamicJsonDocument &response) = 0;
    virtual void afterExecution() {}

protected:
    DynamicJsonDocument *response(CommandResponseCode responseCode, DynamicJsonDocument &response);

private:
    uint32_t clientId;
    uint32_t requestId;
};

class Commands
{
public:
    static Commands &instance() { return commands; }
    std::map<String, Command *> &getCommands();

private:
    static Commands commands;
    std::map<String, Command *> commandHandlers;
};

#endif