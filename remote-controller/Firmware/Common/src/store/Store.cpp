#include "Store.h"
#include <mutex>
#include <ArduinoJson.h>
#include "common/config/Hardware.h"

Store Store::store;

std::mutex dataMutex;
std::mutex messagesMutex;

Store::Store() : protectedMessages(WEB_SERVER_CONCURRENT_CLIENTS_COUNT)
{
}

void *Store::threadSafeInputMessagesAccess(void *(Store::*callback)(Queue *messages, va_list args), Store *self, int extraArgs, ...)
{
    std::lock_guard<std::mutex> lck(messagesMutex);

    va_list args;
    va_start(args, extraArgs);
    void *result = (self->*callback)(&protectedMessages, args);
    va_end(args);
    return result;
}

void Store::threadSafeInputMessagesAccess(void (Store::*callback)(Queue *messages, va_list args), Store *self, int extraArgs, ...)
{
    std::lock_guard<std::mutex> lck(messagesMutex);

    va_list args;
    va_start(args, extraArgs);
    (self->*callback)(&protectedMessages, args);
    va_end(args);
}

void Store::begin()
{
}

void *Store::addJsonMessageFromUser(Queue *messages, va_list args)
{
    if (messages->addLast(va_arg(args, DynamicJsonDocument *)))
    {
        return trueValue;
    }
    return NULL;
}

void *Store::consumeJsonMessageFromUser(Queue *messages, va_list args)
{
    if (messages->consumeFirst())
    {
        return trueValue;
    }
    return NULL;
}

void *Store::getFirstJsonMessageFromUser(Queue *messages, va_list args)
{
    return messages->first();
}

bool Store::queueInputMessageFromUser(uint32_t clientId, String &message)
{
    DynamicJsonDocument *messageJson = new DynamicJsonDocument(WEB_SERVER_MESSAGE_MAX_LEN + 1);
    DeserializationError error = deserializeJson(*messageJson, message);
    if (!error.code())
    {
        (*messageJson)[COMMAND_CLIENT_ID_KEY] = clientId;
        return (bool)threadSafeInputMessagesAccess(&Store::addJsonMessageFromUser, (Store *)this, 1, messageJson);
    }
    return false;
}

DynamicJsonDocument *Store::getInputMessageFromUser()
{
    return (DynamicJsonDocument *)threadSafeInputMessagesAccess(&Store::getFirstJsonMessageFromUser, (Store *)this, 0);
}

void Store::notifyMessageFromUserhandled(DynamicJsonDocument *message)
{
    if (threadSafeInputMessagesAccess(&Store::consumeJsonMessageFromUser, (Store *)this, 0))
    {
        message->clear();
        delete message;
    }
}