#ifndef COMMON_STORE_H
#define COMMON_STORE_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include "common/Queue.h"
#include "Config.h"

class ModuleApi;

struct Boolean
{
};

class Store
{
public:
    Store();
    void begin();
    static Store &instance() { return store; }

    void *threadSafeInputMessagesAccess(void *(Store::*callback)(Queue *messages, va_list args), Store *self, int extraArgs, ...);
    void threadSafeInputMessagesAccess(void (Store::*callback)(Queue *messages, va_list args), Store *self, int extraArgs, ...);

    bool queueInputMessageFromUser(uint32_t userId, String &message);
    DynamicJsonDocument *getInputMessageFromUser();
    void notifyMessageFromUserhandled(DynamicJsonDocument *message);

protected:
    Boolean *trueValue = &trueVal;
    Boolean *falseValue = NULL;

private:
    void *addJsonMessageFromUser(Queue *messages, va_list args);
    void *getFirstJsonMessageFromUser(Queue *messages, va_list args);
    void *consumeJsonMessageFromUser(Queue *messages, va_list args);

    Queue protectedMessages;
    Boolean trueVal;

    static Store store;
};

#endif