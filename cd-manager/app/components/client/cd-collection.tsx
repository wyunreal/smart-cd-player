"use client";

import { Cd } from "@/api/types";
import {
  DeleteOutlinedIcon,
  EditOutlinedIcon,
  MoreVertIcon,
  PlaylistAddOutlinedIcon,
  PlaylistRemoveOutlinedIcon,
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
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Menu, { MenuOption } from "./menu";
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
import { removeCdFromPlayer } from "@/api/cd-player-content";

const GRID_HEADER_HEIGHT = 55;
const GRID_ROW_HEIGHT = 52;



const getPageSize = (height: number): number => {
  return height > 0
    ? Math.floor(
        (height - GRID_HEADER_HEIGHT - GRID_ROW_HEIGHT) / GRID_ROW_HEIGHT,
      )
    : 12;
};

const CdCollection = ({ cds }: { cds: { [id: number]: Cd } }) => {
  const { height, width, resizeRef } = useResizeObserver();

  const { openEditCdForm, editCdFormInstance } = useEditCdForm();
  const { confirmDialog, confirmDialogInstance } = useConfirmDialog();
  const { openAddCdToPlayerFlow, addCdToPlayerFlowInstance } =
    useAddCdToPlayerFlow();
  const { openSnackbar, snackbarInstance } = useSnackbar();

  const { refreshCds, refreshPlayerContent, playerContent } = useContext(
    DataRepositoryContext,
  );
  const { selectedCdId, selectCdById } = useCdSelection();

  // Solo cambiar cuando width cruza el umbral de 600px
  const isWide = width > 600;

  // Pre-calculate used CD IDs for O(1) access
  const usedCdIds = useMemo(() => {
    const ids = new Set<number>();
    playerContent.forEach((player) => {
      player.forEach((slot) => {
        if (slot?.cd?.id) {
          ids.add(slot.cd.id);
        }
      });
    });
    return ids;
  }, [playerContent]);

  const renderAlbumArt = useCallback(
    (params: GridRenderCellParams<Cd, string>) => {
      // Use params.value (url) directly or params.row (cd) to avoid 'cds' dependency
      const imgUrl = params.value || "/cd-placeholder-small.png";
      return (
        <Box my="5px" ml="-4px">
          <Avatar variant="rounded">
            <Image width={40} height={40} src={imgUrl} alt="Album cover" />
          </Avatar>
        </Box>
      );
    },
    [],
  );

  const renderMenu = useCallback(
    (params: GridRenderCellParams<Cd, string>) => {
      const cd = params.row; // Use row data directly without 'cds' lookup dependency
      const cdId = cd.id;
      const menuId = `cd-menu-${cdId}`;
      const isUsed = usedCdIds.has(cdId);
      
      const manageCdSlotMenuItem: MenuOption = isUsed
        ? {
            type: "action",
            icon: <PlaylistRemoveOutlinedIcon />,
            caption: "Remove from player",
            handler: async () => {
              await removeCdFromPlayer(cd.id);
              refreshCds();
              refreshPlayerContent();
              openSnackbar({
                text: `Album ${cd.artist} - ${cd.title} removed from player`,
              });
            },
          }
        : {
            type: "action",
            icon: <PlaylistAddOutlinedIcon />,
            caption: "Add to player",
            handler: () => {
              openAddCdToPlayerFlow({ cd });
            },
          };

      return (
        <Menu
          icon={<MoreVertIcon />}
          menuId={menuId}
          options={[
            {
              type: "action",
              icon: <EditOutlinedIcon />,
              caption: "Edit",
              handler: () => {
                openEditCdForm(
                  {
                    album: cd.title,
                    artist: cd.artist,
                    genre: cd.genre,
                  },
                  cd.id,
                );
              },
            },
            {
              type: "action",
              icon: <DeleteOutlinedIcon />,
              caption: "Delete",
              handler: () => {
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
              },
            },
            { type: "divider" },
            manageCdSlotMenuItem,
          ]}
        />
      );
    },
    [
      usedCdIds, // Dependent on playerContent, but faster check
      openEditCdForm,
      confirmDialog,
      openAddCdToPlayerFlow,
      refreshCds,
      refreshPlayerContent,
      openSnackbar,
    ],
  );

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "albumArt",
        headerName: "",
        width: 40,
        hideable: false,
        disableColumnMenu: true,
        sortable: false,
        renderCell: renderAlbumArt,
      },
      {
        field: "title",
        headerName: "Album",
        flex: 2,
        hideable: false,
      },
      ...(isWide
        ? [
            {
              field: "artist",
              headerName: "Artist",
              flex: 2,
              hideable: false,
            },
          ]
        : []),
      ...(isWide
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
        renderCell: renderMenu,
      },
    ],
    [isWide, renderAlbumArt, renderMenu],
  );

  const rows = useMemo(
    () =>
      Object.values(cds).map((cd) => ({
        ...cd,
        albumArt: cd.art?.album?.uri150,
        id: cd.id,
        tracksNumber: cd.tracks.length,
      })),
    [cds],
  );

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: getPageSize(height),
  });

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setVisible(true);
    }, 300);
  }, []);

  useEffect(() => {
    setPaginationModel((prev) => ({
      ...prev,
      pageSize: getPageSize(height),
    }));
  }, [height]);

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
  }, [selectedCdId, cdIds.length, paginationModel.pageSize]);

  const rowSelectionModel: GridRowSelectionModel =
    selectedCdId !== null ? [selectedCdId] : [];

  return (
    <Box
      sx={{
        flex: 1,
        position: "relative",
        height: "100%",
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
      <Box sx={{ position: "absolute", inset: 0, height: "100%" }}>
        <Paper sx={{ flex: 1, height: "100%" }}>
          <div ref={resizeRef} style={{ height: "100%" }}>
            <DataGrid
              disableColumnResize
              rows={rows}
              columns={columns}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[getPageSize(height)]}
              rowSelection
              rowSelectionModel={rowSelectionModel}
              isCellEditable={useCallback(() => false, [])}
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
                  selectCdById(Number(selection[0]));
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
