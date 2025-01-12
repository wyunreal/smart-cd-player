"use client";
import { createTheme } from "@mui/material/styles";
import getMPTheme from "./theme/getMPTheme";

const lightTheme = createTheme({ ...getMPTheme("light"), cssVariables: true });
const darkTheme = createTheme({ ...getMPTheme("dark"), cssVariables: true });

const theme = {
  light: lightTheme,
  dark: darkTheme,
};

export default theme;
