"use client";

import {
  Activity,
  Album,
  BadgeDollarSign,
  Bell,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FolderSync,
  FolderOpen,
  AlertTriangle,
  HelpCircle,
  Image,
  Images,
  Mail,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Tags,
  TrendingUp,
  Trash2,
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
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { AlbumInsight, ConsolidatedPoint, ConsolidatedSummary, DashboardPayload, DashboardSummary, FidelityCode, Sale, SalesPoint } from "@/lib/lumepic-types";
import packageJson from "../../package.json";

const APP_VERSION = packageJson.version;

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

function isAlbumMatch(saleAlbum?: string, albumTitle?: string): boolean {
  if (!saleAlbum || !albumTitle) return false;
  const s = saleAlbum.toLowerCase().trim();
  const a = albumTitle.toLowerCase().trim();
  if (s === a) return true;
  if (s.includes(a) || a.includes(s)) return true;
  
  const clean = (str: string) => str.replace(/\b20\d{2}\b/g, "").replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
  const cleanS = clean(s);
  const cleanA = clean(a);
  if (cleanS && cleanA && (cleanS.includes(cleanA) || cleanA.includes(cleanS))) return true;
  
  return false;
}

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

type Language = "en" | "es";

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Switcher & Sidebar
    consolidated: "Consolidated",
    clients: "Clients",
    watcher: "Watcher",
    gallery: "Gallery",
    settings: "Settings",
    refresh: "Refresh",
    export: "Export",
    exportView: "Export view",
    profilesConnected: "profiles connected",
    studio: "Studio",
    revenue: "Revenue",
    sales: "Sales",
    profile: "Profile",
    allPhotographers: "All Photographers",
    fidelityCode: "Fidelity code",
    localStorage: "Local storage",
    watcherDaemon: "Watch Folder Daemon",
    activeHistory: "Active history",
    photoArchive: "Photo archive",
    salesAndPaid: "Sold & paid photos",
    buyersCount: "buyers",
    baseOfClients: "Client database",
    realData: "Real data",
    demoMode: "Demo mode",
    
    // KPI
    totalRevenue: "Total Revenue",
    totalSales: "Total Sales",
    photosSold: "Photos Sold",
    avgOrder: "Avg Order",
    orders: "Orders",
    photos: "Photos",
    ticket: "Ticket",
    subtotal: "Subtotal",
    discounts: "Discounts",
    serviceFee: "Service Fee",
    netFinal: "Net earnings (after commissions)",
    beforeDiscounts: "Before discounts",
    promosAndComps: "Promos & comps",
    commProcessing: "Commissions & processing",
    netRevenueHelp: "Net earnings after commissions and processing fees have been deducted",
    grossRevenueHelp: "Gross earnings before commissions and processing fees are deducted",
    
    // Cruce por perfil
    profileCross: "Profile Cross-Reference",
    profileCrossDesc: "Volume, revenue and average ticket.",
    
    // Ventas Consolidadas
    consolidatedSales: "Consolidated Sales",
    consolidatedSalesDesc: "Comparison of net revenue/sold photos by period.",
    netRevenue: "Net Revenue",
    soldPhotosLabel: "Sold Photos",
    
    // Ventas por Evento (Album)
    salesByEvent: "Sales by Event (Album)",
    salesByEventDesc: "Consolidated performance breakdown for each event.",
    event: "Event",
    date: "Date",
    publishedPhotos: "Published Photos",
    ratio: "Ratio (Conv.)",
    views: "Views",
    noEvents: "No events available.",
    
    // Profile Dashboard specific
    salesByActivity: "Sales by Activity",
    whereDemand: "Where demand is concentrated.",
    bestAlbums: "Albums with best commercial readout",
    bestAlbumsDesc: "Prioritize albums with conversion, volume, and revenue.",
    recentSales: "Recent Sales",
    clickSaleDesc: "Click on a sale to review details.",
    allEvents: "All Events",
    
    // Sale Details
    saleDetails: "Sale Details",
    saleDetailsDesc: "Itemized transactions, custom labels, and fees.",
    client: "Client",
    downloadPhotos: "Download Photos",
    discount: "Discount",
    net: "Net",
    status: "Status",
    completed: "Completed",
    
    // Table Headers
    tableSale: "Sale",
    tableAlbum: "Album",
    tablePhotos: "Photos",
    tableSubtotal: "Subtotal",
    tableDiscount: "Discount",
    tableGross: "Gross",
    tableService: "Service",
    tableNet: "Net",
    tableStatus: "Status",
    
    // Settings
    configTitle: "Settings",
    configDesc: "Adjust preferences, languages, and custom names.",
    autoPull: "Automatic Sync (Pull)",
    autoPullDesc: "Periodically update server sales in the background.",
    pullFreq: "Update Frequency",
    pullFreqDesc: "Define how often new data will be requested.",
    desktopAlerts: "Desktop Notifications",
    desktopAlertsDesc: "Receive native desktop alerts when new sales are recorded.",
    photoNames: "Photographer Names",
    photoNamesDesc: "Define custom names for your profiles instead of the defaults.",
    customNamePlaceholder: "Custom name...",
    saveClose: "Save & Close",
    language: "Language",
    languageDesc: "Select the interface language.",
    spanish: "Spanish",
    english: "English",
    
    // Settings intervals
    sec30: "30 seconds",
    min1: "1 minute",
    min5: "5 minutes",
    min10: "10 minutes",
    
    // watcher view
    watcherTitle: "Local Folder Watcher",
    watcherDesc: "Monitor a local folder for automatic image uploads to Lumepic.",
    
    // gallery view
    galleryTitle: "Sold Gallery Archive",
    galleryDesc: "Quick access to all high-resolution purchased photos across all profiles.",

    // Export Modal
    exportModalTitle: "Export Data",
    exportModalDesc: "Export current table entries as CSV.",
    exportScope: "Scope to export",
    exportFields: "Select fields",
    exportButton: "Export as CSV",
    cancel: "Cancel",

    // Clients
    totalClients: "Total Clients",
    uniqueBuyers: "Unique Buyers",
    totalBilling: "Total Billing",
    accumulatedTotal: "Accumulated total",
    avgSpentPerClient: "Avg Spent per Client",
    clientDirectory: "Client Directory",
    clientDirectoryDesc: "Click on a client to view their history and social networks.",
    clientLabel: "Client",
    customName: "Custom Name",
    instagramLabel: "Instagram",
    notesLabel: "Notes",
    clientNotesPlaceholder: "Client notes...",
    save: "Save",
    notAssigned: "Not assigned",
    totalPurchases: "Total Purchases",
    purchaseHistory: "Purchase History",
    editProfile: "Edit Profile",
    selectClientPrompt: "Select a client to view details.",
    noEmail: "No email",
    totalPurchased: "Total purchased",
    viewDetail: "View Details",

    // Watcher
    watcherStatus: "Watcher Status",
    active: "Active",
    inactive: "Inactive",
    watcherActiveDesc: "Scanning and uploading photos automatically",
    watcherInactiveDesc: "Select a target album before activating",
    processedUploads: "Processed Uploads",
    successful: "successful",
    failed: "failed",
    targetAlbum: "Target Album",
    selectAlbumPrompt: "Select an album",
    noProfiles: "No profiles",
    watcherFolderConfig: "Watcher Folder Configuration",
    localFolderPath: "Local Folder Path",
    selectLocalFolder: "Select Local Folder",
    albumDestination: "Target Album / Destination",
    uploadConcurrency: "Upload Concurrency",
    activeDaemon: "Active Sync Daemon",
    activeDaemonDesc: "Upload images automatically in background",
    uploadHistory: "Upload History",
    searchHistory: "Search history...",
    retryAllFailed: "Retry all failed",
    clearHistory: "Clear history",
    success: "success",
    attempts: "attempts",
    retry: "Retry",
    delete: "Delete"
  },
  es: {
    // Switcher & Sidebar
    consolidated: "Consolidado",
    clients: "Clientes",
    watcher: "Watcher",
    gallery: "Galería",
    settings: "Ajustes",
    refresh: "Actualizar",
    export: "Exportar",
    exportView: "Exportar vista",
    profilesConnected: "perfiles conectados",
    studio: "Estudio",
    revenue: "Ingresos",
    sales: "Ventas",
    profile: "Perfil",
    allPhotographers: "Todos los fotógrafos",
    fidelityCode: "Fidelity code",
    localStorage: "Local storage",
    watcherDaemon: "Watch Folder Daemon",
    activeHistory: "Historial activo",
    photoArchive: "Archivo fotográfico",
    salesAndPaid: "Fotos vendidas y pagadas",
    buyersCount: "compradores",
    baseOfClients: "Base de clientes",
    realData: "Datos reales",
    demoMode: "Modo demo",
    
    // KPI
    totalRevenue: "Ingresos Totales",
    totalSales: "Ventas Totales",
    photosSold: "Fotos Vendidas",
    avgOrder: "Ticket Medio",
    orders: "Ordenes",
    photos: "Fotos",
    ticket: "Ticket",
    subtotal: "Subtotal",
    discounts: "Descuentos",
    serviceFee: "Service Fee",
    netFinal: "Ganancias netas (comisiones deducidas)",
    beforeDiscounts: "Antes de descuentos",
    promosAndComps: "Promos y bonificaciones",
    commProcessing: "Comision y processing",
    netRevenueHelp: "Ganancias netas tras deducir comisiones y tasas de procesamiento",
    grossRevenueHelp: "Ingresos brutos antes de deducir comisiones y tasas de procesamiento",
    
    // Cruce por perfil
    profileCross: "Cruce por perfil",
    profileCrossDesc: "Volumen, ingreso y ticket medio.",
    
    // Ventas Consolidadas
    consolidatedSales: "Ventas Consolidadas",
    consolidatedSalesDesc: "Comparación de ingresos netos/fotos vendidas por periodo.",
    netRevenue: "Ingresos Netos",
    soldPhotosLabel: "Fotos Vendidas",
    
    // Ventas por Evento (Album)
    salesByEvent: "Ventas por Evento (Album)",
    salesByEventDesc: "Desglose de rendimiento consolidado por cada evento.",
    event: "Evento",
    date: "Fecha",
    publishedPhotos: "Fotos publicadas",
    ratio: "Ratio (Conv.)",
    views: "Vistas",
    noEvents: "No hay eventos disponibles.",
    
    // Profile Dashboard specific
    salesByActivity: "Ventas por actividad",
    whereDemand: "Donde se concentra la demanda.",
    bestAlbums: "Albums con mejor lectura comercial",
    bestAlbumsDesc: "Prioriza albumes con conversion, volumen e ingresos.",
    recentSales: "Ventas recientes",
    clickSaleDesc: "Click en una venta para revisar el detalle.",
    allEvents: "Todos los eventos",
    
    // Sale Details
    saleDetails: "Detalle de Venta",
    saleDetailsDesc: "Transacciones detalladas, etiquetas personalizadas y comisiones.",
    client: "Cliente",
    downloadPhotos: "Descargar Fotos",
    discount: "Descuento",
    net: "Neto",
    status: "Estado",
    completed: "Completado",
    
    // Table Headers
    tableSale: "Venta",
    tableAlbum: "Album",
    tablePhotos: "Fotos",
    tableSubtotal: "Subtotal",
    tableDiscount: "Descuento",
    tableGross: "Bruto",
    tableService: "Comisión",
    tableNet: "Neto",
    tableStatus: "Estado",
    
    // Settings
    configTitle: "Configuración",
    configDesc: "Ajusta las preferencias de sincronización, idioma y nombres.",
    autoPull: "Sincronización Automática (Pull)",
    autoPullDesc: "Actualiza las ventas del servidor en segundo plano periódicamente.",
    pullFreq: "Frecuencia de actualización",
    pullFreqDesc: "Define cada cuánto tiempo se solicitarán nuevos datos.",
    desktopAlerts: "Notificaciones de Escritorio",
    desktopAlertsDesc: "Recibe alertas nativas en tu escritorio al ingresar nuevas ventas.",
    photoNames: "Nombres de Fotógrafos",
    photoNamesDesc: "Define nombres personalizados para tus perfiles en lugar de los predeterminados.",
    customNamePlaceholder: "Nombre personalizado...",
    saveClose: "Guardar y Cerrar",
    language: "Idioma",
    languageDesc: "Selecciona el idioma de la interfaz.",
    spanish: "Español",
    english: "Inglés",
    
    // Settings intervals
    sec30: "30 segundos",
    min1: "1 minuto",
    min5: "5 minutos",
    min10: "10 minutos",
    
    // watcher view
    watcherTitle: "Watcher de Carpeta Local",
    watcherDesc: "Monitorea una carpeta local para subir imágenes automáticamente a Lumepic.",
    
    // gallery view
    galleryTitle: "Archivo de Galería Vendida",
    galleryDesc: "Acceso rápido a todas las fotos compradas en alta resolución de todos los perfiles.",

    // Export Modal
    exportModalTitle: "Exportar Datos",
    exportModalDesc: "Exportar los registros de la tabla actual como CSV.",
    exportScope: "Alcance a exportar",
    exportFields: "Seleccionar campos",
    exportButton: "Exportar como CSV",
    cancel: "Cancelar",

    // Clients
    totalClients: "Total Clientes",
    uniqueBuyers: "Compradores Únicos",
    totalBilling: "Facturación Total",
    accumulatedTotal: "Total acumulado",
    avgSpentPerClient: "Ticket Medio por Cliente",
    clientDirectory: "Directorio de Clientes",
    clientDirectoryDesc: "Haz clic en un cliente para ver su historial y redes sociales.",
    clientLabel: "Cliente",
    customName: "Nombre Personalizado",
    instagramLabel: "Instagram",
    notesLabel: "Notas",
    clientNotesPlaceholder: "Notas del cliente...",
    save: "Guardar",
    notAssigned: "No asignado",
    totalPurchases: "Total Compras",
    purchaseHistory: "Historial de Compras",
    editProfile: "Editar Perfil",
    selectClientPrompt: "Selecciona un cliente para ver el detalle.",
    noEmail: "Sin email",
    totalPurchased: "Total comprado",
    viewDetail: "Ver Detalle",

    // Watcher
    watcherStatus: "Estado del Watcher",
    active: "Activo",
    inactive: "Inactivo",
    watcherActiveDesc: "Escaneando y subiendo fotos automáticamente",
    watcherInactiveDesc: "Selecciona un álbum destino antes de activar",
    processedUploads: "Cargas Procesadas",
    successful: "exitosas",
    failed: "fallidas",
    targetAlbum: "Álbum de Destino",
    selectAlbumPrompt: "Selecciona un álbum",
    noProfiles: "Sin perfiles",
    watcherFolderConfig: "Configuración de Carpeta Watcher",
    localFolderPath: "Ruta de la Carpeta Local",
    selectLocalFolder: "Seleccionar Carpeta",
    albumDestination: "Álbum de Destino",
    uploadConcurrency: "Concurrencia de Subida",
    activeDaemon: "Daemon de Sincronización Activo",
    activeDaemonDesc: "Sube imágenes automáticamente en segundo plano",
    uploadHistory: "Historial de Cargas",
    searchHistory: "Buscar en el historial...",
    retryAllFailed: "Reintentar todos los fallidos",
    clearHistory: "Limpiar historial",
    success: "éxito",
    attempts: "intentos",
    retry: "Reintentar",
    delete: "Eliminar"
  }
};

