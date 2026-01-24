"use client";

import { StepProps } from "@/app/components/client/flow";
import { AddCdData } from "./types";
import { useState, useRef, useEffect, useCallback } from "react";
import { Art } from "@/api/types";
import { Box, Typography } from "@mui/material";
import useTheme from "@mui/material/styles/useTheme";
import useMediaQuery from "@mui/material/useMediaQuery";

const ITEMS_PER_PAGE = 30;

const CdArtForm = ({ data }: StepProps<AddCdData>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [displayedArts, setDisplayedArts] = useState<Art[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const arts = data.arts || [];

  // Load initial items
  useEffect(() => {
    const initialItems = arts.slice(0, ITEMS_PER_PAGE);
    setDisplayedArts(initialItems);
    setHasMore(initialItems.length < arts.length);
  }, [arts]);

  // Load more items
  const loadMore = useCallback(() => {
    if (!hasMore) return;

    const nextPage = page + 1;
    const startIndex = 0;
    const endIndex = nextPage * ITEMS_PER_PAGE;
    const newItems = arts.slice(startIndex, endIndex);

    setDisplayedArts(newItems);
    setPage(nextPage);
    setHasMore(endIndex < arts.length);
  }, [arts, page, hasMore]);

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
    <>
      {isMobile && (
        <Typography sx={{ mb: 1, mt: "-16px" }}>Select CD picture:</Typography>
      )}
      <Box
        ref={containerRef}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          overflowY: "auto",
          maxHeight: isMobile ? "70vh" : "55vh",
          p: 1,
          mb: 1,
        }}
      >
        {displayedArts.map((art, index) => (
          <Box
            key={`${art.uri150}-${index}`}
            sx={{
              width: "calc(25% - 8px)",
              aspectRatio: "1 / 1",
              flexShrink: 0,
              borderRadius: 1,
              overflow: "hidden",
              cursor: "pointer",
              border: "2px solid transparent",
              "&:hover": {
                border: "2px solid",
                borderColor: "primary.main",
              },
            }}
          >
            <Box
              component="img"
              src={art.uri150}
              alt={`Album art ${index + 1}`}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </Box>
        ))}
      </Box>
    </>
  );
};

export default CdArtForm;
