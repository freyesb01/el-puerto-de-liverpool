"use client";

import { cn } from "@/lib/utils";
import {
  BadgeDollarSign,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Search,
  UserRound,
  UserRoundCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { tryGetDashboardData } from "@/lib/actions";
import type { DashboardData, SalesLead } from "@/lib/types";
import { MD3Tooltip } from "@/components/ui/md3-tooltip";
import { useDashboardBootstrap } from "@/components/dashboard/dashboard-client-wrapper";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: "red" | "yellow" | "green";
  tooltip?: string;
}

interface ManagerNavItem {
  href: string;
  label: string;
  avance: number | null;
  color: string;
  status: string;
  active: boolean;
}

const SIDEBAR_ACCENT = "#833177";
const SIDEBAR_MAGENTA = "#e10098";
const SIDEBAR_ORANGE = "#ff6d01";
const CONTROL_TINT = `color-mix(in srgb, ${SIDEBAR_ACCENT} 9.4%, #ffffff)`;
const CONTROL_TINT_SELECTED = `color-mix(in srgb, ${SIDEBAR_ACCENT} 14.1%, #ffffff)`;

const creditMenu: NavItem[] = [
  {
    href: "/",
    label: "Vista general",
    icon: LayoutDashboard,
    tooltip: "Resumen general del módulo Crédito.",
  },
  {
    href: "/promotores",
    label: "Promotores",
    icon: BadgeDollarSign,
    badge: 1,
    badgeColor: "red",
    tooltip: "Seguimiento de promotores de crédito.",
  },
  {
    href: "/colaboradores",
    label: "Colaboradores",
    icon: UserRoundCog,
    tooltip: "Consulta de colaboradores del módulo Crédito.",
  },
  {
    href: "/periodos",
    label: "Calendarios y periodos",
    icon: CalendarDays,
    tooltip: "Consulta de periodos y calendarios operativos.",
  },
];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")
    .replace(/\s+/g, " ")
    .trim();
}


function isManagerPathActive(pathname: string | null, managerLabel: string): boolean {
  if (!pathname?.startsWith("/jefes-de-ventas/")) return false;
  const raw = pathname.slice("/jefes-de-ventas/".length);
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Si la URL llegara mal codificada, se compara el segmento tal cual.
  }
  return normalizeText(decoded) === normalizeText(managerLabel);
}

function parsePercentage(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace("%", "").replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function managerSemantic(avance: number | null) {
  if (avance === null) {
    return { color: SIDEBAR_ACCENT, status: "Sin avance oficial" };
  }
  if (avance < 33) {
    return { color: SIDEBAR_ORANGE, status: "En riesgo" };
  }
  if (avance < 66) {
    return { color: SIDEBAR_MAGENTA, status: "En progreso" };
  }
  return { color: SIDEBAR_ACCENT, status: "Óptimos" };
}

function buildManagerItems(data: DashboardData | null): ManagerNavItem[] {
  if (!data?.jefesVentas?.length) return [];

  const officialNames = data.acumuladoJefes?.rangoA ?? [];
  const officialValues = data.acumuladoJefes?.rangoAE ?? [];
  const officialMap = new Map<string, number>();

  officialNames.forEach((name, index) => {
    const value = parsePercentage(officialValues[index]);
    if (value !== null) officialMap.set(normalizeText(String(name)), value);
  });

  return [...data.jefesVentas]
    .filter((manager): manager is SalesLead => Boolean(manager?.jefe?.trim()))
    .map((manager) => {
      const label = manager.jefe.trim();
      const official = officialMap.get(normalizeText(label));
      const fallback = manager.plan > 0 ? (manager.real / manager.plan) * 100 : null;
      const avance = official ?? fallback;
      const semantic = managerSemantic(avance);

      return {
        href: `/jefes-de-ventas/${encodeURIComponent(label)}`,
        label,
        avance,
        color: semantic.color,
        status: semantic.status,
        active: Boolean(manager.activo),
      };
    })
    .sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      return a.label.localeCompare(b.label, "es-MX", { sensitivity: "base" });
    });
}

