"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Art } from "@/api/types";
import { Box, SxProps, Theme } from "@mui/material";

const ITEMS_PER_PAGE = 30;

export type ImageSelectorProps = {
  images: Art[];
  selectedIndex?: number;
  onSelectionChange: (
    index: number | undefined,
    image: Art | undefined,
  ) => void;
  maxHeight?: string;
  containerSx?: SxProps<Theme>;
};

const ImageSelector = ({
  images,
  selectedIndex,
  onSelectionChange,
  maxHeight = "55vh",
  containerSx,
}: ImageSelectorProps) => {
  const [displayedImages, setDisplayedImages] = useState<Art[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (index: number) => {
    if (selectedIndex === index) {
      onSelectionChange(undefined, undefined);
    } else {
      onSelectionChange(index, images[index]);
    }
  };

  // Load initial items
  useEffect(() => {
    const initialItems = images.slice(0, ITEMS_PER_PAGE);
    setDisplayedImages(initialItems);
    setHasMore(initialItems.length < images.length);
    setPage(1);
  }, [images]);

  // Load more items
  const loadMore = useCallback(() => {
    if (!hasMore) return;

    const nextPage = page + 1;
    const startIndex = 0;
    const endIndex = nextPage * ITEMS_PER_PAGE;
    const newItems = images.slice(startIndex, endIndex);

    setDisplayedImages(newItems);
    setPage(nextPage);
    setHasMore(endIndex < images.length);
  }, [images, page, hasMore]);

  // Infinite scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollThreshold = 50; // pixels from bottom to trigger load

      if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
        loadMore();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        overflowY: "auto",
        maxHeight,
        p: 1,
        mb: 1,
        ...containerSx,
      }}
    >
      {displayedImages.map((image, index) => (
        <Box
          key={`${image.uri150}-${index}`}
          onClick={() => handleImageClick(index)}
          sx={{
            width: "calc(25% - 8px)",
            aspectRatio: "1 / 1",
            flexShrink: 0,
            borderRadius: 1,
            overflow: "hidden",
            cursor: "pointer",
            border: selectedIndex === index ? "8px solid" : "2px solid",
            borderColor:
              selectedIndex === index ? "primary.main" : "transparent",
            "&:hover": {
              borderColor: "primary.main",
            },
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <Box
            component="img"
            src={image.uri150}
            alt={`Image ${index + 1}`}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

export default ImageSelector;
