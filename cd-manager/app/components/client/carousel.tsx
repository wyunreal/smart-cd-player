"use client";

import { alpha, Box, useTheme } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";

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
  }, [selected, scrollContanierRef, containerWidth]);

  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(() => {
    if (!onSelectedChange || containerWidth <= 0) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      onSelectedChange(
        Math.round(
          ((scrollContanierRef?.scrollLeft ?? 0) * 2) / containerWidth,
        ),
      );
    }, 150);
  }, [containerWidth, scrollContanierRef, onSelectedChange]);

  useEffect(() => {
    const el = scrollContanierRef;
    el?.addEventListener("scroll", handleScroll);
    return () => {
      el?.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [scrollContanierRef, handleScroll]);

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

const Carousel = <T extends object>({
  items,
  renderItem,
  slideDimensions,
  containerWidth,
  selectedIndex,
  onSelectedIndexChange,
}: {
  items: T[];
  renderItem: (
    item: T,
    index: number,
    containerWidth: number,
    itemDimensions: {
      width: string;
      height: string;
    },
    selectedIndex: number,
  ) => React.ReactNode;
  slideDimensions: {
    width: string;
    height: string;
  };
  containerWidth: number;
  selectedIndex: number;
  onSelectedIndexChange?: (index: number) => void;
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        position: "relative",
      }}
    >
      <CarouselSlides
        containerWidth={containerWidth}
        selected={selectedIndex}
        onSelectedChange={onSelectedIndexChange}
      >
        {items.map((item, index) =>
          renderItem(
            item,
            index,
            containerWidth,
            slideDimensions,
            selectedIndex,
          ),
        )}
      </CarouselSlides>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "-5px",
          width: `calc(${slideDimensions.width} / 2)`,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          background: `linear-gradient(270deg, ${alpha(theme.palette.section.background, 0)} 0%, ${alpha(theme.palette.section.background, 1)} 100%)`,
          zIndex: 200,
        }}
        onClick={(e) => {
          if (selectedIndex > 0) {
            onSelectedIndexChange?.(selectedIndex - 1);
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
          width: `calc(${slideDimensions.width} / 2)`,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          background: `linear-gradient(90deg, ${alpha(theme.palette.section.background, 0)} 0%, ${alpha(theme.palette.section.background, 1)} 100%)`,
          zIndex: 200,
        }}
        onClick={(e) => {
          if (selectedIndex < items.length - 1) {
            onSelectedIndexChange?.(selectedIndex + 1);
          }
          e.stopPropagation();
          e.preventDefault();
        }}
      />
    </Box>
  );
};

export default Carousel;
