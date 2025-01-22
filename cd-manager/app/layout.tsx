"use server";

import * as React from "react";
import { NextAppProvider } from "@toolpad/core/nextjs";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { Navigation } from "@toolpad/core/AppProvider";
import { SessionProvider, signIn, signOut } from "next-auth/react";
import { auth } from "../auth";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import { Box } from "@mui/material";
import { AlbumIcon, GroupsIcon, PlayArrowOutlinedIcon } from "./icons";
import { theme } from "@/theme/theme";
import { cookies } from "next/headers";

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
  {
    segment: "groups",
    title: "Groups",
    icon: <GroupsIcon />,
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
      className={themeCookie}
      data-toolpad-color-scheme={themeCookie}
    >
      <body>
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
              {children}
            </NextAppProvider>
          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
