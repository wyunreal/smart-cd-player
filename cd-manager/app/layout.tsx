"use server";

import type { Viewport } from "next";
import * as React from "react";
import { NextAppProvider } from "@toolpad/core/nextjs";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { Navigation } from "@toolpad/core/AppProvider";
import { SessionProvider, signIn, signOut } from "next-auth/react";
import { auth } from "../auth";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import { Box } from "@mui/material";
import { AlbumIcon, PlayArrowOutlinedIcon } from "./icons";
import { theme } from "@/theme/theme";
import { cookies } from "next/headers";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import ThemeCookieSync from "./components/client/theme-cookie-sync";

export async function generateViewport(): Promise<Viewport> {
  return { viewportFit: "cover" };
}

const NAVIGATION: Navigation = [
  {
    title: "Player",
    icon: <PlayArrowOutlinedIcon />,
  },
  {
    segment: "collection",
    title: "Collection",
    icon: <AlbumIcon />,
  },
];

const AUTHENTICATION = {
  signIn,
  signOut,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;

  return (
    <html
      lang="en"
      data-toolpad-color-scheme={themeCookie}
      suppressHydrationWarning
      style={{ height: "100dvh", overflow: "hidden" }}
    >
      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          height: "100dvh",
          overflow: "hidden",
        }}
      >
        <InitColorSchemeScript
          attribute="data-toolpad-color-scheme"
          defaultMode={themeCookie as "light" | "dark" | "system"}
        />
        <SessionProvider session={session}>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <NextAppProvider
              theme={theme}
              branding={{
                title: "Smart CD player",
                logo: (
                  <Box sx={{ marginTop: "8px", marginLeft: 1 }}>
                    <LibraryMusicIcon fontSize="medium" color="primary" />
                  </Box>
                ),
              }}
              navigation={NAVIGATION}
              session={session}
              authentication={AUTHENTICATION}
            >
              <ThemeCookieSync />
              {children}
            </NextAppProvider>
          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
