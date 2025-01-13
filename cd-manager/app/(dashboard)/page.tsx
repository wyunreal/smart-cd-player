"use client";

import { Button } from "@mui/material";
import ResponsiveDialog from "../components/dialog/responsive-dialog";
import React from "react";

export default () => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      Collection{" "}
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Click my clith
      </Button>
      <ResponsiveDialog
        title="Example dialog"
        isOpen={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        Content
      </ResponsiveDialog>
      ;
    </>
  );
};
