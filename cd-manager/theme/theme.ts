"use client";

import {
  background,
  darkBackground,
  section,
  darkSection,
  navigation,
  darkNavigation,
  primary,
  darkPrimary,
  secondary,
  darkSecondary,
  darkText,
  darkError,
  extraColors,
  icon,
  darkIcon,
  darkSuccess,
} from "./colors";
import { fontSize, typography } from "./typography";
import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import getComponentsOverrides from "./components";

declare module "@mui/material/styles/createPalette" {
  export interface Palette {
    section: {
      background: string;
    };
    navigation: {
      main: string;
      selected: string;
      background: string;
    };
    icon: {
      inverse: string;
    };
    extra: string[];
  }
  export interface PaletteOptions {
    section: {
      background: string;
    };
    navigation: {
      main: string;
      selected: string;
      background: string;
    };
    icon: {
      inverse: string;
    };
    extra: string[];
  }
}

export const lightTheme = getComponentsOverrides(
  responsiveFontSizes(
    createTheme({
      palette: {
        primary,
        secondary,
        background,
        section,
        navigation,
        icon,
        extra: extraColors,
      },
      typography,
    }),
    fontSize
  )
);

export const darkTheme = getComponentsOverrides(
  responsiveFontSizes(
    createTheme({
      palette: {
        mode: "dark",
        primary: darkPrimary,
        secondary: darkSecondary,
        background: darkBackground,
        section: darkSection,
        navigation: darkNavigation,
        success: darkSuccess,
        error: darkError,
        text: darkText,
        icon: darkIcon,
        extra: extraColors,
      },
      typography,
    }),
    fontSize
  )
);
