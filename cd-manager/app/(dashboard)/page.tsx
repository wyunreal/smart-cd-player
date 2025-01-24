"use client";

import { DataRepositoryContext } from "@/providers/data-repository";
import {
  alpha,
  Box,
  Fade,
  Slider,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useCallback, useContext, useState } from "react";
import { PlayerSlot } from "../hooks/use-player-content-provider-props";
import Carousel from "../components/client/carousel";
import BottomSheet from "../components/client/bottom-sheet";
import useResizeObserver from "../hooks/use-resize-observer";

const Page = () => {
  const { playerContent, playerContentByArtist, playerDefinitions } =
    useContext(DataRepositoryContext);
  const [selectedPlayer, setSelectedPlayer] = useState<0 | 1 | 2>(0);
  const [selectedSlot, setSelectedSlot] = useState<number[]>([0, 0, 0]);
  console.log(playerContentByArtist);
  const currentSlotNumber = playerContent[selectedPlayer][
    selectedSlot[selectedPlayer]
  ]
    ? playerContent[selectedPlayer][selectedSlot[selectedPlayer]].slot
    : 0;

  const [pageShown, setPageShown] = useState(true);
  const { width, resizeRef } = useResizeObserver();
  const slotsDimension =
    width < 420
      ? "150px"
      : width < 630
        ? "220px"
        : width < 820
          ? "280px"
          : "380px";

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
                <Box sx={{ height: slotsDimension }} ref={resizeRef}>
                  <Carousel<PlayerSlot>
                    items={playerContent[selectedPlayer]}
                    containerWidth={width}
                    slideDimensions={{
                      width: slotsDimension,
                      height: slotsDimension,
                    }}
                    renderItem={(
                      item,
                      i,
                      containerWidth,
                      itemDimensions,
                      selected
                    ) => (
                      <Box
                        key={i}
                        sx={{
                          minWidth: `${containerWidth}px`,
                          height: `${slotsDimension}`,
                          alignItems: "center",
                          marginLeft: i > 0 ? `-${containerWidth / 4}px` : 0,
                          marginRight: `-${containerWidth / 4}px`,
                          display: "flex",
                          justifyContent: "center",
                          scrollSnapAlign: "start",
                        }}
                      >
                        {item.cd ? (
                          <img
                            style={{
                              borderRadius: "16px",
                              zIndex: selected === i ? 100 : 0,
                            }}
                            src={
                              item.cd.art?.albumBig || "/cd-placeholder-big.png"
                            }
                            width={itemDimensions.width}
                            height={itemDimensions.height}
                          />
                        ) : (
                          <svg
                            width={`calc(${itemDimensions.width}/1.5`}
                            height={`calc(${itemDimensions.height}/1.5`}
                            viewBox="-2.5 -2.5 25 25"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            fill={alpha(theme.palette.text.primary, 0.05)}
                            strokeWidth={0.2}
                            stroke={alpha(theme.palette.text.primary, 0.3)}
                          >
                            <g id="layer1">
                              <path d="M 10 0 A 10 10 0 0 0 0 10 A 10 10 0 0 0 10 20 A 10 10 0 0 0 20 10 A 10 10 0 0 0 10 0 z M 10 1 A 9 9 0 0 1 19 10 A 9 9 0 0 1 10 19 A 9 9 0 0 1 1 10 A 9 9 0 0 1 10 1 z M 10 6 A 4 4 0 0 0 6 10 A 4 4 0 0 0 10 14 A 4 4 0 0 0 14 10 A 4 4 0 0 0 10 6 z M 10 7 A 3 3 0 0 1 13 10 A 3 3 0 0 1 10 13 A 3 3 0 0 1 7 10 A 3 3 0 0 1 10 7 z M 10 8 A 2 2 0 0 0 8 10 A 2 2 0 0 0 10 12 A 2 2 0 0 0 12 10 A 2 2 0 0 0 10 8 z M 10 9 A 1 1 0 0 1 11 10 A 1 1 0 0 1 10 11 A 1 1 0 0 1 9 10 A 1 1 0 0 1 10 9 z" />
                            </g>
                          </svg>
                        )}
                      </Box>
                    )}
                    selectedIndex={selectedSlot[selectedPlayer]}
                    onSelectedIndexChange={(index) => {
                      setSelectedSlot(buildSelectedSlot(index, selectedPlayer));
                    }}
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
                    {playerContent[selectedPlayer][selectedSlot[selectedPlayer]]
                      ?.cd?.title || "No disk"}
                  </Typography>
                  <Typography variant="body1" sx={{ textAlign: "center" }}>
                    {playerContent[selectedPlayer][selectedSlot[selectedPlayer]]
                      ?.cd?.artist || "No artist"}
                  </Typography>
                </Box>
                <BottomSheet></BottomSheet>
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
