"use client";

import { alpha, Box, useTheme } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import useResizeObserver from "../../hooks/use-resize-observer";

const CarouselSlides = ({
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

const Carousel = <T extends {}>({
  items,
  renderItem,
  selected,
  onSelectedChange,
}: {
  items: T[];
  renderItem: (
    item: T,
    index: number,
    containerWidth: number,
    itemWidth: string,
    selected: number
  ) => React.ReactNode;
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
      <CarouselSlides
        containerWidth={width}
        selected={selected}
        onSelectedChange={onSelectedChange}
      >
        {items.map((item, index) =>
          renderItem(item, index, width, slideWidth, selected)
        )}
      </CarouselSlides>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "-5px",
          width: `calc(${slideWidth} / 2)`,
          cursor: "pointer",
          background: `linear-gradient(270deg, ${alpha(theme.palette.section.background, 0)} 0%, ${alpha(theme.palette.section.background, 1)} 100%)`,
          zIndex: 200,
        }}
        onClick={(e) => {
          if (selected > 0) {
            onSelectedChange?.(selected - 1);
          }
          e.stopPropagation();
          e.preventDefault();
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: "-5px",
          width: `calc(${slideWidth} / 2)`,
          cursor: "pointer",
          background: `linear-gradient(90deg, ${alpha(theme.palette.section.background, 0)} 0%, ${alpha(theme.palette.section.background, 1)} 100%)`,
          zIndex: 200,
        }}
        onClick={(e) => {
          if (selected < items.length - 1) {
            onSelectedChange?.(selected + 1);
          }
          e.stopPropagation();
          e.preventDefault();
        }}
      />
    </Box>
  );
};

export default Carousel;
