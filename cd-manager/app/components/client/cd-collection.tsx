"use client";

import { Cd } from "@/api/types";
import {
  DeleteOutlinedIcon,
  EditOutlinedIcon,
  ImageOutlinedIcon,
  MoreVertIcon,
  PlaylistAddOutlinedIcon,
  PlaylistRemoveOutlinedIcon,
} from "@/app/icons";
import { Avatar, Box, Divider, Paper } from "@mui/material";
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
import { deleteCd } from "@/api/cd-collection";
import useSnackbar from "@/app/hooks/use-snackbar";
import {
  DataRepositoryContext,
  PlayerSlot,
} from "@/app/providers/data-repository";
import useResizeObserver from "@/app/hooks/use-resize-observer";
import useAddCdToPlayerFlow from "@/app/hooks/use-add-cd-to-player-flow";
import { useCdSelection } from "@/app/providers/cd-selection-context";

const isCdInUse = (cdId: number, playerContent: PlayerSlot[][]): boolean => {
  for (let i = 0; i < playerContent.length; i++) {
    const content = playerContent[i];
    for (let j = 0; j < content.length; j++) {
      if (content[j]?.cd?.id === cdId) {
        return true;
      }
    }
  }
  return false;
};

const CdCollection = ({ cds }: { cds: { [id: number]: Cd } }) => {
  const { width, resizeRef } = useResizeObserver();

  const menuInstancesRef = React.useRef<{ [cdId: number]: React.ReactNode }>(
    {},
  );
  const avatarInstancesRef = React.useRef<{ [cdId: number]: React.ReactNode }>(
    {},
  );

  const cleanCdDataRefs = () => {
    menuInstancesRef.current = {};
    avatarInstancesRef.current = {};
  };

  const { openEditCdForm, editCdFormInstance } = useEditCdForm();
  const { confirmDialog, confirmDialogInstance } = useConfirmDialog();
  const { openAddCdToPlayerFlow, addCdToPlayerFlowInstance } =
    useAddCdToPlayerFlow({ onAfterFlowExecuted: cleanCdDataRefs });
  const { openSnackbar, snackbarInstance } = useSnackbar();

  const { refreshCds, playerContent } = useContext(DataRepositoryContext);
  const { selectedCdId, selectCdById } = useCdSelection();

  const getAvatarInstanceForCd = (cdId: number) => {
    if (avatarInstancesRef.current[cdId]) {
      return avatarInstancesRef.current[cdId];
    }

    const cd = cds[cdId];

    const avatarInstance = (
      <Box my="5px" ml="-4px">
        <Avatar variant="rounded">
          <Image
            width={40}
            height={40}
            src={cd.art?.album?.uri150 || "/cd-placeholder-small.png"}
            alt="Album cover"
          />
        </Avatar>
      </Box>
    );
    avatarInstancesRef.current[cdId] = avatarInstance;
    return avatarInstance;
  };

  const getMenuInstanceForCdId = (cdId: number) => {
    if (menuInstancesRef.current[cdId]) {
      return menuInstancesRef.current[cdId];
    }

    const menuId = `cd-menu-${cdId}`;
    const manageCdSlotMenuItem = isCdInUse(cdId, playerContent)
      ? {
          type: "action" as "action",
          icon: <PlaylistRemoveOutlinedIcon />,
          caption: "Remove from player",
          handler: () => {
            if (cdId !== undefined) {
              const cd = cds[cdId];
              alert(
                `Removing CD ${cd.artist} - ${cd.title} from player is not implemented yet.`,
              );
              // remember to call cleanCdDataRefs() and refreshCds() after implementing
            }
          },
        }
      : {
          type: "action" as "action",
          icon: <PlaylistAddOutlinedIcon />,
          caption: "Add to player",
          handler: () => {
            if (cdId !== undefined) {
              const cd = cds[cdId];
              openAddCdToPlayerFlow({ cd });
            }
          },
        };
    const menuInstance = (
      <>
        <Menu
          icon={<MoreVertIcon />}
          menuId={menuId}
          options={[
            {
              type: "action",
              icon: <EditOutlinedIcon />,
              caption: "Edit",
              handler: () => {
                if (cdId !== undefined) {
                  const cd = cds[cdId];
                  openEditCdForm(
                    {
                      album: cd.title,
                      artist: cd.artist,
                      genre: cd.genre,
                    },
                    cd.id,
                  );
                }
              },
            },
            {
              type: "action",
              icon: <DeleteOutlinedIcon />,
              caption: "Delete",
              handler: () => {
                if (cdId !== undefined) {
                  const cd = cds[cdId];
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
                        cleanCdDataRefs();
                        openSnackbar({
                          text: `Album ${cd.artist} - ${cd.title} deleted`,
                        });
                      });
                    },
                  });
                }
              },
            },
            { type: "divider" },
            manageCdSlotMenuItem,
          ]}
        />
      </>
    );
    menuInstancesRef.current[cdId] = menuInstance;
    return menuInstance;
  };

  const columns: GridColDef[] = [
    {
      field: "albumArt",
      headerName: "",
      width: 40,
      hideable: false,
      disableColumnMenu: true,
      sortable: false,
      renderCell: (params: GridRenderCellParams<any, string>) =>
        getAvatarInstanceForCd(Number(params.id)),
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
        return getMenuInstanceForCdId(Number(params.value));
      },
    },
  ];

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 12,
  });

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setVisible(true);
    }, 300);
  }, []);

  // Navigate to the page containing the selected CD
  const cdIds = Object.keys(cds).map(Number);
  useEffect(() => {
    if (selectedCdId !== null && cdIds.includes(selectedCdId)) {
      const index = cdIds.indexOf(selectedCdId);
      const targetPage = Math.floor(index / paginationModel.pageSize);
      if (targetPage !== paginationModel.page) {
        setPaginationModel((prev) => ({ ...prev, page: targetPage }));
      }
    }
  }, [selectedCdId, cdIds.length]);

  const rowSelectionModel: GridRowSelectionModel =
    selectedCdId !== null ? [selectedCdId] : [];

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
          <div ref={resizeRef}>
            <DataGrid
              disableColumnResize
              rows={Object.values(cds).map((cd) => ({
                ...cd,
                albumArt: cd.art?.album?.uri150,
                id: cd.id,
                tracksNumber: cd.tracks.length,
              }))}
              columns={columns}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[12]}
              rowSelection
              rowSelectionModel={rowSelectionModel}
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
                // Only update selection if user clicked on a row
                // Don't clear selection when changing pages
                if (selection.length > 0) {
                  selectCdById(selection[0] as number);
                }
              }}
            />
          </div>
        </Paper>
      </Box>
      {editCdFormInstance}
      {confirmDialogInstance}
      {snackbarInstance}
      {addCdToPlayerFlowInstance}
    </Box>
  );
};

export default CdCollection;
