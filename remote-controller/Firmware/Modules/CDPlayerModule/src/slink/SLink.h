#ifndef SLINK_CONTROLLER_H
#define SLINK_CONTROLLER_H

#include <Arduino.h>
#include "../Config.h"

enum CDPlaybackState
{
    CD_STOPPED,
    CD_PLAYING,
    CD_PAUSED,
    CD_UNKNOWN
};

struct CDPlayerState
{
    CDPlaybackState playbackState;
    uint16_t discNumber;
    uint8_t trackNumber;
    uint8_t trackMinutes;
    uint8_t trackSeconds;
    bool powered;
};

enum SLinkCommandType
{
    SLINK_CMD_PLAY,
    SLINK_CMD_PAUSE,
    SLINK_CMD_STOP,
    SLINK_CMD_NEXT_TRACK,
    SLINK_CMD_PREV_TRACK,
    SLINK_CMD_SELECT_DISC,
    SLINK_CMD_PLAY_DISC_TRACK,
    SLINK_CMD_POWER_ON,
    SLINK_CMD_POWER_OFF,
    SLINK_CMD_POLL_STATUS
};

struct SLinkCommand
{
    SLinkCommandType type;
    uint16_t discNumber;
    uint8_t trackNumber;
};

class SLinkController
{
public:
    void begin();
    bool sendCommand(SLinkCommandType type, uint16_t disc = 0, uint8_t track = 0);
    void sendCommandAsync(SLinkCommandType type, uint16_t disc = 0, uint8_t track = 0);
    CDPlayerState getState();
    bool hasStateChanged();

private:
    static void slinkTask(void *param);
    static void executeCommand(const SLinkCommand &cmd);
    static void pollStatus();
    static void listenForResponse();
    static void handleBusFrame(const uint8_t *data, int length);
    static bool readByte(uint8_t &outByte, unsigned long timeoutUs = 5000);
    static bool waitForSync(unsigned long timeoutUs = 10000);
    static int readBytes(uint8_t *buffer, int maxBytes, unsigned long timeoutUs = 50000);
    static void updateState(const uint8_t *data, int length);
    static uint8_t encodeDiscNumber(uint16_t discNumber);
    static uint8_t getDeviceCode(uint16_t discNumber);

    static QueueHandle_t commandQueue;
    static SemaphoreHandle_t commandDone;
    static SemaphoreHandle_t stateMutex;
    static CDPlayerState currentState;
    static volatile bool stateDirty;
};

#endif
