"use client";

import { useEffect, useRef, useState } from "react";
import { PromoterTracker } from "./promoter-tracker";
import {
  type DashboardData,
} from "@/lib/dashboard-data";
import { tryGetDashboardData } from "@/lib/actions";

const POLL_INTERVAL = 5000;

export function PromotoresContent({ initialData = null }: { initialData?: DashboardData | null }) {
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
    if (!initialData) refresh();
    timer.current = setInterval(refresh, POLL_INTERVAL);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [live, initialData]);

  if (!data) return null;

  return (
    <div className="flex flex-col gap-[5px] pb-[5px]">
      <div className="grid grid-cols-1 gap-[5px] lg:grid-cols-2">
        <PromoterTracker data={data.promotores} />
      </div>
    </div>
  );
}
