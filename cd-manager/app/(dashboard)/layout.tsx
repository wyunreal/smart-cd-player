"use client";

import * as React from "react";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { PageContainer } from "@toolpad/core/PageContainer";
import SidebarFooterAccount, {
  ToolbarAccountOverride,
} from "./sidebar-footer-account";
import { useTheme } from "@mui/material";
import MainActions from "../components/client/main-actions";
import { DataRepositoryProvider } from "@/app/providers/data-repository";
import { CdSelectionProvider } from "@/app/providers/cd-selection-context";

export default function Layout(props: { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <CdSelectionProvider>
      <DataRepositoryProvider>
        <DashboardLayout
          slots={{
            toolbarAccount: ToolbarAccountOverride,
            sidebarFooter: SidebarFooterAccount,
            toolbarActions: MainActions,
          }}
          sx={{
            height: "calc(100dvh - env(safe-area-inset-bottom))",
            "& nav .MuiListItem-root .MuiListItemIcon-root": {
              minWidth: "38px",
              marginTop: "3px",
            },
            "& .MuiDrawer-paper": {
              borderRight: 0,
              "& .MuiListItem-root": {
                marginBottom: 2,
              },
              "& .Mui-selected": {
                backgroundColor: theme.vars.palette.navigation.background,
                color: theme.vars.palette.primary.main,
                "& .MuiListItemIcon-root": {
                  color: theme.vars.palette.primary.main,
                },
              },

              "& .MuiListItemButton-root:hover": {
                backgroundColor: theme.vars.palette.navigation.background,
                [theme.breakpoints.down("md")]: {
                  backgroundColor: "inherit",
                },
              },
              "&& .MuiTouchRipple-child": {
                backgroundColor: theme.vars.palette.primary.main,
              },
            },
            "& .MuiAppBar-root": {
              boxShadow:
                "0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)",
            },
            "& main": {
              backgroundColor: theme.vars.palette.section.background,
            },
            "& .MuiAvatar-root": {
              color: theme.vars.palette.primary.main,
              background: theme.vars.palette.primary.light,
            },
          }}
        >
          <PageContainer>{props.children}</PageContainer>
        </DashboardLayout>
      </DataRepositoryProvider>
    </CdSelectionProvider>
  );
}
