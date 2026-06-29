import "server-only";

import XLSX from "xlsx-js-style";

import { excelStyles } from "@/lib/export/excel/styles";

export type StyledCell = {
  value: string | number | null;
  style?: (typeof excelStyles)[keyof typeof excelStyles];
};

export type ExportSheetMeta = {
  title: string;
  subtitleLines: string[];
  headers: string[];
  rows: StyledCell[][];
  columnWidths: number[];
  sheetName: string;
  centerHeaderIndexes?: number[];
  rightAlignHeaderIndexes?: number[];
  monoColumnIndexes?: number[];
  numberColumnIndexes?: number[];
  accentColumnIndexes?: number[];
};

function cellRef(row: number, col: number) {
  return XLSX.utils.encode_cell({ r: row, c: col });
}

function setCell(
  sheet: XLSX.WorkSheet,
  row: number,
  col: number,
  value: string | number | null,
  style?: (typeof excelStyles)[keyof typeof excelStyles],
) {
  const display = value === null || value === "" ? "—" : value;
  sheet[cellRef(row, col)] = {
    v: display,
    t: typeof display === "number" ? "n" : "s",
    s: style,
  };
}

function pickRowStyle(
  rowIndex: number,
  colIndex: number,
  meta: ExportSheetMeta,
): (typeof excelStyles)[keyof typeof excelStyles] {
  const zebra = rowIndex % 2 === 1;

  if (meta.accentColumnIndexes?.includes(colIndex)) {
    return zebra ? excelStyles.cellAccentZebra : excelStyles.cellAccent;
  }
  if (meta.numberColumnIndexes?.includes(colIndex)) {
    return zebra ? excelStyles.cellNumberZebra : excelStyles.cellNumber;
  }
  if (meta.monoColumnIndexes?.includes(colIndex)) {
    return zebra ? excelStyles.cellMonoZebra : excelStyles.cellMono;
  }
  if (meta.centerHeaderIndexes?.includes(colIndex)) {
    return zebra ? excelStyles.cellCenterZebra : excelStyles.cellCenter;
  }
  return zebra ? excelStyles.cellZebra : excelStyles.cell;
}

function pickHeaderStyle(colIndex: number, meta: ExportSheetMeta) {
  if (meta.centerHeaderIndexes?.includes(colIndex)) {
    return excelStyles.header;
  }
  if (meta.rightAlignHeaderIndexes?.includes(colIndex)) {
    return excelStyles.header;
  }
  return excelStyles.headerLeft;
}

export function buildStyledWorkbookBuffer(meta: ExportSheetMeta): Buffer {
  const colCount = meta.headers.length;
  const headerRow = 2 + meta.subtitleLines.length;
  const dataStartRow = headerRow + 1;
  const totalRows = dataStartRow + meta.rows.length;

  const sheet: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];

  setCell(sheet, 0, 0, meta.title, excelStyles.title);
  merges.push({
    s: { r: 0, c: 0 },
    e: { r: 0, c: colCount - 1 },
  });

  meta.subtitleLines.forEach((line, index) => {
    const row = 1 + index;
    setCell(sheet, row, 0, line, excelStyles.meta);
    merges.push({
      s: { r: row, c: 0 },
      e: { r: row, c: colCount - 1 },
    });
  });

  meta.headers.forEach((header, colIndex) => {
    setCell(sheet, headerRow, colIndex, header, pickHeaderStyle(colIndex, meta));
  });

  meta.rows.forEach((row, rowIndex) => {
    const sheetRow = dataStartRow + rowIndex;
    row.forEach((cell, colIndex) => {
      const style = cell.style ?? pickRowStyle(rowIndex, colIndex, meta);
      setCell(sheet, sheetRow, colIndex, cell.value, style);
    });
  });

  sheet["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(totalRows - 1, headerRow), c: colCount - 1 },
  });
  sheet["!merges"] = merges;
  sheet["!cols"] = meta.columnWidths.map((width) => ({ wch: width }));
  sheet["!rows"] = [
    { hpt: 28 },
    ...meta.subtitleLines.map(() => ({ hpt: 18 })),
    { hpt: 22 },
    ...meta.rows.map(() => ({ hpt: 20 })),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, meta.sheetName.slice(0, 31));
  return Buffer.from(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
  );
}
