"use client";

import { Cd } from "@/api/types";
import { Paper } from "@mui/material";
import { Table } from "@mui/material";
import { TableBody } from "@mui/material";
import { TableCell } from "@mui/material";
import { TableContainer } from "@mui/material";
import { TableHead } from "@mui/material";
import { TableRow } from "@mui/material";

const CdCollection = ({ cds }: { cds: Cd[] }) => {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Artist</TableCell>
            <TableCell align="right">Tracks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cds.map((cd, index) => (
            <TableRow
              key={`${index}-${cd.id}`}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {cd.title}
              </TableCell>
              <TableCell>{cd.artist}</TableCell>
              <TableCell align="right">
                {Object.entries(cd.tracks).length}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CdCollection;
