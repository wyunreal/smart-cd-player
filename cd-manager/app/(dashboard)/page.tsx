import React from "react";
import Cds from "../components/server/cds";
import { Box, Paper } from "@mui/material";

const DETAILS_PANEL_WIDTH = 300;

const CdDetails = async () => (
  <Box sx={{ mx: 2, position: "absolute" }}>
    <Paper>
      <Box padding={2} minWidth={`${DETAILS_PANEL_WIDTH}px`}>
        Cd Details
      </Box>
    </Paper>
  </Box>
);

export default () => {
  return (
    <Box sx={{ display: "flex", flexDirection: "row" }}>
      <Cds />
      {true && (
        <Box
          sx={{
            width: `${DETAILS_PANEL_WIDTH + 16}px`,
            backgroundColor: "red",
          }}
        >
          <Box sx={{ position: "relative", right: 2 }}>
            <CdDetails />
          </Box>
        </Box>
      )}
    </Box>
  );
};
