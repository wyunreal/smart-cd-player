#include "Scheduler.h"
#include <Arduino.h>

#define DEFAULT_TIME_UNIT 100
#define DEFAULT_EVENTS_MAX_COUNT 50

SchedulerEvent::SchedulerEvent()
{
  isPeriodic = false;
  timeLapse = 0;
  elapsedTime = 0;
  isEnabled = false;
  immediately = false;
}

void SchedulerEvent::enable(bool isPeriodicEvent, long aTimeLapse, bool fireImmediately)
{
  isPeriodic = isPeriodicEvent;
  timeLapse = aTimeLapse;
  immediately = fireImmediately;
  reset();
  isEnabled = true;
}

void SchedulerEvent::disable()
{
  isEnabled = false;
}

void SchedulerEvent::notifyElapsedTime(long aTimeLapse)
{
  if (isEnabled)
  {
    noInterrupts();
    elapsedTime += aTimeLapse;
    interrupts();
  }
}

bool SchedulerEvent::hasTimedOut()
{
  noInterrupts();
  bool hasTimedOut = isEnabled && ((elapsedTime >= timeLapse) || immediately);
  immediately = false;
  interrupts();
  return hasTimedOut;
}

void SchedulerEvent::reset()
{
  noInterrupts();
  elapsedTime = 0;
  interrupts();
}

Scheduler::Scheduler()
{
  eventsCount = 0;
  timeUnit = DEFAULT_TIME_UNIT;
  eventsMaxCount = DEFAULT_EVENTS_MAX_COUNT;
  events = new SchedulerEvent *[eventsMaxCount];
}

Scheduler::Scheduler(int aTimeUnitInMs, int aEventsMaxCount)
{
  eventsCount = 0;
  timeUnit = aTimeUnitInMs;
  eventsMaxCount = aEventsMaxCount;
  currentMillis = millis();
  events = new SchedulerEvent *[eventsMaxCount];
}

void Scheduler::notifyTick()
{
  SchedulerEvent *event;
  for (int i = 0; i < eventsCount; i++)
  {
    events[i]->notifyElapsedTime(timeUnit);
  }
}

void Scheduler::execute()
{
  if((unsigned long)(millis() - currentMillis) > timeUnit){
    currentMillis = millis();
    notifyTick();
  }

  SchedulerEvent *event;
  for (int i = 0; i < eventsCount; i++)
  {
    event = events[i];
    if (event->isEnabled && event->hasTimedOut())
    {
      event->execute();
      event->reset();
      if (!event->isPeriodicEvent())
      {
        event->disable();
      }
    }
  }
}

void Scheduler::registerEvent(SchedulerEvent *event)
{
  if (eventsCount < eventsMaxCount)
  {
    events[eventsCount++] = event;
  }
}
