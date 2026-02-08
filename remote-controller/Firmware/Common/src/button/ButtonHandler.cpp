#include "ButtonHandler.h"

#define LONG_PRESS_COUNTING_TASK_PERIOD 50
#define DEBOUNCE_PERIOD 50

ButtonHandler::ButtonHandler(): longPressEvent(this)
{
    state = BUTTON_STATE_NOT_INITIALIZED;
}

void ButtonHandler::begin(uint8_t aPin, int longPressTriggerMs)
{
    pin = aPin;
    pinMode(pin, INPUT_PULLUP);

    longPressTriggerCount = longPressTriggerMs / LONG_PRESS_COUNTING_TASK_PERIOD;
    longPressTriggerCount = longPressTriggerCount > 0 ? longPressTriggerCount : 1;
    longPressTriggerCount = longPressTriggerCount < 250 ? longPressTriggerCount : 200;
    pressCounter = 0;

    TaskScheduler::instance().registerEvent(&longPressEvent);
    longPressEvent.enable(true, LONG_PRESS_COUNTING_TASK_PERIOD);
    
    state = BUTTON_STATE_RESETING;
}

void ButtonHandler::runStateMachine()
{
    bool isPressed = !digitalRead(pin);
    switch (state) {
        case BUTTON_STATE_RESETING:
            if (!isPressed) {
                state = BUTTON_STATE_IDLE;
            }
            break;
        case BUTTON_STATE_IDLE:
            pressCounter = 0;
            if (isPressed) {
                state = BUTTON_STATE_COUNTING;
            }
            break;
        case BUTTON_STATE_COUNTING:
            pressCounter++;
            if (!isPressed || pressCounter >= longPressTriggerCount) {
                if (pressCounter >= longPressTriggerCount) {
                    state = BUTTON_STATE_LONG_PRESSED;
                } else if (pressCounter >= 1) {
                    state = BUTTON_STATE_PRESSED;
                } else {
                    state = BUTTON_STATE_RESETING;
                }
            }
            break;
    }
}

ButtonState ButtonHandler::getState()
{
    ButtonState currentState = state;
    if (currentState == BUTTON_STATE_PRESSED || currentState == BUTTON_STATE_LONG_PRESSED) {
        state = BUTTON_STATE_RESETING;
    }
    return currentState;
}