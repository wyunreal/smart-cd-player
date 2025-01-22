"use client";

import { DataRepositoryContext } from "@/providers/data-repository";
import { alpha, Box, Slider, Stack, Typography, useTheme } from "@mui/material";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { PlayerSlot } from "../hooks/use-player-content-provider-props";
import useResizeObserver from "../hooks/use-resize-observer";

const PlayerSlots = ({
  selected,
  containerWidth,
  onSelectedChange,
  children,
}: {
  selected: number;
  containerWidth: number;
  onSelectedChange?: (index: number) => void;
  children: React.ReactNode;
}) => {
  const [scrollContanierRef, setScrollContainerRef] =
    useState<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollContanierRef?.scrollTo({
      left: (selected * containerWidth) / 2,
      behavior: "smooth",
    });
  }, [selected, onSelectedChange]);

  const handleScrollSnapChanged = useCallback(
    (event: any) => {
      if (onSelectedChange) {
        onSelectedChange(
          Math.round(
            ((scrollContanierRef?.scrollLeft ?? 0) * 2) / containerWidth
          )
        );
      }
    },
    [containerWidth, scrollContanierRef]
  );

  useEffect(() => {
    scrollContanierRef?.addEventListener(
      "scrollsnapchange",
      handleScrollSnapChanged
    );
    return () =>
      scrollContanierRef?.removeEventListener(
        "scrollsnapchange",
        handleScrollSnapChanged
      );
  }, [scrollContanierRef, handleScrollSnapChanged]);

  return (
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
      ref={(scrollContanierRef: HTMLDivElement | null) => {
        setScrollContainerRef(scrollContanierRef);
      }}
    >
      {children}
    </Box>
  );
};

const PlayerContent = ({
  items,
  selected,
  onSelectedChange,
}: {
  items: PlayerSlot[];
  selected: number;
  onSelectedChange?: (index: number) => void;
}) => {
  const { width, resizeRef } = useResizeObserver();
  const theme = useTheme();

  const slideWidth =
    width < 420
      ? "150px"
      : width < 630
        ? "220px"
        : width < 820
          ? "280px"
          : "380px";
  return (
    <Box
      sx={{
        display: "flex",
        position: "relative",
      }}
      ref={resizeRef}
    >
      <PlayerSlots
        containerWidth={width}
        selected={selected}
        onSelectedChange={onSelectedChange}
      >
        {items.map((item, i) => (
          <Box
            key={i}
            sx={{
              minWidth: `${width}px`,
              alignItems: "center",
              marginLeft: i > 0 ? `-${width / 4}px` : 0,
              marginRight: `-${width / 4}px`,
              display: "flex",
              justifyContent: "center",
              scrollSnapAlign: "start",
            }}
          >
            {item.cd ? (
              <img
                style={{ borderRadius: "16px" }}
                src={item.cd.art?.albumBig || "/cd-placeholder-big.png"}
                width={slideWidth}
                height={slideWidth}
                alt={item.cd?.title || "CD"}
              />
            ) : (
              <Stack spacing={1} alignItems="center">
                <svg
                  width={`calc(${slideWidth}/1.2`}
                  height={`calc(${slideWidth}/1.2`}
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
        ))}
      </PlayerSlots>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "-5px",
          width: `calc(${slideWidth} / 2)`,
          background: `linear-gradient(270deg, ${alpha(theme.palette.section.background, 0)} 0%, ${alpha(theme.palette.section.background, 1)} 100%)`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: "-5px",
          width: `calc(${slideWidth} / 2)`,
          background: `linear-gradient(90deg, ${alpha(theme.palette.section.background, 0)} 0%, ${alpha(theme.palette.section.background, 1)} 100%)`,
        }}
      />
    </Box>
  );
};

const Page = () => {
  const { playerContent } = useContext(DataRepositoryContext);
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  return (
    <Stack spacing={4}>
      <PlayerContent
        items={playerContent[0]}
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
