"use client";

import { DataRepositoryContext } from "@/providers/data-repository";
import {
  Box,
  Fade,
  Slider,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useCallback, useContext, useState } from "react";
import BottomSheet from "../components/client/bottom-sheet";
import useResizeObserver from "../hooks/use-resize-observer";
import PlayerSlots from "../components/client/player-slots";
import SelectedSlotDetails from "../components/client/selected-slot-details";

const Page = () => {
  const { playerContent, playerContentByArtist, playerDefinitions } =
    useContext(DataRepositoryContext);
  const [selectedPlayer, setSelectedPlayer] = useState<0 | 1 | 2>(0);
  const [selectedSlot, setSelectedSlot] = useState<number[]>([0, 0, 0]);

  const currentSlot =
    playerContent[selectedPlayer][selectedSlot[selectedPlayer]];
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
          <Tabs
            value={selectedPlayer}
            onChange={(event: React.SyntheticEvent, newValue: number) => {
              if (newValue === 0 || newValue === 1 || newValue === 2) {
                setPageShown(false);
                setTimeout(() => {
                  setSelectedSlot([0, 0, 0]);
                  setSelectedPlayer(newValue);
                  setTimeout(() => {
                    setPageShown(true);
                  }, 500);
                }, 500);
              }
            }}
            centered
          >
            {playerDefinitions.map((player, i) => (
              <Tab label={`Player ${i + 1}`} key={i} />
            ))}
          </Tabs>
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
                    selectedPlayer={selectedPlayer}
                    selectedSlot={selectedSlot[selectedPlayer]}
                    handleSelectedSlotChange={(slot) => {
                      setSelectedSlot(buildSelectedSlot(slot, selectedPlayer));
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
                          ? playerContentByArtist[selectedPlayer][
                              currentSlot.cd.artist
                            ] || []
                          : []
                      }
                      onRelatedAlbumClick={(slot) => {
                        setSelectedSlot(
                          buildSelectedSlot(slot.slot - 1, selectedPlayer)
                        );
                      }}
                    />
                  </BottomSheet>
                )}
              </Box>
              <Box mt={2} mb={1}>
                <Slider
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => currentSlotNumber.toString()}
                  value={selectedSlot[selectedPlayer]}
                  step={1}
                  min={0}
                  max={
                    playerContent[selectedPlayer].length > 0
                      ? playerContent[selectedPlayer].length - 1
                      : 0
                  }
                  onChange={(e, v) => {
                    setSelectedSlot(
                      buildSelectedSlot(v as number, selectedPlayer)
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
