"use client";

import React, { useContext, useState } from "react";
import { Box } from "@mui/material";
import CdCollection from "../../components/client/cd-collection";
import CdDetails from "../../components/client/cd-details";
import FullScreenSpinner from "../../components/client/full-screen-spinner";
import { DataRepositoryContext } from "@/app/providers/data-repository";

export default () => {
  const { cds } = useContext(DataRepositoryContext);
  const [selectedCdId, setSelectedCdId] = useState<number | null>(null);
  return (
    <>
      {cds !== null ? (
        <Box sx={{ display: "flex", flexDirection: "row" }}>
          <CdCollection
            cds={cds}
            onCdSelected={(cd) => setSelectedCdId(cd?.id || null)}
          />
          <CdDetails
            cdId={selectedCdId}
            onDialogClosed={() => setSelectedCdId(null)}
          />
        </Box>
      ) : (
        <FullScreenSpinner />
      )}
    </>
  );
};
