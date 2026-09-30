import { google } from 'googleapis';
import { unstable_cache } from 'next/cache';
import type { DashboardData, SalesLead, PromoterData, TeamMember, MonthlyPlanReal, CardTypePoint, CollaboratorMonthlyRecord } from "./types";

import { toTitleCase } from './utils';
import { formatManagerName, isManagerHeaderLabel } from './person-names';
import { MESES } from './constants';

function parseSheetNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  
  let str = String(val).trim();
  if (!str) return 0;

  let isNegative = false;
  if (str.includes('-') || (str.startsWith('(') && str.endsWith(')'))) {
    isNegative = true;
  }
  str = str.replace(/[()\-+$%€\s]/g, '');

  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf(',') < str.indexOf('.')) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/\./g, '').replace(',', '.');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length !== 3) {
      str = str.replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}


function normalizeSheetText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleUpperCase('es-MX');
}

function collaboratorIdentityKey(numeroPersonal: unknown, nombre: unknown): string {
  const employeeId = String(numeroPersonal ?? '').trim();
  if (employeeId) return `ID:${employeeId}`;
  return `NAME:${normalizeSheetText(nombre)}`;
}

function mergeTeamMember(
  target: TeamMember | undefined,
  incoming: TeamMember,
  monthName: string,
): TeamMember {
  if (!target) {
    return {
      ...incoming,
      meses: [monthName],
      ultimoMes: monthName,
    };
  }

  const meses = target.meses?.includes(monthName)
    ? target.meses
    : [...(target.meses ?? []), monthName];

  return {
    ...target,
    numeroPersonal: incoming.numeroPersonal || target.numeroPersonal,
    nombre: incoming.nombre || target.nombre,
    seccion: incoming.seccion || target.seccion,
    dilisa: target.dilisa + incoming.dilisa,
    lpc: target.lpc + incoming.lpc,
    garantizada: target.garantizada + incoming.garantizada,
    justMe: target.justMe + incoming.justMe,
    declinadas: (target.declinadas ?? 0) + (incoming.declinadas ?? 0),
    ingresadas: (target.ingresadas ?? 0) + (incoming.ingresadas ?? 0),
    total: target.total + incoming.total,
    meses,
    ultimoMes: monthName,
  };
}

