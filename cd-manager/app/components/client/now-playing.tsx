"use client";

import { Fade, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";

const NowPlaying = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [visible, setVisible] = useState(isMobile);

  useEffect(() => {
    if (isMobile) return;
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, [isMobile]);

  return (
    <Fade in={visible} timeout={isMobile ? 0 : 500}>
      <Typography>now playing</Typography>
    </Fade>
  );
};

export default NowPlaying;
