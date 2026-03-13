#include "SLink.h"
#include <Sony_SLink.h>
#include "common/ir/ir.h"

Slink slink;

QueueHandle_t SLinkController::commandQueue = NULL;
SemaphoreHandle_t SLinkController::commandDone = NULL;
SemaphoreHandle_t SLinkController::stateMutex = NULL;
CDPlayerState SLinkController::currentState = {CD_UNKNOWN, 0, 0, 0, 0, false};
volatile bool SLinkController::stateDirty = false;

void SLinkController::begin()
{
    slink.init(SLINK_PIN);

    if (core1TimingMutex == NULL) {
        core1TimingMutex = xSemaphoreCreateMutex();
    }

    commandQueue = xQueueCreate(4, sizeof(SLinkCommand));
    commandDone = xSemaphoreCreateBinary();
    stateMutex = xSemaphoreCreateMutex();

    xTaskCreatePinnedToCore(
        slinkTask,
        "slink",
        4096,
        NULL,
        configMAX_PRIORITIES - 2, // high priority, but below IR send
        NULL,
        1 // core 1 (free from WiFi)
    );
}

void SLinkController::slinkTask(void *param)
{
    SLinkCommand cmd;
    for (;;)
    {
        if (xQueueReceive(commandQueue, &cmd, portMAX_DELAY) == pdTRUE)
        {
            executeCommand(cmd);
            xSemaphoreGive(commandDone);
        }
    }
}

void SLinkController::executeCommand(const SLinkCommand &cmd)
{
    xSemaphoreTake(core1TimingMutex, portMAX_DELAY);

    uint8_t device;

    switch (cmd.type)
    {
    case SLINK_CMD_PLAY:
        slink.sendCommand(SLINK_DEVICE_CDP_CX1L, SLINK_CMD_CD_PLAY);
        break;

    case SLINK_CMD_PAUSE:
        slink.sendCommand(SLINK_DEVICE_CDP_CX1L, SLINK_CMD_CD_PAUSE);
        break;

    case SLINK_CMD_STOP:
        slink.sendCommand(SLINK_DEVICE_CDP_CX1L, SLINK_CMD_CD_STOP);
        break;

    case SLINK_CMD_NEXT_TRACK:
        slink.sendCommand(SLINK_DEVICE_CDP_CX1L, SLINK_CMD_CD_NEXT);
        break;

    case SLINK_CMD_PREV_TRACK:
        slink.sendCommand(SLINK_DEVICE_CDP_CX1L, SLINK_CMD_CD_PREV);
        break;

    case SLINK_CMD_POWER_ON:
        slink.sendCommand(SLINK_DEVICE_CDP_CX1L, SLINK_CMD_CDP_POWER_ON_BYTE);
        break;

    case SLINK_CMD_POWER_OFF:
        slink.sendCommand(SLINK_DEVICE_CDP_CX1L, SLINK_CMD_CDP_POWER_OFF_BYTE);
        break;

    case SLINK_CMD_SELECT_DISC:
        device = getDeviceCode(cmd.discNumber);
        slink.sendCommand(device, SLINK_CMD_CDP_PLAY_DISC_TRACK_BYTE,
                          encodeDiscNumber(cmd.discNumber), 0x01);
        break;

    case SLINK_CMD_PLAY_DISC_TRACK:
        device = getDeviceCode(cmd.discNumber);
        slink.sendCommand(device, SLINK_CMD_CDP_PLAY_DISC_TRACK_BYTE,
                          encodeDiscNumber(cmd.discNumber), cmd.trackNumber);
        break;

    case SLINK_CMD_POLL_STATUS:
        pollStatus();
        break;
    }

    // After sending any command (except poll), listen for the CDP's response
    if (cmd.type != SLINK_CMD_POLL_STATUS)
    {
        listenForResponse();
    }

    xSemaphoreGive(core1TimingMutex);
}

bool SLinkController::waitForSync(unsigned long timeoutUs)
{
    unsigned long start = micros();
    // Wait for line to go LOW (start of sync pulse)
    while (digitalRead(slink.pin()) == HIGH)
    {
        if (micros() - start > timeoutUs)
            return false;
        delayMicroseconds(10);
    }
    // Measure how long the LOW pulse lasts
    unsigned long lowStart = micros();
    while (digitalRead(slink.pin()) == LOW)
    {
        if (micros() - lowStart > 5000) // safety timeout
            return false;
        delayMicroseconds(10);
    }
    unsigned long duration = micros() - lowStart;
    // Sync pulse is ~2400us, accept 1800-3000us range
    return (duration > 1800 && duration < 3000);
}

