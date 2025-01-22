"use client";

import { DataRepositoryContext } from "@/providers/data-repository";
import { alpha, Box, Slider, Stack, Typography, useTheme } from "@mui/material";
import React, { useContext, useState } from "react";
import { PlayerSlot } from "../hooks/use-player-content-provider-props";
import Carousel from "../components/client/carousel";

const Page = () => {
  const { playerContent } = useContext(DataRepositoryContext);
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const theme = useTheme();
  return (
    <Stack spacing={4}>
      <Carousel<PlayerSlot>
        items={playerContent[0]}
        renderItem={(item, i, containerWidth, itemWidth, selected) => (
          <Box
            key={i}
            sx={{
              minWidth: `${containerWidth}px`,
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
                  cursor: "pointer",
                  zIndex: selected === i ? 100 : 0,
                }}
                src={item.cd.art?.albumBig || "/cd-placeholder-big.png"}
                width={itemWidth}
                height={itemWidth}
                onClick={() => alert(i)}
              />
            ) : (
              <Stack spacing={1} alignItems="center">
                <svg
                  width={`calc(${itemWidth}/1.2`}
                  height={`calc(${itemWidth}/1.2`}
                  viewBox="0 0 64 64"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke={alpha(theme.palette.text.primary, 0.3)}
                >
                  <circle cx="32" cy="32" r="24" />
                  <circle cx="32" cy="32" r="6" />
                  <line x1="38" y1="32" x2="56" y2="32" />
                  <line x1="8" y1="32" x2="26.01" y2="32" />
                  <line x1="48.97" y1="15.03" x2="36.21" y2="27.79" />
                  <line x1="27.76" y1="36.24" x2="15.03" y2="48.97" />
                </svg>
                {<Typography variant="caption">No disk</Typography>}
              </Stack>
            )}
          </Box>
        )}
        selected={selectedSlot}
        onSelectedChange={setSelectedSlot}
      />

      <Slider
        valueLabelDisplay="auto"
        value={selectedSlot}
        step={1}
        min={0}
        max={playerContent[0].length > 0 ? playerContent[0].length - 1 : 0}
        onChange={(e, v) => setSelectedSlot(v as number)}
      />
    </Stack>
  );
};

export default Page;
