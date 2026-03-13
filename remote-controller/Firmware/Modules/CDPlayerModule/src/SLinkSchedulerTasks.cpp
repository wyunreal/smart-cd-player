#include "SLinkSchedulerTasks.h"

static const char *playbackStateToString(CDPlaybackState state)
{
    switch (state)
    {
    case CD_PLAYING:
        return "playing";
    case CD_PAUSED:
        return "paused";
    case CD_STOPPED:
        return "stopped";
    default:
        return "unknown";
    }
}

void SLinkPollTask::execute()
{
    slinkController->sendCommandAsync(SLINK_CMD_POLL_STATUS);

    if (slinkController->hasStateChanged())
    {
        CDPlayerState state = slinkController->getState();
        Serial.printf("[SLink] State: %s | disc:%u track:%u time:%u:%02u powered:%s\n",
                      playbackStateToString(state.playbackState),
                      state.discNumber,
                      state.trackNumber,
                      state.trackMinutes,
                      state.trackSeconds,
                      state.powered ? "yes" : "no");
    }
}