bool SLinkController::readByte(uint8_t &outByte, unsigned long timeoutUs)
{
    outByte = 0;
    for (int i = 7; i >= 0; i--)
    {
        unsigned long start = micros();
        // Wait for line to go LOW (start of bit)
        while (digitalRead(slink.pin()) == HIGH)
        {
            if (micros() - start > timeoutUs)
                return false;
            delayMicroseconds(10);
        }
        // Measure LOW pulse duration
        unsigned long lowStart = micros();
        while (digitalRead(slink.pin()) == LOW)
        {
            if (micros() - lowStart > 2000) // safety
                return false;
            delayMicroseconds(10);
        }
        unsigned long duration = micros() - lowStart;
        // 1200us = 1, 600us = 0 (with tolerance)
        if (duration > 900)
        {
            outByte |= (1 << i);
        }
        // Wait for delimiter to pass (line HIGH ~600us)
    }
    return true;
}

int SLinkController::readBytes(uint8_t *buffer, int maxBytes, unsigned long timeoutUs)
{
    int count = 0;
    unsigned long start = micros();

    while (count < maxBytes && (micros() - start) < timeoutUs)
    {
        uint8_t byte;
        if (readByte(byte, 3000))
        {
            buffer[count++] = byte;
        }
        else
        {
            break; // no more data
        }
    }
    return count;
}

void SLinkController::updateState(const uint8_t *data, int length)
{
    // Called from handleBusFrame() after verifying device code is 0x98/99/9A
    if (length < 2)
        return;

    uint8_t statusByte = data[1];

    CDPlayerState newState = currentState;

    switch (statusByte)
    {
    case 0x00: // Play
        newState.playbackState = CD_PLAYING;
        newState.powered = true;
        break;
    case 0x01: // Stop
        newState.playbackState = CD_STOPPED;
        newState.powered = true;
        break;
    case 0x02: // Pause
    case 0x03: // Pause toggle
        newState.playbackState = CD_PAUSED;
        newState.powered = true;
        break;
    case 0x2E: // Power on
        newState.powered = true;
        break;
    case 0x2F: // Power off
        newState.powered = false;
        newState.playbackState = CD_STOPPED;
        break;
    }

    // If playing track info is included: device, 0x50, disc, track, min, sec
    if (statusByte == 0x50 && length >= 6)
    {
        newState.playbackState = CD_PLAYING;
        newState.powered = true;
        // Disc number decoding (reverse of encodeDiscNumber)
        uint8_t discByte = data[2];
        if (discByte == 0x00)
        {
            newState.discNumber = 100;
        }
        else if (discByte >= 0x9A)
        {
            newState.discNumber = 100 + (discByte - 0x9A);
        }
        else
        {
            // BCD decode
            newState.discNumber = ((discByte >> 4) & 0x0F) * 10 + (discByte & 0x0F);
        }
        newState.trackNumber = data[3];
        newState.trackMinutes = data[4];
        newState.trackSeconds = data[5];
    }

    // Check if state changed
    if (newState.playbackState != currentState.playbackState ||
        newState.discNumber != currentState.discNumber ||
        newState.trackNumber != currentState.trackNumber ||
        newState.trackMinutes != currentState.trackMinutes ||
        newState.trackSeconds != currentState.trackSeconds ||
        newState.powered != currentState.powered)
    {
        xSemaphoreTake(stateMutex, portMAX_DELAY);
        currentState = newState;
        xSemaphoreGive(stateMutex);
        stateDirty = true;
    }
}

void SLinkController::handleBusFrame(const uint8_t *data, int length)
{
    if (length < 2)
        return;

    uint8_t deviceCode = data[0];

    // CDP status response (0x98=CDP-1, 0x99=CDP-2, 0x9A=CDP-3)
    if (deviceCode == 0x98 || deviceCode == 0x99 || deviceCode == 0x9A)
    {
        updateState(data, length);
        return;
    }

    // Amplifier emulation: if the CDP sends a command to device 0xC0 (amp),
    // we respond as if we're the amplifier. This makes the CDP think a
    // compatible receiver is connected, causing it to send status updates.
    //
    // Common CDP->AMP commands:
    //   0xC0 0x50 0x02 = "switch input to CD" (sent when CDP starts playing)
    //   0xC0 0x2E      = "power on amp"
    //   0xC0 0x2F      = "power off amp"
    //
    // We acknowledge by echoing back with the amp response prefix (0xC0).
    if (deviceCode == SLINK_DEVICE_AMP)
    {
        // Small delay before responding (amp would take time to process)
        delayMicroseconds(5000);
        // Echo back: amp device code + received command byte (acknowledgment)
        slink.sendCommand(SLINK_DEVICE_AMP, data[1]);
    }
}

