import React from "react";
import Cds from "../components/server/cds";
import { Box, Paper } from "@mui/material";

const DETAILS_PANEL_WIDTH = "300px";

const CdDetails = async () => (
  <Box sx={{ marginTop: 12, marginLeft: 2 }}>
    <Paper>
      <Box padding={2} minWidth={DETAILS_PANEL_WIDTH}>
        Cd Details
      </Box>
    </Paper>
  </Box>
);

export default () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "row" }}>
      <Box sx={{ display: "flex", flex: 1 }}>
        <Cds />
      </Box>
      {true && (
        <Box sx={{ width: DETAILS_PANEL_WIDTH }}>
          <Box sx={{ position: "absolute", top: "64px" }}>
            <CdDetails />
          </Box>
        </Box>
      )}
    </Box>
  );
};
