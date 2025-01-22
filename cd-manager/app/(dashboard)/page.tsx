"use client";

import { DataRepositoryContext } from "@/providers/data-repository";
import { alpha, Box, Slider, Stack, useTheme } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { PlayerSlot } from "../hooks/use-player-content-provider-props";
import useResizeObserver from "../hooks/use-resize-observer";

const PlayerContent = ({
  items,
  selected,
}: {
  items: PlayerSlot[];
  selected: number;
}) => {
  const { width, resizeRef } = useResizeObserver();
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        position: "relative",
      }}
      ref={resizeRef}
    >
      <Box
        sx={{
          display: "flex",
          overflow: "auto",
          scrollSnapType: "x mandatory",

          "&::-webkit-scrollbar": {
            display: "none",
            scrollbarWidth: "none",
            overflowStyle: "none",
          },
          scrollbarWidth: "none",
          overflowStyle: "none",
        }}
      >
        {items.map((item, i) => (
          <Box
            key={i}
            sx={{
              minWidth: `${width}px`,
              marginLeft: i > 0 ? `-${width / 4}px` : 0,
              marginRight: `-${width / 4}px`,
              display: "flex",
              justifyContent: "center",
              scrollSnapAlign: "start",
            }}
          >
            <img
              style={{ borderRadius: "16px" }}
              src={item.cd?.art?.albumBig || "/cd-placeholder-big.png"}
              width={width / 3}
              height={width / 3}
              alt={item.cd?.title || "CD"}
            />
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: width / 6,
          background: `linear-gradient(270deg, ${alpha(theme.palette.section.background, 0)} 0%, ${alpha(theme.palette.section.background, 1)} 100%)`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: width / 6,
          background: `linear-gradient(90deg, ${alpha(theme.palette.section.background, 0)} 0%, ${alpha(theme.palette.section.background, 1)} 100%)`,
        }}
      />
    </Box>
  );
};

const Page = () => {
  const { playerContent, playerDefinitions } = useContext(
    DataRepositoryContext
  );
  const [selectedSlot, setSelectedSlot] = useState(0);
  console.log(selectedSlot);

  return (
    <Stack spacing={4}>
      <PlayerContent items={playerContent[0]} selected={selectedSlot} />

      <Slider
        step={1}
        min={0}
        max={
          playerDefinitions && playerDefinitions.length > 0
            ? playerDefinitions[0]?.capacity - 1
            : 0
        }
        onChange={(e, v) => setSelectedSlot(v as number)}
      />
    </Stack>
  );
};

export default Page;
