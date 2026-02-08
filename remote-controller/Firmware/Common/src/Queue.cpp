#include "Queue.h"
#include <Arduino.h>

Queue::Queue(int capacity, bool rolling)
{
    firstIndex = -1;
    lastIndex = -1;
    dataCapacity = capacity;
    isRolling = rolling;

    data = new void *[capacity];
}

void Queue::foreach (void (*callback)(void *))
{
    if (firstIndex > -1 && lastIndex > -1)
    {
        if (lastIndex >= firstIndex)
        {
            for (int i = firstIndex; i <= lastIndex; i++)
            {
                (*callback)(data[i]);
            }
        }
        else
        {
            for (int i = firstIndex; i < dataCapacity; i++)
            {
                (*callback)(data[i]);
            }
            for (int i = 0; i <= lastIndex; i++)
            {
                (*callback)(data[i]);
            }
        }
    }
}

Queue::~Queue()
{
    delete[] data;
}

void *Queue::first()
{
    if (firstIndex > -1)
    {
        return data[firstIndex];
    }
    else
    {
        return NULL;
    }
}

void *Queue::last()
{
    if (lastIndex > -1)
    {
        return data[lastIndex];
    }
    else
    {
        return NULL;
    }
}

bool Queue::consumeFirst()
{
    if (firstIndex > -1)
    {
        bool lastItem = firstIndex == lastIndex;
        if (lastItem)
        {
            firstIndex = lastIndex = -1;
        }
        else
        {
            firstIndex++;
            if (firstIndex >= dataCapacity)
            {
                firstIndex = 0;
            }
        }
        return true;
    }
    return false;
}

bool Queue::isFull()
{
    return (firstIndex == 0 && lastIndex == dataCapacity - 1) || (lastIndex == firstIndex - 1);
}

bool Queue::addLast(void *aData)
{
    if (isFull() && isRolling)
    {
        consumeFirst();
    }
    if (!isFull())
    {
        if (firstIndex > -1)
        {
            lastIndex++;
            if (lastIndex >= dataCapacity)
            {
                lastIndex = 0;
            }
        }
        else
        {
            firstIndex = lastIndex = 0;
        }
        data[lastIndex] = aData;
        return true;
    }
    return false;
}