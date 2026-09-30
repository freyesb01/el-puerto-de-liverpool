# Auditoría visual del dashboard `/` — antes de la refactorización

Medición en Chrome sobre la aplicación original. Las nueve gráficas usan
Recharts mediante UniversalComposedChart, UniversalLineChart,
UniversalAreaChart y UniversalRadarChart, con las cuatro representaciones.
La novena se monta cuando existen secciones, conservando esa condición.

## Inventario exacto

Abreviaturas de márgenes: T/R/B/L (arriba/derecha/abajo/izquierda).
RC = ResponsiveContainer al 100% de ancho y 300 px de alto.

| # | Título / React | Archivo | Wrapper y altura | Márgenes cartesianos; radar | Ejes | Tooltip | Leyenda |
|---|---|---|---|---|---|---|---|
| 1 | Índice de efectividad anual / KpiCard en KpiCards | components/kpi-cards.tsx | section propia + RC; 300 px | 20/30/20/20; 20/40/20/40 | Mes + porcentaje; Y porcentual | UniversalChartTooltip + CustomChartTooltip | No |
| 2 | Volumen de originación real / KpiCard en KpiCards | components/kpi-cards.tsx | section propia + RC; 300 px | 20/30/20/20; 20/40/20/40 | Mes + volumen; Y numérico | UniversalChartTooltip + CustomChartTooltip | No |
| 3 | Desviación operativa / KpiCard en KpiCards | components/kpi-cards.tsx | section propia + RC; 300 px | 20/30/20/20; 20/40/20/40 | Mes + diferencia; Y numérico | UniversalChartTooltip + CustomChartTooltip | No |
| 4 | Mezcla de portafolio financiero / KpiCard en KpiCards | components/kpi-cards.tsx | section propia + RC; 300 px | 20/30/20/20; 20/40/20/40 | Mes + total; Y numérico | UniversalChartTooltip + CustomChartTooltip | No |
| 5 | Análisis mensual del cumplimiento de meta frente al plan proyectado. / PlanVsRealChart | components/charts/plan-vs-real-chart.tsx | ChartCard + RC; 300 px | 20/30/20/10; 20/40/20/40 | Mes + porcentaje; Y con formato % y dominio original [0,100] | UniversalChartTooltip + CustomChartTooltip | No |
| 6 | Distribución estratégica y participación por canal comercial. / ChannelDonutChart | components/charts/channel-donut-chart.tsx | ChartCard + RC; 300 px | 20/30/20/20; 20/40/20/40 | Canal + porcentaje; Y % | UniversalChartTooltip + CustomChartTooltip | No |
| 7 | Top 3 jefes de ventas por avance acumulado (%). / JefesVentasChart | components/charts/jefes-ventas-chart.tsx | ChartCard + RC; 300 px | barras 20/30/20/10, líneas/áreas 20/30/20/20; radar 20/40/20/40 | Nombre + avance; Y % | UniversalChartTooltip + JefeCustomTooltip local | No |
| 8 | Clasificación de rendimiento operativo acumulado por promotor. / PromotoresRankingChart | components/charts/promotores-ranking-chart.tsx | ChartCard + RC; 300 px | barras 20/30/20/10, líneas/áreas 20/30/20/20; radar 20/40/20/40 | Nombre + avance; Y % | UniversalChartTooltip + PromotorCustomTooltip local | No |
| 9 | Desempeño comercial por departamento y sección operativa. / SeccionesChart | components/charts/secciones-chart.tsx | ChartCard + RC; 300 px | 20/30/20/20; 20/40/20/40 | Sección + avance; Y numérico | UniversalChartTooltip + CustomChartTooltip | No |

## Elementos comunes y duplicados

Las nueve reutilizan grid, ejes cartesianos/polares, cursores, puntos,
animaciones y tipos de gráfica de `components/charts/universal/`.
Las series, formatos y cálculos particulares permanecen en cada consumidor.
Las barras provienen de `components/ui/vertical-md3-bar.tsx` y sus medidas de
`lib/chart-config.ts`. Los ticks SVG de dos líneas se duplican en seis archivos.
Márgenes, radios (65%), altura y tarjetas están configurados en varios sitios.
Los tooltips de rankings duplican estructura visual y conservan textos propios.

Todas heredan Inter. Títulos: 12,5 px en móvil / 15 px desde sm;
valores: 25 px monoespaciados; etiquetas X: 10 px + segunda línea 9 px;
Y: 10 px. Los ticks polares y algunos estilos se definen localmente.
Padding de tarjeta: 15 px; separación título/KPI/gráfica: 15 px.
La altura mínima envolvente es 280 px, pero RC fija realmente 300 px.

## Medidas y causa

| Viewport | RC superior (ancho × alto) | RC inferior | Tarjeta superior / inferior |
|---|---|---|---|
| 1920 | 375 × 300 | 787 × 300 | 406,75 × 437 / 818,5 × 437 |
| 1440 | 255 × 300 | 547 × 300 | 286,75 × 437 / 578,5 × 437 |
| 1024 | 339 × 300 | 339 × 300 | 370,5 × 437 / 370,5 × 444,5 |
| 768 | 211 × 300 | 458 × 300 | 242,5 × 437–444,5 / 490 × 437 |
| 390 | 80 × 300 | 80 × 300 | ancho 112; títulos producen alturas de 677–1277 |

El grid superior es `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` en KpiCards;
los inferiores usan `grid-cols-1 lg:grid-cols-2` en OverviewContent.
La causa principal es el ancho disponible, no una altura de gráfica menor.
En móvil el sidebar fijo de 260 px deja apenas espacio para el dashboard.

## Alcance previsto

Conservar 300 px de gráfica y 15 px de padding como referencia inferior.
Activar un sistema universal de tarjetas, grid y presentación solo dentro de
OverviewContent. KpiCards también se usa en Periodos: mantener su presentación
anterior fuera del contexto del dashboard. Conservar datos, dominios,
formatos numéricos, cálculos, autenticación, navegación y filtros.
