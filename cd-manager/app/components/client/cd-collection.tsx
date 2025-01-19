"use client";

import { AlbumArt, Cd } from "@/api/types";
import {
  DeleteOutlinedIcon,
  EditOutlinedIcon,
  ImageOutlinedIcon,
  MoreVertIcon,
} from "@/app/icons";
import { Avatar, Box, Paper } from "@mui/material";
import {
  DataGrid,
  gridClasses,
  GridColDef,
  GridRenderCellParams,
  GridRowSelectionModel,
} from "@mui/x-data-grid";
import Image from "next/image";
import React, { useContext, useEffect, useState } from "react";
import Menu from "./menu";
import useEditCdForm from "@/app/hooks/use-edit-cd-form";
import useConfirmDialog from "@/app/hooks/use-confirm-dialog";
import { deleteCd, fetchCdArt } from "@/api/cd-collection";
import useSnackbar from "@/app/hooks/use-snackbar";
import { DataRepositoryContext } from "@/providers/data-repository";

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

  const { openEditCdForm, editCdFormInstance } = useEditCdForm();
  const { confirmDialog, confirmDialogInstance } = useConfirmDialog();
  const { openSnackbar, snackbarInstance } = useSnackbar();

  const { refreshCds } = useContext(DataRepositoryContext);

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
    {
      field: "id",
      headerName: "",
      width: 60,
      hideable: false,
      disableColumnMenu: true,
      sortable: false,
      renderCell: (params: GridRenderCellParams<any, string>) => {
        const menuId = `cd-menu-${params.value}`;
        return (
          <>
            <Menu
              icon={<MoreVertIcon />}
              menuId={menuId}
              options={[
                {
                  icon: <EditOutlinedIcon />,
                  caption: "Edit",
                  handler: () => {
                    if (params.value !== undefined) {
                      const cd = cds[Number(params.value)];
                      openEditCdForm(
                        {
                          album: cd.title,
                          artist: cd.artist,
                          tracksNumber: cd.tracks.length,
                          genre: cd.genre,
                        },
                        cd.id
                      );
                    }
                  },
                },
                {
                  icon: <ImageOutlinedIcon />,
                  caption: "Fetch albun art",
                  handler: () => {
                    if (params.value !== undefined) {
                      const cd = cds[Number(params.value)];
                      const fetchArt = () =>
                        fetchCdArt(cd.id).then(() => {
                          refreshCds();
                          openSnackbar({
                            text: `Art updated for album ${cd.artist} - ${cd.title}`,
                          });
                        });
                      if (cd.art) {
                        confirmDialog({
                          title: "Update album art",
                          text: (
                            <>
                              <p>{`Are you sure you want to update the existing art for the album  ${cd.artist} - ${cd.title} ?`}</p>
                            </>
                          ),
                          okButtonText: "Yes, update",
                          cancelButtonText: "No, cancel",
                          onConfirm: fetchArt,
                        });
                      } else {
                        fetchArt();
                      }
                    }
                  },
                },
                {
                  icon: <DeleteOutlinedIcon />,
                  caption: "Delete",
                  handler: () => {
                    if (params.value !== undefined) {
                      const cd = cds[Number(params.value)];
                      confirmDialog({
                        title: "Delete album",
                        text: (
                          <>
                            <p>{`Are you sure you want to delete the album  ${cd.artist} - ${cd.title} ?`}</p>
                            <p>This action cannot be undone.</p>
                          </>
                        ),
                        okButtonText: "Yes, delete",
                        cancelButtonText: "No, cancel",
                        onConfirm: () => {
                          deleteCd(cd.id).then(() => {
                            refreshCds();
                            openSnackbar({
                              text: `Album ${cd.artist} - ${cd.title} deleted`,
                            });
                          });
                        },
                      });
                    }
                  },
                },
              ]}
            />
          </>
        );
      },
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
                [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]:
                  {
                    outline: "none",
                  },
                [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]:
                  {
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
      {editCdFormInstance}
      {confirmDialogInstance}
      {snackbarInstance}
    </Box>
  );
};

export default CdCollection;
