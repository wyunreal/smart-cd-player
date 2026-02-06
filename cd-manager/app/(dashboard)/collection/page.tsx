"use client";

import React, { useContext } from "react";
import { Box } from "@mui/material";
import CdCollection from "../../components/client/cd-collection";
import CdDetails from "../../components/client/cd-details";
import FullScreenSpinner from "../../components/client/full-screen-spinner";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import { useCdSelection } from "@/app/providers/cd-selection-context";

const CollectionPage = () => {
  const { cds } = useContext(DataRepositoryContext);
  const { selectedCdId, clearSelection } = useCdSelection();

  return (
    <>
      {cds !== null ? (
        <Box sx={{ display: "flex", flexDirection: "row", height: "100%" }}>
          <CdCollection cds={cds} />
          <CdDetails
            cdId={selectedCdId}
            onDialogClosed={() => clearSelection()}
          />
        </Box>
      ) : (
        <FullScreenSpinner />
      )}
    </>
  );
};

export default CollectionPage;
