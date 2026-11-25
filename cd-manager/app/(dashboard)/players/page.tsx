"use client";

import { DataRepositoryContext } from "@/app/providers/data-repository";
import { Box, Fade, Slider, Typography, useTheme } from "@mui/material";
import React, { useCallback, useContext, useEffect, useState } from "react";
import BottomSheet from "../../components/client/bottom-sheet";
import useResizeObserver from "../../hooks/use-resize-observer";
import PlayerSlots from "../../components/client/player-slots";
import PlayerControlButtons from "../../components/client/player-control-buttons";
import SelectedSlotDetails from "../../components/client/selected-slot-details";
import {
  getPlayDiscOrder,
  getPlayTrackOrder,
  getPlayTrackOnDiskOrder,
} from "@/api/player-remote/command-factory";
import SpectrumBackground from "../../components/client/spectrum-background";

const Page = () => {
  const {
    playerDefinitions,
    irRemoteClients,
    visibleSlots,
    visibleSlotsByArtist,
    selectedVirtualSlot,
    setSelectedVirtualNumber,
    lastPlayedSlots,
    setLastPlayedSlots,
    displayState,
    focusedPlayer,
  } = useContext(DataRepositoryContext);

  const isOff = displayState?.mode === "off";
  const currentSlot = selectedVirtualSlot;
  const currentSlotNumber = currentSlot?.number ?? 0;
  const { width, resizeRef } = useResizeObserver();
  const theme = useTheme();

  const focusedPlayerIndex = focusedPlayer !== null ? focusedPlayer - 1 : -1;
  const currentRemoteClient =
    focusedPlayerIndex >= 0 ? irRemoteClients[focusedPlayerIndex] : null;

  const selectedVisibleIndex = currentSlot?.index ?? 0;
  const [sliderIndex, setSliderIndex] = useState(selectedVisibleIndex);

  // Keep the thumb in sync when the selection changes from the carousel,
  // search, related albums or the collection.
  useEffect(() => {
    setSliderIndex(selectedVisibleIndex);
  }, [selectedVisibleIndex]);

  // Commit the slider after a short pause. Updating the global selection on
  // every drag event fights with the carousel's smooth scrolling.
  useEffect(() => {
    if (sliderIndex === selectedVisibleIndex) return;
    const item = visibleSlots[sliderIndex];
    if (!item) return;

    const timer = setTimeout(() => {
      setSelectedVirtualNumber(item.number);
    }, 120);

    return () => clearTimeout(timer);
  }, [
    sliderIndex,
    selectedVisibleIndex,
    visibleSlots,
    setSelectedVirtualNumber,
  ]);

  const handleTrackPlay = useCallback(
    async (trackNumber: number) => {
      if (!currentRemoteClient || !currentSlot || focusedPlayerIndex < 0) {
        return;
      }

      const isSameSlot =
        lastPlayedSlots[focusedPlayerIndex] === currentSlot.slot;
      const sequence = isSameSlot
        ? getPlayTrackOrder(trackNumber)
        : getPlayTrackOnDiskOrder(currentSlot.slot, trackNumber);

      try {
        await currentRemoteClient.sendOrder(sequence);
        if (!isSameSlot) {
          const newLastPlayed = [...lastPlayedSlots];
          newLastPlayed[focusedPlayerIndex] = currentSlot.slot;
          setLastPlayedSlots(newLastPlayed);
        }
      } catch (e) {
        console.error("Failed to sequence commands", e);
      }
    },
    [
      currentRemoteClient,
      currentSlot,
      focusedPlayerIndex,
      lastPlayedSlots,
      setLastPlayedSlots,
    ],
  );

  const handleAlbumPlay = useCallback(async () => {
    if (!currentRemoteClient || !currentSlot || focusedPlayerIndex < 0) return;

    const sequence = getPlayDiscOrder(currentSlot.slot);

    try {
      await currentRemoteClient.sendOrder(sequence);
      const newLastPlayed = [...lastPlayedSlots];
      newLastPlayed[focusedPlayerIndex] = currentSlot.slot;
      setLastPlayedSlots(newLastPlayed);
    } catch (e) {
      console.error("Failed to sequence commands", e);
    }
  }, [
    currentRemoteClient,
    currentSlot,
    focusedPlayerIndex,
    lastPlayedSlots,
    setLastPlayedSlots,
  ]);

  const checkTrackPlaySupport = useCallback(
    (trackNumber: number) => {
      if (isOff || !currentRemoteClient || !currentSlot) return false;

      const isSameSlot =
        lastPlayedSlots[focusedPlayerIndex] === currentSlot.slot;
      const sequence = isSameSlot
        ? getPlayTrackOrder(trackNumber)
        : getPlayTrackOnDiskOrder(currentSlot.slot, trackNumber);

      return currentRemoteClient.canExecuteSequence(sequence);
    },
    [
      isOff,
      currentRemoteClient,
      currentSlot,
      focusedPlayerIndex,
      lastPlayedSlots,
    ],
  );

  const isPlayDiskButtonVisible =
    !isOff && currentSlot?.cd && currentRemoteClient
      ? currentRemoteClient.canExecuteSequence(
          getPlayDiscOrder(currentSlot.slot),
        )
      : false;

  return (
    <Box
      sx={{
        marginTop: "-94px", // hack to hide the toolpad page title
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        backgroundColor: theme.vars.palette.section.background,
      }}
    >
      {playerDefinitions !== null && playerDefinitions.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
          }}
        >
          <Fade timeout={250} in={width > 0}>
            <Box
              sx={{
                mt: 2,
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
              }}
            >
              <Box
                sx={{
                  mt: { xs: 0, sm: 2 },
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                }}
              >
                <Box
                  sx={{
                    display: { xs: "flex", sm: "none" },
                    justifyContent: "center",
                    gap: 0.5,
                    mb: 2,
                  }}
                >
                  <PlayerControlButtons />
                </Box>
                <Box ref={resizeRef}>
                  {visibleSlots.length > 0 && (
                    <PlayerSlots
                      items={visibleSlots}
                      selectedIndex={currentSlot?.index ?? 0}
                      isPlayDiskButtonVisible={isPlayDiskButtonVisible}
                      handleSelectedSlotChange={(index) => {
                        const item = visibleSlots[index];
                        if (item) setSelectedVirtualNumber(item.number);
                      }}
                      handleAlbumPlay={handleAlbumPlay}
                      containerWidth={width}
                    />
                  )}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    mt: 2,
                  }}
                >
                  <SpectrumBackground>
                    {currentSlot ? (
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="h3"
                          sx={{
                            textAlign: "center",
                          }}
                        >
                          {currentSlotNumber}
                        </Typography>
                        <Typography variant="h5" sx={{ textAlign: "center" }}>
                          {(currentSlot.cd?.diskAmount || 1) > 1
                            ? `${currentSlot.cd?.title}, Disc ${currentSlot.cd?.diskNumber}`
                            : currentSlot.cd?.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ textAlign: "center" }}
                        >
                          {currentSlot.cd?.artist}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", textAlign: "center" }}
                        >
                          {`Player ${currentSlot.playerRemoteIndex} · slot ${currentSlot.slot}`}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ mb: 1, textAlign: "center" }}>
                        <Typography variant="h5">No discs assigned</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Add CDs from the collection and choose a player and
                          slot.
                        </Typography>
                      </Box>
                    )}
                  </SpectrumBackground>
                </Box>
                {currentSlot && (
                  <BottomSheet>
                    <SelectedSlotDetails
                      width={width}
                      slot={currentSlot}
                      relatedSlots={
                        currentSlot.cd
                          ? visibleSlotsByArtist[currentSlot.cd.artist] || []
                          : []
                      }
                      onRelatedAlbumClick={(slot) => {
                        setSelectedVirtualNumber(slot.number);
                      }}
                      onTrackPlay={handleTrackPlay}
                      isTrackPlaySupported={checkTrackPlaySupport}
                    />
                  </BottomSheet>
                )}
              </Box>
              {visibleSlots.length > 1 && (
                <Box mt={2} mb={1} mx={1}>
                  <Slider
                    aria-label="Virtual slot"
                    value={sliderIndex}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) =>
                      String(visibleSlots[Number(value)]?.number ?? "")
                    }
                    step={1}
                    min={0}
                    max={visibleSlots.length - 1}
                    onChange={(e, value) => {
                      setSliderIndex(
                        typeof value === "number" ? value : 0,
                      );
                    }}
                  />
                </Box>
              )}
            </Box>
          </Fade>
        </Box>
      )}
    </Box>
  );
};

export default Page;
