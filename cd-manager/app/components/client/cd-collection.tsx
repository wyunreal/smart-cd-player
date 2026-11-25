"use client";

import { Cd } from "@/api/types";
import {
  DeleteOutlinedIcon,
  EditOutlinedIcon,
  MoreVertIcon,
  PlayArrowOutlinedIcon,
  PlaylistAddOutlinedIcon,
  PlaylistRemoveOutlinedIcon,
} from "@/app/icons";
import { Avatar, Box, Paper, useMediaQuery, useTheme } from "@mui/material";
import {
  DataGrid,
  gridClasses,
  GridColDef,
  GridFilterModel,
  GridFilterOperator,
  GridPaginationModel,
  GridRenderCellParams,
  GridRowSelectionModel,
  GridSortModel,
} from "@mui/x-data-grid";
import Image from "next/image";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Menu, { MenuOption } from "./menu";
import useEditCdForm from "@/app/hooks/use-edit-cd-form";
import useConfirmDialog from "@/app/hooks/use-confirm-dialog";
import { deleteCd } from "@/api/cd-collection";
import useSnackbar from "@/app/hooks/use-snackbar";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import useResizeObserver from "@/app/hooks/use-resize-observer";
import useAddCdToPlayerFlow from "@/app/hooks/use-add-cd-to-player-flow";
import { useCdSelection } from "@/app/providers/cd-selection-context";
import { removeCdFromPlayer } from "@/api/cd-player-content";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/app/util/routes";

const GRID_HEADER_HEIGHT = 55;
const GRID_ROW_HEIGHT = 52;

const getPageSize = (height: number): number => {
  return height > 0
    ? Math.min(
        100,
        Math.max(
          1,
          Math.floor(
            (height - GRID_HEADER_HEIGHT - GRID_ROW_HEIGHT) / GRID_ROW_HEIGHT,
          ),
        ),
      )
    : 12;
};

type CdGridRow = Cd & {
  albumArt?: string;
  tracksNumber: number;
};

const sortRows = (
  rows: CdGridRow[],
  sortModel: GridSortModel,
): CdGridRow[] => {
  if (sortModel.length === 0) return rows;

  return [...rows].sort((a, b) => {
    for (const { field, sort } of sortModel) {
      const aValue = (a as unknown as Record<string, unknown>)[field];
      const bValue = (b as unknown as Record<string, unknown>)[field];

      if (aValue === bValue) continue;

      let comparison: number;
      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue ?? "").localeCompare(String(bValue ?? ""));
      }

      if (comparison !== 0) {
        return sort === "asc" ? comparison : -comparison;
      }
    }
    return 0;
  });
};

// Filtering is applied by this component because the grids use server-side
// pagination. Keeping the operators here also limits the filter panel to the
// operations we support.
const stringFilterOperators: GridFilterOperator[] = [
  { value: "contains", label: "contains", getApplyFilterFn: () => null },
  {
    value: "doesNotContain",
    label: "does not contain",
    getApplyFilterFn: () => null,
  },
  { value: "equals", label: "equals", getApplyFilterFn: () => null },
  {
    value: "doesNotEqual",
    label: "does not equal",
    getApplyFilterFn: () => null,
  },
  { value: "startsWith", label: "starts with", getApplyFilterFn: () => null },
  { value: "endsWith", label: "ends with", getApplyFilterFn: () => null },
  {
    value: "isEmpty",
    label: "is empty",
    requiresFilterValue: false,
    getApplyFilterFn: () => null,
  },
  {
    value: "isNotEmpty",
    label: "is not empty",
    requiresFilterValue: false,
    getApplyFilterFn: () => null,
  },
];

