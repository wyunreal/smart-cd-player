#ifndef NOTIFIER_H
#define NOTIFIER_H

#include <ArduinoJson.h>

class Notifier {
public:
    void setRequestData(uint32_t aClientId, uint32_t aRequestId) { clientId = aClientId; requestId = aRequestId; }
    void setForAllClients() { clientId = 0; requestId = 0; }
    virtual void notify() = 0;

protected:
    void send(DynamicJsonDocument &notificationData);

private:
    uint32_t clientId;
    uint32_t requestId;
};

#endif