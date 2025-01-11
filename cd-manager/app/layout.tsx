import * as React from "react";
import { NextAppProvider } from "@toolpad/core/nextjs";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import type { Navigation } from "@toolpad/core/AppProvider";
import { SessionProvider, signIn, signOut } from "next-auth/react";
import theme from "../theme";
import { auth } from "../auth";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import { Box } from "@mui/material";
import { AlbumIcon, GroupsIcon } from "./icons";

const NAVIGATION: Navigation = [
  {
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
  return (
    <html lang="en" data-toolpad-color-scheme="light">
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
