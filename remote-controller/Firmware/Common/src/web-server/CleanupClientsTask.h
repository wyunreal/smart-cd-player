#ifndef CLEANUP_CLIENTS_TASK_H
#define CLEANUP_CLIENTS_TASK_H

#include "../scheduler/TaskScheduler.h"

class CleanupClientsTask: public SchedulerEvent {
    public:
    virtual void execute();
};

#endif