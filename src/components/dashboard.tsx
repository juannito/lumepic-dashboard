"use client";

import {
  Activity,
  Album,
  BadgeDollarSign,
  Camera,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Eye,
  Images,
  Mail,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Tags,
  TrendingUp,
  UserRound,
  X
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import type { ConsolidatedPoint, ConsolidatedSummary, DashboardPayload, DashboardSummary, FidelityCode, Sale, SalesPoint } from "@/lib/lumepic-types";

type ExportColumn = {
  key: string;
  label: string;
  getValue: (profile: DashboardSummary, sale: Sale) => string | number | boolean;
};

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const compact = new Intl.NumberFormat("es-AR", {
  notation: "compact",
  maximumFractionDigits: 1
});

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "profile_label", label: "Perfil", getValue: (profile) => profile.label },
  { key: "photographer_name", label: "Fotografo", getValue: (profile) => profile.profile.name },
  { key: "photographer_email", label: "Email fotografo", getValue: (profile) => profile.profile.email },
  { key: "fidelity_code", label: "Fidelity code", getValue: (profile) => profile.profile.fidelityCode?.code ?? "" },
  {
    key: "fidelity_discount",
    label: "Fidelity discount",
    getValue: (profile) => formatFidelityDiscount(profile.profile.fidelityCode)
  },
  {
    key: "fidelity_status",
    label: "Fidelity status",
    getValue: (profile) => (profile.profile.fidelityCode?.isSuspended ? "suspended" : profile.profile.fidelityCode ? "active" : "")
  },
  { key: "sale_id", label: "Sale ID", getValue: (_profile, sale) => sale.id },
  { key: "status", label: "Estado", getValue: (_profile, sale) => sale.status },
  { key: "sale_date", label: "Fecha venta", getValue: (_profile, sale) => sale.date },
  { key: "buyer_name", label: "Comprador", getValue: (_profile, sale) => sale.buyer },
  { key: "buyer_email", label: "Email comprador", getValue: (_profile, sale) => sale.buyerEmail },
  { key: "album", label: "Album", getValue: (_profile, sale) => sale.album },
  { key: "activity", label: "Actividad", getValue: (_profile, sale) => sale.activity },
  { key: "photos", label: "Fotos", getValue: (_profile, sale) => sale.photos },
  { key: "photo_ids", label: "Photo IDs", getValue: (_profile, sale) => sale.photographs.map((photo) => photo.id).join("|") },
  {
    key: "photo_filenames",
    label: "Photo filenames",
    getValue: (_profile, sale) => sale.photographs.map((photo) => photo.originalFileName).join("|")
  },
  {
    key: "photo_thumbnails",
    label: "Photo thumbnails",
    getValue: (_profile, sale) => sale.photographs.map((photo) => photo.thumbnailUrl).join("|")
  },
  { key: "photo_urls", label: "Photo URLs", getValue: (_profile, sale) => sale.photographs.map((photo) => photo.url).join("|") },
  { key: "subtotal", label: "Subtotal", getValue: (_profile, sale) => sale.subtotal },
  { key: "discount", label: "Descuento", getValue: (_profile, sale) => sale.discount },
  { key: "gross_sale", label: "Venta", getValue: (_profile, sale) => sale.grossTotal },
  { key: "service", label: "Service", getValue: (_profile, sale) => sale.fees },
  { key: "net_total", label: "Neto", getValue: (_profile, sale) => sale.total },
  { key: "is_comped", label: "Bonificada", getValue: (_profile, sale) => sale.isComped },
  { key: "details_loaded", label: "Detalle cargado", getValue: (_profile, sale) => sale.detailsLoaded }
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