export function AppSidebar() {
  const pathname = usePathname();
  const { initialData } = useDashboardBootstrap();
  const [sidebarData, setSidebarData] = useState<DashboardData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreditoExpanded, setIsCreditoExpanded] = useState(true);
  const [isManagersExpanded, setIsManagersExpanded] = useState(
    pathname?.startsWith("/jefes-de-ventas") ?? false,
  );
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (pathname?.startsWith("/jefes-de-ventas")) {
      setIsCreditoExpanded(true);
      setIsManagersExpanded(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (initialData) {
      setSidebarData(initialData);
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const next = await tryGetDashboardData();
        if (active && next) setSidebarData(next as DashboardData);
      } catch {
        // La navegación principal sigue disponible si Google Sheets no responde.
      }
    };

    load();
    const timer = window.setInterval(load, 60_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [initialData]);

  const data = initialData ?? sidebarData;
  const managers = useMemo(() => buildManagerItems(data), [data]);

  const query = normalizeText(searchQuery);
  const filteredMenu = creditMenu.filter((item) =>
    normalizeText(item.label).includes(query),
  );
  const filteredManagers = managers.filter((manager) =>
    normalizeText(manager.label).includes(query),
  );

  const isSearchActive = query !== "";
  const hasResults = filteredMenu.length > 0 || filteredManagers.length > 0;
  const isManagersRoute = pathname?.startsWith("/jefes-de-ventas") ?? false;
  const isAnyChildActive =
    pathname === "/" ||
    isManagersRoute ||
    creditMenu.some(
      (item) =>
        pathname === item.href ||
        (item.href !== "/" && pathname?.startsWith(item.href)),
    );

  return (
    <aside className="w-[255px] h-full bg-card border border-border flex flex-col shrink-0 overflow-hidden">
      <div className="p-[15px] shrink-0 border-b border-border">
        <div className="relative flex h-[45px] items-center w-full">
          <Search
            className="w-[17.5px] h-[17.5px] text-[#49454F] absolute left-[12.5px] pointer-events-none"
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar registros..."
            className="h-[45px] w-full border border-border bg-background pl-[40px] pr-[37.5px] rounded-none text-[10px] leading-[15px] text-[#1D1B20] placeholder:text-[#49454F] transition-colors hover:bg-muted/40 focus:bg-background focus:outline-none focus:ring-1 focus:ring-[#833177]/25"
          />
          {!searchQuery && (
            <kbd className="absolute right-[10px] grid h-[22.5px] min-w-[22.5px] place-items-center border border-border bg-background px-[5px] rounded-none font-mono text-[10px] text-[#49454F] pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isSearchActive && !hasResults ? (
          <div className="p-[15px] text-center">
            <p className="text-[10px] leading-[15px] text-[#49454F]">
              No se encontraron resultados para &quot;
              <span className="font-medium text-[#1D1B20]">{searchQuery}</span>&quot;
            </p>
          </div>
        ) : (
          <div className="p-[15px]">
            {isSearchActive ? (
              <nav className="flex flex-col gap-[5px]" aria-label="Resultados de búsqueda">
                {filteredMenu.map((item) => (
                  <NavButton
                    key={`search-${item.href}`}
                    item={item}
                    isActive={
                      pathname === item.href ||
                      (item.href !== "/" && pathname?.startsWith(item.href))
                    }
                  />
                ))}

                {filteredManagers.map((manager) => (
                  <ManagerButton
                    key={`search-manager-${manager.href}`}
                    manager={manager}
                    isActive={isManagerPathActive(pathname, manager.label)}
                  />
                ))}
              </nav>
            ) : (
              <div className="flex flex-col gap-[5px]">
                <MD3Tooltip
                  className="block w-full"
                  content={
                    <SidebarTooltip
                      title="Crédito"
                      detail="Navegación principal del módulo comercial."
                      color={SIDEBAR_ACCENT}
                    />
                  }
                >
                  <button
                    type="button"
                    onClick={() => setIsCreditoExpanded((value) => !value)}
                    aria-expanded={isCreditoExpanded}
                    aria-controls="credito-menu"
                    className={cn(
                      "min-h-[45px] w-full flex items-center gap-[10px] border border-transparent px-[12.5px] rounded-none text-[10px] leading-[15px] transition-[background-color,border-color,color] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#833177]/25 cursor-liverpool-pointer",
                      isAnyChildActive
                        ? "font-semibold text-[#1D1B20]"
                        : "text-[#1D1B20]/80 font-medium",
                      "hover:border-border hover:text-[#1D1B20]",
                    )}
                    style={{
                      backgroundColor: isCreditoExpanded ? CONTROL_TINT : "transparent",
                    }}
                  >
                    <CreditCard className="w-[17.5px] h-[17.5px] shrink-0" aria-hidden="true" />
                    <span className="flex-1 text-left">Crédito</span>
                    {isCreditoExpanded ? (
                      <ChevronDown className="w-[15px] h-[15px] shrink-0 text-[#49454F]" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="w-[15px] h-[15px] shrink-0 text-[#49454F]" aria-hidden="true" />
                    )}
                  </button>
                </MD3Tooltip>

                {isCreditoExpanded && (
                  <nav id="credito-menu" className="flex flex-col gap-[5px] pl-[15px]" aria-label="Crédito">
                    <NavButton
                      item={creditMenu[0]}
                      isActive={pathname === "/"}
                    />

                    <div className="flex flex-col gap-[5px]">
                      <MD3Tooltip
                        className="block w-full"
                        content={
                          <SidebarTooltip
                            title="Jefes de ventas"
                            detail={`${managers.length} jefes detectados desde Google Sheets.`}
                            color={SIDEBAR_ACCENT}
                          />
                        }
                      >
                        <button
                          type="button"
                          onClick={() => setIsManagersExpanded((value) => !value)}
                          aria-expanded={isManagersExpanded}
                          aria-controls="jefes-menu"
                          className={cn(
                            "min-h-[45px] w-full flex items-center gap-[10px] border px-[12.5px] rounded-none text-[10px] leading-[15px] transition-[background-color,border-color,color] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#833177]/25 cursor-liverpool-pointer",
                            isManagersRoute
                              ? "border-border font-semibold text-[#833177]"
                              : "border-transparent text-[#1D1B20]/80 font-medium hover:border-border hover:text-[#1D1B20]",
                          )}
                          style={{
                            backgroundColor: isManagersExpanded ? CONTROL_TINT_SELECTED : "transparent",
                          }}
                        >
                          <Users className="w-[17.5px] h-[17.5px] shrink-0" aria-hidden="true" />
                          <span className="flex-1 text-left">Jefes de ventas</span>
                          <span className="font-mono text-[10px] tabular-nums text-[#49454F]">
                            {managers.length || "-"}
                          </span>
                          {isManagersExpanded ? (
                            <ChevronDown className="w-[15px] h-[15px] shrink-0 text-[#49454F]" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="w-[15px] h-[15px] shrink-0 text-[#49454F]" aria-hidden="true" />
                          )}
                        </button>
                      </MD3Tooltip>

                      {isManagersExpanded && (
                        <div
                          id="jefes-menu"
                          className="ml-[20px] flex flex-col gap-[5px] border-l border-border pl-[10px]"
                        >
                          <NavButton
                            compact
                            item={{
                              href: "/jefes-de-ventas",
                              label: "Todos los jefes",
                              icon: Users,
                              tooltip: "Abrir la vista general de Jefes de ventas.",
                            }}
                            isActive={pathname === "/jefes-de-ventas"}
                          />

                          {managers.map((manager) => (
                            <ManagerButton
                              key={manager.href}
                              manager={manager}
                              isActive={isManagerPathActive(pathname, manager.label)}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {creditMenu.slice(1).map((item) => (
                      <NavButton
                        key={`nav-${item.href}`}
                        item={item}
                        isActive={
                          pathname === item.href ||
                          (item.href !== "/" && pathname?.startsWith(item.href))
                        }
                      />
                    ))}
                  </nav>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  compact?: boolean;
}

function NavButton({ item, isActive, compact = false }: NavButtonProps) {
  const badgeColorClass = {
    red: { backgroundColor: "#ff6d0120", color: SIDEBAR_ORANGE },
    yellow: { backgroundColor: "#83317720", color: SIDEBAR_ACCENT },
    green: { backgroundColor: "#83317720", color: SIDEBAR_ACCENT },
  };

  return (
    <MD3Tooltip
      className="block w-full"
      content={
        <SidebarTooltip
          title={item.label}
          detail={item.tooltip || `Abrir ${item.label}.`}
          color={SIDEBAR_ACCENT}
        />
      }
    >
      <Link
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "min-h-[45px] w-full flex items-center gap-[10px] border px-[12.5px] rounded-none text-[10px] leading-[15px] no-underline cursor-liverpool-pointer transition-[background-color,border-color,color]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#833177]/25",
          compact ? "pl-[10px]" : "",
          isActive
            ? "border-[#833177]/25 bg-primary text-primary-foreground font-medium"
            : "border-transparent text-[#1D1B20]/80 hover:border-border hover:bg-muted/60 hover:text-[#1D1B20]",
        )}
      >
        <item.icon className="w-[17.5px] h-[17.5px] shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span
            className={cn(
              "text-[10px] leading-[12.5px] font-medium px-[7.5px] py-[2.5px] rounded-none",
              isActive && "bg-primary-foreground/20 text-primary-foreground",
              !isActive && !item.badgeColor && "bg-muted text-[#49454F]",
            )}
            style={
              !isActive && item.badgeColor
                ? badgeColorClass[item.badgeColor]
                : undefined
            }
          >
            {item.badge}
          </span>
        )}
      </Link>
    </MD3Tooltip>
  );
}

function ManagerButton({
  manager,
  isActive,
}: {
  manager: ManagerNavItem;
  isActive: boolean;
}) {
  const percentageText =
    manager.avance === null
      ? "Sin porcentaje oficial"
      : `${manager.avance.toFixed(2).replace(".", ",")}%`;

  return (
    <MD3Tooltip
      className="block w-full"
      content={
        <SidebarTooltip
          title={manager.label}
          detail={`${manager.status} · ${percentageText}${manager.active ? " · Plantilla actual" : " · Histórico"}`}
          color={manager.color}
        />
      }
    >
      <Link
        href={manager.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "min-h-[40px] w-full flex items-center gap-[10px] border px-[10px] rounded-none text-[10px] leading-[12.5px] no-underline cursor-liverpool-pointer transition-[background-color,border-color,color,transform]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#833177]/25",
          isActive
            ? "border-[#833177]/25 bg-primary text-primary-foreground font-medium"
            : "border-transparent text-[#1D1B20]/80 hover:border-border hover:bg-muted/60 hover:text-[#1D1B20]",
        )}
      >
        <span
          className="h-[12.5px] w-[5px] shrink-0"
          style={{
            backgroundColor: isActive ? "currentColor" : manager.color,
          }}
          aria-hidden="true"
        />
        <UserRound className="h-[15px] w-[15px] shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left">{manager.label}</span>
      </Link>
    </MD3Tooltip>
  );
}

function SidebarTooltip({
  title,
  detail,
  color,
}: {
  title: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="w-[220px] text-[10px] leading-[12.5px]">
      <div className="flex items-start gap-[10px] px-[10px] py-[10px]">
        <span
          className="mt-[1px] h-[12.5px] w-[5px] shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="break-words font-medium text-[#1D1B20]">{title}</p>
          <p className="mt-[5px] break-words text-[#49454F]">{detail}</p>
        </div>
      </div>
    </div>
  );
}
