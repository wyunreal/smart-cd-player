import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import {
  AppBar,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { CloseIcon } from "../icons";

type ConfirmDialogProps = {
  title: string;
  text: React.ReactNode;
  okButtonText: string;
  cancelButtonText: string;
  onConfirm: () => void;
};

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const useConfirmDialog = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = React.useState(false);
  const [props, setProps] = React.useState<ConfirmDialogProps>({
    title: "",
    text: <></>,
    okButtonText: "",
    cancelButtonText: "",
    onConfirm: () => {},
  });

  const handleClose = () => {
    setOpen(false);
  };

  return {
    confirmDialog: (props: ConfirmDialogProps) => {
      setProps(props);
      setOpen(true);
    },
    confirmDialogInstance: (
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="confirm-dialog-description"
      >
        <AppBar position="relative">
          <DialogTitle id="customized-dialog-title">{props.title}</DialogTitle>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={() => ({
              position: "absolute",
              right: 8,
              top: 12,
            })}
          >
            <CloseIcon />
          </IconButton>
        </AppBar>
        <Box
          sx={{
            backgroundColor: theme.vars.palette.section.background,
            padding: isMobile ? "16px" : "32px",
          }}
        >
          <Box
            id="confirm-dialog-description"
            sx={{
              paddingBottom: "16px",
            }}
          >
            {props.text}
          </Box>

          <DialogActions>
            <Button variant="outlined" onClick={handleClose}>
              {props.cancelButtonText}
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                handleClose();
                props.onConfirm();
              }}
            >
              {props.okButtonText}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    ),
  };
};

export default useConfirmDialog;
