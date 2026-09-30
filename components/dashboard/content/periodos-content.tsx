"use client";

import { useEffect, useState } from "react";
import { Medal } from "lucide-react";
import { formatPersonName } from "@/lib/utils";

import { ProductPerformanceChart } from "@/components/charts/product-performance-chart";
import { CardTypeLineChart } from "@/components/charts/card-type-line-chart";
import { ChartCard } from "@/components/charts/chart-card";
import {
  type DashboardData,
  MESES,
} from "@/lib/dashboard-data";
import { tryFetchMonthlyData } from "@/lib/actions";
import { KpiCards } from "@/components/kpi-cards";
import { MD3DatePicker } from "@/components/ui/md3-date-picker";
import { MD3Tab } from "@/components/ui/md3-tab";
import { useDashboardBootstrap } from "../dashboard-client-wrapper";

export function PeriodosContent() {
  const { reportRendered } = useDashboardBootstrap();
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // Default to Junio
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let retryTimer: number | undefined;
    let failures = 0;
    const loadMonth = async () => {
      setIsLoading(true);
      let next: DashboardData | null = null;
      try {
        next = await tryFetchMonthlyData(selectedMonth);
      } catch { /* La siguiente petición recuperará un fallo temporal. */ }
      if (!active) return;
      if (next) {
        setData(next);
        setIsLoading(false);
        return;
      }
      retryTimer = window.setTimeout(loadMonth, Math.min(1000 * 2 ** Math.min(failures++, 3), 5000));
    };
    loadMonth();
    return () => {
      active = false;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [selectedMonth]);

  useEffect(() => {
    if (data && !isLoading) reportRendered();
  }, [data, isLoading, reportRendered]);

  if (!data) return null;

  const topJefes = [...data.jefesVentas].sort((a, b) => b.real - a.real).slice(0, 3);

  return (
    <div className="flex flex-col gap-[5px] pb-[5px]">
      
      {/* 1. KPI Cards (same position and size as OverviewContent) */}
      <div className={isLoading ? 'opacity-50' : 'opacity-100'}>
        <KpiCards data={data} />
      </div>

      <div className={isLoading ? 'opacity-50 flex flex-col gap-[5px]' : 'opacity-100 flex flex-col gap-[5px]'}>
        {/* 2. Side-by-side Grid exactly like OverviewContent (lg:grid-cols-2) */}
        <div className="grid grid-cols-1 gap-[5px] lg:grid-cols-2 mt-[5px]">
          
          {/* Desempeño por producto (Matches Plan vs Real size) */}
          <ProductPerformanceChart data={data.productPerformance} />
          
          {/* Jefes destacados */}
          <ChartCard 
            icon={<Medal className="w-5 h-5" style={{ color: '#833177' }} aria-hidden="true" />} 
            accentColor="#833177"
            kpiValue={topJefes.length > 0 ? topJefes[0].real : '—'}
            title="Jefes destacados" 
            subtitle={`Top 3 rendimiento en ${MESES[selectedMonth]}`}
          >
            <div className="flex flex-col justify-center gap-[15px]" style={{ height: 300 }}>
              {topJefes.map((jefe, i) => (
                <div key={jefe.jefe} className="flex items-center gap-[15px] p-4 rounded-none bg-card border border-border">
                  <div className="w-10 h-10 rounded-none flex items-center justify-center font-bold text-[10px]" style={{ 
                    backgroundColor: i === 0 ? '#83317715' : 'var(--muted)',
                    color: i === 0 ? '#833177' : 'var(--muted-foreground)'
                  }}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] leading-[17.5px] font-bold text-[#1D1B20] truncate">{formatPersonName(jefe.jefe)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] leading-[30px] font-mono font-bold tabular-nums tracking-tight" style={{ color: i === 0 ? '#833177' : 'var(--primary)' }}>{jefe.real}</p>
                    <p className="text-[10px] leading-[12.5px] text-[#49454F]">aprobadas</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
          
        {/* 3. Evolución por tipo de tarjeta */}
        <div className="mt-[5px]">
          <CardTypeLineChart data={data.tiposTarjeta} />
        </div>

        {/* Month Selector */}
        <div className="flex gap-2 p-2 bg-card rounded-none border-b border-border overflow-x-auto mt-[5px]">
          {MESES.map((mes, idx) => (
            <MD3Tab
              key={mes}
              onClick={() => setSelectedMonth(idx)}
              isActive={selectedMonth === idx}
            >
              {mes} 2026
            </MD3Tab>
          ))}
        </div>

        {/* 5. DatePicker at the bottom */}
        <div className="flex justify-center md:justify-start mt-[5px]">
          <MD3DatePicker 
            getPerformanceData={(date) => {
              const day = date.getDate();
              if (day % 5 === 0) return { performance: 'high', metrics: '35 aprobadas - Excelente' };
              if (day % 7 === 0) return { performance: 'risk', metrics: '4 aprobadas - Riesgo' };
              return { performance: 'neutral' };
            }}
          />
        </div>
      </div>
    </div>
  );
}
