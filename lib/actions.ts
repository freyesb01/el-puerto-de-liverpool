"use server";

import { type DashboardData } from "./types";
import { MESES } from "./dashboard-data";
import { getSheetDataCached } from "./google-sheets";

// La carga del splash y las actualizaciones periódicas son recuperables: una
// respuesta vacía no debe producir el overlay de error de Next.js.
export async function tryGetDashboardData(): Promise<DashboardData | null> {
  const monthName = MESES[new Date().getMonth()] || "Enero";

  try {
    return (await getSheetDataCached(monthName)) ?? null;
  } catch (error) {
    console.error(
      `[tryGetDashboardData] No se pudo obtener Google Sheets para ${monthName}:`,
      error
    );
    return null;
  }
}

export async function tryFetchMonthlyData(monthIndex: number): Promise<DashboardData | null> {
  const monthName = MESES[monthIndex] || "Enero";

  try {
    return (await getSheetDataCached(monthName)) ?? null;
  } catch (error) {
    console.error(
      `[tryFetchMonthlyData] No se pudo obtener Google Sheets para ${monthName}:`,
      error
    );
    return null;
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const currentMonthIndex = new Date().getMonth();
  const monthName = MESES[currentMonthIndex] || "Enero";

  const sheetData = await getSheetDataCached(monthName);
  if (sheetData) return sheetData;

  throw new Error("No se pudo obtener la información de Google Sheets");
}

export async function fetchMonthlyData(monthIndex: number): Promise<DashboardData> {
  const monthName = MESES[monthIndex] || "Enero";
  const sheetData = await getSheetDataCached(monthName);
  if (sheetData) return sheetData;

  throw new Error(`No se pudo obtener la información de Google Sheets para el mes ${monthName}`);
}