void SLinkController::listenForResponse()
{
    // After sending a command, the CDP typically responds on the bus.
    // Switch to input mode and listen for response frame(s).
    // Also handles amp emulation if the CDP sends commands to 0xC0.
    pinMode(slink.pin(), INPUT);

    // Listen for up to 2 frames (CDP may send status + amp command)
    for (int i = 0; i < 2; i++)
    {
        if (waitForSync(100000)) // wait up to 100ms
        {
            uint8_t buffer[8];
            int bytesRead = readBytes(buffer, 8, 50000);
            if (bytesRead >= 2)
            {
                handleBusFrame(buffer, bytesRead);
            }
        }
        else
        {
            break; // no more frames
        }
    }
}

void SLinkController::pollStatus()
{
    // Continuous bus monitor with amplifier emulation.
    //
    // The ESP32 emulates a Sony amplifier (device 0xC0) on the S-Link bus.
    // When the CDP-CX270 detects an amp is responding, it sends status
    // updates (track, disc, time, playback state) automatically.
    //
    // This poll runs every SLINK_POLL_INTERVAL_MS and:
    // 1. Listens for any frame on the bus
    // 2. If it's a CDP status (0x98), updates our state
    // 3. If it's a CDP->AMP command (0xC0), responds as the amp
    // 4. If nothing heard and not playing, sends a query to trigger response

    pinMode(slink.pin(), INPUT);

    // Listen for a bus frame
    if (waitForSync(20000)) // 20ms window
    {
        uint8_t buffer[8];
        int bytesRead = readBytes(buffer, 8, 50000);
        if (bytesRead >= 2)
        {
            handleBusFrame(buffer, bytesRead);
            return;
        }
    }

    // If nothing on the bus and not playing, actively query the CDP
    if (currentState.playbackState != CD_PLAYING)
    {
        slink.sendCommand(SLINK_DEVICE_CDP_CX1L, SLINK_CMD_CDP_REQUEST_NAME);
        listenForResponse();
    }
}

uint8_t SLinkController::encodeDiscNumber(uint16_t discNumber)
{
    if (discNumber >= 201)
    {
        // Discs 201-400: raw offset from 200, device code switches to 0x93
        return (uint8_t)(discNumber - 200);
    }
    else if (discNumber >= 101)
    {
        // Discs 101-200: offset encoding 0x9A + (disc - 100)
        return (uint8_t)(0x9A + (discNumber - 100));
    }
    else if (discNumber == 100)
    {
        // Disc 100: special case
        return 0x00;
    }
    else
    {
        // Discs 1-99: BCD encoding
        uint8_t tens = discNumber / 10;
        uint8_t ones = discNumber % 10;
        return (tens << 4) | ones;
    }
}

uint8_t SLinkController::getDeviceCode(uint16_t discNumber)
{
    if (discNumber > 200)
    {
        return SLINK_DEVICE_CDP_CX1H;
    }
    return SLINK_DEVICE_CDP_CX1L;
}

bool SLinkController::sendCommand(SLinkCommandType type, uint16_t disc, uint8_t track)
{
    SLinkCommand cmd;
    cmd.type = type;
    cmd.discNumber = disc;
    cmd.trackNumber = track;

    xQueueSend(commandQueue, &cmd, portMAX_DELAY);
    xSemaphoreTake(commandDone, portMAX_DELAY);

    return true;
}

void SLinkController::sendCommandAsync(SLinkCommandType type, uint16_t disc, uint8_t track)
{
    SLinkCommand cmd;
    cmd.type = type;
    cmd.discNumber = disc;
    cmd.trackNumber = track;

    xQueueSend(commandQueue, &cmd, 0); // non-blocking, drop if queue full
}

CDPlayerState SLinkController::getState()
{
    CDPlayerState state;
    xSemaphoreTake(stateMutex, portMAX_DELAY);
    state = currentState;
    xSemaphoreGive(stateMutex);
    return state;
}

bool SLinkController::hasStateChanged()
{
    bool changed = stateDirty;
    stateDirty = false;
    return changed;
}
