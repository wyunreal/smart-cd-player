import * as React from "react";
import { Alert, Snackbar } from "@mui/material";

type SnackbarProps = {
  title?: string;
  text: string;
  severity?: "success" | "info" | "warning" | "error";
  autoHideDuration?: number;
};

const useSnackbar = () => {
  const [open, setOpen] = React.useState(false);
  const [props, setProps] = React.useState<SnackbarProps>({
    title: "",
    text: "",
  });

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, props.autoHideDuration || 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return {
    openSnackbar: (props: SnackbarProps) => {
      setProps(props);
      setOpen(true);
    },
    snackbarInstance: (
      <Snackbar
        open={open}
        message={props.text}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpen(false)}
          severity={props.severity || "info"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {props.text}
        </Alert>
      </Snackbar>
    ),
  };
};

export default useSnackbar;
