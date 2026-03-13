#ifndef SLINK_SCHEDULER_TASKS_H
#define SLINK_SCHEDULER_TASKS_H

#include "./common/scheduler/TaskScheduler.h"
#include "slink/SLink.h"

class SLinkPollTask : public SchedulerEvent
{
public:
    void setSlinkController(SLinkController *ctrl) { slinkController = ctrl; }
    virtual void execute();

private:
    SLinkController *slinkController;
};

#endif