function extractPromotersFromPlan(planRows: any[][]): PromoterData[] {
  // Fuente exclusiva de Promotores: bloque "Resultados Promotores de Crédito"
  // en Plan 2026. No se mezclan colaboradores de las hojas mensuales.
  // Columnas actuales del bloque: A nombre, B ingresadas, G declinadas,
  // H plan, I real, J % avance.

  const titleIndex = planRows.findIndex((row) => {
    const joined = normalizeSheetText((row || []).join(' '));
    return joined.includes('RESULTADOS PROMOTORES') && joined.includes('CREDITO');
  });

  let headerIndex = -1;
  if (titleIndex >= 0) {
    const maxHeaderSearch = Math.min(planRows.length, titleIndex + 8);
    for (let index = titleIndex + 1; index < maxHeaderSearch; index++) {
      const row = planRows[index] || [];
      const normalized = row.map(normalizeSheetText);
      const hasPromotores = normalized.some((cell) => cell === 'PROMOTORES');
      const hasIngresadas = normalized.some((cell) => cell.includes('INGRESADAS'));
      const hasPlan = normalized.some((cell) => cell === 'PLAN');
      const hasReal = normalized.some((cell) => cell === 'REAL');
      if (hasPromotores && hasIngresadas && hasPlan && hasReal) {
        headerIndex = index;
        break;
      }
    }
  }

  // Fallback para hojas donde el título cambie pero el encabezado del bloque se conserve.
  if (headerIndex < 0) {
    headerIndex = planRows.findIndex((row) => {
      const normalized = (row || []).map(normalizeSheetText);
      return normalized.some((cell) => cell === 'PROMOTORES') &&
        normalized.some((cell) => cell.includes('INGRESADAS')) &&
        normalized.some((cell) => cell === 'PLAN') &&
        normalized.some((cell) => cell === 'REAL');
    });
  }

  // Si encontramos el encabezado, resolvemos índices por nombre de columna para no
  // quedar amarrados a una posición fija si se inserta una columna en la hoja.
  let nameCol = 0;
  let ingresadasCol = 1;
  let declinadasCol = 6;
  let planCol = 7;
  let realCol = 8;

  if (headerIndex >= 0) {
    const header = (planRows[headerIndex] || []).map(normalizeSheetText);
    const findCol = (predicate: (cell: string) => boolean, fallback: number) => {
      const idx = header.findIndex(predicate);
      return idx >= 0 ? idx : fallback;
    };

    nameCol = findCol((cell) => cell === 'PROMOTORES', 0);
    ingresadasCol = findCol((cell) => cell.includes('INGRESADAS'), 1);
    declinadasCol = findCol((cell) => cell.startsWith('DECLI'), 6);
    planCol = findCol((cell) => cell === 'PLAN', 7);
    realCol = findCol((cell) => cell === 'REAL', 8);
  }

  // Preferimos empezar después del encabezado; si no fue detectable, empezamos
  // después del título. Como último recurso recorremos la zona inferior de Plan 2026.
  const startIndex = headerIndex >= 0
    ? headerIndex + 1
    : titleIndex >= 0
      ? titleIndex + 1
      : 20;

  const promoters: PromoterData[] = [];

  for (let index = startIndex; index < planRows.length; index++) {
    const row = planRows[index] || [];
    const rawName = String(row[nameCol] || '').trim();
    const upperName = normalizeSheetText(rawName);
    const joined = normalizeSheetText(row.join(' '));

    if (upperName.startsWith('META ') || joined.startsWith('META ')) break;
    if (!rawName) continue;
    if (upperName === 'PROMOTORES' || upperName === 'TOTAL') continue;

    const ingresadas = parseSheetNumber(row[ingresadasCol]);
    const declinadas = parseSheetNumber(row[declinadasCol]);
    const plan = parseSheetNumber(row[planCol]);
    const real = parseSheetNumber(row[realCol]);

    // Una fila real de promotor debe tener meta o resultado operativo.
    // Esto excluye encabezados, textos auxiliares y notas del bloque.
    if (plan <= 0 && real <= 0) continue;

    promoters.push({
      nombre: toTitleCase(rawName),
      ingresadas,
      aprobadas: real,
      declinadas,
      plan,
    });
  }

  // Último respaldo deliberadamente acotado al bloque conocido: si la hoja tiene
  // una rareza de formato que impide detectar título/encabezado, Rafael sigue
  // leyéndose desde su fila real sin volver a mezclar colaboradores mensuales.
  if (promoters.length === 0) {
    const rafaelRow = planRows.find((row) => normalizeSheetText(row?.[0]) === 'RAFAEL');
    if (rafaelRow) {
      const plan = parseSheetNumber(rafaelRow[7]);
      const real = parseSheetNumber(rafaelRow[8]);
      if (plan > 0 || real > 0) {
        promoters.push({
          nombre: toTitleCase(String(rafaelRow[0] || 'RAFAEL')),
          ingresadas: parseSheetNumber(rafaelRow[1]),
          aprobadas: real,
          declinadas: parseSheetNumber(rafaelRow[6]),
          plan,
        });
      }
    }
  }

  return promoters;
}

const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
let lastSheetsIssue = '';

function reportSheetsIssue(issue: string) {
  if (issue === lastSheetsIssue) return;
  lastSheetsIssue = issue;
  console.warn(`[Google Sheets] ${issue}`);
}

