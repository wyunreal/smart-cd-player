"use client";

import { Cd } from "@/api/types";
import { Avatar, Box, Paper } from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const CdCollection = ({
  cds,
  onCdSelected,
}: {
  cds: Cd[];
  onCdSelected: (cd: Cd | null) => void;
}) => {
  const [tableContentRef, setTableContentRef] = useState<HTMLDivElement | null>(
    null
  );
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setWidth(tableContentRef ? tableContentRef.offsetWidth : 0);
    });
    if (tableContentRef) {
      resizeObserver.observe(tableContentRef);
      return () => {
        resizeObserver.disconnect();
      };
    }
  });

  const columns: GridColDef[] = [
    {
      field: "albumArt",
      headerName: "",
      width: 40,
      hideable: false,
      disableColumnMenu: true,
      sortable: false,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <Box my="5px" ml="-4px">
          <Avatar variant="rounded">
            <Image
              width={40}
              height={40}
              src={params.value || "/cd-placeholder-small.png"}
              alt="Album cover"
            />
          </Avatar>
        </Box>
      ),
    },
    {
      field: "title",
      headerName: "Album",
      flex: 2,
      hideable: false,
    },
    ...(width > 600
      ? [
          {
            field: "artist",
            headerName: "Artist",
            flex: 2,
            hideable: false,
          },
        ]
      : []),
    ...(width > 600
      ? [
          {
            field: "genre",
            headerName: "Genre",
            flex: 1,
            hideable: false,
          },
        ]
      : []),
    {
      field: "tracksNumber",
      headerName: "Tracks",
      type: "number",
      width: 80,
      hideable: false,
    },
  ];

  const paginationModel = { page: 0, pageSize: 50 };

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setVisible(true);
    }, 300);
  }, []);

  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(
    []
  );

  return (
    <Box
      sx={{
        flex: 1,
        position: "relative",
        ...(visible
          ? {
              animation: "fadeInFromNone 0.3s ease-out;",
              "@keyframes fadeInFromNone": {
                "0%": {
                  opacity: 0,
                },
                "100%": {
                  opacity: 1,
                },
              },
            }
          : { opacity: 0 }),
      }}
    >
      <Box sx={{ position: "absolute", inset: 0 }}>
        <Paper sx={{ flex: 1 }}>
          <div
            ref={(tableContentRef) => {
              setTableContentRef(tableContentRef);
            }}
          >
            <DataGrid
              disableColumnResize
              rows={cds.map((cd, index) => ({
                ...cd,
                albumArt: cd.art?.albumSmall,
                id: index,
                cdId: cd.id,
                tracksNumber: cd.tracks.length,
              }))}
              columns={columns}
              initialState={{ pagination: { paginationModel } }}
              pageSizeOptions={[50]}
              rowSelection
              isCellEditable={() => false}
              autoPageSize={false}
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
              onRowSelectionModelChange={(selection) => {
                if (selection.length > 0) {
                  setSelectionModel(selection);
                  onCdSelected(cds[selection[0] as number]);
                } else {
                  onCdSelected(null);
                }
              }}
            />
          </div>
        </Paper>
      </Box>
    </Box>
  );
};

export default CdCollection;