const numberFilterOperators: GridFilterOperator[] = [
  { value: "=", label: "=", getApplyFilterFn: () => null },
  { value: "!=", label: "!=", getApplyFilterFn: () => null },
  { value: ">", label: ">", getApplyFilterFn: () => null },
  { value: ">=", label: ">=", getApplyFilterFn: () => null },
  { value: "<", label: "<", getApplyFilterFn: () => null },
  { value: "<=", label: "<=", getApplyFilterFn: () => null },
  {
    value: "isEmpty",
    label: "is empty",
    requiresFilterValue: false,
    getApplyFilterFn: () => null,
  },
  {
    value: "isNotEmpty",
    label: "is not empty",
    requiresFilterValue: false,
    getApplyFilterFn: () => null,
  },
];

const applyFilter = (
  rows: CdGridRow[],
  filterModel: GridFilterModel,
): CdGridRow[] => {
  const items = filterModel.items.filter((item) => !!item.field);
  const quickValues = (filterModel.quickFilterValues ?? [])
    .map((value) => String(value).toLowerCase())
    .filter(Boolean);

  if (items.length === 0 && quickValues.length === 0) return rows;

  return rows.filter((row) => {
    const itemResults = items.map((item) => {
      const rawValue = (row as unknown as Record<string, unknown>)[item.field];
      const rowValue = String(rawValue ?? "").toLowerCase();
      const filterValue = String(item.value ?? "").toLowerCase();
      const operator =
        item.operator ??
        (typeof rawValue === "number" ? "=" : "contains");

      switch (operator) {
        case "contains":
          return rowValue.includes(filterValue);
        case "doesNotContain":
          return !rowValue.includes(filterValue);
        case "equals":
          return rowValue === filterValue;
        case "doesNotEqual":
          return rowValue !== filterValue;
        case "startsWith":
          return rowValue.startsWith(filterValue);
        case "endsWith":
          return rowValue.endsWith(filterValue);
        case "isEmpty":
          return rowValue.trim() === "";
        case "isNotEmpty":
          return rowValue.trim() !== "";
        case "=":
          return Number(rawValue) === Number(item.value);
        case "!=":
          return Number(rawValue) !== Number(item.value);
        case ">":
          return Number(rawValue) > Number(item.value);
        case ">=":
          return Number(rawValue) >= Number(item.value);
        case "<":
          return Number(rawValue) < Number(item.value);
        case "<=":
          return Number(rawValue) <= Number(item.value);
        default:
          return true;
      }
    });

    const matchesItems =
      filterModel.logicOperator === "or"
        ? itemResults.some(Boolean)
        : itemResults.every(Boolean);
    if (!matchesItems) return false;

    if (quickValues.length === 0) return true;

    return quickValues.every((needle) =>
      [row.title, row.artist, row.genre, row.tracksNumber].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  });
};

const CdCollection = ({ cds }: { cds: { [id: number]: Cd } }) => {
  const { height, width, resizeRef } = useResizeObserver();
  const theme = useTheme();
  const isUltraWide = useMediaQuery(theme.breakpoints.up("xxl"));

  const { openEditCdForm, editCdFormInstance } = useEditCdForm();
  const { confirmDialog, confirmDialogInstance } = useConfirmDialog();
  const { openAddCdToPlayerFlow, addCdToPlayerFlowInstance } =
    useAddCdToPlayerFlow();
  const { openSnackbar, snackbarInstance } = useSnackbar();

  const {
    refreshCds,
    refreshPlayerContent,
    playerContent,
    visibleSlots,
    setSelectedVirtualNumber,
  } = useContext(DataRepositoryContext);
  const router = useRouter();
  const { selectedCdId, selectCdById, clearSelection } = useCdSelection();

  // Width available to each grid. When two grids are shown the details panel
  // and the gap reduce the per-grid width.
  const gridWidth = isUltraWide ? Math.max(0, (width - 16) / 2) : width;
  const isWide = gridWidth > 600;

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

      const seeOnPlayerMenuItem: MenuOption | null = isUsed
        ? (() => {
            const visibleSlot = visibleSlots.find(
              (slot) => slot.cd?.id === cdId,
            );
            if (!visibleSlot) return null;
            return {
              type: "action" as const,
              icon: <PlayArrowOutlinedIcon />,
              caption: "See on player",
              handler: () => {
                setSelectedVirtualNumber(visibleSlot.number);
                router.push(ROUTES.PLAYER);
              },
            };
          })()
        : null;

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
            ...(seeOnPlayerMenuItem ? [seeOnPlayerMenuItem] : []),
            manageCdSlotMenuItem,
          ]}
        />
      );
    },
    [
      usedCdIds, // Dependent on playerContent, but faster check
      visibleSlots,
      setSelectedVirtualNumber,
      router,
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
        filterable: false,
        renderCell: renderAlbumArt,
      },
      {
        field: "title",
        headerName: "Album",
        flex: 2,
        hideable: false,
        filterOperators: stringFilterOperators,
      },
      ...(isWide
        ? [
            {
              field: "artist",
              headerName: "Artist",
              flex: 2,
              hideable: false,
              filterOperators: stringFilterOperators,
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
              filterOperators: stringFilterOperators,
            },
          ]
        : []),
      {
        field: "tracksNumber",
        headerName: "Tracks",
        type: "number",
        width: 80,
        hideable: false,
        filterOperators: numberFilterOperators,
      },
      {
        field: "id",
        headerName: "",
        width: 60,
        hideable: false,
        disableColumnMenu: true,
        sortable: false,
        filterable: false,
        renderCell: renderMenu,
      },
    ],
    [isWide, renderAlbumArt, renderMenu],
  );

  const rows = useMemo<CdGridRow[]>(
    () =>
      Object.values(cds).map((cd) => ({
        ...cd,
        albumArt: cd.art?.album?.uri150,
        id: cd.id,
        tracksNumber: cd.tracks.length,
      })),
    [cds],
  );

  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });
  const hasActiveFilter =
    filterModel.items.length > 0 || !!filterModel.quickFilterValues?.length;
  const pageSize = getPageSize(height);
  // MUI DataGrid MIT caps pageSize at 100. In two-column mode the paging
  // control represents both grids, so each grid can use at most 50 rows.
  const gridPageSize = isUltraWide ? Math.min(pageSize, 50) : pageSize;
  const uiPageSize = isUltraWide ? gridPageSize * 2 : gridPageSize;

  const filteredRows = useMemo(
    () => applyFilter(rows, filterModel),
    [rows, filterModel],
  );

  const sortedRows = useMemo(
    () => sortRows(filteredRows, sortModel),
    [filteredRows, sortModel],
  );

  const [pageGroup, setPageGroup] = useState(0);

  const paginationModel = useMemo<GridPaginationModel>(
    () => ({ page: pageGroup, pageSize: uiPageSize }),
    [pageGroup, uiPageSize],
  );

  const columnRows = useMemo(() => {
    if (!isUltraWide) {
      const start = pageGroup * gridPageSize;
      return {
        left: sortedRows.slice(start, start + gridPageSize),
        right: [] as CdGridRow[],
      };
    }

    const start = pageGroup * gridPageSize * 2;
    return {
      left: sortedRows.slice(start, start + gridPageSize),
      right: sortedRows.slice(
        start + gridPageSize,
        start + gridPageSize * 2,
      ),
    };
  }, [sortedRows, isUltraWide, pageGroup, gridPageSize]);

  const isNavigatingToSelection = useRef(false);
  const lastAutoNavigatedCdId = useRef<number | null>(null);

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setVisible(true);
    }, 300);
  }, []);

  // Reset navigation tracking when the visible data layout changes so the
  // selected row can be located again.
  useEffect(() => {
    lastAutoNavigatedCdId.current = null;
  }, [hasActiveFilter, gridPageSize, sortModel, filterModel, isUltraWide]);

  // Layout, filter, sort or page-size changes start from the first page.
  useEffect(() => {
    setPageGroup(0);
  }, [hasActiveFilter, isUltraWide, sortModel, gridPageSize, filterModel]);

  // Deleting rows can leave the current page out of range.
  const maxPage = Math.max(
    0,
    Math.ceil(sortedRows.length / uiPageSize) - 1,
  );
  useEffect(() => {
    setPageGroup((prev) => Math.min(prev, maxPage));
  }, [maxPage]);

  useEffect(() => {
    if (selectedCdId === null || hasActiveFilter) {
      if (selectedCdId === null) {
        lastAutoNavigatedCdId.current = null;
      }
      return;
    }

    if (selectedCdId === lastAutoNavigatedCdId.current) return;

    const selectedIndex = sortedRows.findIndex(
      (row) => row.id === selectedCdId,
    );
    if (selectedIndex === -1) return;

    lastAutoNavigatedCdId.current = selectedCdId;

    const targetPage = isUltraWide
      ? Math.floor(selectedIndex / (gridPageSize * 2))
      : Math.floor(selectedIndex / gridPageSize);

    setPageGroup((prev) => {
      if (targetPage !== prev) {
        isNavigatingToSelection.current = true;
        return targetPage;
      }
      return prev;
    });
  }, [
    selectedCdId,
    hasActiveFilter,
    sortedRows,
    isUltraWide,
    gridPageSize,
  ]);

  const gridSx = useMemo(
    () => ({
      border: 0,
      borderRadius: "8px",
      "& .MuiDataGrid-columnSeparator": {
        display: "none",
      },
      [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]: {
        outline: "none",
      },
      [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]:
        {
          outline: "none",
        },
    }),
    [],
  );

  const onRowSelectionModelChange = useCallback(
    (selection: GridRowSelectionModel) => {
      if (selection.length > 0) {
        selectCdById(Number(selection[0]));
      }
    },
    [selectCdById],
  );

  const onPaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      if (selectedCdId !== null && !isNavigatingToSelection.current) {
        clearSelection();
      }
      isNavigatingToSelection.current = false;
      setPageGroup(model.page);
    },
    [selectedCdId, clearSelection],
  );

  const pageSizeOptions = useMemo(() => [uiPageSize], [uiPageSize]);
  const isCellEditable = useCallback(() => false, []);

  const renderGrid = (gridRows: CdGridRow[], key: string) => {
    const gridSelectionModel: GridRowSelectionModel =
      selectedCdId !== null &&
      gridRows.some((row) => row.id === selectedCdId)
        ? [selectedCdId]
        : [];

    return (
      <Box
        key={key}
        sx={{
          flex: 1,
          minWidth: 0,
          height: "100%",
        }}
      >
        <Paper sx={{ height: "100%" }}>
          <div style={{ height: "100%" }}>
            <DataGrid
              disableColumnResize
              rows={gridRows}
              columns={columns}
              paginationMode="server"
              rowCount={sortedRows.length}
              paginationModel={paginationModel}
              onPaginationModelChange={onPaginationModelChange}
              pageSizeOptions={pageSizeOptions}
              rowSelection
              rowSelectionModel={gridSelectionModel}
              isCellEditable={isCellEditable}
              autoPageSize={false}
              sx={gridSx}
              onRowSelectionModelChange={onRowSelectionModelChange}
              filterMode="server"
              filterModel={filterModel}
              onFilterModelChange={setFilterModel}
              sortingMode="server"
              sortModel={sortModel}
              onSortModelChange={setSortModel}
            />
          </div>
        </Paper>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
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
        <Box
          ref={resizeRef}
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: isUltraWide ? 2 : 0,
            height: "100%",
            minWidth: 0,
          }}
        >
          {renderGrid(columnRows.left, "left-grid")}
          {isUltraWide && renderGrid(columnRows.right, "right-grid")}
        </Box>
      </Box>
      {editCdFormInstance}
      {confirmDialogInstance}
      {snackbarInstance}
      {addCdToPlayerFlowInstance}
    </Box>
  );
};

export default CdCollection;
