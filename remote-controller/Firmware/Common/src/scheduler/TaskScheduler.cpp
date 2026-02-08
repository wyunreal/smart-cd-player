#include "TaskScheduler.h"
#include "../config/Hardware.h"

Scheduler TaskScheduler::scheduler(SCHEDULER_RESOLUTION_MS, SCHEDULER_MAX_EVENTS);
