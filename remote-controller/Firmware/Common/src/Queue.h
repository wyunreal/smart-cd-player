#ifndef STORE_QUEUE_H
#define STORE_QUEUE_H

class Queue
{
public:
    Queue(int capacity, bool rolling = false);
    ~Queue();
    void *first();
    void *last();
    bool consumeFirst();
    bool addLast(void *aData);
    bool isFull();
    void foreach (void (*callback)(void *));

private:
    void **data;
    int dataCapacity;
    bool isRolling;
    int firstIndex;
    int lastIndex;
};

#endif