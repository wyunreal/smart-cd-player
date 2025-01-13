import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import React, { useEffect, useState } from "react";
import useTheme from "@mui/material/styles/useTheme";
import useMediaQuery from "@mui/material/useMediaQuery";
import { DialogContextProvider } from "./dialog-context";
import { TransitionProps } from "@mui/material/transitions";
import { DialogTitle, IconButton, Slide } from "@mui/material";
import { CloseIcon } from "@/app/icons";

const PADDING = 32;
const TITLE_BAR_HEIGHT = 56;

type FullScreenDialogProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
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
  children,
}: FullScreenDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [height, setHeight] = useState(0);

  const [dialogContentRef, setDialogContentRef] =
    useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setHeight(
        dialogContentRef ? dialogContentRef.offsetHeight + PADDING - 14 : 0
      );
    });
    if (dialogContentRef) {
      resizeObserver.observe(dialogContentRef);
      return () => {
        resizeObserver.disconnect();
      };
    }
  });

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
                height: height + TITLE_BAR_HEIGHT + PADDING + 16,
                transition: "height 0.5s",
                overflow: "hidden",
              },
          "& .MuiDialogTitle-root": {
            backgroundColor: theme.palette.background.paper,
            padding: "14px 16px",
            borderBottom: 1,
            borderColor: theme.palette.divider,
            height: TITLE_BAR_HEIGHT,
          },
        }}
      >
        <DialogTitle id="customized-dialog-title">{title}</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={() => ({
            position: "absolute",
            right: 8,
            top: 8,
          })}
        >
          <CloseIcon />
        </IconButton>
        <Box
          sx={{
            backgroundColor: theme.palette.background.default,
            padding: isMobile ? "16px" : `${PADDING}px`,
            minHeight: `calc(100vh - ${TITLE_BAR_HEIGHT + 2}px)`,
            overflowX: "hidden",
            [theme.breakpoints.up("md")]: {
              overflow: "hidden",
              minHeight: 0,
            },
          }}
        >
          <div
            style={{ height: "auto" }}
            ref={(dialogContentRef) => {
              setDialogContentRef(dialogContentRef);
            }}
          >
            {children}
          </div>
        </Box>
      </Dialog>
    </DialogContextProvider>
  );
};

export default ResponsiveDialog;
