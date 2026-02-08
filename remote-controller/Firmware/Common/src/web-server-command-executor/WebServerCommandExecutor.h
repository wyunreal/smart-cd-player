#ifndef WEB_SERVER_COMMAND_EXECUTOR_H
#define WEB_SERVER_COMMAND_EXECUTOR_H

#include "common/command/Command.h"

class WebServerCommandExecutor {
    friend class Notifier;

    public:
    static WebServerCommandExecutor& instance() { return executor; }
    void begin();
    void execute();

    private:
    Command* getCommandHandler(DynamicJsonDocument* messageJson);

    char responseBuffer[WEB_SERVER_MESSAGE_MAX_LEN + 1];
    std::map<String, Command*>* commandHandlers;

    static WebServerCommandExecutor executor;
};

#endif