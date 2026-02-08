# Scheduler Library

Wiljan Arias Milian

This library uses the TimerOne library to create a synchronous events scheduler.

## Ussage

First, include the library header **Scheduler.h**

Then you should create a class, publicly extending SchedulerEvent and providing, at least, the **execute** method.

Also, you can provide implementations for following methods:

- notifyElapsedTime(long aTimeLapse): for overriding the way the event should be notified with the elapsed time since last execution.
- hasTimedOut(): for defining how the event should check if it should be executed in current main loop iteration.

Event class should be instantiated. The constructor accepts no parameters:

```c++
YourEventClass event;
```
or
```c++
ScheduleEvent *event = new YourEventClass();
```

Ok, so we have created the event instance, now we should instantiate the scheduler, using one of the following constructors:

```c++
Scheduler();
Scheduler(int aTimeUnitInMs, int aEventsMaxCount);
```
The first one creates a scheduler that runs each 100 ms and has a capacity to handle 50 events at most. The second one allows to override these default parameters with provided values.

Now, in the sketch's setup function, you should run following methods to enable both the event and the scheduler:

```c++
event.enable(true, 100); // Enable the event, specifying: true if the event should run periodically, false if it should run just once and, an amount of time in milliseconds to specify event execution period.

scheduler.registerEvent(&event); // Register the event within the scheduler

scheduler.begin(); // Start the scheduler
```

Last, in the main loop, the scheduler should be executed:

```c++
scheduler.execute();
```

See the following complete example:

```c++
#include <Arduino.h>
#include <Scheduler.h>

// First create an event class, defining at least its execute method.
class SampleEvent : public SchedulerEvent
{
public:
    virtual void execute()
    {
        Serial.println("Event executed");
    }
};

// Create event and scheduler instances.
SampleEvent event;
Scheduler scheduler;

void setup()
{
    Serial.begin(115200);

    // Event should be enabled, passing a boolean to specify if the
    // event is periodic or not, and an integer with the amount in MS
    // for the time the event should wait before being executed.
    event.enable(true, 100);

    // Event should be registered with the scheduler.
    scheduler.registerEvent(&event);

    // Scheduler should be started.
    scheduler.begin();
}

void loop()
{
    // Once in the main loop, the scheduler should be executed
    // This is what makes this library able running timed based events
    // synchronously within the main loop.
    scheduler.execute();
}
```

## TimerOne

https://playground.arduino.cc/Code/Timer1/

https://github.com/PaulStoffregen/TimerOne

## License

MIT
