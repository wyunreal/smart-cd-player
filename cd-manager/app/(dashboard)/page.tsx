"use client";

import React, { useContext, useState } from "react";
import { Box } from "@mui/material";
import CdCollection from "../components/client/cd-collection";
import CdDetails from "../components/client/cd-details";
import FullScreenSpinner from "../components/client/full-screen-spinner";
import { Cd } from "@/api/types";
import { DataRepositoryContext } from "@/providers/data-repository";

export default () => {
  const { cds } = useContext(DataRepositoryContext);
  const [selectedCd, setSelectedCd] = useState<Cd | null>(null);
  return (
    <>
      {cds !== null ? (
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <CdCollection cds={cds} onCdSelected={(cd) => setSelectedCd(cd)} />
          <CdDetails
            cd={selectedCd}
            onDialogClosed={() => setSelectedCd(null)}
          />
        </Box>
      ) : (
        <FullScreenSpinner />
      )}
    </>
  );
};
