"use client";

import { Button, useColorScheme } from "@mui/material";
import ResponsiveDialog from "../components/dialog/responsive-dialog";
import React from "react";
import CdForm from "../forms/cd-form";

export default () => {
  const [open, setOpen] = React.useState(false);
  const { mode, setMode } = useColorScheme();
  console.log("mode", mode);
  return (
    <>
      <Button
        onClick={() => {
          const newMode = mode === "light" ? "dark" : "light";
          setMode(newMode);
          document.cookie = `theme=${newMode}`;
        }}
      >
        Theme
      </Button>
      <Button
        onClick={() => {
          setOpen(true);
        }}
      >
        Dialog
      </Button>
      <ResponsiveDialog
        title="Example dialog"
        isOpen={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        <CdForm />
      </ResponsiveDialog>
    </>
  );
};