const COLUMN_TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    "Perfil": "Profile",
    "Fotografo": "Photographer",
    "Email fotografo": "Photographer email",
    "Fidelity code": "Fidelity code",
    "Fidelity discount": "Fidelity discount",
    "Fidelity status": "Fidelity status",
    "Sale ID": "Sale ID",
    "Estado": "Status",
    "Fecha venta": "Sale Date",
    "Comprador": "Buyer",
    "Email comprador": "Buyer Email",
    "Album": "Album",
    "Actividad": "Activity",
    "Fotos": "Photos",
    "Photo IDs": "Photo IDs",
    "Photo filenames": "Photo filenames",
    "Photo thumbnails": "Photo thumbnails",
    "Photo URLs": "Photo URLs",
    "Subtotal": "Subtotal",
    "Descuento": "Discount",
    "Venta": "Sale",
    "Service": "Service Fee",
    "Neto": "Net",
    "Bonificada": "Bonified",
    "Detalle cargado": "Details Loaded"
  },
  es: {
    "Perfil": "Perfil",
    "Fotografo": "Fotógrafo",
    "Email fotografo": "Email fotógrafo",
    "Fidelity code": "Fidelity code",
    "Fidelity discount": "Fidelity discount",
    "Fidelity status": "Fidelity status",
    "Sale ID": "ID Venta",
    "Estado": "Estado",
    "Fecha venta": "Fecha venta",
    "Comprador": "Comprador",
    "Email comprador": "Email comprador",
    "Album": "Álbum",
    "Actividad": "Actividad",
    "Fotos": "Fotos",
    "Photo IDs": "IDs de fotos",
    "Photo filenames": "Nombres de fotos",
    "Photo thumbnails": "Miniaturas de fotos",
    "Photo URLs": "URLs de fotos",
    "Subtotal": "Subtotal",
    "Descuento": "Descuento",
    "Venta": "Venta",
    "Service": "Service",
    "Neto": "Neto",
    "Bonificada": "Bonificada",
    "Detalle cargado": "Detalle cargado"
  }
};

