#ifndef BUTTON_HANDLER_H
#define BUTTON_HANDLER_H

#include "Arduino.h"
#include "../scheduler/TaskScheduler.h"

enum ButtonState
{
    BUTTON_STATE_NOT_INITIALIZED,
    BUTTON_STATE_RESETING,
    BUTTON_STATE_IDLE,
    BUTTON_STATE_COUNTING,
    BUTTON_STATE_PRESSED,
    BUTTON_STATE_LONG_PRESSED,
};

class ButtonHandler
{
public:
    ButtonHandler();
    void begin(uint8_t aPin, int longPressTriggerMs);
    ButtonState getState();
    void reset() { state = BUTTON_STATE_RESETING; }

private:
    void runStateMachine();
    uint8_t pin;
    uint8_t pressCounter;
    ButtonState state;
    uint8_t longPressTriggerCount;

    class LongPressCheckerEvent : public SchedulerEvent
    {
    public:
        LongPressCheckerEvent(ButtonHandler *aButtonHandler) : SchedulerEvent() { buttonHandler = aButtonHandler; }
        void execute()
        {
            buttonHandler->runStateMachine();
        }
        ButtonHandler *buttonHandler;
    } longPressEvent;
};

#endif