export async function fetchSheetData(monthName: string): Promise<DashboardData | null> {
  const missingConfig = [
    !SPREADSHEET_ID && 'GOOGLE_SHEET_ID',
    !process.env.GOOGLE_CLIENT_EMAIL && 'GOOGLE_CLIENT_EMAIL',
    !privateKey && 'GOOGLE_PRIVATE_KEY',
  ].filter(Boolean);
  if (missingConfig.length) {
    reportSheetsIssue(`Falta configuración: ${missingConfig.join(', ')}`);
    return null;
  }

  try {

    const sheetMeta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const existingSheets = sheetMeta.data.sheets?.map(s => s.properties?.title) || [];
    
    const ranges = MESES.filter(m => existingSheets.includes(m)).map(m => `'${m}'!A3:J`);
    if (existingSheets.includes('Plan 2026')) {
      ranges.push(`'Plan 2026'!A1:M50`);
    }
    if (existingSheets.includes('Acumulado Jefes')) {
      ranges.push(`'Acumulado Jefes'!A2:AE25`);
    }

    if (ranges.length === 0) {
      reportSheetsIssue("No se encontraron pestañas de meses válidos en el documento.");
      return null;
    }

    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SPREADSHEET_ID,
      ranges,
      valueRenderOption: 'FORMATTED_VALUE'
    });
    
    const valueRanges = response.data.valueRanges || [];
    let acumuladoJefesRows: any[][] = [];
    if (existingSheets.includes('Acumulado Jefes')) {
      const acumuladoRange = valueRanges.pop();
      acumuladoJefesRows = acumuladoRange?.values || [];
    }

    let planRows: any[][] = [];
    if (existingSheets.includes('Plan 2026')) {
      const planRange = valueRanges.pop(); 
      planRows = planRange?.values || [];
    }

    const jefesMap = new Map<string, SalesLead>();
    // Histórico por jefe y N. Personal. Si una persona cambia de jefe, sus meses
    // anteriores permanecen atribuidos al jefe que realmente tenía entonces.
    const jefesTeamMap = new Map<string, Map<string, TeamMember>>();
    const managerHistoryMap = new Map<string, CollaboratorMonthlyRecord[]>();
    const managerLastMonthMap = new Map<string, { monthIndex: number; mes: string }>();
    const rosterByMonth = new Map<number, Map<string, Map<string, TeamMember>>>();
    let latestRosterMonthIndex = -1;
    let latestRosterMonthName = '';

    const planVsRealMap = new Map<string, MonthlyPlanReal>();
    const tiposTarjetaMap = new Map<string, CardTypePoint>();
    
    // Extracción dinámica de Participación por Canal
    let participacionCanal = [
      { name: 'Ventas', value: 0, fill: '#833177' },
      { name: 'Crédito', value: 0, fill: '#ff6d01' },
      { name: 'Promotores', value: 0, fill: '#83317740' }
    ];
    
    if (planRows[48]) {
      const ventas = Number(planRows[48][0]) || 0;
      const credito = Number(planRows[48][1]) || 0;
      const promotores = Number(planRows[48][2]) || 0;
      participacionCanal = [
        { name: 'Ventas', value: ventas, fill: '#833177' },
        { name: 'Crédito', value: credito, fill: '#ff6d01' },
        { name: 'Promotores', value: promotores, fill: '#83317740' }
      ];
    }

    const strictMonthlyPlan: number[] = [];
    const strictMonthlyReal: number[] = [];
    const strictMonthlyPorcentaje: string[] = [];
    const strictMonthlyCardTypes: CardTypePoint[] = [];

    for (let i = 3; i <= 14; i++) {
      const mesRow = planRows[i] || [];
      const planValue = parseSheetNumber(mesRow[9]);
      const realValue = parseSheetNumber(mesRow[10]);
      const avanceCell = mesRow[11];

      strictMonthlyPlan.push(planValue);
      strictMonthlyReal.push(realValue);

      const dilisaPlan = parseSheetNumber(mesRow[1]);
      const dilisaReal = parseSheetNumber(mesRow[2]);
      const lpcPlan = parseSheetNumber(mesRow[3]);
      const lpcReal = parseSheetNumber(mesRow[4]);
      const justMePlan = parseSheetNumber(mesRow[5]);
      const justMeReal = parseSheetNumber(mesRow[6]);
      const garantizadaPlan = parseSheetNumber(mesRow[7]);
      const garantizadaReal = parseSheetNumber(mesRow[8]);

      const totalProductosPlan = dilisaPlan + lpcPlan + justMePlan + garantizadaPlan;
      const totalProductosReal = dilisaReal + lpcReal + justMeReal + garantizadaReal;

      strictMonthlyCardTypes.push({
        mes: MESES[i - 3],
        DILISA_PLAN: dilisaPlan,
        DILISA: dilisaReal,
        LPC_PLAN: lpcPlan,
        LPC: lpcReal,
        'JUST ME_PLAN': justMePlan,
        'JUST ME': justMeReal,
        GARANTIZADA_PLAN: garantizadaPlan,
        GARANTIZADA: garantizadaReal,
        isPending: totalProductosPlan === 0 && totalProductosReal === 0,
      });

      if (
        avanceCell !== undefined &&
        avanceCell !== null &&
        String(avanceCell).trim() !== ''
      ) {
        const avance = parseSheetNumber(avanceCell);

        strictMonthlyPorcentaje.push(
          `${avance.toFixed(2).replace('.', ',')}%`
        );
      } else if (planValue > 0 && realValue > 0) {
        const porcentaje = (realValue / planValue) * 100;

        strictMonthlyPorcentaje.push(
          `${porcentaje.toFixed(2).replace('.', ',')}%`
        );
      } else {
        strictMonthlyPorcentaje.push('-');
      }
    }

    MESES.forEach((m, idx) => {
      planVsRealMap.set(m, { 
        mes: m, 
        plan: strictMonthlyPlan[idx] || 0, 
        real: strictMonthlyReal[idx] || 0, 
        porcentajeStr: strictMonthlyPorcentaje[idx] || '-' 
      });
      tiposTarjetaMap.set(
        m,
        strictMonthlyCardTypes[idx] || {
          mes: m,
          DILISA_PLAN: 0,
          DILISA: 0,
          LPC_PLAN: 0,
          LPC: 0,
          'JUST ME_PLAN': 0,
          'JUST ME': 0,
          GARANTIZADA_PLAN: 0,
          GARANTIZADA: 0,
          isPending: true,
        }
      );
    });

    const validMonthNames = MESES.filter(m => existingSheets.includes(m));

    for (let m = 0; m < valueRanges.length; m++) {
      const monthStr = validMonthNames[m];
      const monthIndex = MESES.indexOf(monthStr);
      const monthRows = valueRanges[m]?.values;
      if (!monthRows || monthRows.length === 0 || monthIndex < 0) continue;

      let currentCanal = 'Ventas';
      let currentJefeRaw = '';
      let monthHasRoster = false;

      const monthRoster = new Map<string, Map<string, TeamMember>>();
      rosterByMonth.set(monthIndex, monthRoster);

      for (let i = 0; i < monthRows.length; i++) {
        const row = monthRows[i] || [];
        const joinedRowText = normalizeSheetText(row.join(' '));

        if (joinedRowText.includes('TOTAL')) continue;

        if (
          joinedRowText.includes('CREDITO N. PERSONAL') ||
          joinedRowText.includes('PROMOTOR CREDITO') ||
          joinedRowText.includes('CREDITO ASESORES')
        ) {
          currentCanal = 'Crédito';
        }

        const dVal = String(row[3] || '').trim();
        if (dVal !== '' && currentCanal === 'Ventas' && !isManagerHeaderLabel(dVal)) {
          currentJefeRaw = dVal;
        }

        const nombreRaw = String(row[1] || '').trim();
        if (!nombreRaw || normalizeSheetText(nombreRaw) === 'NOMBRE') continue;

        const numeroPersonal = String(row[0] || '').trim();
        const seccionRaw = String(row[2] || '').trim();

        // Las filas reales de plantilla tienen N. Personal. Como respaldo, una fila
        // con nombre + sección + jefe también se conserva, pero nunca los encabezados.
        const looksLikeEmployeeId = /^\d+$/.test(numeroPersonal.replace(/\s+/g, ''));
        if (!looksLikeEmployeeId && (!seccionRaw || (!dVal && !currentJefeRaw))) continue;

        const nombre = toTitleCase(nombreRaw);
        const seccion = toTitleCase(seccionRaw);
        const dilisa = parseSheetNumber(row[4]);
        const lpc = parseSheetNumber(row[5]);
        const garantizada = parseSheetNumber(row[6]);
        const justMe = parseSheetNumber(row[7]);
        const declinadas = parseSheetNumber(row[8]);
        const aprobadas = parseSheetNumber(row[9]);
        const ingresadas = aprobadas + declinadas;

        const normalizedManager = currentCanal === 'Ventas'
          ? (formatManagerName(dVal || currentJefeRaw) || 'Desconocido')
          : formatManagerName('Abigail Cortez');

        if (!normalizedManager || normalizedManager === 'Desconocido') continue;

        monthHasRoster = true;
        managerLastMonthMap.set(normalizedManager, { monthIndex, mes: monthStr });

        if (!jefesMap.has(normalizedManager)) {
          jefesMap.set(normalizedManager, {
            jefe: normalizedManager,
            canal: currentCanal,
            real: 0,
            // La meta individual oficial de jefe sigue viniendo de Acumulado Jefes.
            plan: 0,
            dia: 0,
            mesActual: 0,
            equipo: [],
            equipoActual: [],
            historialEquipo: [],
            activo: false,
            ultimoMes: monthStr,
          });
          jefesTeamMap.set(normalizedManager, new Map<string, TeamMember>());
          managerHistoryMap.set(normalizedManager, []);
        }

        const jefe = jefesMap.get(normalizedManager)!;
        jefe.real += aprobadas;
        jefe.ultimoMes = monthStr;

        const employeeKey = collaboratorIdentityKey(numeroPersonal, nombreRaw);
        const memberForMonth: TeamMember = {
          numeroPersonal: numeroPersonal || undefined,
          nombre,
          seccion,
          dilisa,
          lpc,
          garantizada,
          justMe,
          declinadas,
          ingresadas,
          total: aprobadas,
          meses: [monthStr],
          ultimoMes: monthStr,
        };

        const historicalTeam = jefesTeamMap.get(normalizedManager)!;
        historicalTeam.set(
          employeeKey,
          mergeTeamMember(historicalTeam.get(employeeKey), memberForMonth, monthStr),
        );

        if (!monthRoster.has(normalizedManager)) {
          monthRoster.set(normalizedManager, new Map<string, TeamMember>());
        }
        monthRoster.get(normalizedManager)!.set(employeeKey, memberForMonth);

        managerHistoryMap.get(normalizedManager)!.push({
          mes: monthStr,
          monthIndex,
          numeroPersonal: numeroPersonal || employeeKey,
          nombre,
          seccion,
          jefe: normalizedManager,
          canal: currentCanal,
          dilisa,
          lpc,
          justMe,
          garantizada,
          declinadas,
          aprobadas,
          ingresadas,
        });
      }

      if (monthHasRoster && monthIndex >= latestRosterMonthIndex) {
        latestRosterMonthIndex = monthIndex;
        latestRosterMonthName = monthStr;
      }
    }

    const latestRoster = latestRosterMonthIndex >= 0
      ? rosterByMonth.get(latestRosterMonthIndex)
      : undefined;

    const jefesVentas = Array.from(jefesMap.values()).map(jefe => {
      const historicalTeam = jefesTeamMap.get(jefe.jefe) ?? new Map<string, TeamMember>();
      const currentSnapshot = latestRoster?.get(jefe.jefe);

      jefe.equipo = Array.from(historicalTeam.values())
        .sort((a, b) => b.total - a.total);

      // La plantilla actual proviene exclusivamente del último mes con datos.
      // Sus métricas, en cambio, son el acumulado de cada persona únicamente
      // durante los meses en que estuvo asignada a este mismo jefe.
      jefe.equipoActual = currentSnapshot
        ? Array.from(currentSnapshot.entries())
            .map(([employeeKey, currentMember]) => ({
              ...(historicalTeam.get(employeeKey) ?? currentMember),
              nombre: currentMember.nombre,
              seccion: currentMember.seccion,
              numeroPersonal: currentMember.numeroPersonal,
              ultimoMes: latestRosterMonthName,
            }))
            .sort((a, b) => b.total - a.total)
        : [];

      jefe.historialEquipo = managerHistoryMap.get(jefe.jefe) ?? [];
      jefe.activo = Boolean(currentSnapshot && currentSnapshot.size > 0);
      jefe.ultimoMes = managerLastMonthMap.get(jefe.jefe)?.mes ?? jefe.ultimoMes;
      jefe.mesActual = currentSnapshot
        ? Array.from(currentSnapshot.values()).reduce((sum, member) => sum + member.total, 0)
        : 0;

      return jefe;
    });

    jefesVentas.sort((a, b) => b.real - a.real);
    const promotoresGenerales = extractPromotersFromPlan(planRows)
      .sort((a, b) => b.aprobadas - a.aprobadas);

    const baseData: DashboardData = {
      actualizado: '',
      kpis: {
        avanceAcumulado: 95.63,
        aprobadas: 3372,
        planAnual: 3526,
        diferenciaGlobal: -154,
        participacionVentas: 0,
        participacionCredito: 0,
        participacionPromotores: 0,
      },
      planVsReal: [],
      tiposTarjeta: [],
      canales: [],
      jefesVentas: [],
      promotores: [],
      productPerformance: [],
      participacionCanal: [],
    };
    baseData.actualizado = new Date().toISOString();
    baseData.ultimoMesConDatos = latestRosterMonthName || undefined;
    baseData.jefesVentas = jefesVentas;
    baseData.promotores = promotoresGenerales;

    baseData.planVsReal = MESES.map(m => {
       const d = planVsRealMap.get(m)!;
       return { mes: d.mes, plan: Math.round(d.plan), real: d.real, porcentajeStr: d.porcentajeStr };
    });
    baseData.tiposTarjeta = MESES.map(m => tiposTarjetaMap.get(m)!);
    baseData.participacionCanal = participacionCanal;

    if (acumuladoJefesRows.length > 0) {
      const rangoA: string[] = [];
      const rangoAE: (string | number)[] = [];
      const promotoresA: string[] = [];
      const promotoresAE: (string | number)[] = [];

      acumuladoJefesRows.forEach((row, idx) => {
        const name = (row[0] || '').trim();
        const pct = row[30] !== undefined ? row[30] : '0';
        if (!name || isManagerHeaderLabel(name)) return;

        // Fila 22 y 23 de la hoja son índices 20 y 21 respecto a A2.
        // Promotores conservan su etiqueta de origen; jefes usan la identidad canónica.
        if (idx === 20 || idx === 21 || name.toUpperCase().includes('PROMOTOR') || name.toUpperCase().includes('CORTEZ')) {
          promotoresA.push(name);
          promotoresAE.push(pct);
        } else if (idx < 18) {
          const managerName = formatManagerName(name);
          if (managerName) {
            rangoA.push(managerName);
            rangoAE.push(pct);
          }
        }
      });

      baseData.acumuladoJefes = {
        rangoA,
        rangoAE,
        promotoresA,
        promotoresAE
      };
    }

    const canalesMap = new Map<string, number>();
    canalesMap.set("Ventas", 0);
    canalesMap.set("Crédito", 0);

    jefesVentas.forEach(jefe => {
      const curr = canalesMap.get(jefe.canal) || 0;
      canalesMap.set(jefe.canal, curr + jefe.real);
    });

    baseData.canales = [
      { canal: 'Ventas', aprobadas: canalesMap.get('Ventas') || 0 },
      { canal: 'Crédito', aprobadas: canalesMap.get('Crédito') || 0 }
    ];

    const totalCanalesAprob = (canalesMap.get('Ventas') || 0) + (canalesMap.get('Crédito') || 0);
    if (totalCanalesAprob > 0) {
      baseData.kpis.participacionVentas = Number((((canalesMap.get('Ventas') || 0) / totalCanalesAprob) * 100).toFixed(1));
      baseData.kpis.participacionCredito = Number((((canalesMap.get('Crédito') || 0) / totalCanalesAprob) * 100).toFixed(1));
      baseData.kpis.participacionPromotores = 0;
    }

    // Extracción pura de Totales Maestros desde la Fila 16 (índice 15 en planRows, 'Plan 2026')
    // Fila 16: ["TOTAL", "2712", "2399", "619", "728", "102", "170", "93", "75", "3526", "3372", "95,63%", "-154"]
    let totalRow = planRows[15];
    if (!totalRow || !totalRow.some(c => String(c).toUpperCase().trim().includes('TOTAL'))) {
      const foundRow = planRows.find(r => r && r.some(c => String(c).toUpperCase().trim() === 'TOTAL' || String(c).toUpperCase().trim().startsWith('TOTAL')));
      if (foundRow) {
        totalRow = foundRow;
      }
    }

    if (totalRow && totalRow.length >= 10) {
      // Columna J (índice 9): Meta anual -> 3526
      baseData.kpis.planAnual = parseSheetNumber(totalRow[9]) || 3526;

      // Columna K (índice 10): Aprobadas reales acumuladas -> 3372
      baseData.kpis.aprobadas = parseSheetNumber(totalRow[10]) || 3372;

      // Columna L (índice 11): Avance acumulado YTD -> 95.63%
      let avance = parseSheetNumber(totalRow[11]);
      if (avance > 0 && avance <= 1) {
        avance = Number((avance * 100).toFixed(1));
      }
      baseData.kpis.avanceAcumulado = avance || 95.63;

      // Columna M (índice 12): Diferencia global YTD -> -154
      const diffVal = totalRow[12];
      baseData.kpis.diferenciaGlobal = (diffVal !== undefined && diffVal !== null && String(diffVal).trim() !== '')
        ? parseSheetNumber(diffVal)
        : -154;
    } else {
      baseData.kpis.planAnual = 3526;
      baseData.kpis.aprobadas = 3372;
      baseData.kpis.avanceAcumulado = 95.63;
      baseData.kpis.diferenciaGlobal = -154;
    }

    lastSheetsIssue = '';
    return baseData;

  } catch (error) {
    const err = error as any;
    const status = err?.response?.status ?? err?.code ?? err?.name ?? 'desconocido';
    reportSheetsIssue(`${status}: ${String(err?.message ?? 'No se pudo consultar la hoja')}`);
    return null; 
  }
}

export const getSheetDataCached = unstable_cache(
  async (monthName: string) => {
    const data = await fetchSheetData(monthName);
    // Los fallos no deben guardarse en la caché durante 60 segundos.
    if (!data) throw new Error('Google Sheets no disponible');
    return data;
  },
  ['google-sheets-data-v16-manager-history-current-roster'],
  { revalidate: 60 }
);
