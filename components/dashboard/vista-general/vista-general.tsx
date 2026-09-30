"use client";

import { useEffect, useRef, useState } from "react";
import { UniversalChartDashboard, UniversalKpiGroup } from "@/components/charts/universal";
import {
  IndiceDeEfectividadAnual,
  VolumenDeOriginacionReal,
  DesviacionOperativa,
  MezclaDePortafolioFinanciero,
  CumplimientoMensualDeMeta,
  ParticipacionPorCanal,
  RankingDeJefesDeVentas,
  RankingDePromotores,
  DesempenoPorSeccion,
} from "./graficas";
import { type DashboardData } from "@/lib/dashboard-data";
import { tryGetDashboardData } from "@/lib/actions";

const POLL_INTERVAL = 5000;

export interface VistaGeneralProps {
  initialData?: DashboardData | null;
}

export function VistaGeneral({ initialData = null }: VistaGeneralProps) {
  const [data, setData] = useState<DashboardData | null>(initialData);
  const [live, setLive] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!live) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    const refresh = async () => {
      try {
        const next = await tryGetDashboardData();
        if (next) setData(next);
      } catch { /* Conserva los últimos datos durante una desconexión. */ }
    };
    if (!initialData) {
      refresh();
    }
    timer.current = setInterval(refresh, POLL_INTERVAL);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [live, initialData]);

  if (!data) return null;

  const topPromotores = [...data.promotores]
    .sort((a, b) => b.aprobadas - a.aprobadas)
    .slice(0, 3)
    .map(p => ({
      name: p.nombre,
      plan: p.plan,
      real: p.aprobadas,
    }));

  const seccionCounts: Record<string, number> = {};
  data.jefesVentas.forEach(jefe => {
    if (jefe.equipo) {
      jefe.equipo.forEach(member => {
        seccionCounts[member.seccion] = (seccionCounts[member.seccion] || 0) + member.total;
      });
    }
  });

  const topSecciones = Object.entries(seccionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <UniversalChartDashboard>
      <UniversalKpiGroup>
        <IndiceDeEfectividadAnual data={data.planVsReal} kpis={data.kpis} />
        <VolumenDeOriginacionReal data={data.planVsReal} kpis={data.kpis} />
        <DesviacionOperativa data={data.planVsReal} kpis={data.kpis} />
        <MezclaDePortafolioFinanciero data={data.tiposTarjeta} kpis={data.kpis} />
      </UniversalKpiGroup>

      <CumplimientoMensualDeMeta data={data.planVsReal} />
      <ParticipacionPorCanal data={data.participacionCanal} />

      <RankingDeJefesDeVentas
        rangoA={data.acumuladoJefes?.rangoA}
        rangoAE={data.acumuladoJefes?.rangoAE}
        rawData={data.jefesVentas}
      />

      <RankingDePromotores
        rangoA={data.acumuladoJefes?.promotoresA}
        rangoAE={data.acumuladoJefes?.promotoresAE}
        data={topPromotores}
      />

      {topSecciones.length > 0 && (
        <DesempenoPorSeccion data={topSecciones} />
      )}
    </UniversalChartDashboard>
  );
}
