import type { CellStyle } from "xlsx-js-style";

const BORDER_COLOR = "CBD5E1";
const HEADER_BG = "1E3A5F";
const TITLE_BG = "2563EB";
const META_BG = "F1F5F9";
const ZEBRA_BG = "F8FAFC";
const ACCENT_BG = "EEF2FF";

const thinBorder = {
  top: { style: "thin", color: { rgb: BORDER_COLOR } },
  bottom: { style: "thin", color: { rgb: BORDER_COLOR } },
  left: { style: "thin", color: { rgb: BORDER_COLOR } },
  right: { style: "thin", color: { rgb: BORDER_COLOR } },
} as const;

export const excelStyles = {
  title: {
    font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: TITLE_BG } },
    alignment: { horizontal: "left", vertical: "center" },
  } satisfies CellStyle,
  meta: {
    font: { sz: 10, color: { rgb: "475569" } },
    fill: { fgColor: { rgb: META_BG } },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
  } satisfies CellStyle,
  header: {
    font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: HEADER_BG } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: thinBorder,
  } satisfies CellStyle,
  headerLeft: {
    font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: HEADER_BG } },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
    border: thinBorder,
  } satisfies CellStyle,
  cell: {
    font: { sz: 10, color: { rgb: "0F172A" } },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
    border: thinBorder,
  } satisfies CellStyle,
  cellZebra: {
    font: { sz: 10, color: { rgb: "0F172A" } },
    fill: { fgColor: { rgb: ZEBRA_BG } },
    alignment: { horizontal: "left", vertical: "center", wrapText: true },
    border: thinBorder,
  } satisfies CellStyle,
  cellCenter: {
    font: { sz: 10, color: { rgb: "0F172A" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: thinBorder,
  } satisfies CellStyle,
  cellCenterZebra: {
    font: { sz: 10, color: { rgb: "0F172A" } },
    fill: { fgColor: { rgb: ZEBRA_BG } },
    alignment: { horizontal: "center", vertical: "center" },
    border: thinBorder,
  } satisfies CellStyle,
  cellMono: {
    font: { sz: 10, color: { rgb: "0F172A" }, name: "Consolas" },
    alignment: { horizontal: "left", vertical: "center" },
    border: thinBorder,
  } satisfies CellStyle,
  cellMonoZebra: {
    font: { sz: 10, color: { rgb: "0F172A" }, name: "Consolas" },
    fill: { fgColor: { rgb: ZEBRA_BG } },
    alignment: { horizontal: "left", vertical: "center" },
    border: thinBorder,
  } satisfies CellStyle,
  cellNumber: {
    font: { sz: 10, color: { rgb: "0F172A" } },
    alignment: { horizontal: "right", vertical: "center" },
    border: thinBorder,
    numFmt: "#,##0",
  } satisfies CellStyle,
  cellNumberZebra: {
    font: { sz: 10, color: { rgb: "0F172A" } },
    fill: { fgColor: { rgb: ZEBRA_BG } },
    alignment: { horizontal: "right", vertical: "center" },
    border: thinBorder,
    numFmt: "#,##0",
  } satisfies CellStyle,
  cellAccent: {
    font: { sz: 10, color: { rgb: "1E3A8A" } },
    fill: { fgColor: { rgb: ACCENT_BG } },
    alignment: { horizontal: "center", vertical: "center" },
    border: thinBorder,
  } satisfies CellStyle,
  cellAccentZebra: {
    font: { sz: 10, color: { rgb: "1E3A8A" } },
    fill: { fgColor: { rgb: "E0E7FF" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: thinBorder,
  } satisfies CellStyle,
} as const;
