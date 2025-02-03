"use client";

import { DataRepositoryContext } from "@/providers/data-repository";
import { Box, Fade, Slider, Typography, useTheme } from "@mui/material";
import React, { useCallback, useContext, useEffect, useState } from "react";
import BottomSheet from "../components/client/bottom-sheet";
import useResizeObserver from "../hooks/use-resize-observer";
import PlayerSlots from "../components/client/player-slots";
import SelectedSlotDetails from "../components/client/selected-slot-details";

const Page = () => {
  const {
    playerContent,
    playerContentByArtist,
    playerDefinitions,
    selectedPlayer,
  } = useContext(DataRepositoryContext);
  const [selectedPlayerRemoteIndex, setSelectedPlayerRemoteIndex] = useState<
    1 | 2 | 3
  >(1);
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

  const [selectedSlot, setSelectedSlot] = useState<number[]>([0, 0, 0]);
  const currentSlot =
    selectedPlayerRemoteIndex !== null
      ? playerContent[selectedPlayerRemoteIndex - 1][
          selectedSlot[selectedPlayerRemoteIndex - 1]
        ]
      : null;
  const currentSlotNumber = currentSlot?.slot || 0;
  const [pageShown, setPageShown] = useState(true);
  const { width, resizeRef } = useResizeObserver();

  const buildSelectedSlot = useCallback(
    (slot: number, selectedPlayer: 0 | 1 | 2) => {
      if (selectedPlayer === 0) {
        return [slot, selectedSlot[1], selectedSlot[2]];
      } else if (selectedPlayer === 1) {
        return [selectedSlot[0], slot, selectedSlot[2]];
      } else {
        return [selectedSlot[0], selectedSlot[1], slot];
      }
    },
    [selectedSlot]
  );

  const theme = useTheme();
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
                    selectedPlayer={
                      (selectedPlayerRemoteIndex - 1) as 0 | 1 | 2
                    }
                    selectedSlot={selectedSlot[selectedPlayerRemoteIndex - 1]}
                    handleSelectedSlotChange={(slot) => {
                      setSelectedSlot(
                        buildSelectedSlot(
                          slot,
                          (selectedPlayerRemoteIndex - 1) as 0 | 1 | 2
                        )
                      );
                    }}
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
                    {currentSlot?.cd?.title || "No disk"}
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
                        setSelectedSlot(
                          buildSelectedSlot(
                            slot.slot - 1,
                            (selectedPlayerRemoteIndex - 1) as 0 | 1 | 2
                          )
                        );
                      }}
                    />
                  </BottomSheet>
                )}
              </Box>
              <Box mt={2} mb={1} mx={1}>
                <Slider
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => currentSlotNumber.toString()}
                  value={selectedSlot[selectedPlayerRemoteIndex - 1]}
                  step={1}
                  min={0}
                  max={
                    playerContent[selectedPlayerRemoteIndex - 1].length > 0
                      ? playerContent[selectedPlayerRemoteIndex - 1].length - 1
                      : 0
                  }
                  onChange={(e, v) => {
                    setSelectedSlot(
                      buildSelectedSlot(
                        v as number,
                        (selectedPlayerRemoteIndex - 1) as 0 | 1 | 2
                      )
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
