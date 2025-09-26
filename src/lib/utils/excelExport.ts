import * as ExcelJS from "exceljs";

export interface ExportData {
  [key: string]: string | number | Date;
}

export const exportToExcel = async (
  data: ExportData[],
  filename: string,
  sheetName: string = "Sheet1"
) => {
  const workbook = new ExcelJS.Workbook();

  const worksheet = workbook.addWorksheet(sheetName);

  if (data.length === 0) {
    return;
  }

  const headers = Object.keys(data[0]);

  worksheet.addRow(headers);

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  data.forEach((item) => {
    const row = headers.map((header) => item[header]);
    worksheet.addRow(row);
  });

  worksheet.columns.forEach((column) => {
    if (column.header) {
      column.width = Math.max(column.header.toString().length, 15);
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const formatDateForExcel = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US");
  } catch {
    return dateString;
  }
};
