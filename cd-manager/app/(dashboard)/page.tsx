"use client";

import { Button } from "@mui/material";
import ResponsiveDialog from "../components/dialog/responsive-dialog";
import React, { useEffect } from "react";
import CdForm from "../forms/cd-form";

export default () => {
  const [open, setOpen] = React.useState(false);
  return (
    <>
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
