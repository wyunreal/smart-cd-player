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
                  width={`calc(${itemWidth}/1.5`}
                  height={`calc(${itemWidth}/1.5`}
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
        onChange={(e, v) => {
          setSelectedSlot(v as number);
        }}
      />
    </Stack>
  );
};

export default Page;
