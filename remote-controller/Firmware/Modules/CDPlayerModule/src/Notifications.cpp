#include "Notifications.h"
#include "common/entity/Entity.h"
#include "common/moduleId/ModuleId.h"


void ReadIrCommandSuccessNotifier::notify()
{
    DynamicJsonDocument notification(IR_READ_SUCCESS_MESSAGE_LEN + 1);
    notification["type"] = IR_READ_SUCCESS;
    notification["irType"] = typeToString(irSignal->type);
    notification["irValue"] = String(irSignal->value, HEX);
    notification["irBits"] = String(irSignal->bits, DEC);
    send(notification);
}

void ReadIrCommandTimeoutNotifier::notify()
{
    DynamicJsonDocument notification(IR_READ_TIMEOUT_MESSAGE_LEN + 1);
    notification["type"] = IR_READ_TIMEOUT;
    send(notification);
}