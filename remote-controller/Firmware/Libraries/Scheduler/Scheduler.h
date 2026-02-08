#ifndef SCHEDULER_H
#define SCHEDULER_H

class SchedulerEvent
{
  friend class Scheduler;

public:
  SchedulerEvent();
  void enable(bool isPeriodicEvent, long aTimeLapse, bool fireImmediately = false);
  void disable();
  virtual void notifyElapsedTime(long aTimeLapse);
  virtual bool hasTimedOut();
  void reset();
  virtual void execute() = 0;
  bool isPeriodicEvent() { return isPeriodic; }

protected:
  bool isPeriodic;
  long timeLapse;
  long elapsedTime;
  bool isEnabled;
  bool immediately;
};

class Scheduler
{
public:
  Scheduler();
  Scheduler(int aTimeUnitInMs, int aEventsMaxCount);
  void execute();
  void registerEvent(SchedulerEvent *event);

private:
  void notifyTick();

  int eventsMaxCount;
  int timeUnit;
  SchedulerEvent **events;
  int eventsCount;
  unsigned long currentMillis;
};

extern Scheduler scheduler;

#endif
