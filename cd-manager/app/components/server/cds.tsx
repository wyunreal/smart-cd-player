"use server";

import React from "react";
import { getCdCollection } from "@/api/cd-collection";
import CdCollection from "../client/cd-collection";
import { Box, Paper, Typography } from "@mui/material";

const Cds = async () => {
  const cds = await getCdCollection();
  return <CdCollection cds={cds || []} />;
};

export default Cds;
