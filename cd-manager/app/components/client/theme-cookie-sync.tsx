"use client";

import { useColorScheme } from "@mui/material/styles";
import { useEffect } from "react";

const ThemeCookieSync = () => {
  const { mode, systemMode } = useColorScheme();

  useEffect(() => {
    if (mode) {
      const value = mode === "system" ? systemMode : mode;
      if (value) {
        document.cookie = `theme=${value}; path=/; max-age=31536000`;
      }
    }
  }, [mode, systemMode]);

  return null;
};

export default ThemeCookieSync;