function formatDate(date: string, lang: Language = "en") {
  return new Intl.DateTimeFormat(lang === "es" ? "es-AR" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

function formatDateOnly(date: string, lang: Language = "en") {
  return new Intl.DateTimeFormat(lang === "es" ? "es-AR" : "en-US", {
    day: "2-digit",
    month: "short"
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
  icon,
  tooltip
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <article className="kpi-card">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {label}
          {tooltip && (
            <span
              title={tooltip}
              style={{
                cursor: "help",
                color: "var(--muted)",
                display: "inline-flex",
                alignItems: "center",
                opacity: 0.75,
                transition: "opacity 0.2s"
              }}
            >
              <HelpCircle size={14} />
            </span>
          )}
        </span>
        {icon}
      </header>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  );
}

function KpiGrid({ totals, language = "en" }: { totals: DashboardSummary["totals"]; language?: Language }) {
  const t = TRANSLATIONS[language];
  return (
    <section className="kpi-grid" aria-label="Metricas principales">
      <Kpi label={t.totalRevenue} value={money.format(totals.revenue)} note={t.netFinal} icon={<BadgeDollarSign size={20} />} tooltip={t.netRevenueHelp} />
      <Kpi label={t.subtotal} value={money.format(totals.subtotal)} note={t.beforeDiscounts} icon={<CircleDollarSign size={20} />} tooltip={t.grossRevenueHelp} />
      <Kpi label={t.discounts} value={`-${money.format(totals.discounts)}`} note={t.promosAndComps} icon={<TrendingUp size={20} />} />
      <Kpi label={t.serviceFee} value={`-${money.format(totals.fees)}`} note={t.commProcessing} icon={<Activity size={20} />} />
      <Kpi label={language === "es" ? "Ventas reales" : "Real sales"} value={String(totals.sales)} note={`${totals.orders} ${language === "es" ? "ordenes aprobadas" : "approved orders"}`} icon={<ShoppingBag size={20} />} />
      <Kpi label={t.avgOrder} value={money.format(totals.avgOrder)} note={language === "es" ? "Bruto por venta real" : "Gross per real sale"} icon={<TrendingUp size={20} />} />
      <Kpi label={language === "es" ? "Álbumes" : "Albums"} value={String(totals.albums)} note={language === "es" ? "Publicados" : "Published"} icon={<Album size={20} />} />
      <Kpi label={t.photosSold} value={compact.format(totals.photos)} note={`${compact.format(totals.publishedPhotos)} ${language === "es" ? "publicadas" : "published"}`} icon={<Images size={20} />} />
      <Kpi label={t.ratio} value={`${totals.conversion.toFixed(2)}%`} note={language === "es" ? "Fotos vendidas/publicadas" : "Photos sold/published"} icon={<Eye size={20} />} />
    </section>
  );
}

function LoadingState({ language = "en" }: { language?: Language }) {
  return (
    <main className="skeleton">
      <section className="skeleton-inner">
        <p className="eyebrow">Lumepic dashboard</p>
        <h1>{language === "es" ? "Cargando ventas" : "Loading sales"}</h1>
        <div className="pulse" />
        <div className="pulse" />
        <div className="pulse" />
      </section>
    </main>
  );
}

function SettingsModal({
  isOpen,
  onClose,
  autoPullEnabled,
  setAutoPullEnabled,
  autoPullInterval,
  setAutoPullInterval,
  notificationsEnabled,
  setNotificationsEnabled,
  profiles,
  customProfileLabels,
  setCustomProfileLabel,
  language,
  setLanguage
}: {
  isOpen: boolean;
  onClose: () => void;
  autoPullEnabled: boolean;
  setAutoPullEnabled: (val: boolean) => void;
  autoPullInterval: number;
  setAutoPullInterval: (val: number) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (val: boolean) => void;
  profiles: Array<{
    id: string;
    label: string;
    color: string;
    profile: { name: string };
  }>;
  customProfileLabels: Record<string, string>;
  setCustomProfileLabel: (profileId: string, label: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}) {
  if (!isOpen) return null;
  const t = TRANSLATIONS[language];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="settings-modal" onClick={(e) => e.stopPropagation()} style={{
        width: "min(460px, 100%)",
        padding: "24px",
        border: "1px solid var(--line)",
        borderRadius: "24px",
        background: "var(--white)",
        position: "relative",
        boxShadow: "0 24px 80px rgba(0, 0, 0, 0.15)",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        <header className="modal-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "14px", borderBottom: "1px solid var(--line)" }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "800", margin: 0 }}>{t.configTitle}</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "4px 0 0 0" }}>{t.configDesc}</p>
          </div>
          <button className="icon-button" onClick={onClose} style={{
            border: "none",
            background: "var(--paper-2)",
            cursor: "pointer",
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px",
            borderRadius: "50%"
          }}>
            <X size={16} />
          </button>
        </header>

        <div className="settings-list" style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
          {/* Idioma / Language */}
          <div className="settings-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: "1", paddingRight: "16px" }}>
              <strong style={{ display: "block", fontSize: "0.92rem", fontWeight: "700" }}>{t.language}</strong>
              <span style={{ display: "block", fontSize: "0.78rem", color: "var(--muted)", marginTop: "2px" }}>
                {t.languageDesc}
              </span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              style={{
                height: "32px",
                padding: "0 10px",
                border: "1px solid var(--line)",
                borderRadius: "6px",
                background: "var(--white)",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="en">{t.english}</option>
              <option value="es">{t.spanish}</option>
            </select>
          </div>

          {/* Pull Automático */}
          <div className="settings-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line-soft)", paddingTop: "16px" }}>
            <div style={{ flex: "1", paddingRight: "16px" }}>
              <strong style={{ display: "block", fontSize: "0.92rem", fontWeight: "700" }}>{t.autoPull}</strong>
              <span style={{ display: "block", fontSize: "0.78rem", color: "var(--muted)", marginTop: "2px" }}>
                {t.autoPullDesc}
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={autoPullEnabled}
                onChange={(e) => setAutoPullEnabled(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* Intervalo de Pull (sólo visible si autoPull está habilitado) */}
          {autoPullEnabled && (
            <div className="settings-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--paper-2)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--line)" }}>
              <div style={{ flex: "1", paddingRight: "16px" }}>
                <strong style={{ display: "block", fontSize: "0.85rem", fontWeight: "700" }}>{t.pullFreq}</strong>
                <span style={{ display: "block", fontSize: "0.74rem", color: "var(--muted)", marginTop: "2px" }}>
                  {t.pullFreqDesc}
                </span>
              </div>
              <select
                value={autoPullInterval}
                onChange={(e) => setAutoPullInterval(parseInt(e.target.value, 10))}
                style={{
                  height: "32px",
                  padding: "0 10px",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  background: "var(--white)",
                  fontSize: "0.82rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value={30000}>{t.sec30}</option>
                <option value={60000}>{t.min1}</option>
                <option value={300000}>{t.min5}</option>
                <option value={600000}>{t.min10}</option>
              </select>
            </div>
          )}

          {/* Notificaciones de Escritorio */}
          <div className="settings-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line-soft)", paddingTop: "16px" }}>
            <div style={{ flex: "1", paddingRight: "16px" }}>
              <strong style={{ display: "block", fontSize: "0.92rem", fontWeight: "700" }}>{t.desktopAlerts}</strong>
              <span style={{ display: "block", fontSize: "0.78rem", color: "var(--muted)", marginTop: "2px" }}>
                {t.desktopAlertsDesc}
              </span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* Nombres Personalizados de Fotógrafos */}
          {profiles.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <strong style={{ display: "block", fontSize: "0.92rem", fontWeight: "700" }}>{t.photoNames}</strong>
              <span style={{ display: "block", fontSize: "0.78rem", color: "var(--muted)", marginBottom: "4px" }}>
                {t.photoNamesDesc}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {profiles.map((profile) => (
                  <div key={profile.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className="profile-dot" style={{ background: profile.color, width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.82rem", fontWeight: "600", width: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={profile.profile.name}>
                      {profile.profile.name}
                    </span>
                    <input
                      type="text"
                      placeholder={t.customNamePlaceholder}
                      value={customProfileLabels[profile.id] || ""}
                      onChange={(e) => setCustomProfileLabel(profile.id, e.target.value)}
                      style={{
                        flex: 1,
                        height: "32px",
                        padding: "0 10px",
                        border: "1px solid var(--line)",
                        borderRadius: "6px",
                        background: "var(--white)",
                        fontSize: "0.82rem",
                        outline: "none"
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", paddingTop: "14px", borderTop: "1px solid var(--line)" }}>
          <button className="text-button primary" onClick={onClose} style={{ height: "36px", padding: "0 16px", fontSize: "0.85rem", fontWeight: "600" }}>
            {t.saveClose}
          </button>
        </footer>
      </section>
    </div>
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
  onSelectNone,
  language = "en"
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
  language?: Language;
}) {
  const t = TRANSLATIONS[language];
  return (
    <div className="modal-backdrop" role="presentation">
      <section aria-modal="true" className="export-modal" role="dialog">
        <header className="modal-header">
          <div>
            <p className="eyebrow">CSV export</p>
            <h2>{t.exportModalTitle}</h2>
            <p>
              {scopeLabel} - {rowCount} {language === "es" ? "filas" : "rows"}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} title={language === "es" ? "Cerrar" : "Close"}>
            x
          </button>
        </header>

        <div className="modal-actions">
          <button className="text-button" onClick={onSelectAll}>
            {language === "es" ? "Todas" : "All"}
          </button>
          <button className="text-button" onClick={onSelectNone}>
            {language === "es" ? "Ninguna" : "None"}
          </button>
        </div>

        <div className="column-grid">
          {columns.map((column) => {
            const translatedLabel = COLUMN_TRANSLATIONS[language][column.label] || column.label;
            return (
              <label className="column-toggle" key={column.key}>
                <input
                  checked={selectedColumns.includes(column.key)}
                  onChange={() => onToggleColumn(column.key)}
                  type="checkbox"
                />
                <span>{translatedLabel}</span>
              </label>
            );
          })}
        </div>

        <footer className="modal-footer">
          <button className="text-button" onClick={onClose}>
            {t.cancel}
          </button>
          <button className="text-button primary" disabled={!selectedColumns.length || !rowCount} onClick={onExport}>
            <Download size={16} />
            {language === "es" ? "Descargar CSV" : "Download CSV"}
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
  availableYears,
  allProfiles,
  language = "en"
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
  allProfiles: DashboardSummary[];
  language?: Language;
}) {
  const [metric, setMetric] = useState<"revenue" | "photos">("revenue");
  const t = TRANSLATIONS[language];

  const consolidatedAlbums = useMemo(() => {
    const albumMap: Record<string, AlbumInsight & { netRevenue: number }> = {};
    allProfiles.forEach(profile => {
      profile.albums.forEach(album => {
        const albumSales = profile.sales.filter(s => isAlbumMatch(s.album, album.title));
        const albumNetRevenue = album.netRevenue || albumSales.reduce((sum, s) => sum + s.total, 0);

        if (!albumMap[album.id]) {
          albumMap[album.id] = { ...album, netRevenue: albumNetRevenue };
        } else {
          albumMap[album.id].views += album.views;
          albumMap[album.id].photos += album.photos;
          albumMap[album.id].soldPhotos += album.soldPhotos;
          albumMap[album.id].sales += album.sales;
          albumMap[album.id].revenue += album.revenue;
          albumMap[album.id].netRevenue += albumNetRevenue;
          albumMap[album.id].conversion = albumMap[album.id].photos > 0 ? (albumMap[album.id].soldPhotos / albumMap[album.id].photos) * 100 : 0;
        }
      });
    });
    return Object.values(albumMap).sort((a, b) => b.revenue - a.revenue);
  }, [allProfiles]);

  return (
    <>
      <KpiGrid totals={consolidated.totals} language={language} />
      <section className="panel">
        <header className="panel-header" style={{ flexDirection: "column", alignItems: "stretch", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2>{t.consolidatedSales}</h2>
              <p>
                {language === "es" 
                  ? `Comparación de ${metric === "revenue" ? "ingresos netos" : "cantidad de fotos vendidas"} por periodo.`
                  : `Comparison of ${metric === "revenue" ? "net revenue" : "quantity of sold photos"} by period.`}
              </p>
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
                  {language === "es" ? "Precio" : "Price"}
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
                  {language === "es" ? "Fotos" : "Photos"}
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
              {language === "es" ? "Filtrar gráfico:" : "Filter chart:"}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <button
                className={`filter-pill ${filterType === "all" ? "active" : ""}`}
                onClick={() => setFilterType("all")}
              >
                {language === "es" ? "Todo" : "All"}
              </button>
              <button
                className={`filter-pill ${filterType === "7d" ? "active" : ""}`}
                onClick={() => setFilterType("7d")}
              >
                {language === "es" ? "Últimos 7 días" : "Last 7 days"}
              </button>
              <button
                className={`filter-pill ${filterType === "15d" ? "active" : ""}`}
                onClick={() => setFilterType("15d")}
              >
                {language === "es" ? "Últimos 15 días" : "Last 15 days"}
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
                {language === "es" ? "Personalizado" : "Custom"}
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
                <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{language === "es" ? "a" : "to"}</span>
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
              {language === "es" ? "Sin ventas en el rango seleccionado" : "No sales in selected range"}
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
                  formatter={(value) => (metric === "revenue" ? money.format(Number(value)) : `${value} ${language === "es" ? "fotos" : "photos"}`)}
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
            <h2>{t.profileCross}</h2>
            <p>{t.profileCrossDesc}</p>
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
                  <span>{t.sales}</span>
                  <strong>{profile.sales}</strong>
                </div>
                <div>
                  <span>{language === "es" ? "Ordenes" : "Orders"}</span>
                  <strong>{profile.orders}</strong>
                </div>
                <div>
                  <span>{language === "es" ? "Fotos" : "Photos"}</span>
                  <strong>{profile.photos}</strong>
                </div>
                <div>
                  <span>{t.ticket}</span>
                  <strong>{money.format(profile.avgOrder)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sales-section" style={{ marginTop: '24px' }}>
        <article className="panel">
          <header className="table-toolbar">
            <div>
              <h2>{t.salesByEvent}</h2>
              <p>{t.salesByEventDesc}</p>
            </div>
            <Album size={21} />
          </header>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.event}</th>
                  <th>{t.date}</th>
                  <th>{t.tableGross}</th>
                  <th>{t.tableNet}</th>
                  <th>{t.sales}</th>
                  <th>{t.publishedPhotos}</th>
                  <th>{t.photosSold}</th>
                  <th>{t.ratio}</th>
                  <th>{t.views}</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedAlbums.map((album) => (
                  <tr key={album.id}>
                    <td data-label={t.event}><strong>{album.title}</strong></td>
                    <td data-label={t.date}>{formatDateOnly(album.createdAt, language)}</td>
                    <td data-label={t.tableGross}>{money.format(album.revenue)}</td>
                    <td data-label={t.tableNet}>{money.format(album.netRevenue)}</td>
                    <td data-label={t.sales}>{album.sales}</td>
                    <td data-label={t.publishedPhotos}>{compact.format(album.photos)}</td>
                    <td data-label={t.photosSold}>{compact.format(album.soldPhotos)}</td>
                    <td data-label={t.ratio}>{album.conversion.toFixed(1)}%</td>
                    <td data-label={t.views}>{compact.format(album.views)}</td>
                  </tr>
                ))}
                {consolidatedAlbums.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>{t.noEvents}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
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
  availableYears,
  language = "en"
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
  language?: Language;
}) {
  const [metric, setMetric] = useState<"revenue" | "photos">("revenue");
  const [selectedAlbum, setSelectedAlbum] = useState<string>("all");
  const t = TRANSLATIONS[language];

  const uniqueAlbums = useMemo(() => {
    const albums = new Set<string>();
    summary.sales.forEach(sale => {
      if (sale.album) albums.add(sale.album);
    });
    return Array.from(albums).sort();
  }, [summary.sales]);

  const filteredSales = useMemo(() => {
    if (selectedAlbum === "all") return summary.sales;
    return summary.sales.filter(sale => sale.album === selectedAlbum);
  }, [summary.sales, selectedAlbum]);

  return (
    <>
      <KpiGrid totals={summary.totals} language={language} />

      <section className="analysis-grid">
        <article className="panel">
          <header className="panel-header" style={{ flexDirection: "column", alignItems: "stretch", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2>
                  {metric === "revenue" 
                    ? (language === "es" ? "Tendencia de ingresos" : "Revenue Trend") 
                    : (language === "es" ? "Tendencia de fotos vendidas" : "Photos Sold Trend")}
                </h2>
                <p>
                  {metric === "revenue" 
                    ? (language === "es" ? "Evolución reciente de ventas aprobadas." : "Recent evolution of approved sales.") 
                    : (language === "es" ? "Cantidad de fotos vendidas por periodo." : "Quantity of photos sold per period.")}
                </p>
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
                    {language === "es" ? "Precio" : "Price"}
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
                    {language === "es" ? "Fotos" : "Photos"}
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
                {language === "es" ? "Filtrar gráfico:" : "Filter chart:"}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                <button
                  className={`filter-pill ${filterType === "all" ? "active" : ""}`}
                  onClick={() => setFilterType("all")}
                >
                  {language === "es" ? "Todo" : "All"}
                </button>
                <button
                  className={`filter-pill ${filterType === "7d" ? "active" : ""}`}
                  onClick={() => setFilterType("7d")}
                >
                  {language === "es" ? "Últimos 7 días" : "Last 7 days"}
                </button>
                <button
                  className={`filter-pill ${filterType === "15d" ? "active" : ""}`}
                  onClick={() => setFilterType("15d")}
                >
                  {language === "es" ? "Últimos 15 días" : "Last 15 days"}
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
                  {language === "es" ? "Personalizado" : "Custom"}
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
                  <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{language === "es" ? "a" : "to"}</span>
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
                {language === "es" ? "Sin ventas en el rango seleccionado" : "No sales in selected range"}
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
                    formatter={(value) => (metric === "revenue" ? money.format(Number(value)) : `${value} ${language === "es" ? "fotos" : "photos"}`)}
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
              <h2>{t.salesByActivity}</h2>
              <p>{t.whereDemand}</p>
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
            <h2>{t.bestAlbums}</h2>
            <p>{t.bestAlbumsDesc}</p>
          </div>
          <Album size={21} />
        </header>
        <div className="album-grid">
          {summary.albums.slice(0, 6).map((album) => {
            const albumSales = summary.sales.filter(s => isAlbumMatch(s.album, album.title));
            const netRevenue = album.netRevenue || albumSales.reduce((sum, s) => sum + s.total, 0);
            return (
              <article className="album-card" key={album.id}>
                <header>
                  <span className="status-pill">
                    <CheckCircle2 size={13} />
                    Live
                  </span>
                  <span>{formatDateOnly(album.createdAt, language)}</span>
                </header>
                <h3>{album.title}</h3>
                <div className="album-meta">
                  <div>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {t.tableGross}
                      <span title={t.grossRevenueHelp} style={{ cursor: "help", color: "var(--muted)", opacity: 0.8, display: "inline-flex", alignItems: "center" }}>
                        <HelpCircle size={12} />
                      </span>
                    </span>
                    <strong>{money.format(album.revenue)}</strong>
                  </div>
                  <div>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {t.tableNet}
                      <span title={t.netRevenueHelp} style={{ cursor: "help", color: "var(--muted)", opacity: 0.8, display: "inline-flex", alignItems: "center" }}>
                        <HelpCircle size={12} />
                      </span>
                    </span>
                    <strong>{money.format(netRevenue)}</strong>
                  </div>
                  <div>
                    <span>{t.sales}</span>
                    <strong>{album.sales}</strong>
                  </div>
                  <div>
                    <span>{t.ticket}</span>
                    <strong>{money.format(album.sales > 0 ? album.revenue / album.sales : 0)}</strong>
                  </div>
                  <div>
                    <span>{language === "es" ? "Fotos" : "Photos"}</span>
                    <strong>{album.soldPhotos}</strong>
                  </div>
                  <div>
                    <span>{language === "es" ? "Publicadas" : "Published"}</span>
                    <strong>{album.photos}</strong>
                  </div>
                  <div>
                    <span>{t.views}</span>
                    <strong>{compact.format(album.views)}</strong>
                  </div>
                  <div>
                    <span>Conv.</span>
                    <strong>{album.conversion.toFixed(1)}%</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="sales-section">
        <article className="panel">
          <header className="table-toolbar">
            <div>
              <h2>{t.recentSales}</h2>
              <p>{t.clickSaleDesc}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {uniqueAlbums.length > 0 && (
                <select
                  value={selectedAlbum}
                  onChange={(e) => setSelectedAlbum(e.target.value)}
                  style={{
                    height: "32px",
                    padding: "0 10px",
                    border: "1px solid var(--line)",
                    borderRadius: "8px",
                    background: "var(--white)",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    outline: "none"
                  }}
                  aria-label={language === "es" ? "Filtrar ventas por evento" : "Filter sales by event"}
                >
                  <option value="all">{t.allEvents}</option>
                  {uniqueAlbums.map(album => (
                    <option key={album} value={album}>{album}</option>
                  ))}
                </select>
              )}
              <ShoppingBag size={21} />
            </div>
          </header>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.tableSale}</th>
                  <th>{t.tableAlbum}</th>
                  <th>{t.tablePhotos}</th>
                  <th>{t.tableSubtotal}</th>
                  <th>{t.tableDiscount}</th>
                  <th>{t.tableGross}</th>
                  <th>{t.tableService}</th>
                  <th>{t.tableNet}</th>
                  <th>{t.tableStatus}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td data-label={t.tableSale}>
                      <button className="sale-button" onClick={() => onSelectSale(sale.id)}>
                        <strong>
                          {sale.buyer}
                          {sale.buyerEmail ? (
                            <span title={sale.buyerEmail} style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "6px" }}>
                              <Mail size={14} />
                            </span>
                          ) : null}
                        </strong>
                        <span>{formatDate(sale.date, language)}</span>
                      </button>
                    </td>
                    <td data-label={t.tableAlbum}>{sale.album}</td>
                    <td data-label={t.tablePhotos}>
                      <SaleThumbnails sale={sale} />
                    </td>
                    <td data-label={t.tableSubtotal}>{money.format(sale.subtotal)}</td>
                    <td data-label={t.tableDiscount}>-{money.format(sale.discount)}</td>
                    <td data-label={t.tableGross}>{money.format(sale.grossTotal)}</td>
                    <td data-label={t.tableService}>-{money.format(sale.fees)}</td>
                    <td data-label={t.tableNet}>{money.format(sale.total)}</td>
                    <td data-label={t.tableStatus}>
                      <span className="status-pill">
                        <CheckCircle2 size={13} />
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", color: "var(--muted)", padding: "30px 10px" }}>
                      {language === "es" ? "No hay ventas registradas para este evento." : "No sales registered for this event."}
                    </td>
                  </tr>
                )}
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
              <h2>{selectedSale?.buyer ?? (language === "es" ? "Venta" : "Sale")}</h2>
              <p>{selectedSale?.buyerEmail || selectedSale?.album || (language === "es" ? "Sin email" : "No email")}</p>
            </div>
            <Camera size={21} />
          </header>
          <div className="detail-list">
            <div>
              <span>{language === "es" ? "Email comprador" : "Buyer Email"}</span>
              <strong>{selectedSale?.buyerEmail || "-"}</strong>
            </div>
            <div>
              <span>{language === "es" ? "Actividad" : "Activity"}</span>
              <strong>{selectedSale?.activity}</strong>
            </div>
            <div>
              <span>{language === "es" ? "Fotos pagas" : "Paid photos"}</span>
              <strong>{selectedSale?.photos}</strong>
            </div>
            <div>
              <span>{t.subtotal}</span>
              <strong>{selectedSale ? money.format(selectedSale.subtotal) : "-"}</strong>
            </div>
            <div>
              <span>{t.discounts}</span>
              <strong>{selectedSale ? `-${money.format(selectedSale.discount)}` : "-"}</strong>
            </div>
            <div>
              <span>{t.tableGross}</span>
              <strong>{selectedSale ? money.format(selectedSale.grossTotal) : "-"}</strong>
            </div>
            <div>
              <span>{t.tableService}</span>
              <strong>{selectedSale ? `-${money.format(selectedSale.fees)}` : "-"}</strong>
            </div>
            <div>
              <span>{t.net}</span>
              <strong>{selectedSale ? money.format(selectedSale.total) : "-"}</strong>
            </div>
            <div>
              <span>{t.date}</span>
              <strong>{selectedSale ? formatDate(selectedSale.date, language) : "-"}</strong>
            </div>
            <div>
              <span>{t.status}</span>
              <strong>{selectedSale?.status}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>{language === "es" ? "Mix de actividad" : "Activity Mix"}</h2>
            <p>{language === "es" ? "Comparación rápida por cantidad de ventas." : "Quick comparison by sales count."}</p>
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

interface WatcherConfig {
  watchFolderPath: string;
  targetAlbumId: string;
  isActive: boolean;
  profileId: string;
  uploadConcurrency: number;
}

interface HistoryItem {
  id: string;
  filename: string;
  timestamp: string;
  size: number;
  albumId: string;
  uploadedPhotographId?: string;
  status: "success" | "failed" | "deleted";
  error: string | null;
  durationMs?: number;
  attempts?: number;
  retryable?: boolean;
  lastAttemptAt?: string;
  nextRetryAt?: string | null;
  deletedAt?: string;
  deletedPhotographId?: string;
}

function WatcherDashboard({
  profiles,
  language = "en",
}: {
  profiles: Array<{
    id: string;
    label: string;
    color: string;
    profile: { name: string };
    albums?: Array<{ id: string; title: string; photos: number }>;
  }>;
  language?: Language;
}) {
  const t = TRANSLATIONS[language];
  const [config, setConfig] = useState<WatcherConfig | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [albums, setAlbums] = useState<Array<{ id: string; title: string; photosCount: number; eventId?: string }>>([]);
  const [allAlbums, setAllAlbums] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [creatingAlbumId, setCreatingAlbumId] = useState<string | null>(null);
  const [deletingPhotographId, setDeletingPhotographId] = useState<string | null>(null);
  const [selectingFolder, setSelectingFolder] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  // Form states
  const [watchFolderPath, setWatchFolderPath] = useState("");
  const [targetAlbumId, setTargetAlbumId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [uploadConcurrency, setUploadConcurrency] = useState(1);

  const loadStatus = async () => {
    try {
      const res = await fetch("/api/lumepic/watcher");
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setHistory(data.history || []);
        setAlbums(data.albums || []);
        if (data.allAlbums) setAllAlbums(data.allAlbums);
        setEvents(data.events || []);
        setIsRunning(data.isRunning);
        
        if (data.config) {
          setWatchFolderPath(data.config.watchFolderPath);
          setTargetAlbumId(data.config.targetAlbumId || "");
          setProfileId(data.config.profileId || "");
          setUploadConcurrency(data.config.uploadConcurrency || 1);
        }
      }
    } catch (e) {
      console.error("Error loading watcher status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // Poll every 3 seconds to show progress in real-time
    const timer = setInterval(() => {
      loadStatus();
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveConfig = async (fields: Partial<WatcherConfig>) => {
    try {
      const res = await fetch("/api/lumepic/watcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setHistory(data.history || []);
        setAlbums(data.albums || []);
        if (data.allAlbums) setAllAlbums(data.allAlbums);
        setEvents(data.events || []);
        setIsRunning(data.isRunning);
        if (data.config) {
          setUploadConcurrency(data.config.uploadConcurrency || 1);
        }
      }
    } catch (e) {
      console.error("Error saving watcher config:", e);
    }
  };

  const handleSelectFolder = async () => {
    setSelectingFolder(true);
    try {
      const res = await fetch("/api/lumepic/watcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select-folder" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No pude abrir el selector de carpetas");
        return;
      }
      if (data.canceled) return;

      setConfig(data.config);
      setHistory(data.history || []);
      setAlbums(data.albums || []);
      if (data.allAlbums) setAllAlbums(data.allAlbums);
      setEvents(data.events || []);
      setIsRunning(data.isRunning);
      setWatchFolderPath(data.config?.watchFolderPath || data.selectedPath || "");
    } catch (e) {
      console.error("Error selecting watcher folder:", e);
      alert("No pude seleccionar la carpeta local");
    } finally {
      setSelectingFolder(false);
    }
  };

  const handleForceScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/lumepic/watcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setIsRunning(data.isRunning);
      }
    } catch (e) {
      console.error("Error scanning watcher folder:", e);
    } finally {
      setScanning(false);
    }
  };

  const handleCreateAlbum = async (event: any) => {
    setCreatingAlbumId(event.id);
    try {
      const res = await fetch("/api/lumepic/watcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-album",
          eventId: event.id,
          description: event.name,
          locationId: event.locationId,
          activityId: event.activityId,
          takenDate: event.date,
          defaultImagePrice: event.defaultImagePrice,
        }),
      });

      if (res.ok) {
        // Refresh status to fetch the new album list and select it
        await loadStatus();
      } else {
        const err = await res.json();
        alert(err.error || "No pude crear el álbum");
      }
    } catch (e) {
      console.error("Error creating album:", e);
      alert("Error al crear el álbum en Lumepic");
    } finally {
      setCreatingAlbumId(null);
    }
  };

  const handleDeletePhotograph = async (item: HistoryItem) => {
    const photographId = item.uploadedPhotographId || item.id;
    if (!photographId || item.status !== "success") return;
    const confirmed = window.confirm(`Borrar la foto ${item.filename} de Lumepic?\n\nID: ${photographId}\n\nEsto no borra el álbum.`);
    if (!confirmed) return;

    setDeletingPhotographId(photographId);
    try {
      const res = await fetch("/api/lumepic/watcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-photograph",
          photographId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No pude borrar la foto");
        return;
      }

      setConfig(data.config);
      setHistory(data.history || []);
      setAlbums(data.albums || []);
      if (data.allAlbums) setAllAlbums(data.allAlbums);
      setEvents(data.events || []);
      setIsRunning(data.isRunning);
    } catch (e) {
      console.error("Error deleting photograph:", e);
      alert("Error al borrar la foto en Lumepic");
    } finally {
      setDeletingPhotographId(null);
    }
  };

  const getExistingAlbumForEvent = (eventId: string) => {
    if (allAlbums && allAlbums.length > 0) {
      return allAlbums.find((a) => a.eventId === eventId);
    }
    return albums.find((a) => a.eventId === eventId);
  };

  if (loading && !config) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>
        <RefreshCw size={24} className="spin" style={{ marginBottom: 12 }} />
        <p>{language === "es" ? "Cargando configuración de la Carpeta Watcher..." : "Loading Watch Folder Configuration..."}</p>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (durationMs?: number) => {
    if (typeof durationMs !== "number" || !Number.isFinite(durationMs)) return language === "es" ? "Sin medir" : "Not measured";
    if (durationMs < 1000) return `${durationMs} ms`;
    const seconds = durationMs / 1000;
    if (seconds < 60) return `${seconds.toFixed(seconds >= 10 ? 0 : 1)} s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes} min ${remainingSeconds} s`;
  };

  const formatRetryTime = (value?: string | null) => {
    if (!value) return null;
    return new Date(value).toLocaleString(language === "es" ? "es-AR" : "en-US");
  };

  const activeProf = profiles.find((p) => p.id === profileId) || profiles[0];
  const fallbackAlbums = (activeProf?.albums || []).map((album) => ({
    id: album.id,
    title: album.title,
    photosCount: album.photos || 0,
  }));
  const albumOptions = albums.length > 0 ? albums : fallbackAlbums;
  const selectedAlbum = albumOptions.find((album) => album.id === targetAlbumId);
  const hasTargetAlbum = Boolean(targetAlbumId && selectedAlbum);
  const normalizedHistorySearch = historySearch.trim().toLowerCase();
  const filteredHistory = normalizedHistorySearch
    ? history.filter((item) => {
        const fields = [
          item.filename,
          item.status,
          item.error || "",
          item.albumId,
          item.uploadedPhotographId || item.id,
          item.deletedPhotographId || "",
        ];
        return fields.some((field) => field.toLowerCase().includes(normalizedHistorySearch));
      })
    : history;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-green {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .pulse-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse-green 2s infinite;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      ` }} />

      <section className="kpi-grid" aria-label="Watcher status metrics">
        <article className="kpi-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div>
              <p className="eyebrow" style={{ color: "var(--muted)" }}>{t.watcherStatus}</p>
              <h2 style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}>
                {isRunning ? (
                  <>
                    <span className="pulse-dot" />
                    <span>{t.active}</span>
                  </>
                ) : (
                  <>
                    <span style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      background: "#ef4444",
                      borderRadius: "50%"
                    }} />
                    <span>{t.inactive}</span>
                  </>
                )}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
                {isRunning ? t.watcherActiveDesc : t.watcherInactiveDesc}
              </p>
            </div>
            <FolderSync size={32} style={{ opacity: 0.3 }} />
          </div>
        </article>

        <article className="kpi-card">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>{t.processedUploads}</p>
          <h2 style={{ margin: "8px 0" }}>{history.length}</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
            {history.filter(h => h.status === "success").length} {language === "es" ? "exitosas" : "successful"} | {history.filter(h => h.status === "failed").length} {language === "es" ? "fallidas" : "failed"}
          </p>
        </article>

        <article className="kpi-card">
          <p className="eyebrow" style={{ color: "var(--muted)" }}>{t.targetAlbum}</p>
          <h2 style={{ margin: "8px 0", fontSize: "1.4rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={selectedAlbum?.title || (language === "es" ? "Ninguno" : "None")}>
            {selectedAlbum?.title || t.selectAlbumPrompt}
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0 }}>
            {language === "es" ? "Cuenta" : "Account"}: {activeProf?.profile?.name || t.noProfiles}
          </p>
        </article>
      </section>

      <section className="analysis-grid" style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <article className="panel">
          <header className="panel-header">
            <h3>{t.watcherFolderConfig}</h3>
          </header>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.localFolderPath}</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  value={watchFolderPath}
                  readOnly
                  placeholder={language === "es" ? "/Users/nombre/LumepicWatchFolder" : "/Users/name/LumepicWatchFolder"}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    background: "var(--paper-2)",
                    color: "var(--ink)",
                    width: "100%",
                    fontFamily: "monospace",
                    cursor: "default",
                  }}
                />
                <button
                  className="text-button"
                  onClick={handleSelectFolder}
                  disabled={selectingFolder}
                  style={{ flex: "0 0 auto", minHeight: 42 }}
                  type="button"
                >
                  <FolderOpen size={15} />
                  {selectingFolder ? (language === "es" ? "Abriendo..." : "Opening...") : t.selectLocalFolder}
                </button>
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                {language === "es" ? "Ruta absoluta donde copiarás las fotos. Usa el selector para cambiarla." : "Absolute path where you will copy the photos. Use the selector to change it."}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxWidth: "240px" }}>
              <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.uploadConcurrency}</label>
              <input
                type="number"
                min={1}
                max={10}
                step={1}
                value={uploadConcurrency}
                onChange={(e) => setUploadConcurrency(Number(e.target.value))}
                onBlur={() => {
                  const normalizedValue = Math.min(10, Math.max(1, Math.floor(Number(uploadConcurrency) || 1)));
                  setUploadConcurrency(normalizedValue);
                  handleSaveConfig({ uploadConcurrency: normalizedValue });
                }}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  background: "var(--cream)",
                  color: "var(--ink)",
                  width: "100%",
                }}
              />
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                {language === "es" ? "Por defecto 1. Máximo 10 para evitar límites de tasa." : "Default 1. Maximum 10 to avoid rate limits."}
              </span>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>{language === "es" ? "Cuenta de Fotógrafo" : "Photographer Account"}</label>
                <select
                  value={profileId}
                  onChange={(e) => {
                    setProfileId(e.target.value);
                    setTargetAlbumId("");
                    handleSaveConfig({ profileId: e.target.value, targetAlbumId: "" });
                  }}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    background: "var(--cream)",
                    color: "var(--ink)",
                    width: "100%",
                  }}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} ({p.profile?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>{t.albumDestination}</label>
                <select
                  value={targetAlbumId}
                  onChange={(e) => {
                    setTargetAlbumId(e.target.value);
                    handleSaveConfig({ targetAlbumId: e.target.value });
                  }}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    background: "var(--cream)",
                    color: "var(--ink)",
                    width: "100%",
                  }}
                >
                  <option value="">{t.selectAlbumPrompt}...</option>
                  {albumOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.photosCount} {language === "es" ? "fotos" : "photos"})
                    </option>
                  ))}
                </select>
                {!hasTargetAlbum ? (
                  <span style={{ fontSize: "0.78rem", color: "#c5221f" }}>
                    {language === "es" ? "Selecciona un álbum de destino para poder activar el watcher." : "Select a target album to activate the watcher."}
                  </span>
                ) : null}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="text-button primary"
                  onClick={() => handleSaveConfig({ targetAlbumId, profileId, uploadConcurrency })}
                >
                  {language === "es" ? "Guardar Configuración" : "Save Settings"}
                </button>
                <button
                  className="text-button"
                  onClick={handleForceScan}
                  disabled={scanning || !isRunning || !hasTargetAlbum}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <RefreshCw size={14} className={scanning ? "spin" : ""} />
                  {scanning ? (language === "es" ? "Escaneando..." : "Scanning...") : (language === "es" ? "Escanear Ahora" : "Scan Now")}
                </button>
              </div>

              <button
                className="text-button"
                onClick={() => {
                  if (!isRunning && !hasTargetAlbum) {
                    alert(language === "es" ? "Selecciona un álbum destino antes de activar el watcher." : "Select a target album before activating the watcher.");
                    return;
                  }
                  handleSaveConfig({ isActive: !isRunning });
                }}
                disabled={!isRunning && !hasTargetAlbum}
                style={{
                  background: isRunning ? "#ef4444" : hasTargetAlbum ? "#22c55e" : "var(--line)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 600,
                }}
              >
                {isRunning ? (language === "es" ? "Detener" : "Stop") : (language === "es" ? "Activar" : "Activate")}
              </button>
            </div>
          </div>
        </article>

        <article className="panel">
          <header className="panel-header">
            <h3>{language === "es" ? "¿Cómo funciona la Carpeta Watcher?" : "How does the Watcher Folder work?"}</h3>
          </header>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.88rem", lineHeight: 1.5 }}>
            <p style={{ margin: 0 }}>
              {language === "es"
                ? "Esta herramienta automatiza la subida de fotografías a tus álbumes de Lumepic sin tener que cargarlas manualmente en la web."
                : "This tool automates the upload of photographs to your Lumepic albums without having to upload them manually on the web."}
            </p>
            <ol style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>
                {language === "es" ? (
                  <>
                    <strong>Crea una carpeta local</strong> en tu computadora (ej. <code>/Users/juannito/LumepicWatchFolder</code>).
                  </>
                ) : (
                  <>
                    <strong>Create a local folder</strong> on your computer (e.g. <code>/Users/name/LumepicWatchFolder</code>).
                  </>
                )}
              </li>
              <li>
                {language === "es"
                  ? "Configura la ruta de la carpeta, el fotógrafo y el álbum de destino arriba."
                  : "Configure the folder path, photographer, and destination album above."}
              </li>
              <li>
                <strong>{language === "es" ? "Activa el Watcher" : "Activate the Watcher"}</strong>. {language === "es" ? "El sistema creará automáticamente dos carpetas internas dentro de tu ruta:" : "The system will automatically create two internal folders inside your path:"}
                <ul style={{ paddingLeft: "20px", marginTop: "4px" }}>
                  <li><code>.processed/</code>: {language === "es" ? "Fotos que se subieron **exitosamente**." : "Photos uploaded **successfully**."}</li>
                  <li><code>.failed/</code>: {language === "es" ? "Si ocurre algún error, las fotos se guardarán aquí con el detalle del error." : "If an error occurs, the photos will be saved here with the error details."}</li>
                </ul>
              </li>
              <li>
                {language === "es"
                  ? "Copia, arrastra o exporta directamente tus fotos a la carpeta configurada y se subirán de inmediato en segundo plano."
                  : "Copy, drag or export your photos directly to the configured folder and they will be uploaded immediately in the background."}
              </li>
            </ol>
          </div>
        </article>
      </section>

      {/* Public Events Section */}
      <section className="panel" style={{ marginTop: "24px" }}>
        <header className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3>{language === "es" ? "Eventos Públicos en tu Ubicación" : "Public Events in your Location"}</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: "4px 0 0 0" }}>
              {language === "es"
                ? "Crea un álbum para cualquiera de estos eventos oficiales con un solo clic y empieza a sincronizar fotos de inmediato"
                : "Create an album for any of these official events with a single click and start syncing photos immediately"}
            </p>
          </div>
          <span style={{
            background: "var(--line)",
            padding: "4px 12px",
            borderRadius: "999px",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "var(--ink)"
          }}>
            {events.length} {language === "es" ? "Eventos Disponibles" : "Events Available"}
          </span>
        </header>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{language === "es" ? "Nombre del Evento" : "Event Name"}</th>
                <th>{language === "es" ? "Fecha del Evento" : "Event Date"}</th>
                <th>{language === "es" ? "Ubicación" : "Location"}</th>
                <th>{language === "es" ? "Estado en tu Cuenta" : "Account Status"}</th>
                <th>{language === "es" ? "Acción" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
                    {language === "es" ? "No se encontraron eventos públicos activos en tu región." : "No active public events were found in your region."}
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const existingAlbum = getExistingAlbumForEvent(event.id);
                  const isSelected = existingAlbum && targetAlbumId === existingAlbum.id;
                  return (
                    <tr key={event.id}>
                      <td data-label={language === "es" ? "Nombre del Evento" : "Event Name"} style={{ fontWeight: 600 }}>
                        {event.name}
                      </td>
                      <td data-label={language === "es" ? "Fecha del Evento" : "Event Date"}>
                        {new Date(event.date).toLocaleDateString(language === "es" ? "es-AR" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </td>
                      <td data-label={language === "es" ? "Ubicación" : "Location"}>
                        {event.locationName}
                      </td>
                      <td data-label={language === "es" ? "Estado en tu Cuenta" : "Account Status"}>
                        {existingAlbum ? (
                          <span style={{
                            background: "#e6f4ea",
                            color: "#137333",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600
                          }}>
                            ✓ {language === "es" ? "Creado" : "Created"} ({existingAlbum.photographerName || (language === "es" ? "Fotógrafo" : "Photographer")}) ({existingAlbum.photosCount} {language === "es" ? "f." : "p."})
                          </span>
                        ) : (
                          <span style={{
                            background: "var(--line)",
                            color: "var(--muted)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600
                          }}>
                            {language === "es" ? "No Creado" : "Not Created"}
                          </span>
                        )}
                      </td>
                      <td data-label={language === "es" ? "Acción" : "Action"}>
                        {existingAlbum ? (
                          <button
                            className="text-button"
                            onClick={() => {
                              if (existingAlbum.profileId && existingAlbum.profileId !== profileId) {
                                setProfileId(existingAlbum.profileId);
                                setTargetAlbumId(existingAlbum.id);
                                handleSaveConfig({
                                  profileId: existingAlbum.profileId,
                                  targetAlbumId: existingAlbum.id
                                });
                              } else {
                                setTargetAlbumId(existingAlbum.id);
                                handleSaveConfig({ targetAlbumId: existingAlbum.id });
                              }
                            }}
                            disabled={isSelected}
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.8rem",
                              background: isSelected ? "var(--line)" : "transparent",
                              fontWeight: isSelected ? 600 : 400
                            }}
                          >
                            {isSelected ? (language === "es" ? "Seleccionado" : "Selected") : (language === "es" ? "Seleccionar" : "Select")}
                          </button>
                        ) : (
                          <button
                            className="text-button primary"
                            onClick={() => handleCreateAlbum(event)}
                            disabled={creatingAlbumId !== null}
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.8rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            {creatingAlbumId === event.id ? (
                              <>
                                <RefreshCw size={12} className="spin" />
                                {language === "es" ? "Creando..." : "Creating..."}
                              </>
                            ) : (
                              language === "es" ? "Crear Álbum en Lumepic" : "Create Album in Lumepic"
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel" style={{ marginTop: "24px" }}>
        <header className="panel-header" style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
          <h3>{t.uploadHistory}</h3>
          <label style={{ position: "relative", display: "flex", alignItems: "center", minWidth: 260, maxWidth: 380, flex: "0 1 380px" }}>
            <Search size={16} style={{ position: "absolute", left: 12, color: "var(--muted)" }} />
            <input
              type="search"
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder={t.searchHistory}
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                border: "1px solid var(--line)",
                borderRadius: 999,
                background: "var(--paper-2)",
                color: "var(--ink)",
                fontSize: "0.86rem",
              }}
            />
          </label>
        </header>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{language === "es" ? "Archivo" : "File"}</th>
                <th>{language === "es" ? "Fecha de Carga" : "Upload Date"}</th>
                <th>{language === "es" ? "Tamaño" : "Size"}</th>
                <th>{language === "es" ? "Estado" : "Status"}</th>
                <th>{language === "es" ? "Detalle / Reporte" : "Detail / Report"}</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    {language === "es" ? "No se han detectado archivos en la carpeta todavía. Copia fotos para comenzar." : "No files have been detected in the folder yet. Copy photos to begin."}
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                    {language === "es" ? "No hay cargas que coincidan con la búsqueda." : "No uploads match your search."}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td data-label={language === "es" ? "Archivo" : "File"} style={{ fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FolderOpen size={16} style={{ color: "var(--muted)" }} />
                        {item.filename}
                      </div>
                    </td>
                    <td data-label={language === "es" ? "Fecha de Carga" : "Upload Date"}>
                      {new Date(item.timestamp).toLocaleString(language === "es" ? "es-AR" : "en-US")}
                    </td>
                    <td data-label={language === "es" ? "Tamaño" : "Size"}>
                      {item.size ? formatBytes(item.size) : "—"}
                    </td>
                    <td data-label={language === "es" ? "Estado" : "Status"}>
                      {item.status === "success" ? (
                        <span style={{
                          background: "#e6f4ea",
                          color: "#137333",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600
                        }}>{language === "es" ? "Exitoso" : "Success"}</span>
                      ) : item.status === "deleted" ? (
                        <span style={{
                          background: "var(--line)",
                          color: "var(--muted)",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600
                        }}>{language === "es" ? "Borrado" : "Deleted"}</span>
                      ) : item.retryable ? (
                        <span style={{
                          background: "#fff4ce",
                          color: "#8a5a00",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600
                        }}>{language === "es" ? "Pendiente de reintento" : "Pending retry"}</span>
                      ) : (
                        <span style={{
                          background: "#fce8e6",
                          color: "#c5221f",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 600
                        }}>{language === "es" ? "Fallido" : "Failed"}</span>
                      )}
                    </td>
                    <td data-label={language === "es" ? "Detalle / Reporte" : "Detail / Report"} style={{ fontSize: "0.82rem", color: item.status === "failed" ? "#c5221f" : "var(--muted)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span>
                          {item.status === "deleted"
                            ? `${language === "es" ? "Foto borrada de Lumepic" : "Photo deleted from Lumepic"}${item.deletedAt ? ` ${language === "es" ? "el" : "on"} ${new Date(item.deletedAt).toLocaleString(language === "es" ? "es-AR" : "en-US")}` : ""}`
                            : item.error || (language === "es" ? "Subido exitosamente al álbum" : "Successfully uploaded to album")}
                        </span>
                        {item.status === "success" ? (
                          <span style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                            {language === "es" ? "ID foto" : "Photo ID"}: {item.uploadedPhotographId || item.id}
                          </span>
                        ) : null}
                        {item.status === "deleted" ? (
                          <span style={{ color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                            {language === "es" ? "ID foto" : "Photo ID"}: {item.deletedPhotographId || item.uploadedPhotographId || item.id}
                          </span>
                        ) : null}
                        <span style={{ color: "var(--muted)" }}>{language === "es" ? "Tiempo" : "Time"}: {formatDuration(item.durationMs)}</span>
                        {item.attempts ? (
                          <span style={{ color: "var(--muted)" }}>{language === "es" ? "Intentos" : "Attempts"}: {item.attempts}</span>
                        ) : null}
                        {item.retryable ? (
                          <span style={{ color: "var(--muted)" }}>
                            {language === "es" ? "Próximo intento" : "Next retry"}: {formatRetryTime(item.nextRetryAt) || (language === "es" ? "en el próximo ciclo" : "in the next cycle")}
                          </span>
                        ) : null}
                        {item.status === "success" && (item.uploadedPhotographId || item.id) ? (
                          <button
                            className="text-button"
                            onClick={() => handleDeletePhotograph(item)}
                            disabled={deletingPhotographId === (item.uploadedPhotographId || item.id)}
                            style={{
                              alignSelf: "flex-start",
                              minHeight: 30,
                              padding: "0 10px",
                              fontSize: "0.78rem",
                              color: "#c5221f",
                              borderColor: "#f4b8b3",
                              background: "#fff",
                              gap: 6,
                            }}
                          >
                            <Trash2 size={13} />
                            {deletingPhotographId === (item.uploadedPhotographId || item.id) ? (language === "es" ? "Borrando..." : "Deleting...") : (language === "es" ? "Borrar foto" : "Delete photo")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

interface GalleryPhotoItem {
  id: string;
  thumbnailUrl: string;
  url: string;
  originalFileName: string;
  albumId: string;
  sale: Sale;
  profileId: string;
  profileName: string;
  profileColor: string;
}

function GalleryDashboard({ profiles, language = "en" }: { profiles: DashboardSummary[]; language?: Language }) {
  const t = TRANSLATIONS[language];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("all");
  const [purchaseType, setPurchaseType] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<GalleryPhotoItem | null>(null);

  // Extract all photographs from all sales
  const allPhotos = useMemo(() => {
    const photosList: GalleryPhotoItem[] = [];

    profiles.forEach((profile) => {
      profile.sales.forEach((sale) => {
        sale.photographs.forEach((photo) => {
          photosList.push({
            id: photo.id,
            thumbnailUrl: photo.thumbnailUrl,
            url: photo.url,
            originalFileName: photo.originalFileName || photo.id || (language === "es" ? "Fotografía" : "Photograph"),
            albumId: photo.albumId,
            sale,
            profileId: profile.id,
            profileName: profile.profile.name,
            profileColor: profile.color,
          });
        });
      });
    });

    return photosList;
  }, [profiles]);

  const handleCopyFileName = (fileName: string, photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(fileName);
    setCopiedId(photoId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredPhotos = useMemo(() => {
    let result = [...allPhotos];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const fileName = (item.originalFileName || "").toLowerCase();
        const albumTitle = (item.sale.album || "").toLowerCase();
        const buyerName = (item.sale.buyer || "").toLowerCase();
        const isCompedMatch = item.sale.isComped && "lumepic".includes(q);

        return (
          fileName.includes(q) ||
          albumTitle.includes(q) ||
          buyerName.includes(q) ||
          isCompedMatch
        );
      });
    }

    // Filter by profile
    if (selectedProfile !== "all") {
      result = result.filter((item) => item.profileId === selectedProfile);
    }

    // Filter by purchase type
    if (purchaseType === "comped") {
      result = result.filter((item) => item.sale.isComped);
    } else if (purchaseType === "paid") {
      result = result.filter((item) => !item.sale.isComped);
    }

    // Sort
    if (sortOrder === "recent") {
      result.sort((a, b) => new Date(b.sale.date).getTime() - new Date(a.sale.date).getTime());
    } else if (sortOrder === "oldest") {
      result.sort((a, b) => new Date(a.sale.date).getTime() - new Date(b.sale.date).getTime());
    } else if (sortOrder === "name") {
      result.sort((a, b) => a.originalFileName.localeCompare(b.originalFileName));
    }

    return result;
  }, [allPhotos, searchQuery, selectedProfile, purchaseType, sortOrder]);

  const photoCountLabel = useMemo(() => {
    const total = allPhotos.length;
    const filtered = filteredPhotos.length;
    if (total === filtered) {
      return `${total} ${total === 1 
        ? (language === "es" ? "foto comprada" : "photo purchased") 
        : (language === "es" ? "fotos compradas" : "photos purchased")}`;
    }
    return language === "es" 
      ? `Mostrando ${filtered} de ${total} fotos` 
      : `Showing ${filtered} of ${total} photos`;
  }, [allPhotos, filteredPhotos, language]);

  return (
    <>
      <section className="panel" style={{ marginBottom: "18px" }}>
        <header className="panel-header" style={{ flexDirection: "column", alignItems: "stretch", gap: "16px", marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2>{t.galleryTitle}</h2>
              <p>{t.galleryDesc}</p>
            </div>
            <Images size={22} style={{ color: "var(--muted)" }} />
          </div>

          <div className="gallery-filter-bar">
            {/* Search Input */}
            <div className="gallery-search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder={language === "es" ? "Buscar por nombre, álbum, comprador o Lumepic..." : "Search by name, album, buyer or Lumepic..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-btn" onClick={() => setSearchQuery("")}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Profile Filter (if consolidated has profiles > 1) */}
            {profiles.length > 1 && (
              <div className="filter-select-wrap">
                <UserRound size={14} className="select-icon" />
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                >
                  <option value="all">{t.allPhotographers}</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Purchase Type Filter */}
            <div className="filter-select-wrap">
              <BadgeDollarSign size={14} className="select-icon" />
              <select
                value={purchaseType}
                onChange={(e) => setPurchaseType(e.target.value)}
              >
                <option value="all">{language === "es" ? "Todos los tipos de compra" : "All purchase types"}</option>
                <option value="paid">{language === "es" ? "Sólo Pagadas" : "Paid Only"}</option>
                <option value="comped">{language === "es" ? "Sólo Lumepic (Bonificadas)" : "Lumepic Only (Comped)"}</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="filter-select-wrap">
              <Clock size={14} className="select-icon" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="recent">{language === "es" ? "Más recientes primero" : "Most recent first"}</option>
                <option value="oldest">{language === "es" ? "Más antiguas primero" : "Oldest first"}</option>
                <option value="name">{language === "es" ? "Por nombre de archivo" : "By file name"}</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line-soft)", paddingTop: "12px", fontSize: "0.82rem", color: "var(--muted)" }}>
            <span>{photoCountLabel}</span>
            {allPhotos.length > 0 && allPhotos.length > filteredPhotos.length && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedProfile("all");
                  setPurchaseType("all");
                  setSortOrder("recent");
                }}
                className="text-link-btn"
                style={{ background: "none", border: "none", color: "var(--ink)", fontWeight: "600", cursor: "pointer", textDecoration: "underline", padding: 0 }}
              >
                {language === "es" ? "Restablecer filtros" : "Reset filters"}
              </button>
            )}
          </div>
        </header>
      </section>

      {filteredPhotos.length === 0 ? (
        <section className="panel" style={{ padding: "64px 20px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", width: "64px", height: "64px", borderRadius: "50%", background: "var(--paper-2)", alignItems: "center", justifyContent: "center", marginBottom: "16px", border: "1px solid var(--line)" }}>
            <Images size={28} style={{ color: "var(--muted)" }} />
          </div>
          <h3>{language === "es" ? "No se encontraron fotografías" : "No photographs found"}</h3>
          <p style={{ color: "var(--muted)", maxWidth: "420px", margin: "8px auto 0 auto", fontSize: "0.92rem" }}>
            {allPhotos.length === 0 
              ? (language === "es" 
                  ? "Aún no se han detallado fotos vendidas. Asegúrate de que las transacciones contengan información detallada de fotografías."
                  : "No sold photos have been itemized yet. Make sure transactions contain detailed photo information.")
              : (language === "es"
                  ? "Prueba modificando los filtros de búsqueda, fotógrafo o tipo de compra para encontrar lo que buscas."
                  : "Try modifying search filters, photographer or purchase type to find what you are looking for.")}
          </p>
        </section>
      ) : (
        <section className="gallery-grid">
          {filteredPhotos.map((item) => {
            const isComped = item.sale.isComped;
            const buyerName = isComped ? "Lumepic" : item.sale.buyer;
            const saleDate = new Date(item.sale.date);
            const hourStr = saleDate.toLocaleTimeString(language === "es" ? "es-AR" : "en-US", { hour: "2-digit", minute: "2-digit" });
            const dayStr = saleDate.toLocaleDateString(language === "es" ? "es-AR" : "en-US", { day: "2-digit", month: "short", year: "numeric" });
            const cardKey = `${item.sale.id}-${item.id}`;

            return (
              <article 
                className="photo-card" 
                key={cardKey}
                onClick={() => setActiveLightboxPhoto(item)}
              >
                <div className="photo-image-wrap">
                  <img 
                    src={item.thumbnailUrl || item.url} 
                    alt={item.originalFileName} 
                    loading="lazy"
                  />
                  <div className="photo-card-overlay">
                    <span className="overlay-badge">{language === "es" ? "Detalle" : "Detail"}</span>
                  </div>
                  {isComped ? (
                    <span className="buyer-badge is-comped">Lumepic</span>
                  ) : (
                    <span className="buyer-badge is-paid" title={buyerName}>
                      {buyerName}
                    </span>
                  )}
                </div>
                
                <div className="photo-card-info">
                  <div className="file-name-row">
                    <span className="file-name" title={item.originalFileName}>
                      {item.originalFileName}
                    </span>
                    <button
                      className="copy-btn"
                      onClick={(e) => handleCopyFileName(item.originalFileName, item.id, e)}
                      title={language === "es" ? "Copiar nombre original" : "Copy original name"}
                    >
                      {copiedId === item.id ? (
                        <Check size={13} style={{ color: "var(--green)" }} />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>

                  <div className="photo-meta-list">
                    <div className="photo-meta-item highlighted-time" title={language === "es" ? "Hora de compra local" : "Local purchase time"}>
                      <Clock size={12} />
                      <strong>{hourStr}</strong>
                      <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>({dayStr})</span>
                    </div>
                    <div className="photo-meta-item album-info" title={item.sale.album}>
                      <Album size={12} />
                      <span>{item.sale.album}</span>
                    </div>
                    {profiles.length > 1 && (
                      <div className="profile-indicator-row">
                        <span className="profile-dot" style={{ background: item.profileColor }} />
                        <span>{item.profileName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Lightbox Modal */}
      {activeLightboxPhoto && (
        <div className="lightbox-backdrop" onClick={() => setActiveLightboxPhoto(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setActiveLightboxPhoto(null)}>
              <X size={20} />
            </button>
            <div className="lightbox-grid">
              <div className="lightbox-image-wrap">
                <img 
                  src={activeLightboxPhoto.url || activeLightboxPhoto.thumbnailUrl} 
                  alt={activeLightboxPhoto.originalFileName} 
                />
              </div>
              <div className="lightbox-details">
                <h2>{language === "es" ? "Detalle de Fotografía" : "Photograph Detail"}</h2>
                <div className="lightbox-plate">
                  <span className="plate-label">{language === "es" ? "Nombre original de archivo" : "Original file name"}</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "4px" }}>
                    <strong style={{ fontSize: "1.1rem", fontFamily: "var(--font-mono)", overflowWrap: "anywhere", color: "var(--ink)" }}>
                      {activeLightboxPhoto.originalFileName}
                    </strong>
                    <button
                      className="copy-btn large"
                      onClick={() => handleCopyFileName(activeLightboxPhoto.originalFileName, activeLightboxPhoto.id)}
                      title={language === "es" ? "Copiar nombre" : "Copy name"}
                      style={{ padding: "6px 8px", background: "var(--white)", border: "1px solid var(--line)", borderRadius: "6px", cursor: "pointer", flexShrink: 0 }}
                    >
                      {copiedId === activeLightboxPhoto.id ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "var(--green)" }}><Check size={14} /> {language === "es" ? "¡Copiado!" : "Copied!"}</span>
                      ) : (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem" }}><Copy size={14} /> {language === "es" ? "Copiar" : "Copy"}</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="lightbox-list">
                  <div>
                    <span>{language === "es" ? "Comprador:" : "Buyer:"}</span>
                    <strong>
                      {activeLightboxPhoto.sale.isComped ? (
                        <span className="buyer-badge is-comped" style={{ position: "static", padding: "4px 10px", fontSize: "0.78rem" }}>Lumepic</span>
                      ) : (
                        activeLightboxPhoto.sale.buyer
                      )}
                    </strong>
                  </div>
                  {activeLightboxPhoto.sale.buyerEmail && !activeLightboxPhoto.sale.isComped && (
                    <div>
                      <span>{language === "es" ? "Email del comprador:" : "Buyer email:"}</span>
                      <strong style={{ fontSize: "0.88rem" }}>{activeLightboxPhoto.sale.buyerEmail}</strong>
                    </div>
                  )}
                  <div>
                    <span>{language === "es" ? "Álbum comercial:" : "Commercial album:"}</span>
                    <strong>{activeLightboxPhoto.sale.album}</strong>
                  </div>
                  <div>
                    <span>{language === "es" ? "Actividad:" : "Activity:"}</span>
                    <strong>{activeLightboxPhoto.sale.activity}</strong>
                  </div>
                  <div>
                    <span>{language === "es" ? "Fecha de Compra:" : "Purchase Date:"}</span>
                    <strong>
                      {new Date(activeLightboxPhoto.sale.date).toLocaleDateString(language === "es" ? "es-AR" : "en-US", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                      })}
                    </strong>
                  </div>
                  <div>
                    <span>{language === "es" ? "Hora de Compra:" : "Purchase Time:"}</span>
                    <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={14} />
                      {new Date(activeLightboxPhoto.sale.date).toLocaleTimeString(language === "es" ? "es-AR" : "en-US", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}{language === "es" ? " hs" : ""}
                    </strong>
                  </div>
                  <div>
                    <span>{language === "es" ? "Transacción:" : "Transaction:"}</span>
                    <strong>
                      {activeLightboxPhoto.sale.isComped ? (
                        <span style={{ color: "var(--muted)" }}>{language === "es" ? "Bonificada (Cortesía)" : "Comped (Courtesy)"}</span>
                      ) : (
                        money.format(activeLightboxPhoto.sale.total)
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>{language === "es" ? "Fotógrafo asignado:" : "Assigned photographer:"}</span>
                    <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="profile-dot" style={{ background: activeLightboxPhoto.profileColor }} />
                      {activeLightboxPhoto.profileName}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", gap: "12px" }}>
                  <a
                    href={activeLightboxPhoto.url || activeLightboxPhoto.thumbnailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-button primary"
                    style={{ flex: 1, textDecoration: "none", display: "inline-flex", justifyContent: "center", alignItems: "center", gap: "6px", fontSize: "0.85rem", height: "40px" }}
                  >
                    <ExternalLink size={15} />
                    {language === "es" ? "Ver original en alta" : "View high-res original"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


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
  language = "en",
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
  language?: Language;
}) {
  const selectedClient = clients.find((c) => c.key === selectedClientKey) || clients[0];
  const localData = selectedClient ? clientsLocalData[selectedClient.key] : undefined;
  const isEditing = selectedClient && editingClientKey === selectedClient.key;
  const t = TRANSLATIONS[language];

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
            <p>{selectedClient.email || t.noEmail}</p>
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
                {t.customName}
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
                {t.instagramLabel}
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
                {t.notesLabel}
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={t.clientNotesPlaceholder}
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
                {t.save}
              </button>
              <button className="text-button" onClick={() => setEditingClientKey(null)} style={{ flex: 1 }}>
                {t.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="detail-list">
            <div>
              <span>{t.instagramLabel}</span>
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
                <span style={{ color: "var(--muted)" }}>{t.notAssigned}</span>
              )}
            </div>
            <div>
              <span>{t.notesLabel}</span>
              <strong style={{ whiteSpace: "pre-wrap", textAlign: "right" }}>{localData?.notes || "—"}</strong>
            </div>
            <div>
              <span>{t.totalPurchases}</span>
              <strong>{selectedClient.salesCount}</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", borderBottom: "none" }}>
              <span style={{ marginBottom: "8px" }}>{t.purchaseHistory}</span>
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
                        {formatDate(sale.date, language)} - {sale.photographerName}
                      </span>
                    </div>
                    <strong>{money.format(sale.total)}</strong>
                  </div>
                ))}
              </div>
            </div>
            <button className="text-button" onClick={startEditing} style={{ width: "100%", marginTop: "12px" }}>
              {t.editProfile}
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
            <span>{t.totalClients}</span>
            <UserRound size={20} />
          </header>
          <strong>{totalClientsCount}</strong>
          <span>{t.uniqueBuyers}</span>
        </article>
        <article className="kpi-card" style={{ background: "var(--yellow)" }}>
          <header>
            <span>{t.totalBilling}</span>
            <BadgeDollarSign size={20} />
          </header>
          <strong>{money.format(totalSpentAllClients)}</strong>
          <span>{t.accumulatedTotal}</span>
        </article>
        <article className="kpi-card" style={{ background: "var(--cyan)" }}>
          <header>
            <span>{t.avgSpentPerClient}</span>
            <TrendingUp size={20} />
          </header>
          <strong>{money.format(avgSpentPerClient)}</strong>
          <span>{language === "es" ? "Promedio por cliente" : "Average per client"}</span>
        </article>
      </section>

      <section className="sales-section">
        <article className="panel">
          <header className="table-toolbar">
            <div>
              <h2>{t.clientDirectory}</h2>
              <p>{t.clientDirectoryDesc}</p>
            </div>
            <UserRound size={21} />
          </header>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.clientLabel}</th>
                  <th>{t.instagramLabel}</th>
                  <th>{language === "es" ? "Compras" : "Purchases"}</th>
                  <th>{t.totalPurchased}</th>
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
                      <td data-label={t.clientLabel}>
                        <button className="sale-button" onClick={() => onSelectClient(client.key)}>
                          <strong>{displayName}</strong>
                          <span>{client.email || t.noEmail}</span>
                        </button>
                      </td>
                      <td data-label={t.instagramLabel}>
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
                      <td data-label={language === "es" ? "Compras" : "Purchases"}>{client.salesCount}</td>
                      <td data-label={t.totalPurchased}>{money.format(client.totalSpent)}</td>
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
              {t.selectClientPrompt}
            </div>
          )}
        </aside>
      </section>

      {/* Mobile Peek Bar */}
      {selectedClientKey && selectedClient && !isBottomSheetExpanded && (
        <div className="mobile-peek-bar" onClick={() => setIsBottomSheetExpanded(true)}>
          <div className="mobile-peek-info">
            <strong>{localData?.customName || selectedClient.name}</strong>
            <span>{t.totalPurchased}: {money.format(selectedClient.totalSpent)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button className="text-button primary compact" style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "999px" }}>
              {t.viewDetail}
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
  const [rawDashboard, setRawDashboard] = useState<DashboardPayload | null>(null);
  const [customProfileLabels, setCustomProfileLabels] = useState<Record<string, string>>({});
  const [activeView, setActiveView] = useState("consolidated");
  const [activeSaleId, setActiveSaleId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(EXPORT_COLUMNS.map((column) => column.key));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheTime, setCacheTime] = useState<string>("");
  const [hasFetchedFullHistory, setHasFetchedFullHistory] = useState(false);

  // Estados de Configuración (Auto-Pull y Notificaciones)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoPullEnabled, setAutoPullEnabled] = useState(false);
  const [autoPullInterval, setAutoPullInterval] = useState(60000); // 1 minuto por defecto
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [language, setLanguage] = useState<Language>("en");

  // Referencia mutable para almacenar ventas ya conocidas
  const knownSaleIdsRef = useRef<Set<string>>(new Set());
  const isLanguageMountedRef = useRef(false);

  // Clientes View States
  const [clientsLocalData, setClientsLocalData] = useState<Record<string, ClientLocalProfile>>({});
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [editingClientKey, setEditingClientKey] = useState<string | null>(null);
  const [editInstagram, setEditInstagram] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCustomName, setEditCustomName] = useState("");

  const dashboard = useMemo<DashboardPayload | null>(() => {
    if (!rawDashboard) return null;
    return {
      ...rawDashboard,
      profiles: rawDashboard.profiles.map(profile => ({
        ...profile,
        label: customProfileLabels[profile.id] || profile.label
      })),
      consolidated: {
        ...rawDashboard.consolidated,
        profiles: rawDashboard.consolidated.profiles.map(p => ({
          ...p,
          label: customProfileLabels[p.id] || p.label
        }))
      }
    };
  }, [rawDashboard, customProfileLabels]);

  const handleSetActiveView = (view: string) => {
    setActiveView(view);
    try {
      localStorage.setItem("lumepic_active_view", view);
    } catch (e) {
      console.error("Error al guardar activeView en localStorage", e);
    }
  };

  const handleSetCustomProfileLabel = (profileId: string, label: string) => {
    const updated = {
      ...customProfileLabels,
      [profileId]: label
    };
    setCustomProfileLabels(updated);
    try {
      localStorage.setItem("lumepic_custom_profile_labels", JSON.stringify(updated));
    } catch (e) {
      console.error("Error al guardar customProfileLabels en localStorage", e);
    }
  };

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem("lumepic_language", lang);
    } catch (e) {
      console.error("Error al guardar idioma en localStorage", e);
    }
  };

  // Sincronizar idioma con LocalStorage cuando cambia
  useEffect(() => {
    if (isLanguageMountedRef.current) {
      try {
        localStorage.setItem("lumepic_language", language);
      } catch (e) {
        console.error("Error al guardar idioma en localStorage", e);
      }
    } else {
      isLanguageMountedRef.current = true;
    }
  }, [language]);

  // Cargar configuraciones y activeView de LocalStorage al iniciar
  useEffect(() => {
    try {
      const savedAutoPull = localStorage.getItem("lumepic_autopull_enabled");
      if (savedAutoPull) setAutoPullEnabled(savedAutoPull === "true");

      const savedInterval = localStorage.getItem("lumepic_autopull_interval");
      if (savedInterval) setAutoPullInterval(parseInt(savedInterval, 10));

      const savedNotifications = localStorage.getItem("lumepic_notifications_enabled");
      if (savedNotifications) setNotificationsEnabled(savedNotifications === "true");

      const savedView = localStorage.getItem("lumepic_active_view");
      if (savedView) {
        setActiveView(savedView);
      }

      const savedLabels = localStorage.getItem("lumepic_custom_profile_labels");
      if (savedLabels) {
        setCustomProfileLabels(JSON.parse(savedLabels));
      }

      const savedLanguage = localStorage.getItem("lumepic_language");
      if (savedLanguage === "es" || savedLanguage === "en") {
        setLanguage(savedLanguage as Language);
      }
    } catch (e) {
      console.error("Error al leer configuración de LocalStorage", e);
    }
  }, []);

  // Sincronizar activeView con los perfiles cargados (si es un ID de perfil que ya no existe, volver a consolidado)
  useEffect(() => {
    if (dashboard && activeView !== "consolidated" && activeView !== "clients" && activeView !== "watcher" && activeView !== "gallery") {
      const exists = dashboard.profiles.some(p => p.id === activeView);
      if (!exists) {
        handleSetActiveView("consolidated");
      }
    }
  }, [dashboard, activeView]);

  const handleToggleAutoPull = (val: boolean) => {
    setAutoPullEnabled(val);
    localStorage.setItem("lumepic_autopull_enabled", String(val));
  };

  const handleSetAutoPullInterval = (val: number) => {
    setAutoPullInterval(val);
    localStorage.setItem("lumepic_autopull_interval", String(val));
  };

  const handleToggleNotifications = async (val: boolean) => {
    if (val) {
      if (!("Notification" in window)) {
        alert("Tu navegador no soporta notificaciones de escritorio.");
        return;
      }

      // Validar contexto seguro (HTTPS o Localhost)
      const isSecureContext = 
        window.location.protocol === "https:" || 
        window.location.hostname === "localhost" || 
        window.location.hostname === "127.0.0.1";

      if (!isSecureContext) {
        alert(
          "Las notificaciones de escritorio requieren un contexto seguro.\n\n" +
          "Debido a políticas de seguridad de los navegadores modernos, las notificaciones están bloqueadas en conexiones HTTP sobre IPs de red local (como " + window.location.host + ").\n\n" +
          "Para activarlas, accede a la aplicación mediante 'http://localhost:4000' desde la computadora que corre el servidor, o configura HTTPS."
        );
        return;
      }

      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("Permiso de notificaciones denegado. Asegúrate de habilitar los permisos en la configuración de la barra de direcciones de tu navegador.");
          return;
        }
      }
    }

    setNotificationsEnabled(val);
    localStorage.setItem("lumepic_notifications_enabled", String(val));
  };

  // Callback para procesar ventas nuevas y disparar notificaciones
  const processNewSales = useCallback((data: DashboardPayload) => {
    if (!data || !data.profiles) return;

    const newSales: Array<{ sale: Sale; profileLabel: string }> = [];

    data.profiles.forEach((profile) => {
      profile.sales.forEach((sale) => {
        if (knownSaleIdsRef.current.size > 0 && !knownSaleIdsRef.current.has(sale.id)) {
          const profileLabel = customProfileLabels[profile.id] || profile.label;
          newSales.push({ sale, profileLabel });
        }
      });
    });

    // Si es la carga inicial, poblamos los IDs conocidos sin alertar
    if (knownSaleIdsRef.current.size === 0) {
      data.profiles.forEach((profile) => {
        profile.sales.forEach((sale) => {
          knownSaleIdsRef.current.add(sale.id);
        });
      });
      return;
    }

    // Si se detectan ventas nuevas con respecto a la sincronización anterior
    if (newSales.length > 0) {
      newSales.forEach(({ sale, profileLabel }) => {
        knownSaleIdsRef.current.add(sale.id);

        if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
          try {
            const bodyText = `${sale.buyer} compró ${sale.photos} ${sale.photos === 1 ? "foto" : "fotos"} en "${sale.album}" por ${sale.isComped ? "Lumepic (bonificado)" : money.format(sale.total)}.`;
            const title = `¡Nueva venta en ${profileLabel}!`;

            new Notification(title, {
              body: bodyText,
              icon: "/favicon.ico"
            });
          } catch (e) {
            console.error("Error disparando notificación nativa de navegador", e);
          }
        }
      });
    }
  }, [notificationsEnabled, customProfileLabels]);

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

  async function loadSummary(forceFetch: boolean = false, limit: number = 500, isBackground: boolean = false) {
    if (!isBackground) {
      setLoading(true);
      setError(null);
    }

    // If not forcing fetch, check localStorage cache first
    if (!forceFetch) {
      try {
        const cached = localStorage.getItem("lumepic_dashboard_cache_v2");
        if (cached) {
          const data = JSON.parse(cached) as DashboardPayload;
          
          // Use cached data immediately if we have connected profiles!
          if (data && data.profiles && data.profiles.length > 0) {
            setRawDashboard(data);
            processNewSales(data);
            const cachedTime = localStorage.getItem("lumepic_dashboard_cached_at_v2");
            if (cachedTime) {
              setCacheTime(cachedTime);
            }
            const maxSalesInCache = Math.max(...data.profiles.map(p => p.sales.length), 0);
            if (maxSalesInCache >= 1000) {
              setHasFetchedFullHistory(true);
            }
            const selected = data.profiles.find((profile) => profile.id === activeView) || data.profiles[0];
            if (selected) {
              setActiveSaleId(selected.sales[0]?.id ?? null);
            }
            setLoading(false);

            // Trigger silent background refresh to update stale data!
            void loadSummary(true, limit, true);
            return;
          }
        }
      } catch (e) {
        console.error("Error reading dashboard cache from localStorage", e);
      }
    }

    try {
      const response = await fetch(`/api/lumepic/summary?limit=${limit}${forceFetch ? "&bypassCache=true" : ""}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`API local respondio ${response.status}`);

      const data = (await response.json()) as DashboardPayload;

      // Evitar sobreescribir datos reales con datos de demostración
      if (rawDashboard && rawDashboard.source === "live" && data.source === "demo") {
        setRawDashboard({
          ...rawDashboard,
          warning: "Sincronización fallida. El servidor volvió a modo demo temporalmente. Preservando datos reales anteriores."
        });

        // Actualizamos el indicador de tiempo de refresco
        const timeStr = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
        const dateStr = new Date().toLocaleDateString("es-AR", { month: "short", day: "numeric" });
        setCacheTime(`${dateStr}, ${timeStr}`);
        return;
      }

      // Verificar si algún perfil falló en la respuesta viva del servidor
      const hasFailedProfiles = data.profiles.some(p => p.warning && p.warning.includes("No pude conectar"));

      if (hasFailedProfiles && rawDashboard && rawDashboard.profiles.some(p => p.totals.revenue > 0)) {
        const updatedProfiles = rawDashboard.profiles.map(p => {
          const failedPartner = data.profiles.find(fp => fp.id === p.id);
          if (failedPartner && failedPartner.warning) {
            return { ...p, warning: failedPartner.warning };
          }
          return p;
        });

        const updatedWarning = data.profiles
          .map(p => p.warning)
          .filter(Boolean)
          .join(" ");

        setRawDashboard({
          ...rawDashboard,
          profiles: updatedProfiles,
          warning: updatedWarning || "Sincronización fallida. Mostrando datos anteriores de la caché."
        });

        // Actualizamos el indicador de tiempo de refresco
        const timeStr = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
        const dateStr = new Date().toLocaleDateString("es-AR", { month: "short", day: "numeric" });
        setCacheTime(`${dateStr}, ${timeStr}`);
        return;
      }

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
      const maxSales = Math.max(...data.profiles.map(p => p.sales.length), 0);
      if (maxSales >= 1000) {
        setHasFetchedFullHistory(true);
      }
      setRawDashboard(data);
      processNewSales(data);
      const selected = data.profiles.find((profile) => profile.id === activeView) || data.profiles[0];
      if (selected && (!activeSaleId || !selected.sales.some(s => s.id === activeSaleId))) {
        setActiveSaleId(selected.sales[0]?.id ?? null);
      }
    } catch (caught) {
      if (!isBackground) {
        setError(caught instanceof Error ? caught.message : "No pude cargar los datos");
      } else {
        console.error("Background summary refresh failed:", caught);
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }

  // Referencia mutable para evitar stale closure en el temporizador
  const loadSummaryRef = useRef(loadSummary);
  useEffect(() => {
    loadSummaryRef.current = loadSummary;
  });

  // Efecto para gestionar el temporizador de Pull automático
  useEffect(() => {
    if (!autoPullEnabled) return;

    const intervalId = setInterval(() => {
      void loadSummaryRef.current(true, 500, true);
    }, autoPullInterval);

    return () => clearInterval(intervalId);
  }, [autoPullEnabled, autoPullInterval]);

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
        
        // Prevent duplicate sales for the same client to avoid duplicate React keys
        const isDuplicate = clientMap[key].sales.some((s) => s.saleId === sale.id);
        if (!isDuplicate) {
          clientMap[key].totalSpent += sale.total;
          clientMap[key].salesCount += 1;
          clientMap[key].sales.push({
            saleId: sale.id,
            date: sale.date,
            album: sale.album,
            total: sale.total,
            photographerName: profile.profile.name,
          });
        }
      });
    });

    Object.values(clientMap).forEach((client) => {
      client.sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return Object.values(clientMap).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [dashboard]);

  const activeClientKey = selectedClientKey || clients[0]?.key || null;

  if (loading) return <LoadingState language={language} />;

  if (!dashboard) {
    return (
      <main className="skeleton">
        <section className="skeleton-inner">
          <p className="eyebrow">Lumepic dashboard</p>
          <h1>{language === "es" ? "No pude cargar ventas" : "Could not load sales"}</h1>
          <p>{error ?? (language === "es" ? "La API local no respondió." : "The local API did not respond.")}</p>
          <button className="text-button" onClick={() => void loadSummary(true)}>
            {language === "es" ? "Reintentar" : "Retry"}
          </button>
        </section>
      </main>
    );
  }

  const isClientsView = activeView === "clients";
  const isWatcherView = activeView === "watcher";
  const isGalleryView = activeView === "gallery";
  const showConsolidated = activeView === "consolidated";
  const t = TRANSLATIONS[language];
  const totals = isClientsView
    ? { revenue: clients.reduce((acc, c) => acc + c.totalSpent, 0), albums: dashboard.consolidated.totals.albums }
    : isWatcherView
      ? { revenue: 0, albums: dashboard.consolidated.totals.albums }
      : isGalleryView
        ? { revenue: dashboard.consolidated.totals.revenue, albums: dashboard.consolidated.totals.albums }
        : (showConsolidated ? dashboard.consolidated.totals : activeProfile?.totals);
  const warnings = [dashboard.warning, !showConsolidated && !isClientsView && !isWatcherView && !isGalleryView ? activeProfile?.warning : null].filter(Boolean).join(" ");
  const exportProfiles = showConsolidated ? dashboard.profiles : activeProfile ? [activeProfile] : [];
  const exportRowCount = exportProfiles.reduce((count, profile) => count + profile.sales.length, 0);
  const exportScopeLabel = showConsolidated 
    ? (language === "es" ? "Todos los perfiles" : "All profiles") 
    : activeProfile?.label ?? (language === "es" ? "Perfil" : "Profile");
  const fidelityCodes = dashboard.profiles
    .map((profile) => profile.profile.fidelityCode?.code)
    .filter(Boolean);
  const fidelityLabel = showConsolidated
    ? `${fidelityCodes.length} ${language === "es" ? "codigos" : "codes"}`
    : activeProfile?.profile.fidelityCode
      ? `${activeProfile.profile.fidelityCode.code} - ${formatFidelityDiscount(activeProfile.profile.fidelityCode)}`
      : (language === "es" ? "Sin codigo" : "No code");

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
              onClick={() => handleSetActiveView("consolidated")}
            >
              {t.consolidated}
            </button>
            {dashboard.profiles.map((profile) => (
              <button
                className={activeView === profile.id ? "switcher-item active" : "switcher-item"}
                key={profile.id}
                onClick={() => {
                  handleSetActiveView(profile.id);
                  setActiveSaleId(profile.sales[0]?.id ?? null);
                }}
              >
                <span className="profile-dot" style={{ background: profile.color }} />
                {profile.label}
              </button>
            ))}
            <button
              className={activeView === "clients" ? "switcher-item active" : "switcher-item"}
              onClick={() => handleSetActiveView("clients")}
            >
              <UserRound size={14} style={{ marginRight: 6 }} />
              {t.clients}
            </button>
            <button
              className={activeView === "watcher" ? "switcher-item active" : "switcher-item"}
              onClick={() => handleSetActiveView("watcher")}
            >
              <FolderSync size={14} style={{ marginRight: 6 }} />
              {language === "es" ? "Carpeta Watcher" : "Watcher Folder"}
            </button>
            <button
              className={activeView === "gallery" ? "switcher-item active" : "switcher-item"}
              onClick={() => handleSetActiveView("gallery")}
            >
              <Image size={14} style={{ marginRight: 6 }} />
              {language === "es" ? "Galería Vendidas" : "Sold Gallery"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {cacheTime && (
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", whiteSpace: "nowrap" }} title={language === "es" ? "Última actualización de datos" : "Last data update"}>
                {language === "es" ? "Actualizado:" : "Updated:"} {cacheTime}
              </span>
            )}
            <button className="icon-button" onClick={() => void loadSummary(true)} title={t.refresh}>
              <RefreshCw size={18} />
            </button>
            <button className="icon-button" onClick={() => setSettingsOpen(true)} title={t.settings}>
              <Settings size={18} />
            </button>
          </div>
          {activeView !== "clients" && activeView !== "gallery" && (
            <button className="text-button" onClick={() => setExportOpen(true)} title={t.exportView}>
              <Download size={16} />
              {t.export}
            </button>
          )}
        </div>
      </header>

      <section className="dashboard-grid">
        <aside className="sidebar">
          <div className="profile-card">
            <div className="avatar">
              {isClientsView ? "CLT" : isWatcherView ? "WCH" : isGalleryView ? "GAL" : showConsolidated ? "ALL" : initials(activeProfile?.profile.name ?? "")}
            </div>
            <h2>{isClientsView ? t.clients : isWatcherView ? (language === "es" ? "Watcher Local" : "Local Watcher") : isGalleryView ? (language === "es" ? "Galería" : "Gallery") : showConsolidated ? t.consolidated : activeProfile?.profile.name}</h2>
            <p>
              {isClientsView
                ? `${clients.length} ${t.buyersCount}`
                : isWatcherView
                  ? (language === "es" ? "Sincronizador automático" : "Automatic synchronizer")
                  : isGalleryView
                    ? t.salesAndPaid
                    : showConsolidated
                      ? `${dashboard.profiles.length} ${t.profilesConnected}`
                      : activeProfile?.profile.studio}
            </p>
          </div>
          <nav className="side-nav" aria-label="Dashboard sections">
            <div className="nav-item">
              <CircleDollarSign size={18} />
              <div>
                <strong>{isWatcherView ? (language === "es" ? "Cargas" : "Uploads") : t.revenue}</strong>
                <span>{isWatcherView ? t.activeHistory : money.format(totals?.revenue ?? 0)}</span>
              </div>
            </div>
            <div className="nav-item">
              <Images size={18} />
              <div>
                <strong>{language === "es" ? "Álbumes" : "Albums"}</strong>
                <span>{totals?.albums ?? 0} {language === "es" ? "publicados" : "published"}</span>
              </div>
            </div>
            <div className="nav-item">
              <UserRound size={18} />
              <div>
                <strong>{isWatcherView ? (language === "es" ? "Servicio" : "Service") : t.profile}</strong>
                <span>
                  {isClientsView
                    ? t.baseOfClients
                    : isWatcherView
                      ? t.watcherDaemon
                      : isGalleryView
                        ? t.photoArchive
                        : showConsolidated
                          ? t.allPhotographers
                          : activeProfile?.profile.email}
                </span>
              </div>
            </div>
            <div className="nav-item">
              <Tags size={18} />
              <div>
                <strong>Fidelity code</strong>
                <span>{isClientsView || isWatcherView || isGalleryView ? t.localStorage : fidelityLabel}</span>
              </div>
            </div>
          </nav>
          <p className="timestamp">
            <Sparkles size={16} />
            {dashboard.source === "live" ? t.realData : t.demoMode} - {formatDate(dashboard.updatedAt, language)}
          </p>
        </aside>

        <div className="main-grid">
          {warnings ? (
            <div className="warning">
              <Activity size={18} />
              {warnings}
            </div>
          ) : null}

          {isGalleryView ? (
            <GalleryDashboard profiles={dashboard.profiles} language={language} />
          ) : isClientsView ? (
            <ClientsDashboard
              clients={clients}
              clientsLocalData={clientsLocalData}
              language={language}
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
          ) : activeView === "watcher" ? (
            <WatcherDashboard profiles={dashboard.profiles} language={language} />
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
              allProfiles={dashboard.profiles}
              language={language}
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
              language={language}
            />
          ) : null}
        </div>
      </section>
      <footer className="app-footer">
        <span>Lumepic Sales Dashboard v{APP_VERSION}</span>
        <a href="https://instagram.com/soyphotographer" target="_blank" rel="noreferrer">
          Created by @soyphotographer
        </a>
      </footer>
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
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        autoPullEnabled={autoPullEnabled}
        setAutoPullEnabled={handleToggleAutoPull}
        autoPullInterval={autoPullInterval}
        setAutoPullInterval={handleSetAutoPullInterval}
        notificationsEnabled={notificationsEnabled}
        setNotificationsEnabled={handleToggleNotifications}
        profiles={dashboard?.profiles || []}
        customProfileLabels={customProfileLabels}
        setCustomProfileLabel={handleSetCustomProfileLabel}
        language={language}
        setLanguage={handleSetLanguage}
      />
    </main>
  );
}
