import { useColorScheme } from "@mui/material";
import React from "react";

const useThemeCookie = () => {
  const { mode, setMode } = useColorScheme();
  React.useEffect(() => {
    document.cookie = `theme=${mode};path=/;max-age=31536000`;
  }, [mode]);
  return { mode, setMode };
};

export default useThemeCookie;
