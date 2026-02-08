#ifndef TASK_SCHEDULER_H
#define TASK_SCHEDULER_H

#include <Scheduler.h>

class TaskScheduler
{
    public:
    static Scheduler& instance()
    {
        return scheduler;
    }

    private:
    static Scheduler scheduler;
};

#endif