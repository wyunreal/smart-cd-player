import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import React from "react";
import useTheme from "@mui/material/styles/useTheme";
import useMediaQuery from "@mui/material/useMediaQuery";
import { DialogContextProvider } from "./dialog-context";
import { TransitionProps } from "@mui/material/transitions";
import { AppBar, DialogTitle, IconButton, Slide } from "@mui/material";
import { CloseIcon } from "@/app/icons";
import type {} from "@mui/material/themeCssVarsAugmentation";
import useResizeObserver from "@/app/hooks/use-resize-observer";

const PADDING = 16;
const TITLE_BAR_HEIGHT = 64;

type FullScreenDialogProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  forcedHeight?: number;
  noHeader?: boolean;
  children: React.ReactNode;
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ResponsiveDialog = ({
  title,
  isOpen,
  onClose,
  forcedHeight,
  noHeader,
  children,
}: FullScreenDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { height, resizeRef } = useResizeObserver();

  return (
    <DialogContextProvider>
      <Dialog
        fullScreen={isMobile}
        open={isOpen}
        onClose={onClose}
        TransitionComponent={Transition}
        transitionDuration={350}
        sx={{
          "& .MuiDialog-paper": isMobile
            ? { borderRadius: 0 }
            : {
                width: "600px",
                height: forcedHeight ?? height + TITLE_BAR_HEIGHT + 3 * PADDING,
                transition: "height 0.5s",
                overflow: "hidden",
                backgroundColor: theme.vars.palette.section.background,
              },
        }}
      >
        {!noHeader ? (
          <AppBar position="relative">
            <DialogTitle id="customized-dialog-title">{title}</DialogTitle>
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={() => ({
                position: "absolute",
                right: 8,
                top: 12,
              })}
            >
              <CloseIcon />
            </IconButton>
          </AppBar>
        ) : (
          <Box position="relative">
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={() => ({
                position: "absolute",
                right: 12,
                top: 12,
                zIndex: 100,
              })}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        )}
        <Box
          sx={{
            backgroundColor: theme.vars.palette.section.background,
            paddingY: isMobile ? "16px" : `${PADDING}px`,
            paddingX: isMobile ? "16px" : `${2 * PADDING}px`,
            minHeight: isMobile
              ? noHeader
                ? "100vh"
                : `calc(100vh - ${TITLE_BAR_HEIGHT}px)`
              : "300px",
            overflow: "hidden",
            [theme.breakpoints.up("md")]: {
              overflow: "hidden",
              minHeight: 0,
            },
          }}
        >
          <div style={{ height: "auto" }} ref={resizeRef}>
            {children}
          </div>
        </Box>
      </Dialog>
    </DialogContextProvider>
  );
};

export default ResponsiveDialog;
