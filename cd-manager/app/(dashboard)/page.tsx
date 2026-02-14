"use client";

import { DataRepositoryContext } from "@/app/providers/data-repository";
import { Box, Fade, Slider, Typography, useTheme } from "@mui/material";
import React, { useCallback, useContext, useEffect, useState } from "react";
import BottomSheet from "../components/client/bottom-sheet";
import useResizeObserver from "../hooks/use-resize-observer";
import PlayerSlots from "../components/client/player-slots";
import SelectedSlotDetails from "../components/client/selected-slot-details";
import { getPlayDiscOrder, getPlayTrackOrder, getPlayTrackOnDiskOrder } from "@/api/player-remote/command-factory";

const Page = () => {
  const {
    playerContent,
    playerContentByArtist,
    playerDefinitions,
    selectedPlayer,
    irRemoteClients,
    selectedPlayerSlots,
    setSelectedPlayerSlots,
    lastPlayedSlots,
    setLastPlayedSlots,
  } = useContext(DataRepositoryContext);
  const [selectedPlayerRemoteIndex, setSelectedPlayerRemoteIndex] =
    useState<number>(1);
  useEffect(() => {
    if (selectedPlayer !== null) {
      setPageShown(false);
      setTimeout(() => {
        setSelectedPlayerRemoteIndex(selectedPlayer);
        setTimeout(() => {
          setPageShown(true);
        }, 500);
      }, 500);
    }
  }, [selectedPlayer]);

  const currentSlot =
    selectedPlayerRemoteIndex !== null
      ? playerContent[selectedPlayerRemoteIndex - 1][
          selectedPlayerSlots[selectedPlayerRemoteIndex - 1]
        ]
      : null;
  const currentSlotNumber = currentSlot?.slot || 0;
  const [pageShown, setPageShown] = useState(true);
  const { width, resizeRef } = useResizeObserver();

  const buildSelectedSlot = useCallback(
    (slot: number, selectedPlayer: 0 | 1 | 2) => {
      if (selectedPlayer === 0) {
        return [slot, selectedPlayerSlots[1], selectedPlayerSlots[2]];
      } else if (selectedPlayer === 1) {
        return [selectedPlayerSlots[0], slot, selectedPlayerSlots[2]];
      } else {
        return [selectedPlayerSlots[0], selectedPlayerSlots[1], slot];
      }
    },
    [selectedPlayerSlots],
  );

  const theme = useTheme();
  const getPlayerIndex = (remoteIndex: number): 0 | 1 | 2 => {
    const index = remoteIndex - 1;
    if (index === 0 || index === 1 || index === 2) {
      return index;
    }
    return 0;
  };

  const currentRemoteClientIndex = getPlayerIndex(selectedPlayerRemoteIndex);
  const currentRemoteClient = irRemoteClients[currentRemoteClientIndex];

  const handleTrackPlay = useCallback(
    async (trackNumber: number) => {
      if (!currentRemoteClient) return;
      if (!currentSlot) return;

      const isSameSlot =
        lastPlayedSlots[currentRemoteClientIndex] === currentSlot.slot;
      let sequence;

      if (isSameSlot) {
        sequence = getPlayTrackOrder(trackNumber);
      } else {
        sequence = getPlayTrackOnDiskOrder(currentSlot.slot, trackNumber);
      }

      try {
        await currentRemoteClient.sendOrder(sequence);
        if (!isSameSlot) {
            const newLastPlayed = [...lastPlayedSlots];
            newLastPlayed[currentRemoteClientIndex] = currentSlot.slot;
            setLastPlayedSlots(newLastPlayed);
        }
      } catch (e) {
        console.error("Failed to sequence commands", e);
      }
    },
    [
      currentRemoteClient,
      currentSlot,
      lastPlayedSlots,
      currentRemoteClientIndex,
      setLastPlayedSlots,
    ],
  );

  const handleAlbumPlay = useCallback(async () => {
    if (!currentRemoteClient) return;
    if (!currentSlot) return;

    const sequence = getPlayDiscOrder(currentSlot.slot);

    try {
      await currentRemoteClient.sendOrder(sequence);
      const newLastPlayed = [...lastPlayedSlots];
      newLastPlayed[currentRemoteClientIndex] = currentSlot.slot;
      setLastPlayedSlots(newLastPlayed);
    } catch (e) {
      console.error("Failed to sequence commands", e);
    }
  }, [
    currentRemoteClient,
    currentSlot,
    lastPlayedSlots,
    currentRemoteClientIndex,
    setLastPlayedSlots,
  ]);

  const checkTrackPlaySupport = useCallback(
    (trackNumber: number) => {
      if (!currentRemoteClient || !currentSlot) return false;

      const isSameSlot =
        lastPlayedSlots[currentRemoteClientIndex] === currentSlot.slot;
      let sequence;

      if (isSameSlot) {
        sequence = getPlayTrackOrder(trackNumber);
      } else {
        sequence = getPlayTrackOnDiskOrder(currentSlot.slot, trackNumber);
      }

      return currentRemoteClient.canExecuteSequence(sequence);
    },
    [
      currentRemoteClient,
      currentSlot,
      lastPlayedSlots,
      currentRemoteClientIndex,
    ],
  );

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
      {playerDefinitions !== null && playerDefinitions?.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
          }}
        >
          <Fade timeout={250} in={width > 0 && pageShown}>
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
                  mt: 2,
                  display: "flex",
                  flexDirection: "column",
                  flexGrow: 1,
                }}
              >
                <Box ref={resizeRef}>
                  <PlayerSlots
                    selectedPlayer={getPlayerIndex(selectedPlayerRemoteIndex)}
                    selectedSlot={selectedPlayerSlots[selectedPlayerRemoteIndex - 1]}
                    isPlayDiskButtonVisible={
                      currentSlot && currentRemoteClient
                        ? (() => {
                            const sequence = getPlayDiscOrder(currentSlot.slot);
                            const canExecute = currentRemoteClient.canExecuteSequence(sequence);
                            console.log("Page: Checking Play Button Visibility", { slot: currentSlot.slot, canExecute, sequenceLength: sequence.length });
                            return canExecute;
                        })()
                        : false}
                    handleSelectedSlotChange={(slot) => {
                      setSelectedPlayerSlots(
                        buildSelectedSlot(
                          slot,
                          getPlayerIndex(selectedPlayerRemoteIndex),
                        ),
                      );
                    }}
                    handleAlbumPlay={handleAlbumPlay}
                    containerWidth={width}
                  />
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    my: 2,
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      textAlign: "center",
                      visibility:
                        currentSlotNumber === 0 ? "hidden" : "visible",
                    }}
                  >
                    {currentSlotNumber}
                  </Typography>
                  <Typography variant="h5" sx={{ textAlign: "center" }}>
                    {(currentSlot?.cd?.diskAmount || 1) > 1
                      ? `${currentSlot?.cd?.title}, Disc ${currentSlot?.cd?.diskNumber}`
                      : currentSlot?.cd?.title || "No disk"}
                  </Typography>
                  <Typography variant="body1" sx={{ textAlign: "center" }}>
                    {currentSlot?.cd?.artist || "No artist"}
                  </Typography>
                </Box>
                {currentSlot && (
                  <BottomSheet>
                    <SelectedSlotDetails
                      width={width}
                      slot={currentSlot}
                      relatedSlots={
                        currentSlot.cd
                          ? playerContentByArtist[
                              selectedPlayerRemoteIndex - 1
                            ][currentSlot.cd.artist] || []
                          : []
                      }
                      onRelatedAlbumClick={(slot) => {
                        const slotIndex = playerContent[
                          selectedPlayerRemoteIndex - 1
                        ].findIndex((s) => s.slot === slot.slot);
                        setSelectedPlayerSlots(
                          buildSelectedSlot(
                            slotIndex,
                            getPlayerIndex(selectedPlayerRemoteIndex),
                          ),
                        );
                      }}
                      onTrackPlay={handleTrackPlay}
                      isTrackPlaySupported={checkTrackPlaySupport}
                    />
                  </BottomSheet>
                )}
              </Box>
              <Box mt={2} mb={1} mx={1}>
                <Slider
                  valueLabelDisplay="auto"
                  valueLabelFormat={() => currentSlotNumber.toString()}
                  value={selectedPlayerSlots[selectedPlayerRemoteIndex - 1]}
                  step={1}
                  min={0}
                  max={
                    playerContent[selectedPlayerRemoteIndex - 1].length > 0
                      ? playerContent[selectedPlayerRemoteIndex - 1].length - 1
                      : 0
                  }
                  onChange={(e, v) => {
                    setSelectedPlayerSlots(
                      buildSelectedSlot(
                        typeof v === "number" ? v : 0,
                        getPlayerIndex(selectedPlayerRemoteIndex),
                      ),
                    );
                  }}
                  sx={{
                    visibility: currentSlotNumber === 0 ? "hidden" : "visible",
                  }}
                />
              </Box>
            </Box>
          </Fade>
        </Box>
      )}
    </Box>
  );
};

export default Page;