function toLocalYYYYMMDD(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function csvEscape(value: string | number | boolean) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function formatFidelityDiscount(fidelityCode?: FidelityCode) {
  if (!fidelityCode) return "";
  const amount = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(fidelityCode.amount);
  return fidelityCode.unit === "PERCENTAGE" ? `${amount}%` : `${fidelityCode.unit} ${amount}`.trim();
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Kpi({
  label,
  value,
  note,
  icon
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="kpi-card">
      <header>
        <span>{label}</span>
        {icon}
      </header>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  );
}

function KpiGrid({ totals }: { totals: DashboardSummary["totals"] }) {
  return (
    <section className="kpi-grid" aria-label="Metricas principales">
      <Kpi label="Ingresos" value={money.format(totals.revenue)} note="Neto final" icon={<BadgeDollarSign size={20} />} />
      <Kpi label="Subtotal" value={money.format(totals.subtotal)} note="Antes de descuentos" icon={<CircleDollarSign size={20} />} />
      <Kpi label="Descuentos" value={`-${money.format(totals.discounts)}`} note="Promos y bonificaciones" icon={<TrendingUp size={20} />} />
      <Kpi label="Service" value={`-${money.format(totals.fees)}`} note="Comision y processing" icon={<Activity size={20} />} />
      <Kpi label="Sales reales" value={String(totals.sales)} note={`${totals.orders} ordenes aprobadas`} icon={<ShoppingBag size={20} />} />
      <Kpi label="Ticket medio" value={money.format(totals.avgOrder)} note="Bruto por venta real" icon={<TrendingUp size={20} />} />
      <Kpi label="Albums" value={String(totals.albums)} note="Publicados" icon={<Album size={20} />} />
      <Kpi label="Fotos vendidas" value={compact.format(totals.photos)} note={`${compact.format(totals.publishedPhotos)} publicadas`} icon={<Images size={20} />} />
      <Kpi label="Ratio" value={`${totals.conversion.toFixed(2)}%`} note="Fotos vendidas/publicadas" icon={<Eye size={20} />} />
    </section>
  );
}

function LoadingState() {
  return (
    <main className="skeleton">
      <section className="skeleton-inner">
        <p className="eyebrow">Lumepic dashboard</p>
        <h1>Cargando ventas</h1>
        <div className="pulse" />
        <div className="pulse" />
        <div className="pulse" />
      </section>
    </main>
  );
}

function ExportModal({
  columns,
  selectedColumns,
  scopeLabel,
  rowCount,
  onClose,
  onExport,
  onToggleColumn,
  onSelectAll,
  onSelectNone
}: {
  columns: ExportColumn[];
  selectedColumns: string[];
  scopeLabel: string;
  rowCount: number;
  onClose: () => void;
  onExport: () => void;
  onToggleColumn: (columnKey: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="export-modal" role="dialog">
        <header className="modal-header">
          <div>
            <p className="eyebrow">CSV export</p>
            <h2>Columnas para cruzar offline</h2>
            <p>
              {scopeLabel} - {rowCount} filas
            </p>
          </div>
          <button className="icon-button" onClick={onClose} title="Cerrar">
            x
          </button>
        </header>

        <div className="modal-actions">
          <button className="text-button" onClick={onSelectAll}>
            Todas
          </button>
          <button className="text-button" onClick={onSelectNone}>
            Ninguna
          </button>
        </div>

        <div className="column-grid">
          {columns.map((column) => (
            <label className="column-toggle" key={column.key}>
              <input
                checked={selectedColumns.includes(column.key)}
                onChange={() => onToggleColumn(column.key)}
                type="checkbox"
              />
              <span>{column.label}</span>
            </label>
          ))}
        </div>

        <footer className="modal-footer">
          <button className="text-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="text-button primary" disabled={!selectedColumns.length || !rowCount} onClick={onExport}>
            <Download size={16} />
            Descargar CSV
          </button>
        </footer>
      </section>
    </div>
  );
}

function SaleThumbnails({ sale }: { sale: Sale }) {
  if (!sale.photographs.length) return <span className="photo-count">{sale.photos}</span>;

  return (
    <div className="thumb-cell" aria-label={`${sale.photographs.length} fotografias`}>
      <span className="photo-count">{sale.photos}</span>
      <div className="thumb-stack">
        {sale.photographs.slice(0, 4).map((photo) => (
          <span className="thumb-wrap" key={photo.id}>
            <img alt={photo.originalFileName || "Fotografia vendida"} className="sale-thumb" src={photo.thumbnailUrl || photo.url} />
            <span className="thumb-preview">
              <img alt={photo.originalFileName || "Fotografia vendida"} src={photo.url || photo.thumbnailUrl} />
              <span>{photo.originalFileName || photo.id}</span>
            </span>
          </span>
        ))}
        {sale.photographs.length > 4 ? <span className="thumb-more">+{sale.photographs.length - 4}</span> : null}
      </div>
    </div>
  );
}

function DetailPhotoStrip({ sale }: { sale?: Sale }) {
  if (!sale?.photographs.length) return null;

  return (
    <div className="detail-photo-strip">
      {sale.photographs.map((photo) => (
        <span className="thumb-wrap large" key={photo.id}>
          <img alt={photo.originalFileName || "Fotografia vendida"} className="detail-thumb" src={photo.thumbnailUrl || photo.url} />
          <span className="thumb-preview">
            <img alt={photo.originalFileName || "Fotografia vendida"} src={photo.url || photo.thumbnailUrl} />
            <span>{photo.originalFileName || photo.id}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

function ConsolidatedDashboard({
  consolidated,
  trendData,
  filterType,
  setFilterType,
  selectedYear,
  setSelectedYear,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  availableYears
}: {
  consolidated: ConsolidatedSummary;
  trendData: ConsolidatedPoint[];
  filterType: string;
  setFilterType: (val: string) => void;
  selectedYear: number;
  setSelectedYear: (val: number) => void;
  customStart: string;
  setCustomStart: (val: string) => void;
  customEnd: string;
  setCustomEnd: (val: string) => void;
  availableYears: number[];
}) {
  const [metric, setMetric] = useState<"revenue" | "photos">("revenue");

  return (
    <>
      <KpiGrid totals={consolidated.totals} />
      <section className="panel">
        <header className="panel-header" style={{ flexDirection: "column", alignItems: "stretch", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2>Ventas consolidadas</h2>
              <p>Comparación de {metric === "revenue" ? "ingresos netos" : "cantidad de fotos vendidas"} por periodo.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", gap: "4px", background: "var(--paper-2)", padding: "4px", borderRadius: "999px", border: "1px solid var(--line)" }}>
                <button
                  className={`filter-pill ${metric === "revenue" ? "active" : ""}`}
                  style={{
                    height: "28px",
                    padding: "0 12px",
                    border: "none",
                    borderRadius: "999px",
                    background: metric === "revenue" ? "var(--ink)" : "transparent",
                    color: metric === "revenue" ? "var(--white)" : "var(--ink)",
                    fontSize: "0.78rem",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                  onClick={() => setMetric("revenue")}
                >
                  Precio
                </button>
                <button
                  className={`filter-pill ${metric === "photos" ? "active" : ""}`}
                  style={{
                    height: "28px",
                    padding: "0 12px",
                    border: "none",
                    borderRadius: "999px",
                    background: metric === "photos" ? "var(--ink)" : "transparent",
                    color: metric === "photos" ? "var(--white)" : "var(--ink)",
                    fontSize: "0.78rem",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                  onClick={() => setMetric("photos")}
                >
                  Fotos
                </button>
              </div>
              <TrendingUp size={21} />
            </div>
          </div>

          <div className="filter-bar" style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            alignItems: "center",
            padding: "8px 0",
            borderTop: "1px solid var(--line-soft)"
          }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--muted)", marginRight: "8px" }}>
              Filtrar gráfico:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <button
                className={`filter-pill ${filterType === "all" ? "active" : ""}`}
                onClick={() => setFilterType("all")}
              >
                Todo
              </button>
              <button
                className={`filter-pill ${filterType === "7d" ? "active" : ""}`}
                onClick={() => setFilterType("7d")}
              >
                Últimos 7 días
              </button>
              <button
                className={`filter-pill ${filterType === "15d" ? "active" : ""}`}
                onClick={() => setFilterType("15d")}
              >
                Últimos 15 días
              </button>
              <button
                className={`filter-pill ${filterType === "ytd" ? "active" : ""}`}
                onClick={() => setFilterType("ytd")}
              >
                YTD
              </button>
              
              {availableYears.map(year => (
                <button
                  key={year}
                  className={`filter-pill ${filterType === "year" && selectedYear === year ? "active" : ""}`}
                  onClick={() => {
                    setFilterType("year");
                    setSelectedYear(year);
                  }}
                >
                  {year}
                </button>
              ))}
              
              <button
                className={`filter-pill ${filterType === "custom" ? "active" : ""}`}
                onClick={() => setFilterType("custom")}
              >
                Personalizado
              </button>
            </div>

            {filterType === "custom" && (
              <div className="custom-range-inputs" style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginLeft: "auto",
                background: "var(--paper-2)",
                padding: "4px 12px",
                borderRadius: "999px",
                border: "1px solid var(--line)"
              }}>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--ink)",
                    fontSize: "0.85rem",
                    outline: "none"
                  }}
                />
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>a</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--ink)",
                    fontSize: "0.85rem",
                    outline: "none"
                  }}
                />
              </div>
            )}
          </div>
        </header>
        <div className="chart-wrap">
          {trendData.length === 0 ? (
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--muted)", fontSize: "0.9rem" }}>
              Sin ventas en el rango seleccionado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke="rgba(0,0,0,0.1)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => (metric === "revenue" ? `$${value}` : String(value))}
                />
                <Tooltip
                  formatter={(value) => (metric === "revenue" ? money.format(Number(value)) : `${value} fotos`)}
                />
                {consolidated.profiles.map((profile) => (
                  <Line
                    dataKey={metric === "revenue" ? `${profile.id}_revenue` : `${profile.id}_photos`}
                    dot={false}
                    key={profile.id}
                    name={profile.label}
                    stroke={profile.color}
                    strokeWidth={4}
                    type="monotone"
                  />
                ))}
                <Line
                  dataKey={metric === "revenue" ? "totalRevenue" : "totalPhotos"}
                  dot={false}
                  name="Total"
                  stroke="#000000"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Cruce por perfil</h2>
            <p>Volumen, ingreso y ticket medio.</p>
          </div>
          <UserRound size={21} />
        </header>
        <div className="comparison-grid">
          {consolidated.profiles.map((profile) => (
            <article className="comparison-card" key={profile.id}>
              <header>
                <span className="profile-dot" style={{ background: profile.color }} />
                <strong>{profile.label}</strong>
              </header>
              <h3>{money.format(profile.revenue)}</h3>
              <div className="album-meta">
                <div>
                  <span>Sales</span>
                  <strong>{profile.sales}</strong>
                </div>
                <div>
                  <span>Ordenes</span>
                  <strong>{profile.orders}</strong>
                </div>
                <div>
                  <span>Fotos</span>
                  <strong>{profile.photos}</strong>
                </div>
                <div>
                  <span>Ticket</span>
                  <strong>{money.format(profile.avgOrder)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ProfileDashboard({
  summary,
  selectedSale,
  onSelectSale,
  trendData,
  filterType,
  setFilterType,
  selectedYear,
  setSelectedYear,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  availableYears
}: {
  summary: DashboardSummary;
  selectedSale?: Sale;
  onSelectSale: (saleId: string) => void;
  trendData: SalesPoint[];
  filterType: string;
  setFilterType: (val: string) => void;
  selectedYear: number;
  setSelectedYear: (val: number) => void;
  customStart: string;
  setCustomStart: (val: string) => void;
  customEnd: string;
  setCustomEnd: (val: string) => void;
  availableYears: number[];
}) {
  const [metric, setMetric] = useState<"revenue" | "photos">("revenue");

  return (
    <>
      <KpiGrid totals={summary.totals} />

      <section className="analysis-grid">
        <article className="panel">
          <header className="panel-header" style={{ flexDirection: "column", alignItems: "stretch", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2>{metric === "revenue" ? "Tendencia de ingresos" : "Tendencia de fotos vendidas"}</h2>
                <p>{metric === "revenue" ? "Evolucion reciente de ventas aprobadas." : "Cantidad de fotos vendidas por periodo."}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", gap: "4px", background: "var(--paper-2)", padding: "4px", borderRadius: "999px", border: "1px solid var(--line)" }}>
                  <button
                    className={`filter-pill ${metric === "revenue" ? "active" : ""}`}
                    style={{
                      height: "28px",
                      padding: "0 12px",
                      border: "none",
                      borderRadius: "999px",
                      background: metric === "revenue" ? "var(--ink)" : "transparent",
                      color: metric === "revenue" ? "var(--white)" : "var(--ink)",
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                    onClick={() => setMetric("revenue")}
                  >
                    Precio
                  </button>
                  <button
                    className={`filter-pill ${metric === "photos" ? "active" : ""}`}
                    style={{
                      height: "28px",
                      padding: "0 12px",
                      border: "none",
                      borderRadius: "999px",
                      background: metric === "photos" ? "var(--ink)" : "transparent",
                      color: metric === "photos" ? "var(--white)" : "var(--ink)",
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                    onClick={() => setMetric("photos")}
                  >
                    Fotos
                  </button>
                </div>
                <TrendingUp size={21} />
              </div>
            </div>

            <div className="filter-bar" style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
              padding: "8px 0",
              borderTop: "1px solid var(--line-soft)"
            }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--muted)", marginRight: "8px" }}>
                Filtrar gráfico:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                <button
                  className={`filter-pill ${filterType === "all" ? "active" : ""}`}
                  onClick={() => setFilterType("all")}
                >
                  Todo
                </button>
                <button
                  className={`filter-pill ${filterType === "7d" ? "active" : ""}`}
                  onClick={() => setFilterType("7d")}
                >
                  Últimos 7 días
                </button>
                <button
                  className={`filter-pill ${filterType === "15d" ? "active" : ""}`}
                  onClick={() => setFilterType("15d")}
                >
                  Últimos 15 días
                </button>
                <button
                  className={`filter-pill ${filterType === "ytd" ? "active" : ""}`}
                  onClick={() => setFilterType("ytd")}
                >
                  YTD
                </button>
                
                {availableYears.map(year => (
                  <button
                    key={year}
                    className={`filter-pill ${filterType === "year" && selectedYear === year ? "active" : ""}`}
                    onClick={() => {
                      setFilterType("year");
                      setSelectedYear(year);
                    }}
                  >
                    {year}
                  </button>
                ))}
                
                <button
                  className={`filter-pill ${filterType === "custom" ? "active" : ""}`}
                  onClick={() => setFilterType("custom")}
                >
                  Personalizado
                </button>
              </div>

              {filterType === "custom" && (
                <div className="custom-range-inputs" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginLeft: "auto",
                  background: "var(--paper-2)",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  border: "1px solid var(--line)"
                }}>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--ink)",
                      fontSize: "0.85rem",
                      outline: "none"
                    }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>a</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--ink)",
                      fontSize: "0.85rem",
                      outline: "none"
                    }}
                  />
                </div>
              )}
            </div>
          </header>
          <div className="chart-wrap">
            {trendData.length === 0 ? (
              <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--muted)", fontSize: "0.9rem" }}>
                Sin ventas en el rango seleccionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid stroke="rgba(17,18,16,0.1)" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => (metric === "revenue" ? `$${value}` : String(value))}
                  />
                  <Tooltip
                    formatter={(value) => (metric === "revenue" ? money.format(Number(value)) : `${value} fotos`)}
                  />
                  <Area
                    type="monotone"
                    dataKey={metric === "revenue" ? "revenue" : "photos"}
                    stroke="#000000"
                    fill={summary.color}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <div>
              <h2>Ventas por actividad</h2>
              <p>Donde se concentra la demanda.</p>
            </div>
            <Activity size={21} />
          </header>
          <div className="activity-list">
            {summary.activities.slice(0, 6).map((activity) => (
              <div className="activity-row" key={activity.name}>
                <header>
                  <span>{activity.name}</span>
                  <span>{money.format(activity.revenue)}</span>
                </header>
                <div className="meter" aria-label={`${activity.share}%`}>
                  <span style={{ width: `${Math.min(activity.share, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Albums con mejor lectura comercial</h2>
            <p>Prioriza albumes con conversion, volumen e ingresos.</p>
          </div>
          <Album size={21} />
        </header>
        <div className="album-grid">
          {summary.albums.slice(0, 6).map((album) => (
            <article className="album-card" key={album.id}>
              <header>
                <span className="status-pill">
                  <CheckCircle2 size={13} />
                  Live
                </span>
                <span>{formatDate(album.createdAt)}</span>
              </header>
              <h3>{album.title}</h3>
              <div className="album-meta">
                <div>
                  <span>Revenue</span>
                  <strong>{money.format(album.revenue)}</strong>
                </div>
                <div>
                  <span>Sales</span>
                  <strong>{album.sales}</strong>
                </div>
                <div>
                  <span>Views</span>
                  <strong>{compact.format(album.views)}</strong>
                </div>
                <div>
                  <span>Conv.</span>
                  <strong>{album.conversion.toFixed(1)}%</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sales-section">
        <article className="panel">
          <header className="table-toolbar">
            <div>
              <h2>Ventas recientes</h2>
              <p>Click en una venta para revisar el detalle.</p>
            </div>
            <ShoppingBag size={21} />
          </header>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Venta</th>
                  <th>Album</th>
                  <th>Fotos</th>
                  <th>Subtotal</th>
                  <th>Descuento</th>
                  <th>Venta</th>
                  <th>Service</th>
                  <th>Neto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {summary.sales.map((sale) => (
                  <tr key={sale.id}>
                    <td data-label="Venta">
                      <button className="sale-button" onClick={() => onSelectSale(sale.id)}>
                        <strong>
                          {sale.buyer}
                          {sale.buyerEmail ? (
                            <span title={sale.buyerEmail} style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "6px" }}>
                              <Mail size={14} />
                            </span>
                          ) : null}
                        </strong>
                        <span>{formatDate(sale.date)}</span>
                      </button>
                    </td>
                    <td data-label="Album">{sale.album}</td>
                    <td data-label="Fotos">
                      <SaleThumbnails sale={sale} />
                    </td>
                    <td data-label="Subtotal">{money.format(sale.subtotal)}</td>
                    <td data-label="Descuento">-{money.format(sale.discount)}</td>
                    <td data-label="Venta">{money.format(sale.grossTotal)}</td>
                    <td data-label="Service">-{money.format(sale.fees)}</td>
                    <td data-label="Neto">{money.format(sale.total)}</td>
                    <td data-label="Estado">
                      <span className="status-pill">
                        <CheckCircle2 size={13} />
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="sale-detail">
          <div className="detail-plate">
            <strong>{selectedSale ? money.format(selectedSale.total) : "$0"}</strong>
          </div>
          <DetailPhotoStrip sale={selectedSale} />
          <header className="panel-header">
            <div>
              <h2>{selectedSale?.buyer ?? "Venta"}</h2>
              <p>{selectedSale?.buyerEmail || selectedSale?.album || "Sin email"}</p>
            </div>
            <Camera size={21} />
          </header>
          <div className="detail-list">
            <div>
              <span>Email comprador</span>
              <strong>{selectedSale?.buyerEmail || "-"}</strong>
            </div>
            <div>
              <span>Actividad</span>
              <strong>{selectedSale?.activity}</strong>
            </div>
            <div>
              <span>Fotos pagas</span>
              <strong>{selectedSale?.photos}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{selectedSale ? money.format(selectedSale.subtotal) : "-"}</strong>
            </div>
            <div>
              <span>Descuentos</span>
              <strong>{selectedSale ? `-${money.format(selectedSale.discount)}` : "-"}</strong>
            </div>
            <div>
              <span>Venta</span>
              <strong>{selectedSale ? money.format(selectedSale.grossTotal) : "-"}</strong>
            </div>
            <div>
              <span>Service</span>
              <strong>{selectedSale ? `-${money.format(selectedSale.fees)}` : "-"}</strong>
            </div>
            <div>
              <span>Total neto</span>
              <strong>{selectedSale ? money.format(selectedSale.total) : "-"}</strong>
            </div>
            <div>
              <span>Fecha</span>
              <strong>{selectedSale ? formatDate(selectedSale.date) : "-"}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>{selectedSale?.status}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>Mix de actividad</h2>
            <p>Comparacion rapida por cantidad de ventas.</p>
          </div>
          <Activity size={21} />
        </header>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.activities}>
              <CartesianGrid stroke="rgba(17,18,16,0.1)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="sales" fill="#000000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}

type ClientLocalProfile = {
  instagram?: string;
  notes?: string;
  customName?: string;
};

type ClientSalesItem = {
  saleId: string;
  date: string;
  album: string;
  total: number;
  photographerName: string;
};

type Client = {
  key: string;
  name: string;
  email: string;
  totalSpent: number;
  salesCount: number;
  sales: ClientSalesItem[];
};

function ClientsDashboard({
  clients,
  clientsLocalData,
  selectedClientKey,
  onSelectClient,
  editingClientKey,
  setEditingClientKey,
  editInstagram,
  setEditInstagram,
  editNotes,
  setEditNotes,
  editCustomName,
  setEditCustomName,
  onSaveClient,
}: {
  clients: Client[];
  clientsLocalData: Record<string, ClientLocalProfile>;
  selectedClientKey: string | null;
  onSelectClient: (key: string | null) => void;
  editingClientKey: string | null;
  setEditingClientKey: (key: string | null) => void;
  editInstagram: string;
  setEditInstagram: (val: string) => void;
  editNotes: string;
  setEditNotes: (val: string) => void;
  editCustomName: string;
  setEditCustomName: (val: string) => void;
  onSaveClient: (key: string) => void;
}) {
  const selectedClient = clients.find((c) => c.key === selectedClientKey) || clients[0];
  const localData = selectedClient ? clientsLocalData[selectedClient.key] : undefined;
  const isEditing = selectedClient && editingClientKey === selectedClient.key;

  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

  useEffect(() => {
    if (selectedClientKey) {
      setIsBottomSheetExpanded(true);
    } else {
      setIsBottomSheetExpanded(false);
    }
  }, [selectedClientKey]);

  const totalClientsCount = clients.length;
  const totalSpentAllClients = clients.reduce((acc, c) => acc + c.totalSpent, 0);
  const avgSpentPerClient = totalClientsCount > 0 ? totalSpentAllClients / totalClientsCount : 0;

  const startEditing = () => {
    if (!selectedClient) return;
    setEditingClientKey(selectedClient.key);
    setEditInstagram(localData?.instagram || "");
    setEditNotes(localData?.notes || "");
    setEditCustomName(localData?.customName || "");
  };

  const handleSave = () => {
    if (!selectedClient) return;
    onSaveClient(selectedClient.key);
    setEditingClientKey(null);
  };

  const getInstagramLink = (handle: string) => {
    const cleanHandle = handle.replace("@", "").trim();
    return `https://instagram.com/${cleanHandle}`;
  };

  const renderDetailContent = () => {
    if (!selectedClient) return null;
    return (
      <>
        <div className="detail-plate">
          <strong>{money.format(selectedClient.totalSpent)}</strong>
        </div>
        <header className="panel-header">
          <div>
            <h2>{localData?.customName || selectedClient.name}</h2>
            <p>{selectedClient.email || "Sin email"}</p>
          </div>
          <UserRound size={21} />
        </header>

        {isEditing ? (
          <div style={{ display: "grid", gap: "12px", padding: "8px 0" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "4px",
                }}
              >
                Nombre Personalizado
              </label>
              <input
                type="text"
                value={editCustomName}
                onChange={(e) => setEditCustomName(e.target.value)}
                placeholder={selectedClient.name}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--paper-2)",
                  color: "var(--ink)",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "4px",
                }}
              >
                Instagram
              </label>
              <input
                type="text"
                value={editInstagram}
                onChange={(e) => setEditInstagram(e.target.value)}
                placeholder="@usuario"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--paper-2)",
                  color: "var(--ink)",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "4px",
                }}
              >
                Notas
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notas del cliente..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--paper-2)",
                  color: "var(--ink)",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button className="text-button primary" onClick={handleSave} style={{ flex: 1 }}>
                Guardar
              </button>
              <button className="text-button" onClick={() => setEditingClientKey(null)} style={{ flex: 1 }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="detail-list">
            <div>
              <span>Instagram</span>
              {localData?.instagram ? (
                <a
                  href={getInstagramLink(localData.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--ink)", fontWeight: "600", textDecoration: "underline" }}
                >
                  @{localData.instagram.replace("@", "")}
                </a>
              ) : (
                <span style={{ color: "var(--muted)" }}>No asignado</span>
              )}
            </div>
            <div>
              <span>Notas</span>
              <strong style={{ whiteSpace: "pre-wrap", textAlign: "right" }}>{localData?.notes || "—"}</strong>
            </div>
            <div>
              <span>Total Compras</span>
              <strong>{selectedClient.salesCount}</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", borderBottom: "none" }}>
              <span style={{ marginBottom: "8px" }}>Historial de Compras</span>
              <div style={{ display: "grid", gap: "8px", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
                {selectedClient.sales.map((sale) => (
                  <div
                    key={sale.saleId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px",
                      background: "var(--paper-2)",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div style={{ display: "grid", gap: "2px" }}>
                      <strong style={{ fontSize: "0.85rem" }}>{sale.album}</strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        {formatDate(sale.date)} - {sale.photographerName}
                      </span>
                    </div>
                    <strong>{money.format(sale.total)}</strong>
                  </div>
                ))}
              </div>
            </div>
            <button className="text-button" onClick={startEditing} style={{ width: "100%", marginTop: "12px" }}>
              Editar Perfil
            </button>
          </div>
        )}
      </>
    );
  };

  const isBottomSheetOpen = isBottomSheetExpanded && selectedClientKey !== null && selectedClientKey !== "";

  return (
    <>
      <section className="kpi-grid" aria-label="Metricas de clientes">
        <article className="kpi-card">
          <header>
            <span>Total Clientes</span>
            <UserRound size={20} />
          </header>
          <strong>{totalClientsCount}</strong>
          <span>Compradores unicos</span>
        </article>
        <article className="kpi-card" style={{ background: "var(--yellow)" }}>
          <header>
            <span>Facturacion Total</span>
            <BadgeDollarSign size={20} />
          </header>
          <strong>{money.format(totalSpentAllClients)}</strong>
          <span>Total acumulado</span>
        </article>
        <article className="kpi-card" style={{ background: "var(--cyan)" }}>
          <header>
            <span>Ticket Medio</span>
            <TrendingUp size={20} />
          </header>
          <strong>{money.format(avgSpentPerClient)}</strong>
          <span>Promedio por cliente</span>
        </article>
      </section>

      <section className="sales-section">
        <article className="panel">
          <header className="table-toolbar">
            <div>
              <h2>Directorio de Clientes</h2>
              <p>Haz clic en un cliente para ver su historial y redes sociales.</p>
            </div>
            <UserRound size={21} />
          </header>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Instagram</th>
                  <th>Compras</th>
                  <th>Total Comprado</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const cLocal = clientsLocalData[client.key];
                  const displayName = cLocal?.customName || client.name;
                  const isSelected = selectedClientKey ? client.key === selectedClientKey : client.key === clients[0]?.key;
                  return (
                    <tr
                      key={client.key}
                      style={isSelected ? { background: "var(--paper-2)" } : {}}
                    >
                      <td data-label="Cliente">
                        <button className="sale-button" onClick={() => onSelectClient(client.key)}>
                          <strong>{displayName}</strong>
                          <span>{client.email || "Sin email"}</span>
                        </button>
                      </td>
                      <td data-label="Instagram">
                        {cLocal?.instagram ? (
                          <a
                            href={getInstagramLink(cLocal.instagram)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="status-pill"
                            style={{
                              background: "var(--cream)",
                              border: "1px solid var(--line)",
                              textDecoration: "none",
                              color: "var(--ink)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            @{cLocal.instagram.replace("@", "")}
                          </a>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>—</span>
                        )}
                      </td>
                      <td data-label="Compras">{client.salesCount}</td>
                      <td data-label="Total Comprado">{money.format(client.totalSpent)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="sale-detail">
          {selectedClient ? (
            renderDetailContent()
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
              Selecciona un cliente para ver el detalle.
            </div>
          )}
        </aside>
      </section>

      {/* Mobile Peek Bar */}
      {selectedClientKey && selectedClient && !isBottomSheetExpanded && (
        <div className="mobile-peek-bar" onClick={() => setIsBottomSheetExpanded(true)}>
          <div className="mobile-peek-info">
            <strong>{localData?.customName || selectedClient.name}</strong>
            <span>Total comprado: {money.format(selectedClient.totalSpent)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button className="text-button primary compact" style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "999px" }}>
              Ver Detalle
            </button>
            <button
              className="icon-button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectClient(null);
              }}
              style={{
                border: "none",
                background: "var(--line)",
                cursor: "pointer",
                color: "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px",
                borderRadius: "50%"
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile BottomSheet */}
      {isBottomSheetOpen && selectedClient && (
        <div className="mobile-bottomsheet-backdrop" onClick={() => setIsBottomSheetExpanded(false)}>
          <div className="mobile-bottomsheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-bottomsheet-drag-handle" />
            <div className="mobile-bottomsheet-close-btn">
              <button
                className="icon-button"
                onClick={() => onSelectClient(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--ink)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px"
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mobile-bottomsheet-content">
              {renderDetailContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [activeView, setActiveView] = useState("consolidated");
  const [activeSaleId, setActiveSaleId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(EXPORT_COLUMNS.map((column) => column.key));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheTime, setCacheTime] = useState<string>("");
  const [hasFetchedFullHistory, setHasFetchedFullHistory] = useState(false);

  // Clientes View States
  const [clientsLocalData, setClientsLocalData] = useState<Record<string, ClientLocalProfile>>({});
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [editingClientKey, setEditingClientKey] = useState<string | null>(null);
  const [editInstagram, setEditInstagram] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCustomName, setEditCustomName] = useState("");

  useEffect(() => {
    async function loadClients() {
      try {
        const response = await fetch("/api/lumepic/clients");
        if (response.ok) {
          const data = await response.json();
          
          if (Object.keys(data).length === 0) {
            const saved = localStorage.getItem("lumepic_clients_v1");
            if (saved) {
              const localParsed = JSON.parse(saved);
              setClientsLocalData(localParsed);
              fetch("/api/lumepic/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(localParsed)
              }).catch(console.error);
              return;
            }
          }
          
          setClientsLocalData(data);
        }
      } catch (e) {
        console.error("Error loading client data from API", e);
      }
    }
    loadClients();
  }, []);

  const saveClientData = async (key: string, data: ClientLocalProfile) => {
    const updated = {
      ...clientsLocalData,
      [key]: data,
    };
    setClientsLocalData(updated);
    
    try {
      await fetch("/api/lumepic/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.error("Error saving client data to API", e);
    }
  };

  async function loadSummary(forceFetch: boolean = false, limit: number = 500) {
    setLoading(true);
    setError(null);

    // If not forcing fetch, check localStorage cache first
    if (!forceFetch) {
      try {
        const cached = localStorage.getItem("lumepic_dashboard_cache_v2");
        if (cached) {
          const data = JSON.parse(cached) as DashboardPayload;
          
          // Verify that the cached data size is sufficient for the requested limit
          const maxSalesInCache = Math.max(...data.profiles.map(p => p.sales.length), 0);
          if (maxSalesInCache >= limit) {
            setDashboard(data);
            const cachedTime = localStorage.getItem("lumepic_dashboard_cached_at_v2");
            if (cachedTime) {
              setCacheTime(cachedTime);
            }
            if (maxSalesInCache >= 1000) {
              setHasFetchedFullHistory(true);
            }
            const selected = data.profiles.find((profile) => profile.id === activeView) || data.profiles[0];
            setActiveSaleId(selected?.sales[0]?.id ?? null);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Error reading dashboard cache from localStorage", e);
      }
    }

    try {
      const response = await fetch(`/api/lumepic/summary?limit=${limit}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`API local respondio ${response.status}`);

      const data = (await response.json()) as DashboardPayload;

      // Save to localStorage cache and update cached timestamp
      const timeStr = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      const dateStr = new Date().toLocaleDateString("es-AR", { month: "short", day: "numeric" });
      const fullStr = `${dateStr}, ${timeStr}`;

      try {
        localStorage.setItem("lumepic_dashboard_cache_v2", JSON.stringify(data));
        localStorage.setItem("lumepic_dashboard_cached_at_v2", fullStr);
      } catch (e) {
        console.error("Error writing dashboard cache to localStorage", e);
      }

      setCacheTime(fullStr);
      if (limit >= 1000) {
        setHasFetchedFullHistory(true);
      }
      setDashboard(data);
      const selected = data.profiles.find((profile) => profile.id === activeView) || data.profiles[0];
      setActiveSaleId(selected?.sales[0]?.id ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pude cargar los datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary(false, 500);
  }, []);

  // Filters for the trend charts
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const availableYears = useMemo(() => {
    if (!dashboard) return [];
    const years = new Set<number>();
    dashboard.profiles.forEach((profile) => {
      profile.sales.forEach((sale) => {
        if (sale.date) {
          const year = new Date(sale.date).getFullYear();
          if (!isNaN(year)) {
            years.add(year);
          }
        }
      });
    });
    if (years.size === 0) {
      years.add(new Date().getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [dashboard]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    if (!dashboard || loading || hasFetchedFullHistory) return;

    let minRequiredDate: Date | null = null;
    const now = new Date();

    if (filterType === "7d") {
      minRequiredDate = new Date();
      minRequiredDate.setDate(now.getDate() - 7);
      minRequiredDate.setHours(0, 0, 0, 0);
    } else if (filterType === "15d") {
      minRequiredDate = new Date();
      minRequiredDate.setDate(now.getDate() - 15);
      minRequiredDate.setHours(0, 0, 0, 0);
    } else if (filterType === "ytd") {
      minRequiredDate = new Date(now.getFullYear(), 0, 1);
    } else if (filterType === "year") {
      minRequiredDate = new Date(selectedYear, 0, 1);
    } else if (filterType === "custom" && customStart) {
      minRequiredDate = new Date(customStart + "T00:00:00");
    } else if (filterType === "all") {
      minRequiredDate = new Date(2000, 0, 1);
    }

    if (!minRequiredDate) return;

    const dates: Date[] = [];
    dashboard.profiles.forEach((profile) => {
      profile.sales.forEach((sale) => {
        const d = new Date(sale.date);
        if (!isNaN(d.getTime())) {
          dates.push(d);
        }
      });
    });

    if (dates.length > 0 && minRequiredDate) {
      const oldestLoadedTime = Math.min(...dates.map((d) => d.getTime()));
      if (oldestLoadedTime > minRequiredDate.getTime()) {
        setHasFetchedFullHistory(true);
        void loadSummary(true, 1000);
      }
    }
  }, [dashboard, filterType, selectedYear, customStart, loading, hasFetchedFullHistory]);

  const activeProfile = useMemo(
    () => dashboard?.profiles.find((profile) => profile.id === activeView) ?? dashboard?.profiles[0],
    [activeView, dashboard]
  );
  const selectedSale = useMemo<Sale | undefined>(
    () => activeProfile?.sales.find((sale) => sale.id === activeSaleId) ?? activeProfile?.sales[0],
    [activeSaleId, activeProfile]
  );

  const filteredConsolidatedTrend = useMemo(() => {
    if (!dashboard) return [];

    const now = new Date();
    const matchesFilter = (saleDate: Date) => {
      if (filterType === "7d") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return saleDate >= sevenDaysAgo;
      }
      if (filterType === "15d") {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(now.getDate() - 15);
        fifteenDaysAgo.setHours(0, 0, 0, 0);
        return saleDate >= fifteenDaysAgo;
      }
      if (filterType === "ytd") {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return saleDate >= startOfYear;
      }
      if (filterType === "year") {
        return saleDate.getFullYear() === selectedYear;
      }
      if (filterType === "custom") {
        if (customStart) {
          const start = new Date(customStart + "T00:00:00");
          if (saleDate < start) return false;
        }
        if (customEnd) {
          const end = new Date(customEnd + "T23:59:59");
          if (saleDate > end) return false;
        }
        return true;
      }
      return true;
    };

    const groups: Record<string, {
      date: Date;
      label: string;
      totalRevenue: number;
      totalPhotos: number;
      totalSales: number;
      [profileId: string]: any;
    }> = {};

    dashboard.profiles.forEach((profile) => {
      profile.sales.forEach((sale) => {
        if (sale.isComped) return;
        const saleDate = new Date(sale.date);
        if (isNaN(saleDate.getTime())) return;
        if (!matchesFilter(saleDate)) return;

        const key = toLocalYYYYMMDD(saleDate);
        if (!groups[key]) {
          const label = saleDate.toLocaleDateString("es-AR", { month: "short", day: "2-digit" });
          groups[key] = {
            date: saleDate,
            label,
            totalRevenue: 0,
            totalPhotos: 0,
            totalSales: 0,
          };
          dashboard.profiles.forEach((p) => {
            groups[key][`${p.id}_revenue`] = 0;
            groups[key][`${p.id}_photos`] = 0;
          });
        }

        groups[key].totalRevenue += sale.total;
        groups[key].totalPhotos += (sale.photos || 0);
        groups[key].totalSales += 1;
        groups[key][`${profile.id}_revenue`] = (groups[key][`${profile.id}_revenue`] || 0) + sale.total;
        groups[key][`${profile.id}_photos`] = (groups[key][`${profile.id}_photos`] || 0) + (sale.photos || 0);
      });
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    return sortedKeys.map((key) => {
      const g = groups[key];
      const point: any = {
        label: g.label,
        totalRevenue: Number(g.totalRevenue.toFixed(2)),
        totalPhotos: g.totalPhotos,
        totalSales: g.totalSales,
      };
      dashboard.profiles.forEach((p) => {
        point[`${p.id}_revenue`] = Number((g[`${p.id}_revenue`] || 0).toFixed(2));
        point[`${p.id}_photos`] = g[`${p.id}_photos`] || 0;
      });
      return point;
    });
  }, [dashboard, filterType, selectedYear, customStart, customEnd]);

  const filteredProfileTrend = useMemo(() => {
    if (!dashboard || !activeProfile) return [];

    const now = new Date();
    const matchesFilter = (saleDate: Date) => {
      if (filterType === "7d") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return saleDate >= sevenDaysAgo;
      }
      if (filterType === "15d") {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(now.getDate() - 15);
        fifteenDaysAgo.setHours(0, 0, 0, 0);
        return saleDate >= fifteenDaysAgo;
      }
      if (filterType === "ytd") {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return saleDate >= startOfYear;
      }
      if (filterType === "year") {
        return saleDate.getFullYear() === selectedYear;
      }
      if (filterType === "custom") {
        if (customStart) {
          const start = new Date(customStart + "T00:00:00");
          if (saleDate < start) return false;
        }
        if (customEnd) {
          const end = new Date(customEnd + "T23:59:59");
          if (saleDate > end) return false;
        }
        return true;
      }
      return true;
    };

    const groups: Record<string, {
      date: Date;
      label: string;
      sales: number;
      revenue: number;
      photos: number;
    }> = {};

    activeProfile.sales.forEach((sale) => {
      if (sale.isComped) return;
      const saleDate = new Date(sale.date);
      if (isNaN(saleDate.getTime())) return;
      if (!matchesFilter(saleDate)) return;

      const key = toLocalYYYYMMDD(saleDate);
      if (!groups[key]) {
        const label = saleDate.toLocaleDateString("es-AR", { month: "short", day: "2-digit" });
        groups[key] = {
          date: saleDate,
          label,
          sales: 0,
          revenue: 0,
          photos: 0,
        };
      }

      groups[key].sales += 1;
      groups[key].revenue += sale.total;
      groups[key].photos += (sale.photos || 0);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    return sortedKeys.map((key) => ({
      label: groups[key].label,
      sales: groups[key].sales,
      revenue: Number(groups[key].revenue.toFixed(2)),
      photos: groups[key].photos,
    }));
  }, [dashboard, activeProfile, filterType, selectedYear, customStart, customEnd]);


  const clients = useMemo(() => {
    if (!dashboard) return [];
    const clientMap: Record<string, {
      key: string;
      name: string;
      email: string;
      totalSpent: number;
      salesCount: number;
      sales: { saleId: string; date: string; album: string; total: number; photographerName: string }[];
    }> = {};

    dashboard.profiles.forEach((profile) => {
      profile.sales.forEach((sale) => {
        const key = sale.buyerEmail ? sale.buyerEmail.toLowerCase().trim() : sale.buyer.toLowerCase().trim();
        if (!clientMap[key]) {
          clientMap[key] = {
            key,
            name: sale.buyer,
            email: sale.buyerEmail || "",
            totalSpent: 0,
            salesCount: 0,
            sales: [],
          };
        }
        clientMap[key].totalSpent += sale.total;
        clientMap[key].salesCount += 1;
        clientMap[key].sales.push({
          saleId: sale.id,
          date: sale.date,
          album: sale.album,
          total: sale.total,
          photographerName: profile.profile.name,
        });
      });
    });

    Object.values(clientMap).forEach((client) => {
      client.sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return Object.values(clientMap).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [dashboard]);

  const activeClientKey = selectedClientKey || clients[0]?.key || null;

  if (loading) return <LoadingState />;

  if (!dashboard) {
    return (
      <main className="skeleton">
        <section className="skeleton-inner">
          <p className="eyebrow">Lumepic dashboard</p>
          <h1>No pude cargar ventas</h1>
          <p>{error ?? "La API local no respondio."}</p>
          <button className="text-button" onClick={() => void loadSummary(true)}>
            Reintentar
          </button>
        </section>
      </main>
    );
  }

  const isClientsView = activeView === "clients";
  const showConsolidated = activeView === "consolidated";
  const totals = isClientsView
    ? { revenue: clients.reduce((acc, c) => acc + c.totalSpent, 0), albums: dashboard.consolidated.totals.albums }
    : (showConsolidated ? dashboard.consolidated.totals : activeProfile?.totals);
  const warnings = [dashboard.warning, !showConsolidated && !isClientsView ? activeProfile?.warning : null].filter(Boolean).join(" ");
  const exportProfiles = showConsolidated ? dashboard.profiles : activeProfile ? [activeProfile] : [];
  const exportRowCount = exportProfiles.reduce((count, profile) => count + profile.sales.length, 0);
  const exportScopeLabel = showConsolidated ? "Todos los perfiles" : activeProfile?.label ?? "Perfil";
  const fidelityCodes = dashboard.profiles
    .map((profile) => profile.profile.fidelityCode?.code)
    .filter(Boolean);
  const fidelityLabel = showConsolidated
    ? `${fidelityCodes.length} codigos`
    : activeProfile?.profile.fidelityCode
      ? `${activeProfile.profile.fidelityCode.code} - ${formatFidelityDiscount(activeProfile.profile.fidelityCode)}`
      : "Sin codigo";

  function toggleColumn(columnKey: string) {
    setSelectedColumns((current) =>
      current.includes(columnKey) ? current.filter((key) => key !== columnKey) : [...current, columnKey]
    );
  }

  function exportCsv() {
    const columns = EXPORT_COLUMNS.filter((column) => selectedColumns.includes(column.key));
    const rows = [
      columns.map((column) => column.label),
      ...exportProfiles.flatMap((profile) =>
        profile.sales.map((sale) => columns.map((column) => String(column.getValue(profile, sale) ?? "")))
      )
    ];
    const stamp = new Date().toISOString().slice(0, 10);
    const scope = showConsolidated ? "consolidado" : activeProfile?.id ?? "perfil";
    downloadCsv(`lumepic-${scope}-${stamp}.csv`, rows);
    setExportOpen(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <Camera size={27} />
          </div>
          <div>
            <p className="eyebrow">Lumepic photographer intelligence</p>
            <h1>Dashboard</h1>
          </div>
        </div>
        <div className="top-actions">
          <div className="profile-switcher" aria-label="Dashboard selector">
            <button
              className={activeView === "consolidated" ? "switcher-item active" : "switcher-item"}
              onClick={() => setActiveView("consolidated")}
            >
              Consolidado
            </button>
            {dashboard.profiles.map((profile) => (
              <button
                className={activeView === profile.id ? "switcher-item active" : "switcher-item"}
                key={profile.id}
                onClick={() => {
                  setActiveView(profile.id);
                  setActiveSaleId(profile.sales[0]?.id ?? null);
                }}
              >
                <span className="profile-dot" style={{ background: profile.color }} />
                {profile.label}
              </button>
            ))}
            <button
              className={activeView === "clients" ? "switcher-item active" : "switcher-item"}
              onClick={() => setActiveView("clients")}
            >
              <UserRound size={14} style={{ marginRight: 6 }} />
              Clientes
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {cacheTime && (
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", whiteSpace: "nowrap" }} title="Última actualización de datos">
                Actualizado: {cacheTime}
              </span>
            )}
            <button className="icon-button" onClick={() => void loadSummary(true)} title="Actualizar">
              <RefreshCw size={18} />
            </button>
          </div>
          {activeView !== "clients" && (
            <button className="text-button" onClick={() => setExportOpen(true)} title="Exportar vista">
              <Download size={16} />
              Export
            </button>
          )}
        </div>
      </header>

      <section className="dashboard-grid">
        <aside className="sidebar">
          <div className="profile-card">
            <div className="avatar">
              {isClientsView ? "CLT" : showConsolidated ? "ALL" : initials(activeProfile?.profile.name ?? "")}
            </div>
            <h2>{isClientsView ? "Clientes" : showConsolidated ? "Consolidado" : activeProfile?.profile.name}</h2>
            <p>
              {isClientsView
                ? `${clients.length} compradores`
                : showConsolidated
                  ? `${dashboard.profiles.length} perfiles conectados`
                  : activeProfile?.profile.studio}
            </p>
          </div>
          <nav className="side-nav" aria-label="Dashboard sections">
            <div className="nav-item">
              <CircleDollarSign size={18} />
              <div>
                <strong>Revenue</strong>
                <span>{money.format(totals?.revenue ?? 0)}</span>
              </div>
            </div>
            <div className="nav-item">
              <Images size={18} />
              <div>
                <strong>Albums</strong>
                <span>{totals?.albums ?? 0} publicados</span>
              </div>
            </div>
            <div className="nav-item">
              <UserRound size={18} />
              <div>
                <strong>Perfil</strong>
                <span>
                  {isClientsView
                    ? "Base de clientes"
                    : showConsolidated
                      ? "Todos los fotografos"
                      : activeProfile?.profile.email}
                </span>
              </div>
            </div>
            <div className="nav-item">
              <Tags size={18} />
              <div>
                <strong>Fidelity code</strong>
                <span>{isClientsView ? "Local storage" : fidelityLabel}</span>
              </div>
            </div>
          </nav>
          <p className="timestamp">
            <Sparkles size={16} />
            {dashboard.source === "live" ? "Datos reales" : "Modo demo"} - {formatDate(dashboard.updatedAt)}
          </p>
        </aside>

        <div className="main-grid">
          {warnings ? (
            <div className="warning">
              <Activity size={18} />
              {warnings}
            </div>
          ) : null}

          {isClientsView ? (
            <ClientsDashboard
              clients={clients}
              clientsLocalData={clientsLocalData}
              selectedClientKey={selectedClientKey}
              onSelectClient={(key) => {
                setSelectedClientKey(key);
                setEditingClientKey(null);
              }}
              editingClientKey={editingClientKey}
              setEditingClientKey={setEditingClientKey}
              editInstagram={editInstagram}
              setEditInstagram={setEditInstagram}
              editNotes={editNotes}
              setEditNotes={setEditNotes}
              editCustomName={editCustomName}
              setEditCustomName={setEditCustomName}
              onSaveClient={(key) => {
                saveClientData(key, {
                  instagram: editInstagram,
                  notes: editNotes,
                  customName: editCustomName || undefined
                });
              }}
            />
          ) : showConsolidated ? (
            <ConsolidatedDashboard
              consolidated={dashboard.consolidated}
              trendData={filteredConsolidatedTrend}
              filterType={filterType}
              setFilterType={setFilterType}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              customStart={customStart}
              setCustomStart={setCustomStart}
              customEnd={customEnd}
              setCustomEnd={setCustomEnd}
              availableYears={availableYears}
            />
          ) : activeProfile ? (
            <ProfileDashboard
              summary={activeProfile}
              selectedSale={selectedSale}
              onSelectSale={setActiveSaleId}
              trendData={filteredProfileTrend}
              filterType={filterType}
              setFilterType={setFilterType}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              customStart={customStart}
              setCustomStart={setCustomStart}
              customEnd={customEnd}
              setCustomEnd={setCustomEnd}
              availableYears={availableYears}
            />
          ) : null}
        </div>
      </section>
      {exportOpen ? (
        <ExportModal
          columns={EXPORT_COLUMNS}
          onClose={() => setExportOpen(false)}
          onExport={exportCsv}
          onSelectAll={() => setSelectedColumns(EXPORT_COLUMNS.map((column) => column.key))}
          onSelectNone={() => setSelectedColumns([])}
          onToggleColumn={toggleColumn}
          rowCount={exportRowCount}
          scopeLabel={exportScopeLabel}
          selectedColumns={selectedColumns}
        />
      ) : null}
    </main>
  );
}
