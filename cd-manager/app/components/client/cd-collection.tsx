"use client";

import { Cd } from "@/api/types";
import { Box, Paper } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const CdCollection = ({ cds }: { cds: Cd[] }) => {
  const columns: GridColDef[] = [
    {
      field: "title",
      headerName: "Album",
      flex: 2,
      hideable: false,
    },
    {
      field: "artist",
      headerName: "Artist",
      flex: 2,
      hideable: false,
    },
    {
      field: "genre",
      headerName: "Genre",
      flex: 1,
      hideable: false,
    },
    {
      field: "tracksNumber",
      headerName: "Tracks",
      type: "number",
      width: 80,
      hideable: false,
    },
  ];

  const paginationModel = { page: 0, pageSize: 5 };

  return (
    <Box sx={{ flex: 1, position: "relative" }}>
      <Box sx={{ position: "absolute", inset: 0 }}>
        <Paper sx={{ flex: 1 }}>
          <DataGrid
            disableColumnResize
            rows={cds.map((cd, index) => ({
              ...cd,
              id: index,
              cdId: cd.id,
              tracksNumber: cd.tracks.length,
            }))}
            columns={columns}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[5, 10, 20, 50]}
            rowSelection
            isCellEditable={() => false}
            sx={{
              border: 0,
              borderRadius: "8px",
              "& .MuiDataGrid-columnSeparator": {
                display: "none",
              },
              "& .MuiDataGrid-cell:focus": {
                outline: "none",
              },
              "& .MuiDataGrid-columnHeader:focus": {
                outline: "none",
              },
              "& .MuiDataGrid-columnHeader:focus-within": {
                outline: "none",
              },
            }}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default CdCollection;
