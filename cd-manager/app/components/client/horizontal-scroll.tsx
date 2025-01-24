import { Box } from "@mui/material";
import React from "react";

const HorizontalScroll = ({
  items,
  width,
}: {
  items: React.ReactNode[];
  width: string;
}) => {
  return (
    <Box width={width}>
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
        {items.map((item, index) => (
          <Box
            sx={{
              scrollSnapAlign: "start",
            }}
            key={index}
          >
            {item}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default HorizontalScroll;
