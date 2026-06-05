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
  Coins,
  Clock,
  Copy,
  CreditCard,
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
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  Edit3
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
import { useEffect, useMemo, useState, useCallback, useRef, Fragment } from "react";
import type { AlbumInsight, ConsolidatedPoint, ConsolidatedSummary, DashboardPayload, DashboardSummary, FidelityCode, Sale, SalesPoint, SalePhotograph, CustomEvent, CustomSubEvent } from "@/lib/lumepic-types";
import packageJson from "../../package.json";

const APP_VERSION = packageJson.version;

type ExportColumn = {
  key: string;
  label: string;
  getValue: (profile: DashboardSummary, sale: Sale) => string | number | boolean;
};

// IndexedDB helper to save/retrieve directory handle
const DB_NAME = "lumepic-dashboard-db";
const STORE_NAME = "handles";
const KEY_DIR = "local-photos-dir";

function getLocalDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const getReq = store.get(KEY_DIR);
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };
    request.onerror = () => resolve(null);
  });
}

function setLocalDirectoryHandle(handle: FileSystemDirectoryHandle | null): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      resolve(false);
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const putReq = handle ? store.put(handle, KEY_DIR) : store.delete(KEY_DIR);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    };
    request.onerror = () => resolve(false);
  });
}

function getLocalDirectoryHandleForEvent(eventId: string): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const key = `event-dir-${eventId}`;
        const getReq = store.get(key);
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };
    request.onerror = () => resolve(null);
  });
}

function setLocalDirectoryHandleForEvent(eventId: string, handle: FileSystemDirectoryHandle | null): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      resolve(false);
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const key = `event-dir-${eventId}`;
        const putReq = handle ? store.put(handle, key) : store.delete(key);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    };
    request.onerror = () => resolve(false);
  });
}

function getLocalDirectoryHandleForSubEvent(eventId: string, subEventId: string): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const key = `subevent-dir-${eventId}-${subEventId}`;
        const getReq = store.get(key);
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };
    request.onerror = () => resolve(null);
  });
}

function setLocalDirectoryHandleForSubEvent(eventId: string, subEventId: string, handle: FileSystemDirectoryHandle | null): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      resolve(false);
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      const db = request.result;
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const key = `subevent-dir-${eventId}-${subEventId}`;
        const putReq = handle ? store.put(handle, key) : store.delete(key);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    };
    request.onerror = () => resolve(false);
  });
}

async function verifyDirectoryPermission(handle: FileSystemDirectoryHandle, request = false): Promise<boolean> {
  const opts = { mode: "read" as const };
  try {
    if ((await (handle as any).queryPermission(opts)) === "granted") {
      return true;
    }
    if (request) {
      if ((await (handle as any).requestPermission(opts)) === "granted") {
        return true;
      }
    }
  } catch (e) {
    console.error("Error verifying directory permission:", e);
  }
  return false;
}

async function findLocalPhotoHandle(dirHandle: FileSystemDirectoryHandle, filename: string): Promise<FileSystemFileHandle | null> {
  const targetName = filename.toLowerCase().trim();
  if (!targetName) return null;
  
  const queue: FileSystemDirectoryHandle[] = [dirHandle];
  while (queue.length > 0) {
    const currentDir = queue.shift()!;
    try {
      for await (const entry of (currentDir as any).values()) {
        if (entry.kind === "file") {
          if (entry.name.toLowerCase().trim() === targetName) {
            return entry;
          }
        } else if (entry.kind === "directory") {
          queue.push(entry);
        }
      }
    } catch (e) {
      console.error("Error reading directory entry:", e);
    }
  }
  return null;
}

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
    totalGross: "Total Gross",
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
    grossNote: "Gross earnings before Lumepic commission (net of Stripe fee)",
    beforeDiscounts: "Before discounts",
    promosAndComps: "Promos & comps",
    commProcessing: "Lumepic platform commission",
    netRevenueHelp: "Net earnings after commissions and processing fees have been deducted",
    grossRevenueHelp: "Gross earnings minus Stripe processing fees (before Lumepic commissions)",
    
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
    totalGross: "Ingresos Brutos (Gross)",
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
    grossNote: "Venta bruta antes de comisión de Lumepic (neto de Stripe)",
    beforeDiscounts: "Antes de descuentos",
    promosAndComps: "Promos y bonificaciones",
    commProcessing: "Comisión de plataforma de Lumepic",
    netRevenueHelp: "Ganancias netas tras deducir comisiones y tasas de procesamiento",
    grossRevenueHelp: "Ingresos brutos menos comisiones de Stripe (antes de la comisión de Lumepic)",
    
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
  if (!date) return "";
  try {
    const isSimpleDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
    const parsedDate = isSimpleDate ? new Date(`${date}T12:00:00Z`) : new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short"
    };
    if (isSimpleDate || date.endsWith("Z")) {
      options.timeZone = "UTC";
    }
    return new Intl.DateTimeFormat(lang === "es" ? "es-AR" : "en-US", options).format(parsedDate);
  } catch (_) {
    return date;
  }
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
              className="instant-tooltip"
              data-tooltip={tooltip}
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

const DEFAULT_KPI_ORDER = [
  "revenue",
  "gross",
  "subtotal",
  "discounts",
  "fees",
  "stripeFee",
  "sales",
  "avgOrder",
  "albums",
  "photos",
  "conversion"
];

const DEFAULT_KPI_VISIBILITY: Record<string, boolean> = {
  revenue: true,
  gross: true,
  subtotal: true,
  discounts: true,
  fees: true,
  stripeFee: true,
  sales: true,
  avgOrder: true,
  albums: true,
  photos: true,
  conversion: true
};

function KpiGrid({ totals, language = "en" }: { totals: DashboardSummary["totals"]; language?: Language }) {
  const t = TRANSLATIONS[language];
  const [showSettings, setShowSettings] = useState(false);

  const [kpiOrder, setKpiOrder] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lumepic_kpi_order");
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return DEFAULT_KPI_ORDER;
  });

  const [kpiVisibility, setKpiVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lumepic_kpi_visibility");
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return DEFAULT_KPI_VISIBILITY;
  });

  const getKpiLabel = (id: string, lang: Language) => {
    const t = TRANSLATIONS[lang];
    switch (id) {
      case "revenue": return t.totalRevenue;
      case "gross": return t.totalGross;
      case "subtotal": return t.subtotal;
      case "discounts": return t.discounts;
      case "fees": return t.serviceFee;
      case "stripeFee": return lang === "es" ? "Comisión de Stripe" : "Stripe Fee";
      case "sales": return lang === "es" ? "Ventas reales" : "Real sales";
      case "avgOrder": return t.avgOrder;
      case "albums": return lang === "es" ? "Álbumes" : "Albums";
      case "photos": return t.photosSold;
      case "conversion": return t.ratio;
      default: return id;
    }
  };

  const toggleVisibility = (id: string) => {
    const nextVisibility = { ...kpiVisibility, [id]: kpiVisibility[id] === false ? true : false };
    setKpiVisibility(nextVisibility);
    localStorage.setItem("lumepic_kpi_visibility", JSON.stringify(nextVisibility));
  };

  const moveCard = (index: number, direction: number) => {
    const newOrder = [...kpiOrder];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setKpiOrder(newOrder);
      localStorage.setItem("lumepic_kpi_order", JSON.stringify(newOrder));
    }
  };

  const resetToDefault = () => {
    setKpiOrder(DEFAULT_KPI_ORDER);
    setKpiVisibility(DEFAULT_KPI_VISIBILITY);
    localStorage.setItem("lumepic_kpi_order", JSON.stringify(DEFAULT_KPI_ORDER));
    localStorage.setItem("lumepic_kpi_visibility", JSON.stringify(DEFAULT_KPI_VISIBILITY));
  };

  const formatSalesOrOrders = (val: number) => {
    if (typeof val !== "number") return String(val);
    return val % 1 === 0 ? String(val) : val.toFixed(1);
  };

  const renderCard = (id: string) => {
    switch (id) {
      case "revenue":
        return <Kpi key="revenue" label={t.totalRevenue} value={money.format(totals.revenue)} note={t.netFinal} icon={<BadgeDollarSign size={20} />} tooltip={t.netRevenueHelp} />;
      case "gross":
        return <Kpi key="gross" label={t.totalGross} value={money.format(totals.grossRevenue)} note={t.grossNote} icon={<CircleDollarSign size={20} />} tooltip={t.grossRevenueHelp} />;
      case "subtotal":
        return <Kpi key="subtotal" label={t.subtotal} value={money.format(totals.subtotal)} note={t.beforeDiscounts} icon={<Coins size={20} />} tooltip={language === "es" ? "Venta acumulada antes de aplicar descuentos y comisiones" : "Accumulated sales before applying discounts and commissions"} />;
      case "discounts":
        return <Kpi key="discounts" label={t.discounts} value={`-${money.format(totals.discounts)}`} note={t.promosAndComps} icon={<TrendingUp size={20} />} />;
      case "fees":
        return (
          <Kpi 
            key="fees"
            label={t.serviceFee} 
            value={`-${money.format(totals.fees)}`} 
            note={t.commProcessing} 
            icon={<Activity size={20} />} 
            tooltip={totals.stripeFee ? (
              language === "es"
                ? `Total comisiones: ${money.format(totals.fees + totals.stripeFee)} (Lumepic: ${money.format(totals.fees)}, Stripe: ${money.format(totals.stripeFee)})`
                : `Total service fee: ${money.format(totals.fees + totals.stripeFee)} (Lumepic: ${money.format(totals.fees)}, Stripe: ${money.format(totals.stripeFee)})`
            ) : undefined}
          />
        );
      case "stripeFee":
        return (
          <Kpi 
            key="stripeFee"
            label={language === "es" ? "Comisión de Stripe" : "Stripe Fee"} 
            value={`-${money.format(totals.stripeFee || 0)}`} 
            note={language === "es" ? "Tasa de procesamiento" : "Processing fee"} 
            icon={<CreditCard size={20} />} 
            tooltip={language === "es" ? "Total comisiones cobradas por Stripe por procesamiento de pagos" : "Total Stripe commissions charged for payment processing"} 
          />
        );
      case "sales":
        return <Kpi key="sales" label={language === "es" ? "Ventas reales" : "Real sales"} value={formatSalesOrOrders(totals.sales)} note={`${formatSalesOrOrders(totals.orders)} ${language === "es" ? "ordenes aprobadas" : "approved orders"}`} icon={<ShoppingBag size={20} />} />;
      case "avgOrder":
        return <Kpi key="avgOrder" label={t.avgOrder} value={money.format(totals.avgOrder)} note={language === "es" ? "Bruto por venta real" : "Gross per real sale"} icon={<TrendingUp size={20} />} />;
      case "albums":
        return <Kpi key="albums" label={language === "es" ? "Álbumes" : "Albums"} value={String(totals.albums)} note={language === "es" ? "Publicados" : "Published"} icon={<Album size={20} />} />;
      case "photos":
        return (
          <Kpi 
            key="photos"
            label={t.photosSold} 
            value={compact.format(totals.photos)} 
            note={totals.publishedPhotos > 0 
              ? `${compact.format(totals.publishedPhotos)} ${language === "es" ? "publicadas" : "published"}`
              : (language === "es" ? "Sin datos de publicación" : "No publication data")
            } 
            icon={<Images size={20} />} 
          />
        );
      case "conversion":
        return (
          <Kpi 
            key="conversion"
            label={t.ratio} 
            value={totals.publishedPhotos > 0 ? `${totals.conversion.toFixed(2)}%` : "-"} 
            note={language === "es" ? "Fotos vendidas/publicadas" : "Photos sold/published"} 
            icon={<Eye size={20} />} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "12px", marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="btn-secondary"
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "6px", 
            fontSize: "0.8rem", 
            padding: "8px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            background: "var(--paper)",
            border: "1px solid var(--line)"
          }}
        >
          <Settings size={14} />
          {language === "es" ? "Personalizar tarjetas" : "Customize cards"}
        </button>
      </div>

      {showSettings && (
        <div style={{
          background: "var(--paper)",
          border: "1px solid var(--line)",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }}>
          <div>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: "700", color: "var(--ink)" }}>
              {language === "es" ? "Configurar orden y visibilidad de tarjetas" : "Configure card order & visibility"}
            </h3>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>
              {language === "es" 
                ? "Ordena las tarjetas con las flechas y marca cuáles quieres ver en tu panel principal." 
                : "Order cards using the arrows and check which ones you want to display on your dashboard."}
            </p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
            {kpiOrder.map((id, index) => {
              const label = getKpiLabel(id, language);
              const isVisible = kpiVisibility[id] !== false;
              return (
                <div key={id} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  background: "var(--paper-2)", 
                  padding: "10px 14px", 
                  borderRadius: "10px",
                  border: "1px solid var(--line)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", userSelect: "none" }}>
                    <input 
                      type="checkbox" 
                      checked={isVisible}
                      onChange={() => toggleVisibility(id)}
                      id={`chk-${id}`}
                      style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "var(--accent, #6366f1)" }}
                    />
                    <label htmlFor={`chk-${id}`} style={{ fontSize: "0.85rem", cursor: "pointer", fontWeight: "600", color: "var(--ink)" }}>
                      {label}
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button 
                      onClick={() => moveCard(index, -1)}
                      disabled={index === 0}
                      title={language === "es" ? "Subir" : "Move Up"}
                      style={{ 
                        padding: "4px 8px", 
                        fontSize: "0.8rem", 
                        borderRadius: "6px", 
                        background: "var(--paper)", 
                        border: "1px solid var(--line)", 
                        cursor: index === 0 ? "not-allowed" : "pointer",
                        opacity: index === 0 ? 0.4 : 1
                      }}
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => moveCard(index, 1)}
                      disabled={index === kpiOrder.length - 1}
                      title={language === "es" ? "Bajar" : "Move Down"}
                      style={{ 
                        padding: "4px 8px", 
                        fontSize: "0.8rem", 
                        borderRadius: "6px", 
                        background: "var(--paper)", 
                        border: "1px solid var(--line)", 
                        cursor: index === kpiOrder.length - 1 ? "not-allowed" : "pointer",
                        opacity: index === kpiOrder.length - 1 ? 0.4 : 1
                      }}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--line)", paddingTop: "14px", marginTop: "4px" }}>
            <button 
              onClick={resetToDefault}
              className="btn-secondary"
              style={{ fontSize: "0.8rem", padding: "6px 12px", borderRadius: "6px", background: "transparent", border: "none" }}
            >
              {language === "es" ? "Restablecer" : "Reset defaults"}
            </button>
            <button 
              onClick={() => setShowSettings(false)}
              className="btn-primary"
              style={{ fontSize: "0.8rem", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}
            >
              {language === "es" ? "Aplicar cambios" : "Apply changes"}
            </button>
          </div>
        </div>
      )}

      <section className="kpi-grid" aria-label="Metricas principales">
        {kpiOrder.map(id => {
          const isVisible = kpiVisibility[id] !== false;
          return isVisible ? renderCard(id) : null;
        })}
      </section>
    </div>
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

function DetailPhotoStrip({
  sale,
  profileId,
  profileName,
  profileColor,
  onOpenLightbox
}: {
  sale?: Sale;
  profileId?: string;
  profileName?: string;
  profileColor?: string;
  onOpenLightbox?: (photo: GalleryPhotoItem, list?: GalleryPhotoItem[]) => void;
}) {
  if (!sale?.photographs.length) return null;

  const salePhotos: GalleryPhotoItem[] = sale.photographs.map((photo) => ({
    id: photo.id,
    thumbnailUrl: photo.thumbnailUrl,
    url: photo.url,
    originalFileName: photo.originalFileName || photo.id || "Photograph",
    albumId: photo.albumId,
    sale,
    profileId: profileId || "",
    profileName: profileName || "",
    profileColor: profileColor || "",
    takenDate: photo.takenDate
  }));

  return (
    <div className="detail-photo-strip">
      {salePhotos.map((photoItem) => (
        <span
          className="thumb-wrap large"
          key={photoItem.id}
          onClick={() => {
            if (onOpenLightbox) {
              onOpenLightbox(photoItem, salePhotos);
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <img alt={photoItem.originalFileName || "Fotografia vendida"} className="detail-thumb" src={photoItem.thumbnailUrl || photoItem.url} />
          <span className="thumb-preview">
            <img alt={photoItem.originalFileName || "Fotografia vendida"} src={photoItem.url || photoItem.thumbnailUrl} />
            <span>{photoItem.originalFileName || photoItem.id}</span>
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
  language = "en",
  customEvents = []
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
  customEvents?: CustomEvent[];
}) {
  const [metric, setMetric] = useState<"revenue" | "photos">("revenue");
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>("all");
  const t = TRANSLATIONS[language];

  const allAlbumTitles = useMemo(() => {
    const titles = new Set<string>();
    allProfiles.forEach(profile => {
      profile.albums.forEach(album => {
        if (album.title) {
          titles.add(album.title);
        }
      });
    });
    return Array.from(titles).sort();
  }, [allProfiles]);

  const albumMap = useMemo(() => {
    const map: Record<string, AlbumInsight> = {};
    allProfiles.forEach((profile) => {
      profile.albums.forEach((album) => {
        map[album.id] = album;
      });
    });
    return map;
  }, [allProfiles]);

  const filteredChartData = useMemo(() => {
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

    if (selectedEventFilter === "all") {
      return trendData;
    }

    let targetCustomEvent: CustomEvent | null = null;
    let targetAlbumTitle: string | null = null;

    if (selectedEventFilter.startsWith("custom:")) {
      const id = selectedEventFilter.replace("custom:", "");
      targetCustomEvent = customEvents.find(e => e.id === id) || null;
    } else if (selectedEventFilter.startsWith("album:")) {
      targetAlbumTitle = selectedEventFilter.replace("album:", "");
    }

    const hasSubEvents = targetCustomEvent && targetCustomEvent.subEvents && targetCustomEvent.subEvents.length > 0;

    const groups: Record<string, {
      date: Date;
      label: string;
      totalRevenue: number;
      totalPhotos: number;
      totalSales: number;
      [lineId: string]: any;
    }> = {};

    allProfiles.forEach((profile) => {
      profile.sales.forEach((sale) => {
        if (sale.isComped) return;

        const saleDate = new Date(sale.date);
        if (isNaN(saleDate.getTime())) return;
        if (!matchesFilter(saleDate)) return;

        let isMatch = false;
        if (targetCustomEvent) {
          const matchesPhotoAlbum = sale.photographs?.some(p => targetCustomEvent!.albumIds.includes(p.albumId));
          const matchesAlbumTitle = targetCustomEvent.albumIds.some(aid => {
            const alb = albumMap[aid];
            return alb && isAlbumMatch(sale.album, alb.title);
          });
          isMatch = matchesPhotoAlbum || matchesAlbumTitle;
        } else if (targetAlbumTitle) {
          isMatch = isAlbumMatch(sale.album, targetAlbumTitle);
        }

        if (!isMatch) return;

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
          
          if (hasSubEvents) {
            targetCustomEvent!.subEvents.forEach(sub => {
              groups[key][`${sub.id}_revenue`] = 0;
              groups[key][`${sub.id}_photos`] = 0;
            });
            groups[key][`unclassified_revenue`] = 0;
            groups[key][`unclassified_photos`] = 0;
          } else {
            allProfiles.forEach(p => {
              groups[key][`${p.id}_revenue`] = 0;
              groups[key][`${p.id}_photos`] = 0;
            });
          }
        }

        groups[key].totalRevenue += sale.total;
        groups[key].totalPhotos += (sale.photos || 0);
        groups[key].totalSales += 1;

        if (hasSubEvents) {
          const photos = sale.photographs || [];
          if (photos.length > 0) {
            const allocations: Record<string, number> = {};
            let unclassifiedCount = 0;

            photos.forEach(p => {
              const photoDate = getPhotoDate(p, sale, albumMap);
              const matchedSub = targetCustomEvent!.subEvents.find(s => s.date === photoDate);
              if (matchedSub) {
                allocations[matchedSub.id] = (allocations[matchedSub.id] || 0) + 1;
              } else {
                unclassifiedCount += 1;
              }
            });

            const totalPhotos = photos.length;
            Object.entries(allocations).forEach(([subId, count]) => {
              const ratio = count / totalPhotos;
              groups[key][`${subId}_revenue`] = (groups[key][`${subId}_revenue`] || 0) + (sale.total * ratio);
              groups[key][`${subId}_photos`] = (groups[key][`${subId}_photos`] || 0) + ((sale.photos || 0) * ratio);
            });

            if (unclassifiedCount > 0) {
              const ratio = unclassifiedCount / totalPhotos;
              groups[key][`unclassified_revenue`] = (groups[key][`unclassified_revenue`] || 0) + (sale.total * ratio);
              groups[key][`unclassified_photos`] = (groups[key][`unclassified_photos`] || 0) + ((sale.photos || 0) * ratio);
            }
          } else {
            groups[key][`unclassified_revenue`] = (groups[key][`unclassified_revenue`] || 0) + sale.total;
            groups[key][`unclassified_photos`] = (groups[key][`unclassified_photos`] || 0) + (sale.photos || 0);
          }
        } else {
          groups[key][`${profile.id}_revenue`] = (groups[key][`${profile.id}_revenue`] || 0) + sale.total;
          groups[key][`${profile.id}_photos`] = (groups[key][`${profile.id}_photos`] || 0) + (sale.photos || 0);
        }
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

      if (hasSubEvents) {
        targetCustomEvent!.subEvents.forEach(sub => {
          point[`${sub.id}_revenue`] = Number((g[`${sub.id}_revenue`] || 0).toFixed(2));
          point[`${sub.id}_photos`] = Math.round(g[`${sub.id}_photos`] || 0);
        });
        point[`unclassified_revenue`] = Number((g[`unclassified_revenue`] || 0).toFixed(2));
        point[`unclassified_photos`] = Math.round(g[`unclassified_photos`] || 0);
      } else {
        allProfiles.forEach((p) => {
          point[`${p.id}_revenue`] = Number((g[`${p.id}_revenue`] || 0).toFixed(2));
          point[`${p.id}_photos`] = Math.round(g[`${p.id}_photos`] || 0);
        });
      }

      return point;
    });
  }, [trendData, selectedEventFilter, customEvents, allProfiles, filterType, selectedYear, customStart, customEnd, albumMap]);

  const chartLines = useMemo(() => {
    let targetCustomEvent: CustomEvent | null = null;
    if (selectedEventFilter.startsWith("custom:")) {
      const id = selectedEventFilter.replace("custom:", "");
      targetCustomEvent = customEvents.find(e => e.id === id) || null;
    }

    const hasSubEvents = targetCustomEvent && targetCustomEvent.subEvents && targetCustomEvent.subEvents.length > 0;

    if (hasSubEvents) {
      const colors = ["var(--accent, #6366f1)", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
      const lines: { dataKey: string; name: string; color: string; strokeWidth: number }[] = [];

      targetCustomEvent!.subEvents.forEach((sub, idx) => {
        lines.push({
          dataKey: metric === "revenue" ? `${sub.id}_revenue` : `${sub.id}_photos`,
          name: sub.name,
          color: colors[idx % colors.length],
          strokeWidth: 4
        });
      });

      const hasUnclassified = filteredChartData.some(pt => {
        const val = metric === "revenue" ? pt.unclassified_revenue : pt.unclassified_photos;
        return val && val > 0;
      });

      if (hasUnclassified) {
        lines.push({
          dataKey: metric === "revenue" ? "unclassified_revenue" : "unclassified_photos",
          name: language === "es" ? "Otros" : "Others",
          color: "#9ca3af",
          strokeWidth: 2
        });
      }

      lines.push({
        dataKey: metric === "revenue" ? "totalRevenue" : "totalPhotos",
        name: "Total",
        color: "var(--ink, #000000)",
        strokeWidth: 2
      });

      return lines;
    } else {
      const lines: { dataKey: string; name: string; color: string; strokeWidth: number }[] = [];
      consolidated.profiles.forEach((profile) => {
        lines.push({
          dataKey: metric === "revenue" ? `${profile.id}_revenue` : `${profile.id}_photos`,
          name: profile.label,
          color: profile.color,
          strokeWidth: 4
        });
      });

      lines.push({
        dataKey: metric === "revenue" ? "totalRevenue" : "totalPhotos",
        name: "Total",
        color: "var(--ink, #000000)",
        strokeWidth: 2
      });

      return lines;
    }
  }, [selectedEventFilter, customEvents, consolidated.profiles, metric, language, filteredChartData]);

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
              <div className="filter-select-wrap">
                <Calendar size={14} className="select-icon" />
                <select
                  value={selectedEventFilter}
                  onChange={(e) => setSelectedEventFilter(e.target.value)}
                  aria-label={language === "es" ? "Filtrar por evento o álbum" : "Filter by event or album"}
                >
                  <option value="all">{language === "es" ? "Todos los eventos" : "All Events"}</option>
                  
                  {customEvents.length > 0 && (
                    <optgroup label={language === "es" ? "Eventos Agrupados" : "Grouped Events"}>
                      {customEvents.map(evt => (
                        <option key={`custom:${evt.id}`} value={`custom:${evt.id}`}>{evt.name}</option>
                      ))}
                    </optgroup>
                  )}
                  
                  {allAlbumTitles.length > 0 && (
                    <optgroup label={language === "es" ? "Álbumes" : "Albums"}>
                      {allAlbumTitles.map(title => (
                        <option key={`album:${title}`} value={`album:${title}`}>{title}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

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
          {filteredChartData.length === 0 ? (
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--muted)", fontSize: "0.9rem" }}>
              {language === "es" ? "Sin ventas en el rango seleccionado" : "No sales in selected range"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredChartData}>
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
                {chartLines.map((line) => (
                  <Line
                    dataKey={line.dataKey}
                    dot={false}
                    key={line.dataKey}
                    name={line.name}
                    stroke={line.color}
                    strokeWidth={line.strokeWidth}
                    type="monotone"
                  />
                ))}
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
  language = "en",
  onOpenLightbox
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
  onOpenLightbox?: (photo: GalleryPhotoItem, list?: GalleryPhotoItem[]) => void;
}) {
  const [metric, setMetric] = useState<"revenue" | "photos">("revenue");
  const [selectedAlbum, setSelectedAlbum] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    setSelectedAlbum("all");
    setCurrentPage(1);
  }, [summary.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAlbum]);

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

  const totalPages = Math.ceil(filteredSales.length / pageSize);
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSales.slice(startIndex, startIndex + pageSize);
  }, [filteredSales, currentPage, pageSize]);

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
                      <span className="instant-tooltip" data-tooltip={t.grossRevenueHelp} style={{ cursor: "help", color: "var(--muted)", opacity: 0.8, display: "inline-flex", alignItems: "center" }}>
                        <HelpCircle size={12} />
                      </span>
                    </span>
                    <strong>{money.format(album.revenue)}</strong>
                  </div>
                  <div>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {t.tableNet}
                      <span className="instant-tooltip" data-tooltip={t.netRevenueHelp} style={{ cursor: "help", color: "var(--muted)", opacity: 0.8, display: "inline-flex", alignItems: "center" }}>
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
                {paginatedSales.map((sale) => (
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

          {/* Pagination Controls */}
          {filteredSales.length > 0 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0 0 0",
              borderTop: "1px solid var(--line)",
              marginTop: "16px",
              flexWrap: "wrap",
              gap: "12px"
            }}>
              {/* Rows per page selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--muted)" }}>
                <span>{language === "es" ? "Filas por página:" : "Rows per page:"}</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    height: "30px",
                    padding: "0 8px",
                    border: "1px solid var(--line)",
                    borderRadius: "6px",
                    background: "var(--white)",
                    color: "var(--ink)",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page navigation */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--muted)", fontWeight: "500" }}>
                  {language === "es" 
                    ? `Mostrando ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredSales.length)} de ${filteredSales.length}`
                    : `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filteredSales.length)} of ${filteredSales.length}`}
                </span>
                
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    className="icon-button"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    style={{
                      width: "32px",
                      height: "32px",
                      minHeight: "32px",
                      borderRadius: "6px",
                      border: "1px solid var(--line)",
                      background: "var(--white)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      opacity: currentPage === 1 ? 0.4 : 1,
                      padding: 0
                    }}
                    title={language === "es" ? "Página anterior" : "Previous page"}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNum = index + 1;
                    if (totalPages > 5 && pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - currentPage) > 1) {
                      if (pageNum === 2 && currentPage > 3) {
                        return <span key="ellipsis-start" style={{ display: "inline-flex", alignItems: "center", padding: "0 4px", color: "var(--muted)", fontSize: "0.82rem" }}>...</span>;
                      }
                      if (pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                        return <span key="ellipsis-end" style={{ display: "inline-flex", alignItems: "center", padding: "0 4px", color: "var(--muted)", fontSize: "0.82rem" }}>...</span>;
                      }
                      return null;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          width: "32px",
                          height: "32px",
                          minHeight: "32px",
                          borderRadius: "6px",
                          border: currentPage === pageNum ? "1px solid var(--ink)" : "1px solid var(--line)",
                          background: currentPage === pageNum ? "var(--ink)" : "var(--white)",
                          color: currentPage === pageNum ? "var(--white)" : "var(--ink)",
                          fontSize: "0.82rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    className="icon-button"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    style={{
                      width: "32px",
                      height: "32px",
                      minHeight: "32px",
                      borderRadius: "6px",
                      border: "1px solid var(--line)",
                      background: "var(--white)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      opacity: currentPage === totalPages ? 0.4 : 1,
                      padding: 0
                    }}
                    title={language === "es" ? "Página siguiente" : "Next page"}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </article>

        <aside className="sale-detail">
          <div className="detail-plate">
            <strong>{selectedSale ? money.format(selectedSale.total) : "$0"}</strong>
          </div>
          <DetailPhotoStrip 
            sale={selectedSale}
            profileId={summary.id}
            profileName={summary.label}
            profileColor={summary.color}
            onOpenLightbox={onOpenLightbox}
          />
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
            {selectedSale && selectedSale.stripeFee !== undefined && selectedSale.stripeFee > 0 && (
              <>
                <div style={{ paddingLeft: "16px", fontSize: "0.8rem", color: "var(--muted)", borderBottom: "none", paddingTop: "4px", paddingBottom: "4px" }}>
                  <span>{language === "es" ? "└ Comisión de Stripe" : "└ Stripe Fee"}</span>
                  <strong>{`-${money.format(selectedSale.stripeFee)}`}</strong>
                </div>
                <div style={{ paddingLeft: "16px", fontSize: "0.8rem", color: "var(--muted)", borderBottom: "none", paddingTop: "4px", paddingBottom: "4px" }}>
                  <span>{language === "es" ? "└ Comisión de Lumepic" : "└ Lumepic Fee"}</span>
                  <strong>{`-${money.format(Math.max(selectedSale.fees - selectedSale.stripeFee, 0))}`}</strong>
                </div>
              </>
            )}
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

  const loadStatus = async (statusOnly: boolean = false) => {
    try {
      const res = await fetch(`/api/lumepic/watcher${statusOnly ? "?statusOnly=true" : ""}`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setHistory(data.history || []);
        
        if (!statusOnly || (data.albums && data.albums.length > 0)) {
          setAlbums(data.albums || []);
        }
        if (!statusOnly || (data.allAlbums && data.allAlbums.length > 0)) {
          if (data.allAlbums) setAllAlbums(data.allAlbums);
        }
        if (!statusOnly || (data.events && data.events.length > 0)) {
          setEvents(data.events || []);
        }
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
    void loadStatus(false);
    // Poll every 3 seconds to show progress in real-time
    const timer = setInterval(() => {
      void loadStatus(true);
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
  takenDate?: string;
}

interface GalleryPhotoCardProps {
  item: GalleryPhotoItem;
  customEvents: CustomEvent[];
  globalDirHandle: FileSystemDirectoryHandle | null;
  albumMap: Record<string, AlbumInsight>;
  language: Language;
  onOpenLightbox: () => void;
  copiedId: string | null;
  handleCopyFileName: (fileName: string, photoId: string, e: React.MouseEvent) => void;
  profilesLength: number;
  resolvedLocalUrls: Record<string, string>;
  setResolvedLocalUrls: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setVisiblePhotoKeys: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

function GalleryPhotoCard({
  item,
  customEvents,
  globalDirHandle,
  albumMap,
  language,
  onOpenLightbox,
  copiedId,
  handleCopyFileName,
  profilesLength,
  resolvedLocalUrls,
  setResolvedLocalUrls,
  setVisiblePhotoKeys
}: GalleryPhotoCardProps) {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [localSearchStatus, setLocalSearchStatus] = useState<"idle" | "searching" | "found" | "not_found" | "permission_denied">("idle");
  const [highResLoaded, setHighResLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Reset highResLoaded when localUrl changes
  useEffect(() => {
    setHighResLoaded(false);
  }, [localUrl]);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const cacheKey = `${item.id}_${item.sale.id}`;
  const cachedUrl = resolvedLocalUrls[cacheKey];

  // Intersection observer to track visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { rootMargin: "300px" } // Preload when 300px close to viewport
    );

    const currentCard = cardRef.current;
    if (currentCard) {
      observer.observe(currentCard);
    }

    return () => {
      if (currentCard) {
        observer.unobserve(currentCard);
      }
    };
  }, []);

  // Track visibility in the parent component
  useEffect(() => {
    if (isVisible) {
      setVisiblePhotoKeys(prev => {
        if (prev[cacheKey]) return prev;
        return { ...prev, [cacheKey]: true };
      });
    } else {
      setVisiblePhotoKeys(prev => {
        if (!prev[cacheKey]) return prev;
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });
    }

    return () => {
      setVisiblePhotoKeys(prev => {
        if (!prev[cacheKey]) return prev;
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });
    };
  }, [isVisible, cacheKey, setVisiblePhotoKeys]);

  // Fetch local file and manage Object URL memory
  useEffect(() => {
    let active = true;

    async function loadLocalFile() {
      if (!isVisible) {
        setLocalUrl(null);
        setLocalSearchStatus("idle");
        return;
      }

      if (cachedUrl) {
        setLocalUrl(cachedUrl);
        setLocalSearchStatus("found");
        return;
      }

      setLocalSearchStatus("searching");

      try {
        // 1. Resolve directory handle
        let dirHandle = null;
        const matchedEvent = customEvents.find(e => e.albumIds.includes(item.albumId));
        const photoDate = getPhotoDate(item, item.sale, albumMap);
        let matchedSubEvent = null;

        if (matchedEvent) {
          matchedSubEvent = matchedEvent.subEvents.find(s => s.date === photoDate);
          if (matchedSubEvent && matchedSubEvent.localDirName) {
            dirHandle = await getLocalDirectoryHandleForSubEvent(matchedEvent.id, matchedSubEvent.id);
          }
          if (!dirHandle && matchedEvent.localDirName) {
            dirHandle = await getLocalDirectoryHandleForEvent(matchedEvent.id);
          }
        }
        if (!dirHandle) {
          dirHandle = globalDirHandle;
        }

        if (!dirHandle || !active) {
          setLocalSearchStatus("not_found");
          return;
        }

        // Verify directory permission without prompting
        const hasPermission = await verifyDirectoryPermission(dirHandle, false);
        if (!hasPermission || !active) {
          setLocalSearchStatus("permission_denied");
          return;
        }

        const fileName = item.originalFileName;
        if (!fileName) {
          setLocalSearchStatus("not_found");
          return;
        }

        const fileHandle = await findLocalPhotoHandle(dirHandle, fileName);
        if (!fileHandle || !active) {
          setLocalSearchStatus("not_found");
          return;
        }

        const file = await fileHandle.getFile();
        if (!active) return;

        const url = URL.createObjectURL(file);
        setResolvedLocalUrls(prev => ({ ...prev, [cacheKey]: url }));
        setLocalUrl(url);
        setLocalSearchStatus("found");
      } catch (err) {
        console.error("Error preloading local photo:", err);
        if (active) {
          setLocalSearchStatus("not_found");
        }
      }
    }

    loadLocalFile();

    return () => {
      active = false;
    };
  }, [isVisible, customEvents, globalDirHandle, item, albumMap, cachedUrl, cacheKey, setResolvedLocalUrls]);

  const isComped = item.sale.isComped;
  const saleDate = new Date(item.sale.date);
  const hourStr = saleDate.toLocaleTimeString(language === "es" ? "es-AR" : "en-US", { hour: "2-digit", minute: "2-digit" });
  const dayStr = saleDate.toLocaleDateString(language === "es" ? "es-AR" : "en-US", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <article 
      className="photo-card" 
      ref={cardRef}
      onClick={onOpenLightbox}
    >
      <div className="photo-image-wrap">
        <img 
          src={localUrl || item.thumbnailUrl || item.url} 
          alt={item.originalFileName} 
          loading="lazy"
          style={{
            transition: "opacity 0.3s",
            opacity: (localUrl && highResLoaded) ? 1 : 0.85
          }}
          onLoad={() => {
            if (localUrl) {
              setHighResLoaded(true);
            }
          }}
        />
        {(localSearchStatus === "searching" || (localSearchStatus === "found" && !highResLoaded)) && (
          <span 
            className="buyer-badge" 
            style={{ 
              position: "absolute", 
              top: "8px", 
              left: "8px", 
              background: "rgba(0, 0, 0, 0.6)", 
              color: "white", 
              fontSize: "0.65rem", 
              padding: "4px 8px", 
              borderRadius: "4px", 
              fontWeight: "bold",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span style={{
              width: "8px",
              height: "8px",
              border: "1px solid white",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              display: "inline-block"
            }} />
            {language === "es" ? "Buscando alta..." : "Searching HD..."}
          </span>
        )}
        {localSearchStatus === "found" && highResLoaded && (
          <span 
            className="buyer-badge" 
            style={{ 
              position: "absolute", 
              top: "8px", 
              left: "8px", 
              background: "var(--accent, #6366f1)", 
              color: "white", 
              fontSize: "0.65rem", 
              padding: "4px 8px", 
              borderRadius: "4px", 
              fontWeight: "bold" 
            }}
          >
            {language === "es" ? "LOCAL ALTA" : "LOCAL HD"}
          </span>
        )}
        {isComped && (
          <span className="buyer-badge is-comped">Lumepic</span>
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
          <div className="photo-meta-item" style={{ color: "var(--ink)", fontWeight: "600" }} title={language === "es" ? "Monto de la venta" : "Sale amount"}>
            <BadgeDollarSign size={12} style={{ color: "var(--muted)" }} />
            <span>
              {item.sale.isComped ? (language === "es" ? "Bonificado" : "Comped") : money.format(item.sale.total)}
            </span>
            {item.sale.photos > 1 && (
              <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: "normal", marginLeft: "4px" }}>
                {language === "es" ? `(Total de ${item.sale.photos} fotos)` : `(Total for ${item.sale.photos} photos)`}
              </span>
            )}
          </div>
          
          {!item.sale.isComped && (
            <div 
              className="photo-fee-breakdown" 
              onClick={(e) => e.stopPropagation()}
              style={{ 
                fontSize: "0.72rem", 
                color: "var(--muted)", 
                background: "var(--paper-2, rgba(0,0,0,0.02))", 
                padding: "8px 10px", 
                borderRadius: "8px", 
                marginTop: "6px",
                marginBottom: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                border: "1px dashed var(--line, rgba(0,0,0,0.05))"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{language === "es" ? "Bruto:" : "Gross:"}</span>
                <span style={{ fontWeight: "600", color: "var(--ink)" }}>{money.format(item.sale.grossTotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--red, #ef4444)", opacity: 0.9 }}>
                <span>{language === "es" ? "└ Comisión Stripe:" : "└ Stripe Fee:"}</span>
                <span>-{money.format(item.sale.stripeFee || 0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--red, #ef4444)", opacity: 0.9 }}>
                <span>{language === "es" ? "└ Comisión Lumepic:" : "└ Lumepic Fee:"}</span>
                <span>-{money.format(Math.max(item.sale.fees - (item.sale.stripeFee || 0), 0))}</span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                borderTop: "1px solid var(--line, rgba(0,0,0,0.08))", 
                paddingTop: "4px", 
                marginTop: "2px", 
                fontWeight: "700", 
                color: "var(--accent, #6366f1)" 
              }}>
                <span>{language === "es" ? "Neto Recibido:" : "Net Received:"}</span>
                <span>{money.format(item.sale.total)}</span>
              </div>
            </div>
          )}

          <div className="photo-meta-item album-info" title={item.sale.album}>
            <Album size={12} />
            <span>{item.sale.album}</span>
          </div>
          {profilesLength > 1 && (
            <div className="profile-indicator-row">
              <span className="profile-dot" style={{ background: item.profileColor }} />
              <span>{item.profileName}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function GalleryDashboard({
  profiles,
  language = "en",
  onOpenLightbox,
  customEvents = [],
  localDirHandle = null,
  localDirName = null,
  resolvedLocalUrls,
  setResolvedLocalUrls,
  visiblePhotoKeys,
  setVisiblePhotoKeys,
  activeLightboxPhoto
}: {
  profiles: DashboardSummary[];
  language?: Language;
  onOpenLightbox?: (photo: GalleryPhotoItem, list?: GalleryPhotoItem[]) => void;
  customEvents?: CustomEvent[];
  localDirHandle?: FileSystemDirectoryHandle | null;
  localDirName?: string | null;
  resolvedLocalUrls: Record<string, string>;
  setResolvedLocalUrls: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  visiblePhotoKeys: Record<string, boolean>;
  setVisiblePhotoKeys: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeLightboxPhoto: GalleryPhotoItem | null;
}) {
  const t = TRANSLATIONS[language];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("all");
  const [purchaseType, setPurchaseType] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination states
  const [visibleCount, setVisibleCount] = useState(10);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
            takenDate: photo.takenDate
          });
        });
      });
    });

    return photosList;
  }, [profiles]);

  // Map of all albums in the system for quick title/date lookups
  const albumMap = useMemo(() => {
    const map: Record<string, AlbumInsight> = {};
    profiles.forEach(profile => {
      profile.albums.forEach(album => {
        map[album.id] = album;
      });
    });
    return map;
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

  // Reset pagination when filters or items change
  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, selectedProfile, purchaseType, sortOrder]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredPhotos.length) {
          setVisibleCount(prev => Math.min(prev + 10, filteredPhotos.length));
        }
      },
      { rootMargin: "300px" } // Load early before reaching the screen bottom
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [filteredPhotos.length, visibleCount]);

  const visiblePhotos = useMemo(() => {
    return filteredPhotos.slice(0, visibleCount);
  }, [filteredPhotos, visibleCount]);

  return (
    <>
      <section className="panel" style={{ marginBottom: "18px" }}>
        <header className="panel-header" style={{ flexDirection: "column", alignItems: "stretch", gap: "16px", marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2>{t.galleryTitle}</h2>
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
          {visiblePhotos.map((item, idx) => {
            const cardKey = `${item.sale.id}-${item.id}-${idx}`;

            return (
              <GalleryPhotoCard
                key={cardKey}
                item={item}
                customEvents={customEvents}
                globalDirHandle={localDirHandle}
                albumMap={albumMap}
                language={language}
                onOpenLightbox={() => onOpenLightbox && onOpenLightbox(item, filteredPhotos)}
                copiedId={copiedId}
                handleCopyFileName={handleCopyFileName}
                profilesLength={profiles.length}
                resolvedLocalUrls={resolvedLocalUrls}
                setResolvedLocalUrls={setResolvedLocalUrls}
                setVisiblePhotoKeys={setVisiblePhotoKeys}
              />
            );
          })}

          {visibleCount < filteredPhotos.length && (
            <div 
              ref={sentinelRef} 
              style={{ 
                height: "60px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                width: "100%", 
                gridColumn: "1 / -1" 
              }}
            >
              <div 
                className="pulse" 
                style={{ 
                  width: "10px", 
                  height: "10px", 
                  borderRadius: "50%", 
                  background: "var(--accent, #6366f1)" 
                }} 
              />
            </div>
          )}
        </section>
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

interface ProcessedImage {
  file: File & { handle?: any };
  thumbUrl: string;
  score: number;
  faceDetected: boolean;
  allFaces: Array<{
    score: number;
    rect: { x: number; y: number; w: number; h: number };
    bodyRect?: { x: number; y: number; w: number; h: number };
    isPrimary?: boolean;
  }>;
  totalFaces: number;
  // undefined = no evaluado todavía; true/false = resultado del chequeo de ojos cerrados.
  eyesClosed?: boolean;
}

// Eye Aspect Ratio (EAR) sobre landmarks de MediaPipe FaceMesh (468 puntos).
// EAR = (promedio de distancias verticales del párpado) / (distancia horizontal del ojo).
// Por debajo de ~0.20 el ojo se considera cerrado.
const EYE_CLOSED_THRESHOLD = 0.2;
const RIGHT_EYE_EAR = { h: [33, 133], v: [[159, 145], [158, 153]] };
const LEFT_EYE_EAR = { h: [362, 263], v: [[386, 374], [385, 380]] };

function eyeAspectRatio(
  keypoints: Array<{ x: number; y: number }>,
  idx: { h: number[]; v: number[][] }
): number {
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);
  const hp0 = keypoints[idx.h[0]];
  const hp1 = keypoints[idx.h[1]];
  if (!hp0 || !hp1) return 1;
  const hor = dist(hp0, hp1);
  if (hor === 0) return 1;
  let verSum = 0;
  for (const [a, b] of idx.v) {
    const pa = keypoints[a];
    const pb = keypoints[b];
    if (!pa || !pb) return 1;
    verSum += dist(pa, pb);
  }
  return verSum / idx.v.length / hor;
}

function mapRawScoreToPercentage(rawScore: number): number {
  if (rawScore <= 1.0) return 0;
  const k = 10.0; // Parámetro de decaimiento calibrado para dar 75% en S=15.0
  const percentage = 100 * (1 - Math.exp(-(rawScore - 1.0) / k));
  return Math.min(100, Math.max(0, Math.round(percentage)));
}

// Formatea una duración en ms como m:ss (o h:mm:ss si supera la hora).
function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function varianceOfLaplacian(imageData: ImageData): number {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // 1. Convertir a escala de grises
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
  }
  
  // 2. Suavizado con filtro de caja 3x3 de 3 pasadas usando buffers separados
  // IMPORTANTE: Debemos mantener el array 'gray' intacto para calcular el Laplaciano original.
  const buf1 = new Uint8ClampedArray(gray);
  const buf2 = new Uint8ClampedArray(width * height);
  let inArr = buf1;
  let outArr = buf2;
  
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      const prevRowOffset = rowOffset - width;
      const nextRowOffset = rowOffset + width;
      
      for (let x = 1; x < width - 1; x++) {
        const i = rowOffset + x;
        outArr[i] = Math.round((
          inArr[prevRowOffset + x - 1] + inArr[prevRowOffset + x] + inArr[prevRowOffset + x + 1] +
          inArr[rowOffset + x - 1]     + inArr[rowOffset + x]     + inArr[rowOffset + x + 1] +
          inArr[nextRowOffset + x - 1] + inArr[nextRowOffset + x] + inArr[nextRowOffset + x + 1]
        ) / 9);
      }
    }
    // Intercambiar buffers
    const temp = inArr;
    inArr = outArr;
    outArr = temp;
  }
  const grayBlur = inArr;

  // 3. Laplacianos paralelos (original y difuminado)
  const laplacian = new Int32Array(width * height);
  const laplacianBlur = new Int32Array(width * height);

  for (let y = 2; y < height - 2; y++) {
    const rowOffset = y * width;
    const prevRow = rowOffset - width;
    const nextRow = rowOffset + width;
    
    for (let x = 2; x < width - 2; x++) {
      const i = rowOffset + x;
      
      // Original (usando el array 'gray' que ahora se mantiene perfectamente pristine)
      laplacian[i] = gray[prevRow + x] + gray[nextRow + x] + gray[i - 1] + gray[i + 1] - (4 * gray[i]);

      // Difuminado
      laplacianBlur[i] = grayBlur[prevRow + x] + grayBlur[nextRow + x] + grayBlur[i - 1] + grayBlur[i + 1] - (4 * grayBlur[i]);
    }
  }

  // 4. Malla de bloques de tamaño FIJO (16x16 píxeles) para lograr invarianza real de escala
  const blockSize = 16;
  const blockVariances: number[] = [];

  // Recorrer la imagen en bloques de 16x16 píxeles
  for (let y = 2; y <= height - blockSize - 2; y += blockSize) {
    for (let x = 2; x <= width - blockSize - 2; x += blockSize) {
      let sum = 0;
      let sumBlur = 0;
      let count = 0;

      for (let by = y; by < y + blockSize; by++) {
        const rowOffset = by * width;
        for (let bx = x; bx < x + blockSize; bx++) {
          const idx = rowOffset + bx;
          sum += laplacian[idx];
          sumBlur += laplacianBlur[idx];
          count++;
        }
      }

      if (count === 0) continue;
      const mean = sum / count;
      const meanBlur = sumBlur / count;
      let sqDiffSum = 0;
      let sqDiffSumBlur = 0;

      for (let by = y; by < y + blockSize; by++) {
        const rowOffset = by * width;
        for (let bx = x; bx < x + blockSize; bx++) {
          const idx = rowOffset + bx;
          
          const diff = laplacian[idx] - mean;
          sqDiffSum += diff * diff;

          const diffBlur = laplacianBlur[idx] - meanBlur;
          sqDiffSumBlur += diffBlur * diffBlur;
        }
      }

      const laplacianVariance = sqDiffSum / count;
      const blurVariance = sqDiffSumBlur / count;

      // COMPORTAMIENTO ROBUSTO (Noise Gate): Si la varianza absoluta del Laplaciano original es muy baja,
      // significa que es una zona lisa (cielo, remera lisa, fondo desenfocado o piel sin textura).
      // Asignamos una relación de 1.0 para evitar amplificar y medir el ruido/grano del sensor de la cámara.
      let normalizedVariance = 1.0;
      if (laplacianVariance >= 3.0) {
        normalizedVariance = laplacianVariance / (blurVariance + 0.05);
      }
      blockVariances.push(normalizedVariance);
    }
  }

  // Fallback si la imagen es demasiado pequeña para albergar bloques de 16x16
  if (blockVariances.length === 0) {
    let sum = 0;
    let sumBlur = 0;
    let count = 0;

    for (let y = 2; y < height - 2; y++) {
      const rowOffset = y * width;
      for (let x = 2; x < width - 2; x++) {
        const idx = rowOffset + x;
        sum += laplacian[idx];
        sumBlur += laplacianBlur[idx];
        count++;
      }
    }

    if (count > 0) {
      const mean = sum / count;
      const meanBlur = sumBlur / count;
      let sqDiffSum = 0;
      let sqDiffSumBlur = 0;

      for (let y = 2; y < height - 2; y++) {
        const rowOffset = y * width;
        for (let x = 2; x < width - 2; x++) {
          const idx = rowOffset + x;
          
          const diff = laplacian[idx] - mean;
          sqDiffSum += diff * diff;

          const diffBlur = laplacianBlur[idx] - meanBlur;
          sqDiffSumBlur += diffBlur * diffBlur;
        }
      }

      const laplacianVariance = sqDiffSum / count;
      const blurVariance = sqDiffSumBlur / count;
      
      if (laplacianVariance < 3.0) return 1.0;
      return laplacianVariance / (blurVariance + 0.05);
    }
    return 0;
  }

  // Ordenar varianzas de mayor a menor
  blockVariances.sort((a, b) => b - a);

  // Tomar el promedio de los 3 bloques más nítidos (evita ruido aislado de contornos extremos)
  let maxVariance = 0;
  const topBlocks = Math.min(3, blockVariances.length);
  for (let i = 0; i < topBlocks; i++) {
    maxVariance += blockVariances[i];
  }
  
  return topBlocks > 0 ? (maxVariance / topBlocks) : 0;
}

interface FaceCropCanvasProps {
  imageUrl: string;
  rect: { x: number; y: number; w: number; h: number };
}

function FaceCropCanvas({ imageUrl, rect }: FaceCropCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      canvas.width = 160;
      canvas.height = 160;

      const sW = rect.w;
      const sH = rect.h;
      const maxDim = Math.max(sW, sH);

      // Center the square cropping region over the original bounding box
      const sX = rect.x + (sW - maxDim) / 2;
      const sY = rect.y + (sH - maxDim) / 2;

      // Clear and fill background with a dark slate tone
      ctx.fillStyle = "#1e1e1e";
      ctx.fillRect(0, 0, 160, 160);

      // Draw the cropped face keeping a perfect 1:1 square aspect ratio
      ctx.drawImage(
        img,
        sX,
        sY,
        maxDim,
        maxDim,
        0,
        0,
        160,
        160
      );
    };
  }, [imageUrl, rect]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: 160,
        height: 160,
        borderRadius: "12px",
        border: "2px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
        background: "#000",
        display: "block"
      }}
    />
  );
}

function CullingDashboard({ language = "en" }: { language?: Language }) {
  const [detector, setDetector] = useState<any>(null);
  const [faceDetector, setFaceDetector] = useState<any>(null);
  const faceWorkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // Wake Lock: evita que la pantalla se apague durante el procesamiento largo (que frena
  // los timers de animación y puede perder el contexto WebGL de TensorFlow.js).
  const wakeLockRef = useRef<any>(null);
  const wakeLockWantedRef = useRef(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [dirHandle, setDirHandle] = useState<any>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [analyzingProgress, setAnalyzingProgress] = useState<string | null>(null);
  const [analyzingPercent, setAnalyzingPercent] = useState(0);

  const [currentThreshold, setCurrentThreshold] = useState(75);
  const [currentFilter, setCurrentFilter] = useState<"all" | "sharp" | "blurry">("all");
  // Fotos aceptadas manualmente esta sesión (bypass del umbral, por nombre de archivo).
  const [acceptedOverrides, setAcceptedOverrides] = useState<Set<string>>(new Set());
  // Detección de ojos cerrados (FaceMesh, bajo demanda). Apagado por defecto.
  const [eyeCheckEnabled, setEyeCheckEnabled] = useState(false);
  const [faceMeshDetector, setFaceMeshDetector] = useState<any>(null);

  // Mientras se analiza, se conserva el orden de llegada para que la galería no se reordene
  // bajo los pies del usuario (y el modal abierto no apunte a otra foto).
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Cronómetro de procesamiento: tiempo transcurrido, ETA y comparación con la corrida anterior.
  const [analyzeStart, setAnalyzeStart] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [etaMs, setEtaMs] = useState<number | null>(null);
  const [lastRunMs, setLastRunMs] = useState<number | null>(null);
  const [prevRunMs, setPrevRunMs] = useState<number | null>(null);

  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const [activeModalUrl, setActiveModalUrl] = useState<string | null>(null);
  // Identidad estable de la foto abierta en el modal (por nombre de archivo), independiente
  // de la posición en una lista que puede reordenarse.
  const [activeModalKey, setActiveModalKey] = useState<string | null>(null);
  // Snapshot de la lista al abrir el modal: la navegación usa esto, así incluir/excluir una foto
  // (que la saca del filtro actual) no rompe el paso a la siguiente.
  const [modalList, setModalList] = useState<ProcessedImage[]>([]);

  // Script Modal state
  const [scriptOpen, setScriptOpen] = useState(false);
  const [scriptBlurryFiles, setScriptBlurryFiles] = useState<ProcessedImage[]>([]);
  const [copied, setCopied] = useState(false);

  // Directory access native check
  const hasDirectoryAccess = typeof window !== "undefined" && !!(window as any).showDirectoryPicker;

  const t = TRANSLATIONS[language];

  // ¿La foto se acepta? Override manual gana siempre; si no, debe pasar el umbral de nitidez
  // y (cuando el chequeo de ojos está activo) no tener los ojos cerrados.
  const isImageAccepted = useCallback((img: ProcessedImage) => {
    if (acceptedOverrides.has(img.file.name)) return true;
    const rel = mapRawScoreToPercentage(img.score);
    if (rel < currentThreshold) return false;
    if (eyeCheckEnabled && img.eyesClosed) return false;
    return true;
  }, [acceptedOverrides, currentThreshold, eyeCheckEnabled]);

  // Optimized Stats & Filtered Lists (Lexically declared at the top)
  // Durante el análisis se mantiene el orden de llegada (estable, append-only); al terminar se
  // ordena por nitidez. Esto evita que la galería salte y que el modal abierto cambie de foto.
  const sorted = useMemo(
    () => (isAnalyzing ? processedImages : [...processedImages].sort((a, b) => b.score - a.score)),
    [processedImages, isAnalyzing]
  );

  // Foto abierta en el modal, resuelta por su clave estable (no por índice).
  const activeModalImg = useMemo(
    () => (activeModalKey ? sorted.find(img => img.file.name === activeModalKey) ?? null : null),
    [activeModalKey, sorted]
  );

  const { sharpCount, blurryCount } = useMemo(() => {
    let sharp = 0;
    let blurry = 0;
    sorted.forEach(img => {
      if (isImageAccepted(img)) sharp++;
      else blurry++;
    });
    return { sharpCount: sharp, blurryCount: blurry };
  }, [sorted, isImageAccepted]);

  const displayed = useMemo(() => {
    return sorted.filter(img => {
      const isSharp = isImageAccepted(img);
      if (currentFilter === "sharp") return isSharp;
      if (currentFilter === "blurry") return !isSharp;
      return true;
    });
  }, [sorted, currentFilter, isImageAccepted]);

  // Tick del cronómetro mientras se procesa la carpeta.
  useEffect(() => {
    if (!isAnalyzing || analyzeStart == null) return;
    setElapsedMs(performance.now() - analyzeStart);
    const id = setInterval(() => setElapsedMs(performance.now() - analyzeStart), 250);
    return () => clearInterval(id);
  }, [isAnalyzing, analyzeStart]);

  // Dynamic CDN scripts loader and AI initialization
  useEffect(() => {
    let active = true;
    setIsLoadingModel(true);
    setModelError(null);

    const initModel = async () => {
      const anyWindow = window as any;
      
      // Helper to check if model is loaded globally
      const checkAndLoad = async () => {
        if (anyWindow.cocoSsd) {
          try {
            const loadedDetector = await anyWindow.cocoSsd.load({
              modelUrl: "/model/model.json"
            });
            if (active) {
              setDetector(loadedDetector);
              setIsLoadingModel(false);
            }

            // Cargar detector de caras (best-effort; si falla, se usa la heurística de varianza).
            if (active && anyWindow.faceDetection) {
              try {
                const fd = await anyWindow.faceDetection.createDetector(
                  anyWindow.faceDetection.SupportedModels.MediaPipeFaceDetector,
                  { runtime: "tfjs", maxFaces: 25 }
                );
                if (active) setFaceDetector(fd);
              } catch (fe) {
                console.warn("Detector de caras no disponible, usando heurística:", fe);
              }
            }

            return true;
          } catch (e) {
            console.error("Error loading cocoSsd model:", e);
            if (active) {
              setModelError(language === "es" ? "Error al inicializar el detector de objetos AI" : "Error initializing AI object detector");
              setIsLoadingModel(false);
            }
            return true; // stop polling
          }
        }
        return false;
      };

      // 1. Try immediate load
      if (await checkAndLoad()) return;

      // 2. Poll for the global variables (they are loaded in RootLayout, might take a split second)
      let retries = 0;
      const interval = setInterval(async () => {
        retries++;
        if (!active) {
          clearInterval(interval);
          return;
        }
        
        if (await checkAndLoad()) {
          clearInterval(interval);
          return;
        }

        if (retries > 30) {
          clearInterval(interval);
          
          // 3. Fallback: Dynamic script insertion if still not loaded
          console.warn("Global cocoSsd not found, attempting dynamic insertion fallback...");
          const loadScript = (src: string, id: string, globalVarName?: string) => {
            return new Promise<void>((resolve, reject) => {
              if (globalVarName && anyWindow[globalVarName]) {
                resolve();
                return;
              }
              const existingScript = document.getElementById(id) as HTMLScriptElement;
              if (existingScript) {
                if (anyWindow[globalVarName || ""]) {
                  resolve();
                } else {
                  existingScript.addEventListener("load", () => resolve());
                  existingScript.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
                }
                return;
              }
              const script = document.createElement("script");
              script.src = src;
              script.id = id;
              script.async = true;
              script.onload = () => resolve();
              script.onerror = () => reject(new Error(`Failed to load ${src}`));
              document.body.appendChild(script);
            });
          };

          try {
            await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs", "tfjs-script", "tf");
            await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd", "cocossd-script", "cocoSsd");
            try {
              await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/face-detection", "facedetection-script", "faceDetection");
            } catch (fe) {
              console.warn("No se pudo cargar el script de face-detection:", fe);
            }
            await new Promise(r => setTimeout(r, 200));
            await checkAndLoad();
          } catch (err) {
            console.error("Scripts dynamic load fallback failed:", err);
            if (active) {
              setModelError(language === "es" ? "Error al descargar los scripts de AI" : "Error downloading AI scripts");
              setIsLoadingModel(false);
            }
          }
        }
      }, 100);
    };

    initModel();

    return () => {
      active = false;
    };
  }, [language]);

  // Clean Lightbox URL on close
  useEffect(() => {
    return () => {
      if (activeModalUrl) {
        URL.revokeObjectURL(activeModalUrl);
      }
    };
  }, [activeModalUrl]);

  // Dynamic Lightbox overlay drawer
  const modalImgRef = useRef<HTMLImageElement>(null);
  const [faceBoxes, setFaceBoxes] = useState<Array<{
    faceStyle: React.CSSProperties;
    bodyStyle: React.CSSProperties | null;
    label: string;
    isGreen: boolean;
  }>>([]);

  const updateModalOverlays = useCallback(() => {
    if (!activeModalImg) return;
    const imgData = activeModalImg;
    const modalImg = modalImgRef.current;
    if (!modalImg) return;

    if (imgData.faceDetected && imgData.allFaces && imgData.allFaces.length) {
      const rect = modalImg.getBoundingClientRect();
      const naturalW = modalImg.naturalWidth;
      const naturalH = modalImg.naturalHeight;
      if (!naturalW || !naturalH) return;

      const scaleX = rect.width / naturalW;
      const scaleY = rect.height / naturalH;

      const boxes = imgData.allFaces.map(face => {
        const relativeFaceScore = mapRawScoreToPercentage(face.score);
        const passesThreshold = relativeFaceScore >= currentThreshold;
        const isBest = face.score === imgData.score;
        const isGreen = passesThreshold;

        const faceStyle: React.CSSProperties = {
          display: "block",
          left: `${face.rect.x * scaleX}px`,
          top: `${face.rect.y * scaleY}px`,
          width: `${face.rect.w * scaleX}px`,
          height: `${face.rect.h * scaleY}px`,
          borderColor: isGreen ? "lime" : "red",
          boxShadow: isGreen ? "0 0 10px rgba(0,255,0,0.8)" : "0 0 10px rgba(255,0,0,0.5)",
          borderWidth: "2px",
          borderStyle: "solid",
          position: "absolute" as const,
          pointerEvents: "none" as const
        };

        const bodyStyle: React.CSSProperties | null = face.bodyRect ? {
          display: "block",
          left: `${face.bodyRect.x * scaleX}px`,
          top: `${face.bodyRect.y * scaleY}px`,
          width: `${face.bodyRect.w * scaleX}px`,
          height: `${face.bodyRect.h * scaleY}px`,
          border: "2px dashed rgba(99, 102, 241, 0.8)",
          borderRadius: "8px",
          boxShadow: "inset 0 0 16px rgba(99, 102, 241, 0.15)",
          position: "absolute" as const,
          pointerEvents: "none" as const
        } : null;

        return {
          faceStyle,
          bodyStyle,
          label: `${relativeFaceScore}%`,
          isGreen
        };
      });
      setFaceBoxes(boxes);
    } else {
      setFaceBoxes([]);
    }
  }, [activeModalImg, currentThreshold]);

  useEffect(() => {
    updateModalOverlays();
    window.addEventListener("resize", updateModalOverlays);
    return () => window.removeEventListener("resize", updateModalOverlays);
  }, [updateModalOverlays]);

  // --- Caché de procesamiento (JSON en la carpeta seleccionada) ---
  // Solo guarda datos AI (no thumbnails); identifica cada archivo por nombre+tamaño+fecha.
  const CACHE_FILENAME = "lumepic-culling-cache.json";
  // Subir esta versión cuando cambia el algoritmo de análisis invalida cachés viejas.
  // v2: el score de la imagen pasa a basarse en el sujeto principal (prominencia), no el máximo.
  const CACHE_VERSION = 2;
  const fileKey = (file: File) => `${file.name}|${file.size}|${file.lastModified}`;

  const readFolderCache = async (handle: any): Promise<Map<string, any>> => {
    const map = new Map<string, any>();
    try {
      const fh = await handle.getFileHandle(CACHE_FILENAME);
      const file = await fh.getFile();
      const json = JSON.parse(await file.text());
      if (json && json.version === CACHE_VERSION && json.entries) {
        for (const k of Object.keys(json.entries)) map.set(k, json.entries[k]);
      }
      // Versión distinta -> caché vacía: se recalcula con el algoritmo nuevo.
    } catch {
      // No existe o ilegible: caché vacía.
    }
    return map;
  };

  const writeFolderCache = async (handle: any, map: Map<string, any>) => {
    try {
      const entries: Record<string, any> = {};
      map.forEach((v, k) => { entries[k] = v; });
      const fh = await handle.getFileHandle(CACHE_FILENAME, { create: true });
      const writable = await fh.createWritable();
      await writable.write(JSON.stringify({ version: CACHE_VERSION, entries }));
      await writable.close();
    } catch (e) {
      console.warn("No se pudo escribir la caché de procesamiento:", e);
    }
  };

  // Genera solo el thumbnail (sin AI) — usado cuando la data AI viene de la caché.
  const generateThumbUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const tempUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onerror = () => { URL.revokeObjectURL(tempUrl); reject(new Error("Failed to load image")); };
      img.onload = () => {
        URL.revokeObjectURL(tempUrl);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Could not get 2d context"));
        const MAX_SIZE = 1000;
        let width = img.width;
        let height = img.height;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          const r = Math.min(MAX_SIZE / width, MAX_SIZE / height);
          width = Math.round(width * r);
          height = Math.round(height * r);
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.5));
      };
      img.src = tempUrl;
    });

  // Laplacian Image Analyzer
  const analyzeSingleImage = async (file: File): Promise<Omit<ProcessedImage, "file">> => {
    return new Promise((resolve, reject) => {
      const tempUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onerror = () => {
        URL.revokeObjectURL(tempUrl);
        reject(new Error("Failed to load image"));
      };
      img.onload = async () => {
        URL.revokeObjectURL(tempUrl);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2d context"));
          return;
        }

        const MAX_SIZE = 1000;
        let width = img.width;
        let height = img.height;
        let scaleRatio = 1;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          scaleRatio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
          width = Math.round(width * scaleRatio);
          height = Math.round(height * scaleRatio);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const thumbUrl = canvas.toDataURL("image/jpeg", 0.5);

        let rawPredictions: any[] = [];
        if (detector) {
          try {
            rawPredictions = await detector.detect(canvas);
          } catch (e) {
            console.error("AI detection error:", e);
          }
        }

        const predictions = rawPredictions.filter(p => p.class === "person" && p.score >= 0.50);

        let faceDetected = false;
        let bestScore = 0;
        let allFaces: any[] = [];

        // Normaliza el recuadro de una cara a {xMin,yMin,width,height}.
        const normalizeBox = (f: any) => {
          const b = f.box || f;
          const xMin = b.xMin ?? (b.topLeft ? b.topLeft[0] : 0);
          const yMin = b.yMin ?? (b.topLeft ? b.topLeft[1] : 0);
          const width = b.width ?? ((b.xMax ?? (b.bottomRight ? b.bottomRight[0] : 0)) - xMin);
          const height = b.height ?? ((b.yMax ?? (b.bottomRight ? b.bottomRight[1] : 0)) - yMin);
          return { xMin, yMin, width, height };
        };

        // Construye una entrada de cara (nitidez + rects en coords originales) a partir de un recuadro
        // expresado en coordenadas del canvas escalado.
        const faceEntryFromBox = (
          box: { xMin: number; yMin: number; width: number; height: number },
          bodyRect: any
        ) => {
          const pad = 0.15; // margen para enmarcar la cabeza completa
          const bx = Math.max(0, box.xMin - box.width * pad);
          const by = Math.max(0, box.yMin - box.height * pad);
          const bw = Math.min(canvas.width - bx, box.width * (1 + pad * 2));
          const bh = Math.min(canvas.height - by, box.height * (1 + pad * 2));
          const ix = Math.round(bx);
          const iy = Math.round(by);
          const iw = Math.round(bw);
          const ih = Math.round(bh);
          let score = 0;
          if (iw > 0 && ih > 0) {
            score = varianceOfLaplacian(ctx.getImageData(ix, iy, iw, ih));
          }
          return {
            score,
            rect: { x: bx / scaleRatio, y: by / scaleRatio, w: bw / scaleRatio, h: bh / scaleRatio },
            bodyRect
          };
        };

        // Cascada de detección: recorta una región del canvas y la amplía para que la cara ocupe
        // gran parte del frame (el detector reescala su entrada a ~128px, así que pasarle el canvas
        // completo deja las caras de multitudes en pocos píxeles e indetectables). Devuelve el mejor
        // recuadro de cara mapeado a coordenadas del canvas escalado, o null.
        const detectFaceInRegion = async (rX: number, rY: number, rW: number, rH: number) => {
          if (!faceDetector) return null;
          const regionX = Math.max(0, Math.floor(rX));
          const regionY = Math.max(0, Math.floor(rY));
          const regionW = Math.min(canvas.width - regionX, Math.ceil(rW));
          const regionH = Math.min(canvas.height - regionY, Math.ceil(rH));
          if (regionW < 8 || regionH < 8) return null;

          // El modelo reescala su entrada (~128px), así que solo necesitamos que la cara ocupe buena
          // parte del frame: 256px de lado mayor basta. Reducimos los recortes grandes (sujetos
          // cercanos) y ampliamos poco los chicos -> menos datos a la GPU sin perder detección.
          const TARGET = 256;
          const scale = Math.min(3, TARGET / Math.max(regionW, regionH));
          const tmp = faceWorkCanvasRef.current || (faceWorkCanvasRef.current = document.createElement("canvas"));
          tmp.width = Math.max(1, Math.round(regionW * scale));
          tmp.height = Math.max(1, Math.round(regionH * scale));
          const tctx = tmp.getContext("2d");
          if (!tctx) return null;
          tctx.clearRect(0, 0, tmp.width, tmp.height);
          tctx.drawImage(canvas, regionX, regionY, regionW, regionH, 0, 0, tmp.width, tmp.height);

          let faces: any[] = [];
          try {
            faces = await faceDetector.estimateFaces(tmp, { flipHorizontal: false });
          } catch (e) {
            console.error("Face detection error:", e);
            return null;
          }
          if (!faces || !faces.length) return null;

          // Elegir la cara de mayor área dentro del recorte.
          let best: any = null;
          let bestArea = -1;
          for (const f of faces) {
            const b = normalizeBox(f);
            const area = b.width * b.height;
            if (area > bestArea) {
              bestArea = area;
              best = b;
            }
          }
          if (!best) return null;

          // Mapear de coords del recorte de vuelta al canvas escalado.
          return {
            xMin: regionX + best.xMin / scale,
            yMin: regionY + best.yMin / scale,
            width: best.width / scale,
            height: best.height / scale
          };
        };

        // La detección de cara es lo costoso: limitarla a los sujetos más grandes (los del frente).
        // El resto (multitudes de fondo) usa la heurística barata, sin inferencias extra.
        const FACE_DETECT_LIMIT = 6;
        const faceDetectSet = new Set(
          [...predictions]
            .sort((a, b) => (b.bbox[2] * b.bbox[3]) - (a.bbox[2] * a.bbox[3]))
            .slice(0, FACE_DETECT_LIMIT)
        );

        if (predictions.length > 0) {
          for (const person of predictions) {
            const fX = person.bbox[0];
            const fY = person.bbox[1];
            const fW = person.bbox[2];
            const fH = person.bbox[3];

            const personBodyRect = {
              x: fX / scaleRatio,
              y: fY / scaleRatio,
              w: fW / scaleRatio,
              h: fH / scaleRatio
            };

            // 1) Detección de cara real recortando la mitad superior del cuerpo (donde está la cabeza).
            //    Solo para los sujetos grandes; cubre poses erguidas e inclinadas sin meter piernas/fondo.
            const faceBox = faceDetectSet.has(person)
              ? await detectFaceInRegion(fX, fY, fW, fH * 0.6)
              : null;
            if (faceBox) {
              const entry = faceEntryFromBox(faceBox, personBodyRect);
              allFaces.push(entry);
              if (entry.score > bestScore || bestScore === 0) bestScore = entry.score;
              continue;
            }

            // 2) Fallback heurístico: ubicar la cabeza por varianza cuando no se detectó cara.
            // Cargar proporciones realistas humanas.
            // Si el recuadro corporal es demasiado ancho (brazos abiertos, silla de ruedas o solapamiento),
            // limitamos el ancho efectivo para calcular las dimensiones de la cabeza y evitar recortes gigantes.
            const effectiveW = Math.min(fW, fH * 0.35);
            const headW = Math.round(effectiveW * 0.45);
            const headH = Math.round(Math.min(effectiveW * 0.55, fH * 0.15));

            // Escaneo horizontal por ventana deslizante (Sliding Window Scan)
            // Evaluamos la varianza de Laplace para ubicar la zona con mayor detalle (el rostro).
            // Para evitar falsos positivos con fondos ruidosos de alta frecuencia (como palmeras o carteles):
            // 1. Capped Variance: Limitamos la varianza a un máximo de 13.0 (el rostro tiene zonas lisas de piel, las hojas no).
            // 2. Luminance Penalty: El cielo de fondo es muy brillante; una cabeza humana (pelo, lentes, gorra) es significativamente más oscura.
            // 3. Central Spatial Bias: Mantiene la cabeza alineada cerca de los hombros.
            let bestHeadX = Math.max(0, Math.round(fX + (fW - headW) / 2)); // default al centro
            let maxScore = -1;

            const startX = Math.max(0, Math.round(fX));
            const endX = Math.min(canvas.width - headW, Math.max(startX, Math.round(fX + fW - headW)));
            const centerX = fX + (fW - headW) / 2;
            const maxDist = Math.max(1, (fW - headW) / 2);
            const step = 8;

            for (let sX = startX; sX <= endX; sX += step) {
              const finalW = Math.min(canvas.width - sX, headW);
              const finalH = Math.min(canvas.height - Math.round(fY), headH);
              if (finalW > 0 && finalH > 0) {
                const faceImageData = ctx.getImageData(sX, Math.max(0, Math.round(fY)), finalW, finalH);
                const rawVariance = varianceOfLaplacian(faceImageData);
                
                // 1. Texture Gate: Evita que el follaje de fondo con varianza altísima domine sobre un rostro
                const cappedVariance = Math.min(13.0, rawVariance);

                // 2. Luminance Penalty: Mide el brillo promedio para penalizar el cielo blanco de fondo
                let totalLuma = 0;
                const d = faceImageData.data;
                for (let j = 0; j < d.length; j += 4) {
                  totalLuma += d[j] * 0.299 + d[j+1] * 0.587 + d[j+2] * 0.114;
                }
                const avgLuma = totalLuma / (d.length / 4);
                const lumaFactor = Math.max(0.1, 1.0 - (avgLuma / 255) * 0.7);

                // 3. Sesgo central: 1.0 en el centro, decayendo a 0.65 en extremos corporales
                const distancePercent = Math.abs(sX - centerX) / maxDist;
                const biasWeight = 1.0 - 0.35 * Math.min(1.0, distancePercent);

                const weightedScore = cappedVariance * lumaFactor * biasWeight;

                if (weightedScore > maxScore) {
                  maxScore = weightedScore;
                  bestHeadX = sX;
                }
              }
            }

            const headX = bestHeadX;
            const headY = Math.max(0, Math.round(fY));

            const finalW = Math.min(canvas.width - headX, headW);
            const finalH = Math.min(canvas.height - headY, headH);

            if (finalW > 0 && finalH > 0) {
              const faceImageData = ctx.getImageData(headX, headY, finalW, finalH);
              const currentScore = varianceOfLaplacian(faceImageData);

              const visualRect = {
                x: headX / scaleRatio,
                y: headY / scaleRatio,
                w: finalW / scaleRatio,
                h: finalH / scaleRatio
              };

              const bodyRect = {
                x: fX / scaleRatio,
                y: fY / scaleRatio,
                w: fW / scaleRatio,
                h: fH / scaleRatio
              };

              allFaces.push({
                score: currentScore,
                rect: visualRect,
                bodyRect: bodyRect
              });

              if (currentScore > bestScore || bestScore === 0) {
                bestScore = currentScore;
              }
            }
          }
        }

        // Sin personas detectadas: intentar detección de cara sobre el canvas completo.
        if (predictions.length === 0) {
          const faceBox = await detectFaceInRegion(0, 0, canvas.width, canvas.height);
          if (faceBox) {
            const entry = faceEntryFromBox(faceBox, undefined);
            allFaces.push(entry);
            if (entry.score > bestScore || bestScore === 0) bestScore = entry.score;
          }
        }

        if (allFaces.length > 0) {
          faceDetected = true;

          // Sujeto principal = el más PROMINENTE (tamaño del cuerpo/cara × centralidad),
          // NO el más nítido. Así una foto con el protagonista borroso no se "salva" por una
          // cara nítida de fondo. El score de la imagen pasa a ser el de ese sujeto.
          const cxImg = img.width / 2;
          const cyImg = img.height / 2;
          const halfDiag = Math.hypot(img.width, img.height) / 2 || 1;
          let primary = allFaces[0];
          let bestProm = -1;
          for (const f of allFaces) {
            const fw = f.bodyRect ? f.bodyRect.w : f.rect.w;
            const fh = f.bodyRect ? f.bodyRect.h : f.rect.h;
            const area = Math.max(1, fw * fh);
            const fcx = f.rect.x + f.rect.w / 2;
            const fcy = f.rect.y + f.rect.h / 2;
            const dist = Math.min(1, Math.hypot(fcx - cxImg, fcy - cyImg) / halfDiag);
            const centrality = Math.max(0.15, 1 - 0.6 * dist); // centro=1.0, bordes≈0.4
            const prom = area * centrality;
            if (prom > bestProm) {
              bestProm = prom;
              primary = f;
            }
          }
          primary.isPrimary = true;
          bestScore = primary.score;
        } else {
          // Sin personas ni caras detectadas: medir nitidez sobre la ventana central.
          const cropSize = Math.round(Math.min(width, height) * 0.5);
          const cropX = Math.round((width - cropSize) / 2);
          const cropY = Math.round((height - cropSize) / 2);

          if (cropSize > 0) {
            const imageData = ctx.getImageData(cropX, cropY, cropSize, cropSize);
            bestScore = varianceOfLaplacian(imageData);
          }
        }

        resolve({
          score: bestScore,
          thumbUrl,
          faceDetected,
          allFaces,
          totalFaces: allFaces.length
        });
      };
      img.src = tempUrl;
    });
  };

  // Pide un Wake Lock de pantalla para que no se apague el monitor durante el batch.
  const acquireWakeLock = async () => {
    wakeLockWantedRef.current = true;
    try {
      const nav = navigator as any;
      if (nav.wakeLock && !wakeLockRef.current) {
        const sentinel = await nav.wakeLock.request("screen");
        wakeLockRef.current = sentinel;
        sentinel.addEventListener?.("release", () => {
          // Al soltarse (p. ej. al ocultarse la pestaña) limpiamos para poder re-pedirlo.
          if (wakeLockRef.current === sentinel) wakeLockRef.current = null;
        });
      }
    } catch (e) {
      console.warn("No se pudo activar Wake Lock (la pantalla podría apagarse):", e);
    }
  };

  const releaseWakeLock = async () => {
    wakeLockWantedRef.current = false;
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {
      // ignorar
    }
  };

  // El Wake Lock se libera solo cuando la pestaña se oculta; re-pedirlo al volver a estar visible
  // si seguimos procesando.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && wakeLockWantedRef.current && !wakeLockRef.current) {
        acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Process list with yield logic to prevent tab freezing
  const processFileList = async (filesToProcess: File[], folderHandle?: any) => {
    setProcessedImages([]);
    setAcceptedOverrides(new Set());
    setIsAnalyzing(true);
    setAnalyzingPercent(0);
    await acquireWakeLock();

    // Cronómetro: arranque, reseteo de ETA y captura de la corrida anterior para comparar.
    const start = performance.now();
    const previousRun = lastRunMs;
    setAnalyzeStart(start);
    setElapsedMs(0);
    setEtaMs(null);

    // Caché: si hay carpeta con acceso de escritura, reutilizamos resultados AI ya calculados.
    const handle = folderHandle ?? dirHandle;
    const cache = handle ? await readFolderCache(handle) : new Map<string, any>();
    let cacheDirty = false;
    let reused = 0;

    const channel = new MessageChannel();
    const yieldToMain = () => new Promise(res => {
      channel.port1.onmessage = res;
      channel.port2.postMessage(null);
    });

    const anyWindow = window as any;
    const tf = anyWindow.tf;

    const list: ProcessedImage[] = [];
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      setAnalyzingProgress(
        language === "es"
          ? `Analizando sujetos y nitidez... foto ${i + 1} de ${filesToProcess.length}...`
          : `Analyzing subjects and sharpness... photo ${i + 1} of ${filesToProcess.length}...`
      );
      setAnalyzingPercent(Math.round(((i + 1) / filesToProcess.length) * 100));

      await yieldToMain();

      const key = fileKey(file);
      const cached = cache.get(key);

      try {
        if (cached) {
          // Cache hit: solo regeneramos el thumbnail (barato), reusamos la data AI.
          const thumbUrl = await generateThumbUrl(file);
          list.push({
            file,
            thumbUrl,
            score: cached.score,
            faceDetected: cached.faceDetected,
            allFaces: cached.allFaces || [],
            totalFaces: cached.totalFaces ?? (cached.allFaces ? cached.allFaces.length : 0),
            eyesClosed: cached.eyesClosed
          });
          reused++;
        } else {
          if (tf && tf.nextFrame && !document.hidden) {
            await tf.nextFrame();
          }
          const result = await analyzeSingleImage(file);
          list.push({ file, ...result });
          cache.set(key, {
            score: result.score,
            faceDetected: result.faceDetected,
            allFaces: result.allFaces,
            totalFaces: result.totalFaces,
            eyesClosed: result.eyesClosed
          });
          cacheDirty = true;
        }
      } catch (err) {
        console.error("Error analyzing file:", file.name, err);
      }

      if (i === 0 || (i + 1) % 4 === 0 || i === filesToProcess.length - 1) {
        setProcessedImages([...list]);
      }

      // ETA: promedio por foto hasta ahora × fotos restantes.
      const processedCount = i + 1;
      const elapsed = performance.now() - start;
      const remaining = filesToProcess.length - processedCount;
      setEtaMs(remaining > 0 ? (elapsed / processedCount) * remaining : 0);
    }

    const total = performance.now() - start;
    setIsAnalyzing(false);
    setAnalyzeStart(null);
    setEtaMs(null);
    setElapsedMs(total);
    setPrevRunMs(previousRun);
    setLastRunMs(total);
    setAnalyzingProgress(null);
    await releaseWakeLock();

    // Persistir la caché si se calcularon entradas nuevas.
    if (handle && cacheDirty) {
      await writeFolderCache(handle, cache);
    }
    if (reused > 0) {
      console.info(`Culling caché: ${reused}/${filesToProcess.length} fotos reutilizadas desde ${CACHE_FILENAME}`);
    }

    // native notification
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(language === "es" ? "¡Análisis Completado!" : "Analysis Completed!", {
        body: language === "es" 
          ? `Se evaluaron ${filesToProcess.length} fotos exitosamente.` 
          : `Evaluated ${filesToProcess.length} photos successfully.`,
        icon: "https://cdn-icons-png.flaticon.com/512/1043/1043516.png"
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirHandle(null);
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length === 0) return;
    setFiles(selected);
    await processFileList(selected);
  };

  const handleSelectFolder = async () => {
    try {
      const picker = (window as any).showDirectoryPicker;
      if (!picker) return;

      const handle = await picker({ mode: "readwrite" });
      setDirHandle(handle);
      setAnalyzingProgress(language === "es" ? "Escaneando carpeta nativa..." : "Scanning local folder...");
      setAnalyzingPercent(0);

      const list: File[] = [];
      for await (const entry of handle.values()) {
        if (entry.kind === "file") {
          const file = await entry.getFile();
          const ext = file.name.split(".").pop()?.toLowerCase();
          if (ext && ["jpg", "jpeg", "png", "webp"].includes(ext)) {
            (file as any).handle = entry;
            list.push(file);
          }
        }
      }

      if (list.length === 0) {
        setAnalyzingProgress(language === "es" ? "No se encontraron fotos (JPG/PNG/WEBP) en la carpeta." : "No pictures (JPG/PNG/WEBP) found in directory.");
        return;
      }

      setFiles(list);
      await processFileList(list, handle);
    } catch (e: any) {
      if (e.name === "AbortError") {
        setAnalyzingProgress(null);
        return;
      }
      console.error("Directory picking failed:", e);
      setAnalyzingProgress(null);
      alert(language === "es" ? `No se pudo acceder a la carpeta: ${e.message}` : `Could not access directory: ${e.message}`);
    }
  };

  // Culling execution
  const handleCullImages = async () => {
    const blurryFiles = processedImages.filter(img => !isImageAccepted(img));

    if (blurryFiles.length === 0) {
      alert(
        language === "es"
          ? `¡Excelente! Ninguna foto está por debajo del umbral del ${currentThreshold}%.`
          : `Excellent! No photos are below the ${currentThreshold}% threshold.`
      );
      return;
    }

    const confirmMsg = language === "es"
      ? `Se detectaron ${blurryFiles.length} fotos borrosas por debajo del umbral establecido (${currentThreshold}%).\n\n¿Proceder con el culling?`
      : `Detected ${blurryFiles.length} blurry photos below the specified threshold (${currentThreshold}%).\n\nProceed with culling?`;

    if (!confirm(confirmMsg)) return;

    if (dirHandle) {
      // Native File System Access cleanup
      const confirmDiskMsg = language === "es"
        ? `¡ÚLTIMA CONFIRMACIÓN!\n\nSe moverán físicamente ${blurryFiles.length} archivos a una subcarpeta llamada REJECTED dentro de tu disco.\n\n¿Proceder?`
        : `FINAL CONFIRMATION!\n\nThis will physically move ${blurryFiles.length} files to a REJECTED subfolder on your disk.\n\nProceed?`;

      if (!confirm(confirmDiskMsg)) return;

      setAnalyzingProgress(language === "es" ? "Creando subcarpeta y moviendo archivos..." : "Creating rejected subfolder and moving files...");
      try {
        const rejectedDir = await dirHandle.getDirectoryHandle("REJECTED", { create: true });
        let moved = 0;
        for (const img of blurryFiles) {
          if (img.file.handle) {
            await img.file.handle.move(rejectedDir);
            moved++;
          }
        }

        const remaining = processedImages.filter(img => !blurryFiles.includes(img));
        setProcessedImages(remaining);
        setAnalyzingProgress(null);

        alert(
          language === "es"
            ? `¡Culling completado! Se trasladaron ${moved} fotos exitosamente.`
            : `Culling completed! Moved ${moved} photos successfully.`
        );
      } catch (e: any) {
        console.error("Native file move failed:", e);
        setAnalyzingProgress(null);
        alert(language === "es" ? `Error al trasladar archivos: ${e.message}` : `Error moving files: ${e.message}`);
      }
    } else {
      // Fallback: trigger command script modal
      setScriptBlurryFiles(blurryFiles);
      setScriptOpen(true);
    }
  };

  const handleCopyScript = () => {
    const el = document.getElementById("bash-culling-command") as HTMLTextAreaElement;
    if (el) {
      el.select();
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMacScript = () => {
    if (scriptBlurryFiles.length === 0) return;

    let scriptText = `#!/bin/bash\n`;
    scriptText += `cd "$(dirname "$0")"\n`;
    scriptText += `mkdir -p REJECTED\n`;
    scriptBlurryFiles.forEach(img => {
      scriptText += `mv "${img.file.name}" REJECTED/\n`;
    });
    scriptText += `echo ""\n`;
    scriptText += `echo "=================================================="\n`;
    scriptText += `echo " Lumepic Image Culling Script - COMPLETADO"\n`;
    scriptText += `echo "=================================================="\n`;
    scriptText += `echo "Se trasladaron ${scriptBlurryFiles.length} fotos borrosas a la carpeta REJECTED."\n`;
    scriptText += `echo "Ya puedes cerrar esta ventana."\n`;

    const blob = new Blob([scriptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mover_borrosas_a_rejected.command";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const closeScriptModal = () => {
    setScriptOpen(false);
    // filter culled images from current view
    const remaining = processedImages.filter(img => !scriptBlurryFiles.includes(img));
    setProcessedImages(remaining);
  };

  // Stats and list filters are now declared lexically at the top of the component to prevent TDZ warnings.

  // Abre una entrada de una lista dada (snapshot), por índice.
  const openModalEntry = (listSnapshot: ProcessedImage[], idx: number) => {
    const imgData = listSnapshot[idx];
    if (!imgData) return;
    if (activeModalUrl) {
      URL.revokeObjectURL(activeModalUrl);
    }
    const url = URL.createObjectURL(imgData.file);
    setActiveModalUrl(url);
    setActiveModalIndex(idx);
    setActiveModalKey(imgData.file.name);
  };

  // Lightbox handler: congela la lista visible actual como secuencia de navegación.
  const handleOpenLightbox = (displayedIndex: number) => {
    const snapshot = displayed;
    setModalList(snapshot);
    openModalEntry(snapshot, displayedIndex);
  };

  const handleCloseLightbox = () => {
    setActiveModalIndex(null);
    setActiveModalKey(null);
    if (activeModalUrl) {
      URL.revokeObjectURL(activeModalUrl);
      setActiveModalUrl(null);
    }
  };

  // El índice actual se ubica en el snapshot (no en `displayed`), que no cambia al togglear overrides.
  const currentModalIndex = () =>
    activeModalKey ? modalList.findIndex(i => i.file.name === activeModalKey) : (activeModalIndex ?? -1);

  const handlePrevImage = () => {
    const idx = currentModalIndex();
    if (idx > 0) {
      openModalEntry(modalList, idx - 1);
    }
  };

  const handleNextImage = () => {
    const idx = currentModalIndex();
    if (idx >= 0 && idx < modalList.length - 1) {
      openModalEntry(modalList, idx + 1);
    }
  };

  // Keyboard navigation effect
  useEffect(() => {
    if (activeModalIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "Escape") {
        handleCloseLightbox();
      } else if (e.key === " " || e.code === "Space") {
        // Espacio: incluir/excluir manualmente la foto abierta (override de la sesión).
        e.preventDefault();
        if (activeModalKey) {
          setAcceptedOverrides(prev => {
            const next = new Set(prev);
            if (next.has(activeModalKey)) next.delete(activeModalKey);
            else next.add(activeModalKey);
            return next;
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModalIndex, activeModalKey, modalList]);

  const handleForceAccept = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    setAcceptedOverrides(prev => {
      const next = new Set(prev);
      next.add(fileName);
      return next;
    });
  };

  const handleRemoveOverride = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    setAcceptedOverrides(prev => {
      const next = new Set(prev);
      next.delete(fileName);
      return next;
    });
  };

  // Carga FaceMesh bajo demanda (recién al activar el chequeo de ojos), inyectando el script del CDN.
  const ensureFaceMesh = async () => {
    if (faceMeshDetector) return faceMeshDetector;
    const w = window as any;
    const loadScript = (src: string, id: string, glob: string) =>
      new Promise<void>((resolve, reject) => {
        if (w[glob]) return resolve();
        const existing = document.getElementById(id);
        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.id = id;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(s);
      });

    await loadScript(
      "https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection",
      "facemesh-script",
      "faceLandmarksDetection"
    );
    const det = await w.faceLandmarksDetection.createDetector(
      w.faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      { runtime: "tfjs", refineLandmarks: false, maxFaces: 1 }
    );
    setFaceMeshDetector(det);
    return det;
  };

  // Ejecuta FaceMesh sobre el recorte de la cara más nítida y devuelve si los ojos están cerrados.
  const detectEyesClosed = (detector: any, img: ProcessedImage): Promise<boolean> =>
    new Promise((resolve, reject) => {
      const best = img.allFaces && img.allFaces.length
        ? (img.allFaces.find(f => f.isPrimary) ?? [...img.allFaces].sort((a, b) => b.score - a.score)[0])
        : null;
      if (!best) return resolve(false);

      const url = URL.createObjectURL(img.file);
      const im = new window.Image();
      im.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      im.onload = async () => {
        URL.revokeObjectURL(url);
        // best.rect está en coordenadas de la imagen ORIGINAL. Recortamos la cara con margen
        // (FaceMesh necesita algo de contexto alrededor del rostro) y la ampliamos.
        const pad = 0.4;
        const rx = Math.max(0, best.rect.x - best.rect.w * pad);
        const ry = Math.max(0, best.rect.y - best.rect.h * pad);
        const rw = Math.min(im.width - rx, best.rect.w * (1 + pad * 2));
        const rh = Math.min(im.height - ry, best.rect.h * (1 + pad * 2));
        if (rw < 8 || rh < 8) return resolve(false);

        const TARGET = 256;
        const scale = Math.min(4, TARGET / Math.max(rw, rh));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(rw * scale));
        c.height = Math.max(1, Math.round(rh * scale));
        const cx = c.getContext("2d");
        if (!cx) return resolve(false);
        cx.drawImage(im, rx, ry, rw, rh, 0, 0, c.width, c.height);

        let faces: any[] = [];
        try {
          faces = await detector.estimateFaces(c, { flipHorizontal: false });
        } catch (e) {
          console.error("FaceMesh error:", e);
          return resolve(false);
        }
        if (!faces || !faces.length || !faces[0].keypoints) return resolve(false);
        const kp = faces[0].keypoints;
        if (kp.length < 468) return resolve(false);

        const ear = (eyeAspectRatio(kp, RIGHT_EYE_EAR) + eyeAspectRatio(kp, LEFT_EYE_EAR)) / 2;
        resolve(ear < EYE_CLOSED_THRESHOLD);
      };
      im.src = url;
    });

  // Pasada incremental: solo fotos ya nítidas y aún no evaluadas.
  const runEyeCheckPass = async (detector: any) => {
    const targets = processedImages.filter(img =>
      mapRawScoreToPercentage(img.score) >= currentThreshold &&
      img.eyesClosed === undefined &&
      img.allFaces && img.allFaces.length > 0
    );
    if (!targets.length) return;

    await acquireWakeLock();
    const results = new Map<string, boolean>();
    let done = 0;
    for (const img of targets) {
      try {
        results.set(img.file.name, await detectEyesClosed(detector, img));
      } catch {
        // si falla la carga, dejamos la foto sin marcar
      }
      done++;
      if (done % 5 === 0 || done === targets.length) {
        setAnalyzingPercent(Math.round((done / targets.length) * 100));
        setAnalyzingProgress(
          language === "es"
            ? `Analizando ojos cerrados... ${done}/${targets.length}`
            : `Checking for closed eyes... ${done}/${targets.length}`
        );
      }
    }

    setProcessedImages(prev =>
      prev.map(img =>
        results.has(img.file.name) ? { ...img, eyesClosed: results.get(img.file.name) } : img
      )
    );

    // Persistir el resultado de ojos en la caché de la carpeta para no recomputarlo la próxima vez.
    if (dirHandle) {
      const cache = await readFolderCache(dirHandle);
      let dirty = false;
      for (const img of targets) {
        if (!results.has(img.file.name)) continue;
        const key = fileKey(img.file);
        const entry = cache.get(key) || {
          score: img.score,
          faceDetected: img.faceDetected,
          allFaces: img.allFaces,
          totalFaces: img.totalFaces
        };
        entry.eyesClosed = results.get(img.file.name);
        cache.set(key, entry);
        dirty = true;
      }
      if (dirty) await writeFolderCache(dirHandle, cache);
    }

    await releaseWakeLock();
  };

  const handleToggleEyeCheck = async () => {
    const next = !eyeCheckEnabled;
    setEyeCheckEnabled(next);
    if (!next) return; // al apagar, solo se ignoran los resultados (sin recomputar)

    try {
      setAnalyzingProgress(language === "es" ? "Cargando modelo de rostro (FaceMesh)..." : "Loading face model (FaceMesh)...");
      setAnalyzingPercent(0);
      const det = await ensureFaceMesh();
      await runEyeCheckPass(det);
    } catch (e) {
      console.error("Eye-check pass failed:", e);
    } finally {
      setAnalyzingProgress(null);
      setAnalyzingPercent(0);
    }
  };

  // Render modal
  const renderScriptModal = () => {
    if (!scriptOpen) return null;

    let commandText = `mkdir -p REJECTED && mv `;
    scriptBlurryFiles.forEach(img => {
      commandText += `"${img.file.name}" `;
    });
    commandText += `REJECTED/`;

    return (
      <div className="modal-backdrop" onClick={closeScriptModal}>
        <section className="settings-modal" onClick={(e) => e.stopPropagation()} style={{
          width: "min(600px, 100%)",
          padding: "24px",
          border: "1px solid var(--line)",
          borderRadius: "24px",
          background: "var(--white)",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.15)",
          maxHeight: "90vh",
          overflowY: "auto"
        }}>
          <header className="modal-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "14px", borderBottom: "1px solid var(--line)" }}>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: "800", margin: 0 }}>
                {language === "es" ? "💾 Generar Script de Depuración" : "💾 Generate Culling Script"}
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "4px 0 0 0" }}>
                {language === "es" 
                  ? `Se detectaron ${scriptBlurryFiles.length} fotos borrosas. Copia el comando o descarga el script ejecutable.` 
                  : `Detected ${scriptBlurryFiles.length} blurry photos. Copy command or download script.`}
              </p>
            </div>
            <button className="icon-button" onClick={closeScriptModal} style={{
              border: "none",
              background: "var(--paper-2)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center"
            }}>
              <X size={16} />
            </button>
          </header>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <strong style={{ display: "block", fontSize: "0.92rem", marginBottom: "8px" }}>
                {language === "es" ? "Opción 1: Comando de Terminal" : "Option 1: Terminal Command"}
              </strong>
              <div style={{ position: "relative" }}>
                <textarea
                  id="bash-culling-command"
                  readOnly
                  value={commandText}
                  style={{
                    width: "100%",
                    height: "100px",
                    padding: "10px",
                    borderRadius: "10px",
                    border: "1px solid var(--line)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.76rem",
                    resize: "none",
                    outline: "none",
                    background: "var(--paper-2)"
                  }}
                />
                <button
                  className="text-button"
                  onClick={handleCopyScript}
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    height: "28px",
                    padding: "0 10px",
                    background: "var(--ink)",
                    color: "var(--white)",
                    fontSize: "0.74rem"
                  }}
                >
                  <Copy size={12} style={{ marginRight: 4 }} />
                  {copied ? (language === "es" ? "Copiado" : "Copied") : (language === "es" ? "Copiar" : "Copy")}
                </button>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: "16px" }}>
              <strong style={{ display: "block", fontSize: "0.92rem", marginBottom: "8px" }}>
                {language === "es" ? "Opción 2: Script Ejecutable de macOS" : "Option 2: Executable macOS Script"}
              </strong>
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "0 0 12px 0" }}>
                {language === "es" 
                  ? "Descarga el script, colócalo en la misma carpeta que tus fotos y ejecútalo haciendo doble clic." 
                  : "Download the script, place it in the same directory as the pictures, and double-click to execute."}
              </p>
              <button
                className="text-button"
                onClick={handleDownloadMacScript}
                style={{
                  height: "36px",
                  padding: "0 14px",
                  background: "var(--accent, #6366f1)",
                  color: "var(--white)",
                  fontWeight: "600",
                  fontSize: "0.82rem"
                }}
              >
                <Download size={14} style={{ marginRight: 6 }} />
                {language === "es" ? "Descargar Mover_Borrosas.command" : "Download Mover_Borrosas.command"}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  };

  // Render Lighbox
  const renderLightbox = () => {
    if (!activeModalKey || !activeModalUrl) return null;
    const imgData = activeModalImg;
    if (!imgData) return null;
    const modalIndex = modalList.findIndex(i => i.file.name === activeModalKey);

    return (
      <div className="modal-backdrop" onClick={handleCloseLightbox} style={{ background: "rgba(0,0,0,0.95)", zIndex: 999 }}>
        <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 10, zIndex: 1000 }}>
          <button className="icon-button" onClick={handleCloseLightbox} style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "#fff",
            padding: "8px",
            borderRadius: "50%",
            cursor: "pointer"
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Left Arrow */}
        {modalIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrevImage();
            }}
            style={{
              position: "absolute",
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 1001,
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.25)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            }}
            aria-label={language === "es" ? "Imagen anterior" : "Previous image"}
          >
            <ChevronLeft size={28} />
          </button>
        )}

        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            maxWidth: "min(95vw, 1200px)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: "24px",
            justifyContent: "center",
            alignItems: "center",
            padding: "24px",
            background: "rgba(30, 30, 30, 0.4)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)"
          }}
        >
          {/* Left: Main Image */}
          <div id="modalContainer" style={{ position: "relative", display: "inline-block", maxWidth: "min(100%, 750px)", maxHeight: "75vh" }}>
            <img
              ref={modalImgRef}
              src={activeModalUrl}
              alt="lightbox preview"
              onLoad={updateModalOverlays}
              style={{
                maxWidth: "100%",
                maxHeight: "75vh",
                display: "block",
                borderRadius: "16px",
                boxShadow: "0 12px 48px rgba(0,0,0,0.6)"
              }}
            />
            {faceBoxes.map((box, idx) => (
              <Fragment key={idx}>
                {box.bodyStyle && (
                  <div style={box.bodyStyle} />
                )}
                <div style={box.faceStyle}>
                  <div style={{
                    background: box.isGreen ? "lime" : "red",
                    color: box.isGreen ? "black" : "white",
                    fontWeight: "bold",
                    position: "absolute",
                    top: "-25px",
                    left: "-3px",
                    padding: "2px 6px",
                    fontSize: "13px",
                    borderRadius: "4px",
                    pointerEvents: "none"
                  }}>
                    {box.label}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>

          {/* Right: Bounding box face crops column */}
          {imgData.faceDetected && imgData.allFaces && imgData.allFaces.length > 0 && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              minWidth: "220px",
              maxWidth: "280px",
              maxHeight: "75vh",
              overflowY: "auto",
              padding: "16px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              alignSelf: "stretch"
            }}>
              <h3 style={{
                color: "#fff",
                fontSize: "0.95rem",
                fontWeight: "800",
                margin: "0 0 4px 0",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <Sparkles size={14} style={{ color: "var(--accent, #6366f1)" }} />
                {language === "es" ? "Detalle de Enfoque" : "Focus Details"}
              </h3>
              <p style={{ color: "#aaa", fontSize: "0.75rem", margin: 0 }}>
                {language === "es" 
                  ? "Verifica el grado de foco directamente en el rostro:" 
                  : "Verify sharpness directly on the cropped faces:"}
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "6px" }}>
                {[...imgData.allFaces]
                  .sort((a, b) => (a.isPrimary ? -1 : 0) - (b.isPrimary ? -1 : 0) || b.score - a.score)
                  .map((face, fIdx) => {
                    const relativeScore = mapRawScoreToPercentage(face.score);
                  const isSharp = relativeScore >= currentThreshold;
                  return (
                    <div
                      key={fIdx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px",
                        background: "rgba(0, 0, 0, 0.3)",
                        borderRadius: "12px",
                        border: face.isPrimary
                          ? "2px solid var(--accent, #6366f1)"
                          : `1px solid ${isSharp ? "rgba(0, 255, 0, 0.15)" : "rgba(255, 0, 0, 0.15)"}`
                      }}
                    >
                      {face.isPrimary && (
                        <span style={{
                          fontSize: "0.66rem",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: "var(--accent, #6366f1)",
                          color: "white"
                        }}>
                          ⭐ {language === "es" ? "Principal" : "Main"}
                        </span>
                      )}
                      <FaceCropCanvas imageUrl={activeModalUrl} rect={face.rect} />
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{
                          fontSize: "0.85rem",
                          fontWeight: "800",
                          color: isSharp ? "#4ade80" : "#f87171"
                        }}>
                          {relativeScore}%
                        </span>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          padding: "1px 5px",
                          borderRadius: "4px",
                          background: isSharp ? "rgba(74, 222, 128, 0.15)" : "rgba(248, 113, 113, 0.15)",
                          color: isSharp ? "#4ade80" : "#f87171"
                        }}>
                          {isSharp ? (language === "es" ? "Nítida" : "Sharp") : (language === "es" ? "Borrosa" : "Blurry")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Arrow */}
        {modalIndex < modalList.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextImage();
            }}
            style={{
              position: "absolute",
              right: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 1001,
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.25)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1.08)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            }}
            aria-label={language === "es" ? "Imagen siguiente" : "Next image"}
          >
            <ChevronRight size={28} />
          </button>
        )}

        {activeModalKey && acceptedOverrides.has(activeModalKey) && (
          <div style={{
            position: "absolute",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1002,
            background: "#10b981",
            color: "white",
            fontWeight: 800,
            fontSize: "0.9rem",
            padding: "8px 16px",
            borderRadius: "999px",
            boxShadow: "0 6px 20px rgba(16,185,129,0.5)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            pointerEvents: "none"
          }}>
            ✅ {language === "es" ? "Incluida manualmente" : "Manually included"}
          </div>
        )}

        <div style={{ position: "absolute", bottom: 40, color: "#fff", fontFamily: "var(--font-mono)", fontSize: "0.82rem", textShadow: "0 2px 4px rgba(0,0,0,0.8)", textAlign: "center" }}>
          <strong>{imgData.file.name}</strong>
          <div style={{ marginTop: 6, display: "flex", justifySelf: "center", gap: 10 }}>
            <span>Score: {mapRawScoreToPercentage(imgData.score)}%</span>
            <span>-</span>
            <span>{imgData.faceDetected ? `${imgData.totalFaces} subject(s)` : "Full Image"}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: "0.72rem", opacity: 0.75 }}>
            {language === "es"
              ? "Espacio: incluir / quitar esta foto · ← → navegar · Esc cerrar"
              : "Space: include / remove this photo · ← → navigate · Esc to close"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Notice Card for Experimental Feature */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)",
        border: "1px solid rgba(99, 102, 241, 0.15)",
        borderRadius: "16px",
        padding: "16px 20px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        boxShadow: "0 4px 20px rgba(99, 102, 241, 0.03)"
      }}>
        <div style={{
          background: "var(--accent, #6366f1)",
          color: "#fff",
          borderRadius: "12px",
          padding: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
        }}>
          <Sparkles size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: "0.95rem",
            fontWeight: "800",
            margin: "0 0 4px 0",
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            {language === "es" ? "🧪 Función Experimental en Desarrollo" : "🧪 Experimental Feature under Development"}
          </h3>
          <p style={{
            fontSize: "0.82rem",
            color: "var(--muted)",
            lineHeight: "1.45",
            margin: 0
          }}>
            {language === "es"
              ? "Esta sección de AI Culling está en desarrollo activo y se presenta a modo experimental. Aún requiere ajustes finos, testing exhaustivo y optimizaciones de rendimiento. Siéntete libre de probarla y experimentar con la detección automática de nitidez y ojos cerrados."
              : "This AI Culling section is under active development and is presented as an experimental feature. It still requires fine-tuning, thorough testing, and performance optimization. Feel free to try it out and experiment with automatic sharpness and closed-eye detection."}
          </p>
        </div>
      </div>

      <section className="culling-stats">
        <article className="culling-stat-box">
          <span>{language === "es" ? "Fotos Totales" : "Total Photos"}</span>
          <strong>{processedImages.length}</strong>
        </article>
        <article className="culling-stat-box">
          <span>{language === "es" ? "Nítidas (OK)" : "Sharp (OK)"}</span>
          <strong style={{ color: "#10b981" }}>{sharpCount}</strong>
        </article>
        <article className="culling-stat-box">
          <span>{language === "es" ? "Rechazadas" : "Rejected"}</span>
          <strong style={{ color: "#ef4444" }}>{blurryCount}</strong>
        </article>
      </section>

      <section className="culling-controls">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.18rem", fontWeight: "800", margin: 0 }}>
              {language === "es" ? "⚙️ Filtros de Análisis AI" : "⚙️ AI Analysis Filters"}
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "4px 0 0 0" }}>
              {language === "es" 
                ? "Ajusta el umbral de nitidez o importa más imágenes." 
                : "Adjust sharpness threshold or import more images."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {hasDirectoryAccess ? (
              <button
                className="text-button"
                onClick={handleSelectFolder}
                style={{
                  height: "36px",
                  padding: "0 14px",
                  background: "var(--ink)",
                  color: "var(--white)"
                }}
              >
                <FolderOpen size={15} style={{ marginRight: 6 }} />
                {language === "es" ? "Seleccionar Carpeta" : "Select Folder"}
              </button>
            ) : (
              <div style={{
                color: "#ef4444",
                fontSize: "0.82rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                background: "rgba(239, 68, 68, 0.06)",
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(239, 68, 68, 0.15)"
              }}>
                {language === "es" 
                  ? "⚠️ AI Culling requiere Google Chrome o Microsoft Edge." 
                  : "⚠️ AI Culling requires Google Chrome or Microsoft Edge."}
              </div>
            )}
          </div>
        </header>

        {/* Loading progress */}
        {analyzingProgress && (
          <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", padding: "16px", borderRadius: "12px", width: "100%" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "8px" }}>
              {analyzingProgress}
            </span>
            <div style={{ width: "100%", height: "8px", background: "var(--line-soft)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: `${analyzingPercent}%`, height: "100%", background: "var(--accent, #6366f1)", transition: "width 0.1s" }} />
            </div>
            {isAnalyzing && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--muted)", marginTop: "8px", fontFamily: "var(--font-mono)" }}>
                <span>⏱️ {language === "es" ? "Transcurrido" : "Elapsed"}: {formatDuration(elapsedMs)}</span>
                {etaMs != null && <span>{language === "es" ? "Restante aprox." : "ETA"}: {formatDuration(etaMs)}</span>}
                {prevRunMs != null && <span>{language === "es" ? "Anterior" : "Previous"}: {formatDuration(prevRunMs)}</span>}
              </div>
            )}
          </div>
        )}

        {/* Resumen de tiempo de la última corrida */}
        {!isAnalyzing && lastRunMs != null && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
            <span>✅ {language === "es" ? "Última corrida" : "Last run"}: <strong style={{ color: "var(--ink)" }}>{formatDuration(lastRunMs)}</strong></span>
            {prevRunMs != null && (() => {
              const delta = lastRunMs - prevRunMs;
              const faster = delta < 0;
              return (
                <span style={{ color: faster ? "#10b981" : delta > 0 ? "#ef4444" : "var(--muted)" }}>
                  {language === "es" ? "anterior" : "previous"}: {formatDuration(prevRunMs)} ({faster ? "−" : "+"}{formatDuration(Math.abs(delta))})
                </span>
              );
            })()}
          </div>
        )}

        {/* AI script loading loader */}
        {isLoadingModel && (
          <div style={{ fontSize: "0.78rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <div className="pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
            {language === "es" ? "Cargando biblioteca AI (TensorFlow.js)..." : "Loading AI engine (TensorFlow.js)..."}
          </div>
        )}

        {modelError && (
          <div style={{ fontSize: "0.78rem", color: "var(--red)", fontWeight: "600" }}>
            ⚠️ {modelError}
          </div>
        )}

        {/* Slider & Filter control */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "30px", borderTop: "1px solid var(--line-soft)", paddingTop: "18px" }}>
          <div style={{ flex: "1", minWidth: "240px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: "700", marginBottom: "6px" }}>
              <span>{language === "es" ? "Umbral de Aceptación (Nitidez)" : "Acceptance Threshold (Sharpness)"}</span>
              <span style={{ color: "var(--accent, #6366f1)" }}>{currentThreshold}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              value={currentThreshold}
              onChange={(e) => setCurrentThreshold(parseInt(e.target.value))}
              style={{
                width: "100%",
                height: "6px",
                background: "var(--line-soft)",
                borderRadius: "3px",
                outline: "none",
                cursor: "pointer",
                accentColor: "var(--accent, #6366f1)"
              }}
              aria-label={language === "es" ? "Umbral de nitidez" : "Sharpness threshold"}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", minWidth: "200px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "700" }}>
              <input
                type="checkbox"
                checked={eyeCheckEnabled}
                onChange={handleToggleEyeCheck}
                style={{ width: 16, height: 16, accentColor: "var(--accent, #6366f1)", cursor: "pointer" }}
              />
              👁️ {language === "es" ? "Detectar ojos cerrados" : "Detect closed eyes"}
            </label>
            <span style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "4px" }}>
              {language === "es"
                ? "Rechaza fotos nítidas donde el sujeto más nítido tiene los ojos cerrados."
                : "Rejects sharp photos where the sharpest subject has closed eyes."}
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <button
              className={`filter-pill ${currentFilter === "all" ? "active" : ""}`}
              onClick={() => setCurrentFilter("all")}
              style={{
                height: "32px",
                padding: "0 12px",
                border: "1px solid var(--line)",
                borderRadius: "999px",
                background: currentFilter === "all" ? "var(--ink)" : "transparent",
                color: currentFilter === "all" ? "var(--white)" : "var(--ink)",
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {language === "es" ? "Todas" : "All"} ({processedImages.length})
            </button>
            <button
              className={`filter-pill ${currentFilter === "sharp" ? "active" : ""}`}
              onClick={() => setCurrentFilter("sharp")}
              style={{
                height: "32px",
                padding: "0 12px",
                border: "1px solid var(--line)",
                borderRadius: "999px",
                background: currentFilter === "sharp" ? "var(--ink)" : "transparent",
                color: currentFilter === "sharp" ? "var(--white)" : "var(--ink)",
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {language === "es" ? "✅ Nítidas" : "✅ Sharp"} ({sharpCount})
            </button>
            <button
              className={`filter-pill ${currentFilter === "blurry" ? "active" : ""}`}
              onClick={() => setCurrentFilter("blurry")}
              style={{
                height: "32px",
                padding: "0 12px",
                border: "1px solid var(--line)",
                borderRadius: "999px",
                background: currentFilter === "blurry" ? "var(--ink)" : "transparent",
                color: currentFilter === "blurry" ? "var(--white)" : "var(--ink)",
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {language === "es" ? "❌ Rechazadas" : "❌ Rejected"} ({blurryCount})
            </button>
          </div>
        </div>
      </section>

      {/* cull execution button */}
      {processedImages.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.78rem",
              color: "var(--muted)",
              background: "var(--paper-2, rgba(0,0,0,0.02))",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid var(--line-soft)",
              maxWidth: "360px",
              textAlign: "right"
            }}>
              <HelpCircle size={14} style={{ flexShrink: 0, color: "var(--accent)" }} />
              <span>
                {language === "es"
                  ? "Mueve físicamente las fotos por debajo del umbral a una subcarpeta 'REJECTED' (o genera un script si no hay soporte nativo)."
                  : "Physically moves files below the threshold to a 'REJECTED' subfolder (or generates a script if native access is unsupported)."}
              </span>
            </div>
            <button
              className="text-button"
              onClick={handleCullImages}
              style={{
                height: "40px",
                padding: "0 16px",
                background: "var(--red, #ef4444)",
                color: "var(--white)",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Trash2 size={16} />
              {language === "es" ? "Iniciar Culling (Rechazar)" : "Start Culling (Reject)"}
            </button>
          </div>
        </div>
      )}

      {/* Gallery */}
      <section className="culling-gallery">
        {displayed.map((img, index) => {
          const rel = mapRawScoreToPercentage(img.score);
          const overridden = acceptedOverrides.has(img.file.name);
          const isBlurry = rel < currentThreshold;
          const isEyesClosed = eyeCheckEnabled && !!img.eyesClosed && !isBlurry;
          const wouldReject = isBlurry || isEyesClosed;
          const accepted = overridden || !wouldReject;
          return (
            <article className="culling-card" key={img.file.name} onClick={() => handleOpenLightbox(index)}>
              <img src={img.thumbUrl} alt={img.file.name} />
              <div className={`culling-score ${accepted ? "sharp" : "blurry"}`}>{rel}%</div>
              <span className={`culling-label ${accepted ? "sharp" : "blurry"}`}>
                {accepted
                  ? (overridden && wouldReject
                      ? (language === "es" ? "✅ Incluida (manual)" : "✅ Included (manual)")
                      : (language === "es" ? "✅ Nítida" : "✅ Sharp"))
                  : isBlurry
                    ? (language === "es" ? "❌ Borrosa" : "❌ Blurry")
                    : (language === "es" ? "❌ Ojos cerrados" : "❌ Eyes closed")}
              </span>
              <div className="culling-face-text">
                {img.faceDetected ? `🏃‍♂️ ${img.totalFaces} subject(s)` : "🖼️ Full Image"}
              </div>
              {wouldReject && !overridden && (
                <button
                  onClick={(e) => handleForceAccept(e, img.file.name)}
                  style={{
                    marginTop: "8px",
                    cursor: "pointer",
                    background: "var(--accent, #6366f1)",
                    color: "white",
                    border: "none",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "0.7rem",
                    fontWeight: "600"
                  }}
                >
                  ⬆️ {language === "es" ? "Ésta está bien" : "This is OK"}
                </button>
              )}
              {wouldReject && overridden && (
                <button
                  onClick={(e) => handleRemoveOverride(e, img.file.name)}
                  style={{
                    marginTop: "8px",
                    cursor: "pointer",
                    background: "transparent",
                    color: "var(--muted, #888)",
                    border: "1px solid var(--line, #ddd)",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "0.7rem",
                    fontWeight: "600"
                  }}
                >
                  ↩️ {language === "es" ? "Quitar inclusión" : "Remove"}
                </button>
              )}
            </article>
          );
        })}

        {processedImages.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "50px 10px", color: "var(--muted)", background: "var(--paper)", border: "1px dashed var(--line)", borderRadius: "16px" }}>
            <Sparkles size={24} style={{ marginBottom: 10, opacity: 0.7 }} />
            <strong style={{ display: "block", fontSize: "0.95rem" }}>
              {language === "es" ? "Carga fotos para iniciar el culling" : "Upload pictures to start culling"}
            </strong>
            <span style={{ fontSize: "0.78rem", display: "block", marginTop: 4 }}>
              {language === "es" 
                ? "Soporta selección de carpeta nativa en Chrome/Safari o arrastrar fotos directamente." 
                : "Supports local directory access picker in Chrome/Safari or dropping photos."}
            </span>
          </div>
        )}
      </section>

      {renderLightbox()}
      {renderScriptModal()}
    </>
  );
}
// Helper to resolve a photo's date
function getPhotoDate(photo: SalePhotograph, sale: Sale, albumMap: Record<string, AlbumInsight>): string {
  if (photo.takenDate) {
    if (typeof photo.takenDate === "string" && photo.takenDate.length >= 10 && photo.takenDate.includes("-")) {
      const parts = photo.takenDate.split("T")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) {
        return parts;
      }
    }
    try {
      const d = new Date(photo.takenDate);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    } catch (_) {}
  }
  if (photo.originalFileName) {
    const match = photo.originalFileName.match(/(20[23]\d)[-_]?(0[1-9]|1[0-2])[-_]?(0[1-9]|[12]\d|3[01])(?!\d)/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }
  const album = albumMap[photo.albumId];
  if (album && album.createdAt) {
    try {
      const d = new Date(album.createdAt);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    } catch (_) {}
  }
  if (sale.date) {
    try {
      const d = new Date(sale.date);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    } catch (_) {}
  }
  return "";
}

interface EventsDashboardProps {
  customEvents: CustomEvent[];
  onSaveEvent: (event: CustomEvent, subEventHandles?: Record<string, FileSystemDirectoryHandle | null>) => void;
  onDeleteEvent: (id: string) => void;
  allProfiles: DashboardSummary[];
  language?: Language;
  onLinkEventFolder: (eventId: string) => Promise<void>;
  onUnlinkEventFolder: (eventId: string) => Promise<void>;
  onLinkSubEventFolder: (eventId: string, subEventId: string) => Promise<void>;
  onUnlinkSubEventFolder: (eventId: string, subEventId: string) => Promise<void>;
}

function EventsDashboard({
  customEvents,
  onSaveEvent,
  onDeleteEvent,
  allProfiles,
  language = "en",
  onLinkEventFolder,
  onUnlinkEventFolder,
  onLinkSubEventFolder,
  onUnlinkSubEventFolder
}: EventsDashboardProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSubEventFilter, setSelectedSubEventFilter] = useState<string>("all");
  const userHasSelectedEventRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Reset sub-event filter when active event changes
  useEffect(() => {
    setSelectedSubEventFilter("all");
  }, [selectedEventId]);

  // Form states
  const [formName, setFormName] = useState("");
  const [formAlbumIds, setFormAlbumIds] = useState<string[]>([]);
  const [formSubEvents, setFormSubEvents] = useState<CustomSubEvent[]>([]);
  
  // Temporary map to hold selected handles for new/edited sub-events before save is clicked
  const [tempSubeventHandles, setTempSubeventHandles] = useState<Record<string, FileSystemDirectoryHandle | null>>({});

  const t = TRANSLATIONS[language];

  // Map of all albums in the system for quick title/date lookups
  const albumMap = useMemo(() => {
    const map: Record<string, AlbumInsight & { profileLabel: string }> = {};
    allProfiles.forEach(profile => {
      profile.albums.forEach(album => {
        map[album.id] = { ...album, profileLabel: profile.label };
      });
    });
    return map;
  }, [allProfiles]);

  const sortedCustomEvents = useMemo(() => {
    const getEventDate = (evt: CustomEvent) => {
      let latestTime = 0;
      if (evt.subEvents && evt.subEvents.length > 0) {
        evt.subEvents.forEach(sub => {
          if (sub.date) {
            const t = new Date(sub.date + "T00:00:00").getTime();
            if (!isNaN(t) && t > latestTime) latestTime = t;
          }
        });
      }
      if (evt.albumIds && evt.albumIds.length > 0) {
        evt.albumIds.forEach(albumId => {
          const alb = albumMap[albumId];
          if (alb && alb.createdAt) {
            const t = new Date(alb.createdAt).getTime();
            if (!isNaN(t) && t > latestTime) latestTime = t;
          }
        });
      }
      return latestTime;
    };

    return [...customEvents].sort((a, b) => getEventDate(b) - getEventDate(a));
  }, [customEvents, albumMap]);

  const selectedEvent = useMemo(() => {
    return sortedCustomEvents.find(e => e.id === selectedEventId) || null;
  }, [sortedCustomEvents, selectedEventId]);

  // Auto-select first event if none is selected, and re-evaluate when dashboard data (and thus dates) becomes available
  useEffect(() => {
    if (sortedCustomEvents.length > 0 && !userHasSelectedEventRef.current) {
      setSelectedEventId(sortedCustomEvents[0].id);
    }
  }, [sortedCustomEvents, allProfiles]);

  // Open Create Form
  const handleStartCreate = () => {
    setFormName("");
    setFormAlbumIds([]);
    setFormSubEvents([]);
    setTempSubeventHandles({});
    setIsCreating(true);
    setIsEditing(false);
  };

  // Open Edit Form
  const handleStartEdit = (event: CustomEvent) => {
    setFormName(event.name);
    setFormAlbumIds(event.albumIds);
    setFormSubEvents(event.subEvents);
    setTempSubeventHandles({});
    setIsEditing(true);
    setIsCreating(false);
  };

  // Add Sub-event Row
  const handleAddSubEvent = () => {
    const newSub: CustomSubEvent = {
      id: Math.random().toString(36).substring(2, 9),
      name: "",
      date: new Date().toISOString().split("T")[0]
    };
    setFormSubEvents([...formSubEvents, newSub]);
  };

  // Update Sub-event field
  const handleUpdateSubEvent = (idx: number, field: keyof CustomSubEvent, value: any) => {
    const updated = [...formSubEvents];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormSubEvents(updated);
  };

  // Remove Sub-event Row
  const handleRemoveSubEvent = (idx: number) => {
    const sub = formSubEvents[idx];
    if (sub) {
      setTempSubeventHandles(prev => {
        const cpy = { ...prev };
        delete cpy[sub.id];
        return cpy;
      });
    }
    setFormSubEvents(formSubEvents.filter((_, i) => i !== idx));
  };

  const handleLinkSubEventFolderInForm = async (idx: number, subEventId: string) => {
    try {
      if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
        alert(language === "es"
          ? "Tu navegador no soporta el acceso al sistema de archivos local. Por favor usa Chrome, Edge u otro navegador compatible."
          : "Your browser does not support local file system access. Please use Chrome, Edge, or another compatible browser.");
        return;
      }
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      if (handle) {
        setTempSubeventHandles(prev => ({ ...prev, [subEventId]: handle }));
        handleUpdateSubEvent(idx, "localDirName", handle.name);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error picking directory in form:", err);
      }
    }
  };

  const handleUnlinkSubEventFolderInForm = (idx: number, subEventId: string) => {
    setTempSubeventHandles(prev => ({ ...prev, [subEventId]: null }));
    handleUpdateSubEvent(idx, "localDirName", null);
  };

  // Toggle Album selection
  const handleToggleAlbum = (albumId: string) => {
    if (formAlbumIds.includes(albumId)) {
      setFormAlbumIds(formAlbumIds.filter(id => id !== albumId));
    } else {
      setFormAlbumIds([...formAlbumIds, albumId]);
    }
  };

  // Save Event Group
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert(language === "es" ? "Por favor ingresa un nombre para el evento." : "Please enter a name for the event.");
      return;
    }
    if (formAlbumIds.length === 0) {
      alert(language === "es" ? "Por favor selecciona al menos un álbum." : "Please select at least one album.");
      return;
    }

    const eventToSave: CustomEvent = {
      id: isEditing && selectedEvent ? selectedEvent.id : `evt-${Date.now()}`,
      name: formName.trim(),
      albumIds: formAlbumIds,
      subEvents: formSubEvents.map(sub => ({
        ...sub,
        localDirName: tempSubeventHandles[sub.id] !== undefined ? (tempSubeventHandles[sub.id]?.name || null) : sub.localDirName
      })),
      localDirName: isEditing && selectedEvent ? selectedEvent.localDirName : null
    };

    onSaveEvent(eventToSave, tempSubeventHandles);
    setSelectedEventId(eventToSave.id);
    setIsEditing(false);
    setIsCreating(false);
    setTempSubeventHandles({});
  };

  // Calculate detailed event statistics
  const eventDetails = useMemo(() => {
    if (!selectedEvent) return null;

    // 1. Gather all sales matching the event's albumIds
    const salesList: Sale[] = [];
    allProfiles.forEach(profile => {
      profile.sales.forEach(sale => {
        // Match by albumId in photographs
        const matchesPhotoAlbum = sale.photographs?.some(p => selectedEvent.albumIds.includes(p.albumId));
        // Match by album title
        const matchesAlbumTitle = selectedEvent.albumIds.some(aid => {
          const alb = albumMap[aid];
          return alb && isAlbumMatch(sale.album, alb.title);
        });

        if (matchesPhotoAlbum || matchesAlbumTitle) {
          salesList.push(sale);
        }
      });
    });

    // 2. Initialize sub-events tracking
    interface SubEventTotals {
      revenue: number;
      grossRevenue: number;
      subtotal: number;
      discounts: number;
      fees: number;
      stripeFee?: number;
      sales: number;
      orders: number;
      albums: number;
      publishedPhotos: number;
      photos: number;
      avgOrder: number;
      conversion: number;
    }

    interface SubEventData {
      id: string;
      name: string;
      date: string;
      revenue: number;
      salesCount: number;
      photosSold: number;
      localDirName?: string | null;
      totals: SubEventTotals;
    }

    const subEventMap: Record<string, SubEventData> = {};
    const subEventAlbumsMap: Record<string, Set<string>> = {};

    selectedEvent.subEvents.forEach(sub => {
      subEventMap[sub.date] = {
        id: sub.id,
        name: sub.name,
        date: sub.date,
        revenue: 0,
        salesCount: 0,
        photosSold: 0,
        localDirName: sub.localDirName,
        totals: {
          revenue: 0,
          grossRevenue: 0,
          subtotal: 0,
          discounts: 0,
          fees: 0,
          stripeFee: 0,
          sales: 0,
          orders: 0,
          albums: 0,
          publishedPhotos: 0,
          photos: 0,
          avgOrder: 0,
          conversion: 0
        }
      };
      subEventAlbumsMap[sub.date] = new Set<string>();
    });

    const unclassifiedAlbums = new Set<string>();
    const unclassified = {
      name: language === "es" ? "Otros / Sin clasificar" : "Others / Unclassified",
      date: "",
      revenue: 0,
      salesCount: 0,
      photosSold: 0,
      totals: {
        revenue: 0,
        grossRevenue: 0,
        subtotal: 0,
        discounts: 0,
        fees: 0,
        stripeFee: 0,
        sales: 0,
        orders: 0,
        albums: 0,
        publishedPhotos: 0,
        photos: 0,
        avgOrder: 0,
        conversion: 0
      }
    };

    let totalRevenue = 0;
    let totalGrossRevenue = 0;
    let totalFees = 0;
    let totalStripeFee = 0;
    let totalDiscounts = 0;
    let totalSalesCount = 0;
    let totalPhotosSold = 0;

    // 3. Process each sale
    salesList.forEach(sale => {
      if (sale.isComped) return;

      totalRevenue += sale.total;
      totalGrossRevenue += sale.grossTotal;
      totalFees += sale.fees;
      totalStripeFee += (sale.stripeFee || 0);
      totalDiscounts += sale.discount;
      totalSalesCount += 1;
      totalPhotosSold += sale.photos;

      let matchedAlbumId = "";
      selectedEvent.albumIds.forEach(aid => {
        const alb = albumMap[aid];
        if (alb && isAlbumMatch(sale.album, alb.title)) {
          matchedAlbumId = aid;
        }
      });

      const photos = sale.photographs || [];
      if (photos.length > 0) {
        // Resolve date for each photo
        const allocations: Record<string, number> = {}; // date -> count
        let unclassifiedCount = 0;

        photos.forEach(p => {
          const photoDate = getPhotoDate(p, sale, albumMap);
          if (photoDate && subEventMap[photoDate]) {
            allocations[photoDate] = (allocations[photoDate] || 0) + 1;
            if (p.albumId) {
              subEventAlbumsMap[photoDate].add(p.albumId);
            }
          } else {
            unclassifiedCount += 1;
            if (p.albumId) {
              unclassifiedAlbums.add(p.albumId);
            }
          }
        });

        const totalPhotos = photos.length;
        // Allocate sale proportionally
        Object.entries(allocations).forEach(([date, count]) => {
          const ratio = count / totalPhotos;
          const sub = subEventMap[date];
          sub.revenue += sale.total * ratio;
          sub.salesCount += ratio;
          sub.photosSold += sale.photos * ratio;

          sub.totals.revenue += sale.total * ratio;
          sub.totals.grossRevenue += (sale.grossTotal - (sale.stripeFee || 0)) * ratio;
          sub.totals.subtotal += (sale.grossTotal + sale.discount) * ratio;
          sub.totals.discounts += sale.discount * ratio;
          sub.totals.fees += (sale.fees - (sale.stripeFee || 0)) * ratio;
          sub.totals.stripeFee = (sub.totals.stripeFee || 0) + (sale.stripeFee || 0) * ratio;
          sub.totals.sales += ratio;
          sub.totals.orders += ratio;
          sub.totals.photos += sale.photos * ratio;
        });

        if (unclassifiedCount > 0) {
          const ratio = unclassifiedCount / totalPhotos;
          unclassified.revenue += sale.total * ratio;
          unclassified.salesCount += ratio;
          unclassified.photosSold += sale.photos * ratio;

          unclassified.totals.revenue += sale.total * ratio;
          unclassified.totals.grossRevenue += (sale.grossTotal - (sale.stripeFee || 0)) * ratio;
          unclassified.totals.subtotal += (sale.grossTotal + sale.discount) * ratio;
          unclassified.totals.discounts += sale.discount * ratio;
          unclassified.totals.fees += (sale.fees - (sale.stripeFee || 0)) * ratio;
          unclassified.totals.stripeFee = (unclassified.totals.stripeFee || 0) + (sale.stripeFee || 0) * ratio;
          unclassified.totals.sales += ratio;
          unclassified.totals.orders += ratio;
          unclassified.totals.photos += sale.photos * ratio;
        }
      } else {
        // Fallback: match by sale date
        let saleDate = "";
        try {
          const d = new Date(sale.date);
          if (!isNaN(d.getTime())) {
            saleDate = d.toISOString().split("T")[0];
          }
        } catch (_) {}

        if (saleDate && subEventMap[saleDate]) {
          const sub = subEventMap[saleDate];
          sub.revenue += sale.total;
          sub.salesCount += 1;
          sub.photosSold += sale.photos;

          sub.totals.revenue += sale.total;
          sub.totals.grossRevenue += sale.grossTotal - (sale.stripeFee || 0);
          sub.totals.subtotal += sale.grossTotal + sale.discount;
          sub.totals.discounts += sale.discount;
          sub.totals.fees += sale.fees - (sale.stripeFee || 0);
          sub.totals.stripeFee = (sub.totals.stripeFee || 0) + (sale.stripeFee || 0);
          sub.totals.sales += 1;
          sub.totals.orders += 1;
          sub.totals.photos += sale.photos;
          if (matchedAlbumId) {
            subEventAlbumsMap[saleDate].add(matchedAlbumId);
          }
        } else {
          unclassified.revenue += sale.total;
          unclassified.salesCount += 1;
          unclassified.photosSold += sale.photos;

          unclassified.totals.revenue += sale.total;
          unclassified.totals.grossRevenue += sale.grossTotal - (sale.stripeFee || 0);
          unclassified.totals.subtotal += sale.grossTotal + sale.discount;
          unclassified.totals.discounts += sale.discount;
          unclassified.totals.fees += sale.fees - (sale.stripeFee || 0);
          unclassified.totals.stripeFee = (unclassified.totals.stripeFee || 0) + (sale.stripeFee || 0);
          unclassified.totals.sales += 1;
          unclassified.totals.orders += 1;
          unclassified.totals.photos += sale.photos;
          if (matchedAlbumId) {
            unclassifiedAlbums.add(matchedAlbumId);
          }
        }
      }
    });

    // Calculate total published photos for selected albums to get conversion rate
    let totalPublishedPhotos = 0;
    let totalViews = 0;
    selectedEvent.albumIds.forEach(id => {
      const alb = albumMap[id];
      if (alb) {
        totalPublishedPhotos += alb.photos;
        totalViews += alb.views;
      }
    });

    Object.keys(subEventMap).forEach(date => {
      const sub = subEventMap[date];
      sub.totals.avgOrder = sub.totals.sales > 0 ? sub.totals.grossRevenue / sub.totals.sales : 0;
      sub.totals.albums = subEventAlbumsMap[date].size;
      sub.totals.publishedPhotos = totalPublishedPhotos;
      sub.totals.conversion = totalPublishedPhotos ? (sub.totals.photos / totalPublishedPhotos) * 100 : 0;
    });

    unclassified.totals.avgOrder = unclassified.totals.sales > 0 ? unclassified.totals.grossRevenue / unclassified.totals.sales : 0;
    unclassified.totals.albums = unclassifiedAlbums.size;
    unclassified.totals.publishedPhotos = totalPublishedPhotos;
    unclassified.totals.conversion = totalPublishedPhotos ? (unclassified.totals.photos / totalPublishedPhotos) * 100 : 0;

    const subEventsList = Object.values(subEventMap).sort((a, b) => a.date.localeCompare(b.date));

    const eventTotals = {
      revenue: totalRevenue,
      grossRevenue: Math.max(totalGrossRevenue - totalStripeFee, 0),
      subtotal: totalGrossRevenue + totalDiscounts,
      discounts: totalDiscounts,
      fees: Math.max(totalFees - totalStripeFee, 0),
      stripeFee: totalStripeFee,
      sales: totalSalesCount,
      orders: totalSalesCount,
      albums: selectedEvent.albumIds.length,
      publishedPhotos: totalPublishedPhotos,
      photos: totalPhotosSold,
      avgOrder: totalSalesCount ? totalGrossRevenue / totalSalesCount : 0,
      conversion: totalPublishedPhotos ? (totalPhotosSold / totalPublishedPhotos) * 100 : 0
    };

    return {
      totals: eventTotals,
      subEvents: subEventsList,
      unclassified,
      salesList,
      views: totalViews
    };
  }, [selectedEvent, allProfiles, albumMap, language]);

  // Select which totals to display in the KPI cards (consolidated or specific sub-event)
  const displayedTotals = useMemo(() => {
    if (!eventDetails) return null;
    if (selectedSubEventFilter === "all") {
      return eventDetails.totals;
    }
    if (selectedSubEventFilter === "unclassified") {
      return eventDetails.unclassified.totals;
    }
    const sub = eventDetails.subEvents.find(s => s.id === selectedSubEventFilter);
    return sub ? sub.totals : eventDetails.totals;
  }, [eventDetails, selectedSubEventFilter]);

  // Back to list
  const handleBackToList = () => {
    setIsEditing(false);
    setIsCreating(false);
    if (!selectedEventId && customEvents.length > 0) {
      setSelectedEventId(customEvents[0].id);
    }
  };

  const currentViewEvent = customEvents.find(e => e.id === selectedEventId);

  // Render Creation / Edition Form
  if (isCreating || isEditing) {
    return (
      <section className="panel" style={{ padding: "24px" }}>
        <header className="panel-header" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button className="icon-button" onClick={handleBackToList} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2>{isCreating ? (language === "es" ? "Crear Grupo de Evento" : "Create Event Group") : (language === "es" ? "Editar Grupo de Evento" : "Edit Event Group")}</h2>
              <p>{language === "es" ? "Agrupa álbumes existentes de Lumepic y define sub-eventos por fecha." : "Group existing Lumepic albums and define sub-events by date."}</p>
            </div>
          </div>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Name */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "8px", color: "var(--ink)" }}>
              {language === "es" ? "Nombre del Evento Consolidador" : "Consolidated Event Name"}
            </label>
            <input
              type="text"
              className="text-input"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={language === "es" ? "ej. Rock 'n' Roll San Diego Marathon" : "e.g. Rock 'n' Roll San Diego Marathon"}
              style={{ width: "100%", height: "40px", padding: "0 12px", borderRadius: "8px", border: "1px solid var(--line)" }}
            />
          </div>

          {/* Albums Checkbox list */}
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "8px", color: "var(--ink)" }}>
              {language === "es" ? "Seleccionar Álbumes de Lumepic" : "Select Lumepic Albums"}
            </label>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "-4px 0 12px 0" }}>
              {language === "es" ? "Marca los álbumes cuyos datos se consolidarán en este evento." : "Check the albums whose statistics will consolidate into this event."}
            </p>
            <div style={{
              maxHeight: "220px",
              overflowY: "auto",
              border: "1px solid var(--line)",
              borderRadius: "10px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              background: "var(--paper-2)"
            }}>
              {Object.values(albumMap).map((album) => {
                const checked = formAlbumIds.includes(album.id);
                return (
                  <label key={album.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.82rem", cursor: "pointer", padding: "6px 8px", borderRadius: "6px", background: checked ? "rgba(99, 102, 241, 0.05)" : "transparent" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleAlbum(album.id)}
                      style={{ cursor: "pointer" }}
                    />
                    <div>
                      <strong style={{ color: "var(--ink)" }}>{album.title}</strong>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)", marginLeft: "8px" }}>
                        ({album.profileLabel})
                      </span>
                    </div>
                  </label>
                );
              })}
              {Object.keys(albumMap).length === 0 && (
                <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.8rem", padding: "20px 0" }}>
                  {language === "es" ? "No se encontraron álbumes cargados." : "No loaded albums found."}
                </p>
              )}
            </div>
          </div>

          {/* Sub-events Definition */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--ink)", margin: 0 }}>
                {language === "es" ? "Definir Sub-eventos por Fecha" : "Define Sub-events by Date"}
              </label>
              <button
                type="button"
                className="text-button"
                onClick={handleAddSubEvent}
                style={{ height: "28px", padding: "0 10px", fontSize: "0.72rem", background: "var(--paper-2)", border: "1px solid var(--line)" }}
              >
                <Plus size={12} style={{ marginRight: 4 }} />
                {language === "es" ? "Añadir Sub-evento" : "Add Sub-event"}
              </button>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "-4px 0 12px 0" }}>
              {language === "es" 
                ? "Asigna un nombre (ej. Sábado 5K) a cada fecha del evento para separar las estadísticas de las fotos vendidas." 
                : "Assign a name (e.g. Saturday 5K) to each event date to split statistics of sold photos."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {formSubEvents.map((sub, idx) => (
                <div key={sub.id} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    className="text-input"
                    value={sub.name}
                    onChange={(e) => handleUpdateSubEvent(idx, "name", e.target.value)}
                    placeholder={language === "es" ? "ej. Sábado 5K" : "e.g. Saturday 5K"}
                    style={{ flex: 2, minWidth: "120px", height: "36px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                  <input
                    type="date"
                    className="text-input"
                    value={sub.date}
                    onChange={(e) => handleUpdateSubEvent(idx, "date", e.target.value)}
                    style={{ flex: 1, minWidth: "110px", height: "36px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--line)" }}
                  />
                  
                  {/* Subevent Local Folder Picker inside Creation/Edit Form */}
                  {sub.localDirName ? (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "var(--paper-2)",
                      padding: "0 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--line)",
                      height: "36px",
                      maxWidth: "180px",
                      fontSize: "0.75rem"
                    }}>
                      <span style={{
                        maxWidth: "80px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: "600",
                        color: "var(--ink)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }} title={sub.localDirName}>
                        <FolderOpen size={12} style={{ color: "var(--accent, #6366f1)" }} />
                        {sub.localDirName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLinkSubEventFolderInForm(idx, sub.id)}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "var(--accent, #6366f1)", padding: 0, fontSize: "0.7rem", textDecoration: "underline" }}
                      >
                        {language === "es" ? "Cambiar" : "Change"}
                      </button>
                      <span style={{ color: "var(--line)" }}>|</span>
                      <button
                        type="button"
                        onClick={() => handleUnlinkSubEventFolderInForm(idx, sub.id)}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444", padding: 0, fontSize: "0.7rem", textDecoration: "underline" }}
                      >
                        {language === "es" ? "Quitar" : "Remove"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleLinkSubEventFolderInForm(idx, sub.id)}
                      className="text-button"
                      style={{
                        height: "36px",
                        padding: "0 10px",
                        fontSize: "0.75rem",
                        borderRadius: "6px",
                        border: "1px solid var(--line)",
                        background: "var(--white)",
                        color: "var(--ink)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <FolderOpen size={13} />
                      {language === "es" ? "Carpeta" : "Folder"}
                    </button>
                  )}

                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => handleRemoveSubEvent(idx)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: "8px", color: "var(--red, #ef4444)" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {formSubEvents.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", background: "var(--paper)", border: "1px dashed var(--line)", borderRadius: "8px", color: "var(--muted)", fontSize: "0.78rem" }}>
                  {language === "es" ? "Ningún sub-evento configurado aún. Agrégalos para subdividir ingresos." : "No sub-events configured yet. Add them to subdivide revenue."}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--line)", paddingTop: "20px", marginTop: "10px" }}>
            <button
              type="button"
              className="text-button"
              onClick={handleBackToList}
              style={{ height: "38px", padding: "0 16px", background: "transparent", border: "1px solid var(--line)", color: "var(--ink)" }}
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="button"
              className="text-button"
              onClick={handleSave}
              style={{ height: "38px", padding: "0 18px", background: "var(--accent, #6366f1)", color: "var(--white)" }}
            >
              <Check size={16} style={{ marginRight: 6 }} />
              {language === "es" ? "Guardar Evento" : "Save Event"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Render Empty State (No custom events created yet)
  if (sortedCustomEvents.length === 0) {
    return (
      <section className="panel" style={{ padding: "64px 20px", textAlign: "center", background: "var(--white)", border: "1px solid var(--line)", borderRadius: "16px" }}>
        <Calendar size={48} style={{ color: "var(--accent, #6366f1)", marginBottom: "16px", opacity: 0.8 }} />
        <h2 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "8px", color: "var(--ink)" }}>
          {language === "es" ? "Agrupación de Eventos y Sub-eventos" : "Event Groupings & Sub-events"}
        </h2>
        <p style={{ maxWidth: "460px", margin: "0 auto 24px auto", color: "var(--muted)", fontSize: "0.85rem", lineHeight: "1.5" }}>
          {language === "es" 
            ? "Agrupa múltiples álbumes de Lumepic para ver sus estadísticas consolidadas y luego sepáralos en sub-eventos específicos (ej. Carreras de Sábado 5K vs Domingo 21K) ingresando las fechas correspondientes." 
            : "Group multiple Lumepic albums to view consolidated statistics, then split them into specific sub-events (e.g. Saturday 5K vs Sunday 21K races) by defining their dates."}
        </p>
        <button
          className="text-button"
          onClick={handleStartCreate}
          style={{ height: "40px", padding: "0 18px", background: "var(--accent, #6366f1)", color: "var(--white)" }}
        >
          <Plus size={16} style={{ marginRight: 6 }} />
          {language === "es" ? "Configurar Agrupación de Evento" : "Set Up Event Grouping"}
        </button>
      </section>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Event Selector Header */}
      <section className="panel" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--muted)" }}>
                {language === "es" ? "EVENTO:" : "EVENT:"}
              </span>
              <select
                value={selectedEventId || ""}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  userHasSelectedEventRef.current = true;
                }}
                style={{
                  height: "36px",
                  padding: "0 12px 0 8px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--paper-2)",
                  color: "var(--ink)",
                  fontWeight: "700",
                  fontSize: "0.88rem",
                  cursor: "pointer"
                }}
              >
                {sortedCustomEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedEvent && selectedEvent.subEvents && selectedEvent.subEvents.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--muted)" }}>
                  {language === "es" ? "STATS DE:" : "STATS FOR:"}
                </span>
                <select
                  value={selectedSubEventFilter}
                  onChange={(e) => setSelectedSubEventFilter(e.target.value)}
                  style={{
                    height: "36px",
                    padding: "0 12px 0 8px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--paper-2)",
                    color: "var(--ink)",
                    fontWeight: "700",
                    fontSize: "0.88rem",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">
                    {language === "es" ? "Todo el Evento (Consolidado)" : "Entire Event (Consolidated)"}
                  </option>
                  {eventDetails?.subEvents.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({formatDateOnly(sub.date, language)})
                    </option>
                  ))}
                  {eventDetails && eventDetails.unclassified && eventDetails.unclassified.revenue > 0 && (
                    <option value="unclassified">
                      {eventDetails.unclassified.name}
                    </option>
                  )}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {currentViewEvent && (
              <button
                className="text-button"
                onClick={() => handleStartEdit(currentViewEvent)}
                style={{ height: "34px", padding: "0 12px", background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink)", fontSize: "0.78rem" }}
              >
                <Edit3 size={13} style={{ marginRight: 6 }} />
                {language === "es" ? "Editar Agrupación" : "Edit Grouping"}
              </button>
            )}
            <button
              className="text-button"
              onClick={handleStartCreate}
              style={{ height: "34px", padding: "0 12px", background: "var(--ink)", color: "var(--white)", fontSize: "0.78rem" }}
            >
              <Plus size={13} style={{ marginRight: 6 }} />
              {language === "es" ? "Nuevo Evento" : "New Event"}
            </button>
            {selectedEventId && (
              <button
                className="icon-button"
                onClick={() => {
                  if (confirm(language === "es" ? "¿Seguro que deseas eliminar esta agrupación de evento?" : "Are you sure you want to delete this event grouping?")) {
                    onDeleteEvent(selectedEventId);
                    setSelectedEventId(null);
                  }
                }}
                style={{ background: "transparent", border: "1px solid var(--line)", cursor: "pointer", padding: "8px", borderRadius: "8px", color: "var(--red, #ef4444)" }}
                title={language === "es" ? "Eliminar evento" : "Delete event"}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
        {currentViewEvent && (
          <div style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "0.82rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)" }}>
              <FolderSync size={15} style={{ color: "var(--accent, #6366f1)" }} />
              <span>{language === "es" ? "Carpeta local vinculada:" : "Linked local folder:"}</span>
              {currentViewEvent.localDirName ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--ink)", fontWeight: "700" }}>
                  <FolderOpen size={14} style={{ color: "var(--accent, #6366f1)" }} />
                  {currentViewEvent.localDirName}
                </span>
              ) : (
                <em style={{ color: "var(--muted)", fontWeight: "normal" }}>
                  {language === "es" ? "Ninguna carpeta local vinculada" : "No local folder linked"}
                </em>
              )}
            </div>
            <div>
              {currentViewEvent.localDirName ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    onClick={() => onLinkEventFolder(currentViewEvent.id)}
                    className="text-link-btn"
                    style={{ color: "var(--accent, #6366f1)", border: "none", background: "none", cursor: "pointer", fontWeight: "600", textDecoration: "underline", padding: 0 }}
                  >
                    {language === "es" ? "Cambiar Carpeta" : "Change Folder"}
                  </button>
                  <span style={{ color: "var(--line)" }}>|</span>
                  <button
                    onClick={() => onUnlinkEventFolder(currentViewEvent.id)}
                    className="text-link-btn"
                    style={{ color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontWeight: "600", textDecoration: "underline", padding: 0 }}
                  >
                    {language === "es" ? "Desvincular" : "Unlink"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onLinkEventFolder(currentViewEvent.id)}
                  className="text-button"
                  style={{
                    height: "28px",
                    padding: "0 12px",
                    fontSize: "0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    background: "var(--white)",
                    color: "var(--ink)",
                    cursor: "pointer",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <FolderOpen size={12} />
                  {language === "es" ? "Vincular Carpeta" : "Link Folder"}
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {eventDetails && (
        <>
          {/* KPI Grid (Either consolidated or sub-event filtered) */}
          <KpiGrid totals={displayedTotals || eventDetails.totals} language={language} />

          {/* Sub-events Breakdown Section */}
          <section className="panel" style={{ padding: "20px" }}>
            <header className="panel-header" style={{ marginBottom: "20px" }}>
              <div>
                <h2>{language === "es" ? "Desglose por Sub-eventos" : "Sub-events Breakdown"}</h2>
                <p style={{ marginBottom: "6px" }}>
                  {language === "es" 
                    ? "Distribución financiera y volumen de ventas imputado a cada sub-evento según la fecha de las fotos." 
                    : "Financial distribution and sales volume mapped to each sub-event based on photo dates."}
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px", opacity: 0.85 }}>
                  <span style={{ display: "inline-flex", flexShrink: 0 }}><Calendar size={13} style={{ color: "var(--accent, #6366f1)" }} /></span>
                  {language === "es"
                    ? "Puedes vincular una carpeta general para todo el evento (arriba), o carpetas individuales para cada sub-evento (abajo). Si no vinculas una carpeta de sub-evento, se usará la carpeta del evento general como respaldo."
                    : "You can link a general folder for the entire event (above), or individual folders for each sub-event (below). If a sub-event has no folder linked, the general event folder will be used as a fallback."}
                </p>
              </div>
              <Calendar size={21} style={{ color: "var(--accent, #6366f1)" }} />
            </header>

            {/* Visual Progress Bar Chart */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "16px", background: "var(--paper-2)", borderRadius: "12px", border: "1px solid var(--line)", marginBottom: "24px" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase" }}>
                {language === "es" ? "Participación en los Ingresos Netos" : "Net Revenue Share Breakdown"}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {eventDetails.subEvents.map((sub) => {
                  const pct = eventDetails.totals.revenue > 0 ? (sub.revenue / eventDetails.totals.revenue) * 100 : 0;
                  return (
                    <div key={sub.date} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                        <span style={{ fontWeight: "700", color: "var(--ink)" }}>{sub.name} ({formatDateOnly(sub.date, language)})</span>
                        <span style={{ fontWeight: "800", color: "var(--ink)" }}>{money.format(sub.revenue)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "var(--line-soft)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #a855f7)", borderRadius: "4px" }} />
                      </div>
                    </div>
                  );
                })}
                {/* Unclassified bar */}
                {eventDetails.unclassified.revenue > 0 && (() => {
                  const pct = eventDetails.totals.revenue > 0 ? (eventDetails.unclassified.revenue / eventDetails.totals.revenue) * 100 : 0;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                        <span style={{ fontWeight: "700", color: "var(--muted)" }}>{eventDetails.unclassified.name}</span>
                        <span style={{ fontWeight: "800", color: "var(--muted)" }}>{money.format(eventDetails.unclassified.revenue)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "var(--line-soft)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "var(--muted)", borderRadius: "4px", opacity: 0.5 }} />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{language === "es" ? "Sub-evento" : "Sub-event"}</th>
                    <th>{language === "es" ? "Fecha" : "Date"}</th>
                    <th>{language === "es" ? "Ingresos Netos" : "Net Revenue"}</th>
                    <th>{language === "es" ? "Porcentaje" : "Percentage"}</th>
                    <th>{language === "es" ? "Ventas Imputadas" : "Mapped Sales"}</th>
                    <th>{language === "es" ? "Fotos Vendidas" : "Photos Sold"}</th>
                    <th>{language === "es" ? "Carpeta Local" : "Local Folder"}</th>
                  </tr>
                </thead>
                <tbody>
                  {eventDetails.subEvents.map((sub) => {
                    const pct = eventDetails.totals.revenue > 0 ? (sub.revenue / eventDetails.totals.revenue) * 100 : 0;
                    return (
                      <tr key={sub.date}>
                        <td data-label="Sub-evento"><strong>{sub.name}</strong></td>
                        <td data-label="Fecha">{formatDateOnly(sub.date, language)}</td>
                        <td data-label="Ingresos Netos">{money.format(sub.revenue)}</td>
                        <td data-label="Porcentaje">{pct.toFixed(1)}%</td>
                        <td data-label="Ventas Imputadas">{sub.salesCount.toFixed(1)}</td>
                        <td data-label="Fotos Vendidas">{Math.round(sub.photosSold)}</td>
                        <td data-label={language === "es" ? "Carpeta Local" : "Local Folder"}>
                          {sub.localDirName ? (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <span style={{
                                maxWidth: "120px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontWeight: "600",
                                color: "var(--ink)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }} title={sub.localDirName}>
                                <FolderOpen size={12} style={{ color: "var(--accent, #6366f1)" }} />
                                {sub.localDirName}
                              </span>
                              <button
                                onClick={() => onLinkSubEventFolder(selectedEventId!, sub.id)}
                                style={{ border: "none", background: "none", cursor: "pointer", color: "var(--accent, #6366f1)", padding: 0, fontSize: "0.72rem", textDecoration: "underline" }}
                              >
                                {language === "es" ? "Cambiar" : "Change"}
                              </button>
                              <span style={{ color: "var(--line)" }}>|</span>
                              <button
                                onClick={() => onUnlinkSubEventFolder(selectedEventId!, sub.id)}
                                style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444", padding: 0, fontSize: "0.72rem", textDecoration: "underline" }}
                              >
                                {language === "es" ? "Quitar" : "Remove"}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onLinkSubEventFolder(selectedEventId!, sub.id)}
                              className="text-button"
                              style={{
                                height: "24px",
                                padding: "0 8px",
                                fontSize: "0.7rem",
                                borderRadius: "4px",
                                border: "1px solid var(--line)",
                                background: "var(--white)",
                                color: "var(--ink)",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <FolderOpen size={10} />
                              {language === "es" ? "Vincular" : "Link"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Unclassified Row */}
                  {eventDetails.unclassified.revenue > 0 && (
                    <tr style={{ background: "rgba(0, 0, 0, 0.02)" }}>
                      <td data-label="Sub-evento"><em>{eventDetails.unclassified.name}</em></td>
                      <td data-label="Fecha">-</td>
                      <td data-label="Ingresos Netos">{money.format(eventDetails.unclassified.revenue)}</td>
                      <td data-label="Porcentaje">{(eventDetails.totals.revenue > 0 ? (eventDetails.unclassified.revenue / eventDetails.totals.revenue) * 100 : 0).toFixed(1)}%</td>
                      <td data-label="Ventas Imputadas">{eventDetails.unclassified.salesCount.toFixed(1)}</td>
                      <td data-label="Fotos Vendidas">{Math.round(eventDetails.unclassified.photosSold)}</td>
                      <td data-label={language === "es" ? "Carpeta Local" : "Local Folder"}>-</td>
                    </tr>
                  )}
                  {eventDetails.subEvents.length === 0 && eventDetails.unclassified.revenue === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: "20px" }}>
                        {language === "es" ? "Ninguna venta registrada para los álbumes seleccionados." : "No sales recorded for the selected albums."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* List of Connected Albums */}
          <section className="panel" style={{ padding: "20px" }}>
            <header className="panel-header" style={{ marginBottom: "16px" }}>
              <div>
                <h2>{language === "es" ? "Álbumes Conectados en este Evento" : "Connected Albums in this Event"}</h2>
                <p>{language === "es" ? "Listado de álbumes de Lumepic que alimentan los datos del evento." : "List of Lumepic albums feeding statistics into this event."}</p>
              </div>
              <Album size={21} />
            </header>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{language === "es" ? "Álbum" : "Album"}</th>
                    <th>{language === "es" ? "Perfil" : "Profile"}</th>
                    <th>{language === "es" ? "Visitas" : "Views"}</th>
                    <th>{language === "es" ? "Ingresos Totales" : "Total Revenue"}</th>
                    <th>{language === "es" ? "Fotos Publicadas" : "Uploaded Photos"}</th>
                    <th>{language === "es" ? "Fotos Vendidas" : "Sold Photos"}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEvent?.albumIds.map(id => {
                    const alb = albumMap[id];
                    if (!alb) return null;
                    return (
                      <tr key={id}>
                        <td data-label="Álbum"><strong>{alb.title}</strong></td>
                        <td data-label="Perfil">{alb.profileLabel}</td>
                        <td data-label="Visitas">{compact.format(alb.views)}</td>
                        <td data-label="Ingresos Totales">{money.format(alb.revenue)}</td>
                        <td data-label="Fotos Publicadas">{compact.format(alb.photos)}</td>
                        <td data-label="Fotos Vendidas">{alb.soldPhotos}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
export function Dashboard() {
  const [rawDashboard, setRawDashboard] = useState<DashboardPayload | null>(null);
  const [customProfileLabels, setCustomProfileLabels] = useState<Record<string, string>>({});
  const [activeView, setActiveView] = useState("consolidated");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Custom Events State
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);

  // Global Lightbox and Local Directory states
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<GalleryPhotoItem | null>(null);
  const [lightboxPhotoList, setLightboxPhotoList] = useState<GalleryPhotoItem[]>([]);
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const [localSearchStatus, setLocalSearchStatus] = useState<"idle" | "searching" | "found" | "not_found" | "permission_denied">("idle");
  const [lightboxImageLoaded, setLightboxImageLoaded] = useState(false);
  const [localDirHandle, setLocalDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [localDirName, setLocalDirName] = useState<string | null>(null);

  // Reset lightboxImageLoaded when localPhotoUrl changes or activeLightboxPhoto changes
  useEffect(() => {
    setLightboxImageLoaded(false);
  }, [localPhotoUrl, activeLightboxPhoto]);
  
  // Track active folder being searched for current photo (event folder or global fallback)
  const [activeDirHandle, setActiveDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [activeDirName, setActiveDirName] = useState<string | null>(null);
  const [copiedLightboxId, setCopiedLightboxId] = useState<string | null>(null);
  const [permissionRetry, setPermissionRetry] = useState(0);
  const [resolvedLocalUrls, setResolvedLocalUrls] = useState<Record<string, string>>({});
  const [visiblePhotoKeys, setVisiblePhotoKeys] = useState<Record<string, boolean>>({});

  // Clean up resolved local URLs that are no longer needed (neither visible in gallery nor active in lightbox)
  useEffect(() => {
    const activeLightboxKey = activeLightboxPhoto ? `${activeLightboxPhoto.id}_${activeLightboxPhoto.sale.id}` : null;
    
    setResolvedLocalUrls(prev => {
      let changed = false;
      const next = { ...prev };
      
      Object.entries(prev).forEach(([key, url]) => {
        const isCurrentlyOpenInLightbox = key === activeLightboxKey;
        const isVisibleInGallery = !!visiblePhotoKeys[key];
        
        if (!isCurrentlyOpenInLightbox && !isVisibleInGallery) {
          URL.revokeObjectURL(url);
          delete next[key];
          changed = true;
        }
      });
      
      return changed ? next : prev;
    });
  }, [activeLightboxPhoto, visiblePhotoKeys]);

  // Load local directory handle on startup
  useEffect(() => {
    async function loadDirectory() {
      const handle = await getLocalDirectoryHandle();
      if (handle) {
        setLocalDirHandle(handle);
        setLocalDirName(handle.name);
      }
    }
    loadDirectory();
  }, []);

  // Map of all albums in the system for quick title/date lookups inside Dashboard search effect
  const albumMap = useMemo(() => {
    const map: Record<string, AlbumInsight> = {};
    if (rawDashboard) {
      rawDashboard.profiles.forEach(profile => {
        profile.albums.forEach(album => {
          map[album.id] = album;
        });
      });
    }
    return map;
  }, [rawDashboard]);

  // Decides whether to show the local high-res photo or the remote web preview fallback
  const imageSrc = useMemo(() => {
    if (!activeLightboxPhoto) return "";
    if (localPhotoUrl) return localPhotoUrl;
    return activeLightboxPhoto.url || activeLightboxPhoto.thumbnailUrl || "";
  }, [activeLightboxPhoto, localPhotoUrl]);

  // Search local folder for the active lightbox photo
  useEffect(() => {
    let active = true;
    let currentUrl: string | null = null;

    async function searchPhoto() {
      if (!activeLightboxPhoto) {
        setLocalPhotoUrl(null);
        setLocalSearchStatus("idle");
        setActiveDirHandle(null);
        setActiveDirName(null);
        return;
      }

      try {
        // 1. Resolve which directory handle to use (sub-event, event-specific, or global fallback)
        let dirHandle = null;
        let dirName = null;
        const matchedEvent = customEvents.find(e => e.albumIds.includes(activeLightboxPhoto.albumId));
        const photoDate = getPhotoDate(activeLightboxPhoto, activeLightboxPhoto.sale, albumMap);
        let matchedSubEvent = null;
        
        if (matchedEvent) {
          // A. Try sub-event folder first if photo date maps to a sub-event with configured directory
          matchedSubEvent = matchedEvent.subEvents.find(s => s.date === photoDate);
          
          if (matchedSubEvent && matchedSubEvent.localDirName) {
            dirHandle = await getLocalDirectoryHandleForSubEvent(matchedEvent.id, matchedSubEvent.id);
            dirName = matchedSubEvent.localDirName;
          }
          
          // B. Fallback to event-specific folder if no sub-event folder is loaded
          if (!dirHandle && matchedEvent.localDirName) {
            dirHandle = await getLocalDirectoryHandleForEvent(matchedEvent.id);
            dirName = matchedEvent.localDirName;
          }
        }
        
        // C. Fallback to global directory folder if no event or sub-event folder is configured or handle is null
        if (!dirHandle) {
          dirHandle = localDirHandle;
          if (!dirName) {
            dirName = localDirName;
          }
        }

        // Debugging logs to trace path resolution
        console.log("[searchPhoto] Active Photo:", {
          id: activeLightboxPhoto.id,
          fileName: activeLightboxPhoto.originalFileName,
          albumId: activeLightboxPhoto.albumId,
          takenDate: activeLightboxPhoto.takenDate,
          resolvedDate: photoDate
        });
        console.log("[searchPhoto] Resolution Info:", {
          matchedEventName: matchedEvent?.name,
          matchedSubEventName: matchedSubEvent?.name,
          matchedSubEventDirName: matchedSubEvent?.localDirName,
          resolvedDirName: dirName,
          resolvedDirHandleName: dirHandle?.name || "null",
          usingGlobalFallback: dirHandle === localDirHandle && !!localDirHandle
        });

        if (!active) return;
        setActiveDirHandle(dirHandle);
        setActiveDirName(dirName);

        if (!dirHandle) {
          setLocalPhotoUrl(null);
          setLocalSearchStatus("idle");
          return;
        }

        // Cache lookup
        const cacheKey = `${activeLightboxPhoto.id}_${activeLightboxPhoto.sale.id}`;
        if (resolvedLocalUrls[cacheKey]) {
          setLocalPhotoUrl(resolvedLocalUrls[cacheKey]);
          setLocalSearchStatus("found");
          return;
        }

        setLocalSearchStatus("searching");
        setLocalPhotoUrl(null);

        const hasPermission = await verifyDirectoryPermission(dirHandle, false);
        if (!active) return;
        if (!hasPermission) {
          setLocalSearchStatus("permission_denied");
          return;
        }

        const fileName = activeLightboxPhoto.originalFileName;
        if (!fileName) {
          setLocalSearchStatus("not_found");
          return;
        }

        const fileHandle = await findLocalPhotoHandle(dirHandle, fileName);
        if (!active) return;

        if (fileHandle) {
          const file = await fileHandle.getFile();
          if (!active) return;
          const url = URL.createObjectURL(file);
          currentUrl = url;
          setResolvedLocalUrls(prev => ({ ...prev, [cacheKey]: url }));
          setLocalPhotoUrl(url);
          setLocalSearchStatus("found");
        } else {
          setLocalSearchStatus("not_found");
        }
      } catch (err) {
        console.error("Error retrieving local file:", err);
        if (active) {
          setLocalSearchStatus("not_found");
        }
      }
    }

    searchPhoto();

    return () => {
      active = false;
    };
  }, [activeLightboxPhoto, localDirHandle, localDirName, customEvents, permissionRetry, resolvedLocalUrls, albumMap]);

  const handleOpenLightbox = (photo: GalleryPhotoItem, list?: GalleryPhotoItem[]) => {
    setActiveLightboxPhoto(photo);
    setLightboxPhotoList(list || [photo]);
  };

  const handlePrevLightboxPhoto = useCallback(() => {
    if (!activeLightboxPhoto || lightboxPhotoList.length === 0) return;
    const currentIndex = lightboxPhotoList.findIndex(
      p => p.id === activeLightboxPhoto.id && p.sale.id === activeLightboxPhoto.sale.id
    );
    if (currentIndex > 0) {
      setActiveLightboxPhoto(lightboxPhotoList[currentIndex - 1]);
    }
  }, [activeLightboxPhoto, lightboxPhotoList]);

  const handleNextLightboxPhoto = useCallback(() => {
    if (!activeLightboxPhoto || lightboxPhotoList.length === 0) return;
    const currentIndex = lightboxPhotoList.findIndex(
      p => p.id === activeLightboxPhoto.id && p.sale.id === activeLightboxPhoto.sale.id
    );
    if (currentIndex >= 0 && currentIndex < lightboxPhotoList.length - 1) {
      setActiveLightboxPhoto(lightboxPhotoList[currentIndex + 1]);
    }
  }, [activeLightboxPhoto, lightboxPhotoList]);

  useEffect(() => {
    if (!activeLightboxPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevLightboxPhoto();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextLightboxPhoto();
      } else if (e.key === "Escape") {
        setActiveLightboxPhoto(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeLightboxPhoto, handlePrevLightboxPhoto, handleNextLightboxPhoto]);

  const handleLinkActiveFolder = async () => {
    try {
      if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
        alert(language === "es"
          ? "Tu navegador no soporta el acceso al sistema de archivos local. Por favor usa Chrome, Edge u otro navegador compatible."
          : "Your browser does not support local file system access. Please use Chrome, Edge, or another compatible browser.");
        return;
      }
      if (!activeLightboxPhoto) return;
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      if (handle) {
        const matchedEvent = customEvents.find(e => e.albumIds.includes(activeLightboxPhoto.albumId));
        if (matchedEvent) {
          await setLocalDirectoryHandleForEvent(matchedEvent.id, handle);
          const updated = customEvents.map(e => e.id === matchedEvent.id ? { ...e, localDirName: handle.name } : e);
          setCustomEvents(updated);
          try {
            localStorage.setItem("lumepic_custom_events", JSON.stringify(updated));
          } catch (e) {
            console.error("Error saving event folder link:", e);
          }
          
          const matched = updated.find(e => e.id === matchedEvent.id);
          if (matched) {
            try {
              await fetch("/api/lumepic/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(matched)
              });
            } catch (e) {
              console.error("Error saving event folder link to API:", e);
            }
          }
        } else {
          await setLocalDirectoryHandle(handle);
          setLocalDirHandle(handle);
          setLocalDirName(handle.name);
        }
        setActiveDirHandle(handle);
        setActiveDirName(handle.name);
        setLocalSearchStatus("idle");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error linking folder:", err);
      }
    }
  };

  const handleUnlinkActiveFolder = async () => {
    if (!activeLightboxPhoto) return;
    const matchedEvent = customEvents.find(e => e.albumIds.includes(activeLightboxPhoto.albumId));
    if (matchedEvent) {
      const photoDate = getPhotoDate(activeLightboxPhoto, activeLightboxPhoto.sale, albumMap);
      const matchedSubEvent = matchedEvent.subEvents.find(s => s.date === photoDate);

      if (matchedSubEvent && matchedSubEvent.localDirName) {
        // Unlink sub-event folder
        await setLocalDirectoryHandleForSubEvent(matchedEvent.id, matchedSubEvent.id, null);
        const updated = customEvents.map(e => {
          if (e.id === matchedEvent.id) {
            return {
              ...e,
              subEvents: e.subEvents.map(s => s.id === matchedSubEvent.id ? { ...s, localDirName: null } : s)
            };
          }
          return e;
        });
        setCustomEvents(updated);
        try {
          localStorage.setItem("lumepic_custom_events", JSON.stringify(updated));
        } catch (e) {
          console.error("Error unlinking subevent folder:", e);
        }

        // Set fallback to event folder or global folder
        let fallbackHandle = null;
        let fallbackName = null;
        if (matchedEvent.localDirName) {
          fallbackHandle = await getLocalDirectoryHandleForEvent(matchedEvent.id);
          fallbackName = matchedEvent.localDirName;
        } else {
          fallbackHandle = localDirHandle;
          fallbackName = localDirName;
        }
        setActiveDirHandle(fallbackHandle);
        setActiveDirName(fallbackName);
      } else {
        // Unlink event folder
        await setLocalDirectoryHandleForEvent(matchedEvent.id, null);
        const updated = customEvents.map(e => e.id === matchedEvent.id ? { ...e, localDirName: null } : e);
        setCustomEvents(updated);
        try {
          localStorage.setItem("lumepic_custom_events", JSON.stringify(updated));
        } catch (e) {
          console.error("Error unlinking event folder:", e);
        }

        // Set fallback to global folder
        setActiveDirHandle(localDirHandle);
        setActiveDirName(localDirName);
      }
    } else {
      // Unlink global folder
      await setLocalDirectoryHandle(null);
      setLocalDirHandle(null);
      setLocalDirName(null);
      setActiveDirHandle(null);
      setActiveDirName(null);
    }
    setLocalPhotoUrl(null);
    setLocalSearchStatus("idle");
  };

  const handleLinkEventFolder = async (eventId: string) => {
    try {
      if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
        alert(language === "es"
          ? "Tu navegador no soporta el acceso al sistema de archivos local. Por favor usa Chrome, Edge u otro navegador compatible."
          : "Your browser does not support local file system access. Please use Chrome, Edge, or another compatible browser.");
        return;
      }
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      if (handle) {
        await setLocalDirectoryHandleForEvent(eventId, handle);
        const updated = customEvents.map(e => e.id === eventId ? { ...e, localDirName: handle.name } : e);
        setCustomEvents(updated);
        try {
          localStorage.setItem("lumepic_custom_events", JSON.stringify(updated));
        } catch (e) {
          console.error("Error saving event folder link:", e);
        }

        const matched = updated.find(e => e.id === eventId);
        if (matched) {
          try {
            await fetch("/api/lumepic/events", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(matched)
            });
          } catch (e) {
            console.error("Error saving event folder link to API:", e);
          }
        }
        
        if (activeLightboxPhoto) {
          const matchedEvent = updated.find(e => e.albumIds.includes(activeLightboxPhoto.albumId));
          if (matchedEvent && matchedEvent.id === eventId) {
            setActiveDirHandle(handle);
            setActiveDirName(handle.name);
            setLocalSearchStatus("idle");
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error linking event folder:", err);
      }
    }
  };

  const handleUnlinkEventFolder = async (eventId: string) => {
    await setLocalDirectoryHandleForEvent(eventId, null);
    const updated = customEvents.map(e => e.id === eventId ? { ...e, localDirName: null } : e);
    setCustomEvents(updated);
    try {
      localStorage.setItem("lumepic_custom_events", JSON.stringify(updated));
    } catch (e) {
      console.error("Error unlinking event folder:", e);
    }

    const matched = updated.find(e => e.id === eventId);
    if (matched) {
      try {
        await fetch("/api/lumepic/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(matched)
        });
      } catch (e) {
        console.error("Error saving event folder unlink to API:", e);
      }
    }
    
    if (activeLightboxPhoto) {
      const matchedEvent = updated.find(e => e.albumIds.includes(activeLightboxPhoto.albumId));
      if (matchedEvent && matchedEvent.id === eventId) {
        setActiveDirHandle(null);
        setActiveDirName(null);
        setLocalPhotoUrl(null);
        setLocalSearchStatus("idle");
      }
    }
  };

  const handleLinkSubEventFolder = async (eventId: string, subEventId: string) => {
    try {
      if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
        alert(language === "es"
          ? "Tu navegador no soporta el acceso al sistema de archivos local. Por favor usa Chrome, Edge u otro navegador compatible."
          : "Your browser does not support local file system access. Please use Chrome, Edge, or another compatible browser.");
        return;
      }
      // @ts-ignore
      const handle = await window.showDirectoryPicker();
      if (handle) {
        await setLocalDirectoryHandleForSubEvent(eventId, subEventId, handle);
        const updated = customEvents.map(e => {
          if (e.id === eventId) {
            return {
              ...e,
              subEvents: e.subEvents.map(s => s.id === subEventId ? { ...s, localDirName: handle.name } : s)
            };
          }
          return e;
        });
        setCustomEvents(updated);
        try {
          localStorage.setItem("lumepic_custom_events", JSON.stringify(updated));
        } catch (e) {
          console.error("Error saving subevent folder link:", e);
        }

        const matched = updated.find(e => e.id === eventId);
        if (matched) {
          try {
            await fetch("/api/lumepic/events", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(matched)
            });
          } catch (e) {
            console.error("Error saving subevent folder link to API:", e);
          }
        }
        
        if (activeLightboxPhoto) {
          const matchedEvent = updated.find(e => e.albumIds.includes(activeLightboxPhoto.albumId));
          if (matchedEvent && matchedEvent.id === eventId) {
            const photoDate = getPhotoDate(activeLightboxPhoto, activeLightboxPhoto.sale, albumMap);
            const matchedSub = matchedEvent.subEvents.find(s => s.date === photoDate);
            if (matchedSub && matchedSub.id === subEventId) {
              setActiveDirHandle(handle);
              setActiveDirName(handle.name);
              setLocalSearchStatus("idle");
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error linking subevent folder:", err);
      }
    }
  };

  const handleUnlinkSubEventFolder = async (eventId: string, subEventId: string) => {
    await setLocalDirectoryHandleForSubEvent(eventId, subEventId, null);
    const updated = customEvents.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          subEvents: e.subEvents.map(s => s.id === subEventId ? { ...s, localDirName: null } : s)
        };
      }
      return e;
    });
    setCustomEvents(updated);
    try {
      localStorage.setItem("lumepic_custom_events", JSON.stringify(updated));
    } catch (e) {
      console.error("Error unlinking subevent folder:", e);
    }

    const matched = updated.find(e => e.id === eventId);
    if (matched) {
      try {
        await fetch("/api/lumepic/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(matched)
        });
      } catch (e) {
        console.error("Error saving subevent folder unlink to API:", e);
      }
    }
    
    if (activeLightboxPhoto) {
      const matchedEvent = updated.find(e => e.albumIds.includes(activeLightboxPhoto.albumId));
      if (matchedEvent && matchedEvent.id === eventId) {
        const photoDate = getPhotoDate(activeLightboxPhoto, activeLightboxPhoto.sale, albumMap);
        const matchedSub = matchedEvent.subEvents.find(s => s.date === photoDate);
        if (matchedSub && matchedSub.id === subEventId) {
          let fallbackHandle = null;
          let fallbackName = null;
          if (matchedEvent.localDirName) {
            fallbackHandle = await getLocalDirectoryHandleForEvent(matchedEvent.id);
            fallbackName = matchedEvent.localDirName;
          } else {
            fallbackHandle = localDirHandle;
            fallbackName = localDirName;
          }
          setActiveDirHandle(fallbackHandle);
          setActiveDirName(fallbackName);
          setLocalPhotoUrl(null);
          setLocalSearchStatus("idle");
        }
      }
    }
  };

  const handleCopyLightboxFileName = (fileName: string, photoId: string) => {
    navigator.clipboard.writeText(fileName);
    setCopiedLightboxId(photoId);
    setTimeout(() => setCopiedLightboxId(null), 1500);
  };

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

  // Cargar eventos personalizados desde la API con fallback a LocalStorage
  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch("/api/lumepic/events");
        if (response.ok) {
          const data = await response.json();
          setCustomEvents(data);
          localStorage.setItem("lumepic_custom_events", JSON.stringify(data));
        } else {
          const savedEvents = localStorage.getItem("lumepic_custom_events");
          if (savedEvents) setCustomEvents(JSON.parse(savedEvents));
        }
      } catch (e) {
        console.error("Error loading events from API:", e);
        const savedEvents = localStorage.getItem("lumepic_custom_events");
        if (savedEvents) setCustomEvents(JSON.parse(savedEvents));
      }
    }
    loadEvents();
  }, []);

  // Sincronizar activeView con los perfiles cargados (si es un ID de perfil que ya no existe, volver a consolidado)
  useEffect(() => {
    if (dashboard && activeView !== "consolidated" && activeView !== "events" && activeView !== "clients" && activeView !== "watcher" && activeView !== "gallery" && activeView !== "culling") {
      const exists = dashboard.profiles.some(p => p.id === activeView);
      if (!exists) {
        handleSetActiveView("consolidated");
      }
    }
  }, [dashboard, activeView]);
  const handleSaveEvent = async (event: CustomEvent, subEventHandles?: Record<string, FileSystemDirectoryHandle | null>) => {
    let updated: CustomEvent[] = [];
    const exists = customEvents.some(e => e.id === event.id);
    if (exists) {
      updated = customEvents.map(e => (e.id === event.id ? event : e));
    } else {
      updated = [...customEvents, event];
    }
    setCustomEvents(updated);
    try {
      await fetch("/api/lumepic/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event)
      });
      localStorage.setItem("lumepic_custom_events", JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving event to API:", e);
      try {
        localStorage.setItem("lumepic_custom_events", JSON.stringify(updated));
      } catch (_) {}
    }

    if (subEventHandles) {
      for (const [subEventId, handle] of Object.entries(subEventHandles)) {
        await setLocalDirectoryHandleForSubEvent(event.id, subEventId, handle);
      }
    }

    const originalEvent = customEvents.find(e => e.id === event.id);
    if (originalEvent) {
      const activeSubEventIds = new Set(event.subEvents.map(s => s.id));
      for (const oldSub of originalEvent.subEvents) {
        if (!activeSubEventIds.has(oldSub.id)) {
          await setLocalDirectoryHandleForSubEvent(event.id, oldSub.id, null);
        }
      }
    }

    if (activeLightboxPhoto) {
      const matchedEvent = updated.find(e => e.albumIds.includes(activeLightboxPhoto.albumId));
      if (matchedEvent && matchedEvent.id === event.id) {
        const photoDate = getPhotoDate(activeLightboxPhoto, activeLightboxPhoto.sale, albumMap);
        const matchedSub = matchedEvent.subEvents.find(s => s.date === photoDate);
        if (matchedSub) {
          const handle = await getLocalDirectoryHandleForSubEvent(event.id, matchedSub.id);
          if (handle) {
            setActiveDirHandle(handle);
            setActiveDirName(handle.name);
            setLocalSearchStatus("idle");
          } else {
            let fallbackHandle = null;
            if (event.localDirName) {
              fallbackHandle = await getLocalDirectoryHandleForEvent(event.id);
            }
            if (!fallbackHandle) {
              fallbackHandle = await getLocalDirectoryHandle();
            }
            setActiveDirHandle(fallbackHandle);
            setActiveDirName(fallbackHandle ? fallbackHandle.name : null);
            setLocalSearchStatus("idle");
          }
        }
      }
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const updated = customEvents.filter(e => e.id !== id);
    setCustomEvents(updated);
    try {
      await fetch(`/api/lumepic/events?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      localStorage.setItem("lumepic_custom_events", JSON.stringify(updated));
    } catch (e) {
      console.error("Error deleting event from API:", e);
      try {
        localStorage.setItem("lumepic_custom_events", JSON.stringify(updated));
      } catch (_) {}
    }
  };
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
            const trimmedAlbum = sale.album ? sale.album.trim() : "";
            const bodyText = language === "es"
              ? `Compraron ${sale.photos} ${sale.photos === 1 ? "foto" : "fotos"} de ${trimmedAlbum}. Ganaste ${sale.isComped ? `${money.format(0)} (Bonificado)` : money.format(sale.total)}.`
              : `Bought ${sale.photos} ${sale.photos === 1 ? "photo" : "photos"} of ${trimmedAlbum}. You earned ${sale.isComped ? `${money.format(0)} (Free)` : money.format(sale.total)}.`;

            const title = language === "es"
              ? `¡Nueva venta para ${profileLabel}!`
              : `New sale for ${profileLabel}!`;

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

  const activeFetchControllerRef = useRef<AbortController | null>(null);

  async function loadSummary(forceFetch: boolean = false, limit: number = 500, isBackground: boolean = false) {
    if (!isBackground) {
      setLoading(true);
      setError(null);
    }

    if (activeFetchControllerRef.current) {
      activeFetchControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeFetchControllerRef.current = controller;

    // If not forcing fetch, check localStorage cache first
    if (!forceFetch) {
      try {
        const cached = localStorage.getItem("lumepic_dashboard_cache_v2");
        if (cached) {
          const data = JSON.parse(cached) as DashboardPayload;
          
          const isStaleCache = data && data.profiles && data.profiles.some(p => p.totals.stripeFee === undefined);
          if (isStaleCache) {
            localStorage.removeItem("lumepic_dashboard_cache_v2");
            localStorage.removeItem("lumepic_dashboard_cached_at_v2");
          } else if (data && data.profiles && data.profiles.length > 0) {
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
      const response = await fetch(`/api/lumepic/summary?limit=${limit}${forceFetch ? "&bypassCache=true" : ""}`, {
        cache: "no-store",
        signal: controller.signal
      });
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
    } catch (caught: any) {
      if (caught.name === "AbortError") {
        return;
      }
      if (!isBackground) {
        setError(caught instanceof Error ? caught.message : "No pude cargar los datos");
      } else {
        console.error("Background summary refresh failed:", caught);
      }
    } finally {
      if (activeFetchControllerRef.current === controller) {
        activeFetchControllerRef.current = null;
      }
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
    const initLoad = async () => {
      const cached = localStorage.getItem("lumepic_dashboard_cache_v2");
      if (!cached) {
        // Load first 50 sales to render the page instantly
        await loadSummary(false, 50);
        // Fetch remaining sales silently in the background
        void loadSummary(true, 500, true);
      } else {
        // Hit cache instantly and refresh stale data in background
        await loadSummary(false, 500);
      }
    };
    void initLoad();
  }, []);

  useEffect(() => {
    return () => {
      if (activeFetchControllerRef.current) {
        activeFetchControllerRef.current.abort();
      }
    };
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

  const t = TRANSLATIONS[language];

  const isEventsView = activeView === "events";
  const isClientsView = activeView === "clients";
  const isWatcherView = activeView === "watcher";
  const isGalleryView = activeView === "gallery";
  const isCullingView = activeView === "culling";
  const showConsolidated = activeView === "consolidated";

  const switcherOptions = useMemo(() => {
    interface SwitcherOption {
      id: string;
      label: string;
      icon: React.ReactNode | null;
      dotColor: string | null;
      badge: string | null;
    }

    const opts: SwitcherOption[] = [
      {
        id: "consolidated",
        label: t.consolidated,
        icon: null,
        dotColor: null,
        badge: null
      },
      {
        id: "events",
        label: language === "es" ? "Eventos" : "Events",
        icon: <Calendar size={14} />,
        dotColor: null,
        badge: language === "es" ? "Nuevo" : "New"
      }
    ];

    if (dashboard) {
      dashboard.profiles.forEach(profile => {
        opts.push({
          id: profile.id,
          label: profile.label,
          icon: null,
          dotColor: profile.color,
          badge: null
        });
      });
    }

    opts.push({
      id: "clients",
      label: t.clients,
      icon: <UserRound size={14} />,
      dotColor: null,
      badge: null
    });

    opts.push({
      id: "watcher",
      label: language === "es" ? "Carpeta Watcher" : "Watcher Folder",
      icon: <FolderSync size={14} />,
      dotColor: null,
      badge: null
    });

    opts.push({
      id: "gallery",
      label: language === "es" ? "Galería Vendidas" : "Sold Gallery",
      icon: <Image size={14} />,
      dotColor: null,
      badge: null
    });

    opts.push({
      id: "culling",
      label: "AI Culling",
      icon: <Sparkles size={14} />,
      dotColor: null,
      badge: "Beta"
    });

    return opts;
  }, [dashboard, language, t.consolidated, t.clients]);

  const activeClientKey = selectedClientKey || clients[0]?.key || null;

  if (loading && !dashboard) return <LoadingState language={language} />;

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

  const totals = isClientsView
    ? { revenue: clients.reduce((acc, c) => acc + c.totalSpent, 0), albums: dashboard.consolidated.totals.albums }
    : isWatcherView || isCullingView
      ? { revenue: 0, albums: dashboard.consolidated.totals.albums }
      : isGalleryView
        ? { revenue: dashboard.consolidated.totals.revenue, albums: dashboard.consolidated.totals.albums }
        : (showConsolidated ? dashboard.consolidated.totals : activeProfile?.totals);
  const warnings = [dashboard.warning, !showConsolidated && !isClientsView && !isWatcherView && !isGalleryView && !isCullingView ? activeProfile?.warning : null].filter(Boolean).join(" ");
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
          {/* Desktop Switcher */}
          <div className="profile-switcher desktop-only" aria-label="Dashboard selector">
            {switcherOptions.map((opt) => (
              <button
                key={opt.id}
                className={activeView === opt.id ? "switcher-item active" : "switcher-item"}
                onClick={() => {
                  handleSetActiveView(opt.id);
                  if (opt.id !== "consolidated" && opt.id !== "clients" && opt.id !== "watcher" && opt.id !== "gallery" && opt.id !== "culling") {
                    const profile = dashboard.profiles.find(p => p.id === opt.id);
                    setActiveSaleId(profile?.sales[0]?.id ?? null);
                  }
                }}
                style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
              >
                {opt.icon && <span style={{ marginRight: 6 }}>{opt.icon}</span>}
                {opt.dotColor && <span className="profile-dot" style={{ background: opt.dotColor }} />}
                {opt.label}
                {opt.badge && (
                  <span style={{
                    fontSize: "0.62rem",
                    fontWeight: "bold",
                    background: "var(--accent, #6366f1)",
                    color: "#fff",
                    padding: "2px 6px",
                    borderRadius: "999px",
                    marginLeft: "6px",
                    textTransform: "uppercase"
                  }}>
                    {opt.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Mobile Switcher (Burger Dropdown) */}
          <div className="mobile-switcher-container mobile-only">
            <button
              className="mobile-switcher-trigger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={language === "es" ? "Selector de menú" : "Menu selector"}
            >
              <Menu size={20} />
              <div className="mobile-switcher-current">
                {(() => {
                  const currentOpt = switcherOptions.find(o => o.id === activeView);
                  if (!currentOpt) return null;
                  return (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      {currentOpt.dotColor && <span className="profile-dot" style={{ background: currentOpt.dotColor }} />}
                      {currentOpt.icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{currentOpt.icon}</span>}
                      <span>{currentOpt.label}</span>
                      {currentOpt.badge && (
                        <span style={{
                          fontSize: "0.58rem",
                          fontWeight: "bold",
                          background: "var(--accent, #6366f1)",
                          color: "#fff",
                          padding: "1px 5px",
                          borderRadius: "999px",
                          textTransform: "uppercase"
                        }}>
                          {currentOpt.badge}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </button>

            {mobileMenuOpen && (
              <>
                <div className="mobile-switcher-backdrop" onClick={() => setMobileMenuOpen(false)} />
                <div className="mobile-switcher-dropdown">
                  <div className="mobile-switcher-header">
                    <h3>{language === "es" ? "Navegación" : "Navigation"}</h3>
                    <button className="icon-button" onClick={() => setMobileMenuOpen(false)} style={{ width: 28, height: 28, minHeight: 28, borderRadius: "50%", padding: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div className="mobile-switcher-list">
                    {switcherOptions.map((opt) => (
                      <button
                        key={opt.id}
                        className={activeView === opt.id ? "mobile-switcher-item active" : "mobile-switcher-item"}
                        onClick={() => {
                          handleSetActiveView(opt.id);
                          if (opt.id !== "consolidated" && opt.id !== "clients" && opt.id !== "watcher" && opt.id !== "gallery" && opt.id !== "culling") {
                            const profile = dashboard.profiles.find(p => p.id === opt.id);
                            setActiveSaleId(profile?.sales[0]?.id ?? null);
                          }
                          setMobileMenuOpen(false);
                        }}
                      >
                        {opt.dotColor && <span className="profile-dot" style={{ background: opt.dotColor }} />}
                        {opt.icon && <span className="item-icon">{opt.icon}</span>}
                        <span className="item-label">{opt.label}</span>
                        {opt.badge && (
                          <span className="item-badge">
                            {opt.badge}
                          </span>
                        )}
                        {activeView === opt.id && <Check size={16} className="item-check" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {cacheTime && (
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", whiteSpace: "nowrap" }} title={language === "es" ? "Última actualización de datos" : "Last data update"}>
                {language === "es" ? "Actualizado:" : "Updated:"} {cacheTime}
              </span>
            )}
            <button className="icon-button" onClick={() => void loadSummary(true)} title={t.refresh} disabled={loading}>
              <RefreshCw size={18} className={loading ? "spin" : ""} />
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
              {isEventsView ? "EVT" : isClientsView ? "CLT" : isWatcherView ? "WCH" : isGalleryView ? "GAL" : isCullingView ? "AI" : showConsolidated ? "ALL" : initials(activeProfile?.profile.name ?? "")}
            </div>
            <h2>{isEventsView ? (language === "es" ? "Eventos" : "Events") : isClientsView ? t.clients : isWatcherView ? (language === "es" ? "Watcher Local" : "Local Watcher") : isGalleryView ? (language === "es" ? "Galería" : "Gallery") : isCullingView ? "AI Culling" : showConsolidated ? t.consolidated : activeProfile?.profile.name}</h2>
            <p>
              {isEventsView
                ? (language === "es" ? "Agrupación de ventas" : "Sales grouping")
                : isClientsView
                  ? `${clients.length} ${t.buyersCount}`
                  : isWatcherView
                    ? (language === "es" ? "Sincronizador automático" : "Automatic synchronizer")
                    : isGalleryView
                      ? t.salesAndPaid
                      : isCullingView
                        ? (language === "es" ? "Organizador de fotos (Beta)" : "Photo organizer (Beta)")
                        : showConsolidated
                          ? `${dashboard.profiles.length} ${t.profilesConnected}`
                          : activeProfile?.profile.studio}
            </p>
          </div>
          <nav className="side-nav" aria-label="Dashboard sections">
            {isEventsView ? (
              <>
                <div className="nav-item">
                  <Calendar size={18} />
                  <div>
                    <strong>{language === "es" ? "Agrupación" : "Grouping"}</strong>
                    <span>{customEvents.length} {language === "es" ? "eventos" : "events"}</span>
                  </div>
                </div>
                <div className="nav-item">
                  <TrendingUp size={18} />
                  <div>
                    <strong>{language === "es" ? "Desglose" : "Breakdown"}</strong>
                    <span>{language === "es" ? "Por sub-eventos" : "By sub-events"}</span>
                  </div>
                </div>
                <div className="nav-item">
                  <Activity size={18} />
                  <div>
                    <strong>{language === "es" ? "Análisis" : "Analytics"}</strong>
                    <span>{language === "es" ? "100% Local" : "100% Local"}</span>
                  </div>
                </div>
              </>
            ) : isCullingView ? (
              <>
                <div className="nav-item">
                  <Activity size={18} />
                  <div>
                    <strong>{language === "es" ? "Precisión" : "Accuracy"}</strong>
                    <span>COCO-SSD + Laplacian</span>
                  </div>
                </div>
                <div className="nav-item">
                  <Sparkles size={18} />
                  <div>
                    <strong>{language === "es" ? "Procesador" : "Engine"}</strong>
                    <span>TensorFlow.js (Beta)</span>
                  </div>
                </div>
                <div className="nav-item">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>{language === "es" ? "Estado" : "Status"}</strong>
                    <span>{language === "es" ? "Beta activa" : "Active Beta"}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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

          {isEventsView ? (
            <EventsDashboard
              customEvents={customEvents}
              onSaveEvent={handleSaveEvent}
              onDeleteEvent={handleDeleteEvent}
              allProfiles={dashboard.profiles}
              language={language}
              onLinkEventFolder={handleLinkEventFolder}
              onUnlinkEventFolder={handleUnlinkEventFolder}
              onLinkSubEventFolder={handleLinkSubEventFolder}
              onUnlinkSubEventFolder={handleUnlinkSubEventFolder}
            />
          ) : isGalleryView ? (
            <GalleryDashboard 
              profiles={dashboard.profiles} 
              language={language} 
              onOpenLightbox={handleOpenLightbox} 
              customEvents={customEvents}
              localDirHandle={localDirHandle}
              localDirName={localDirName}
              resolvedLocalUrls={resolvedLocalUrls}
              setResolvedLocalUrls={setResolvedLocalUrls}
              visiblePhotoKeys={visiblePhotoKeys}
              setVisiblePhotoKeys={setVisiblePhotoKeys}
              activeLightboxPhoto={activeLightboxPhoto}
            />
          ) : isCullingView ? (
            <CullingDashboard language={language} />
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
              customEvents={customEvents}
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
              onOpenLightbox={handleOpenLightbox}
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
      {/* Global Lightbox Modal */}
      {activeLightboxPhoto && (
        <div className="lightbox-backdrop" onClick={() => setActiveLightboxPhoto(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => {
              setActiveLightboxPhoto(null);
            }}>
              <X size={20} />
            </button>
            <div className="lightbox-grid">
              <div className="lightbox-image-wrap" style={{ position: "relative" }}>
                {/* Open local file button on top-right of image */}
                {activeDirName && localSearchStatus === "found" && localPhotoUrl && (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (localPhotoUrl) {
                        const newTab = window.open();
                        if (newTab) {
                          newTab.document.write(`
                            <html>
                              <head>
                                <title>${activeLightboxPhoto.originalFileName || "Local File"}</title>
                                <style>
                                  body {
                                    margin: 0;
                                    background: #0e1117;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    min-height: 100vh;
                                    overflow: hidden;
                                  }
                                  img {
                                    max-width: 100%;
                                    max-height: 100vh;
                                    object-fit: contain;
                                    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
                                  }
                                </style>
                              </head>
                              <body>
                                <img src="${localPhotoUrl}" />
                              </body>
                            </html>
                          `);
                          newTab.document.close();
                        }
                      }
                    }}
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      background: "rgba(0, 0, 0, 0.65)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      color: "white",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      zIndex: 5,
                      textDecoration: "none",
                      transition: "all 0.2s ease"
                    }}
                    className="lightbox-open-local-btn"
                    title={language === "es" ? "Abrir archivo local en nueva pestaña" : "Open local file in new tab"}
                  >
                    <ExternalLink size={12} />
                    <span>{language === "es" ? "Abrir archivo local" : "Open local file"}</span>
                  </a>
                )}
                {/* Local status badge on image corner */}
                {activeDirName && localSearchStatus !== "idle" && (
                  <div style={{
                    position: "absolute",
                    top: "16px",
                    left: "16px",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    background: "rgba(0, 0, 0, 0.65)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.78rem",
                    fontWeight: "600",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    zIndex: 5
                  }}>
                    {localSearchStatus === "searching" && (
                      <>
                        <span style={{
                          width: "8px",
                          height: "8px",
                          border: "1px solid white",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                          display: "inline-block"
                        }} />
                        <span>{language === "es" ? "BUSCANDO ALTA..." : "SEARCHING HD..."}</span>
                      </>
                    )}
                    {localSearchStatus === "found" && !lightboxImageLoaded && (
                      <>
                        <span style={{
                          width: "8px",
                          height: "8px",
                          border: "1px solid white",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                          display: "inline-block"
                        }} />
                        <span>{language === "es" ? "CARGANDO ALTA..." : "LOADING HD..."}</span>
                      </>
                    )}
                    {localSearchStatus === "found" && lightboxImageLoaded && (
                      <>
                        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                        <span>{language === "es" ? "ALTA RESOLUCIÓN LOCAL" : "LOCAL HIGH-RES"}</span>
                      </>
                    )}
                    {localSearchStatus === "not_found" && (
                      <>
                        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
                        <span>{language === "es" ? "VISTA PREVIA WEB" : "WEB PREVIEW"}</span>
                      </>
                    )}
                    {localSearchStatus === "permission_denied" && (
                      <>
                        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                        <span>{language === "es" ? "ACCESO BLOQUEADO" : "ACCESS DENIED"}</span>
                      </>
                    )}
                  </div>
                )}
                
                {imageSrc ? (
                  <img 
                    src={imageSrc} 
                    alt={activeLightboxPhoto.originalFileName} 
                    onLoad={() => {
                      if (localPhotoUrl && imageSrc === localPhotoUrl) {
                        setLightboxImageLoaded(true);
                      }
                    }}
                  />
                ) : null}
                {lightboxPhotoList.length > 1 && (() => {
                  const currentIndex = lightboxPhotoList.findIndex(
                    p => p.id === activeLightboxPhoto.id && p.sale.id === activeLightboxPhoto.sale.id
                  );
                  const hasPrev = currentIndex > 0;
                  const hasNext = currentIndex >= 0 && currentIndex < lightboxPhotoList.length - 1;
                  return (
                    <>
                      {hasPrev && (
                        <button
                          onClick={handlePrevLightboxPhoto}
                          style={{
                            position: "absolute",
                            left: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.85)",
                            backdropFilter: "blur(4px)",
                            border: "1px solid var(--line)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            color: "var(--ink)",
                            zIndex: 10,
                            transition: "all 0.2s ease"
                          }}
                          title={language === "es" ? "Anterior (Flecha Izquierda)" : "Previous (Left Arrow)"}
                          className="lightbox-nav-btn"
                        >
                          <ChevronLeft size={20} />
                        </button>
                      )}
                      {hasNext && (
                        <button
                          onClick={handleNextLightboxPhoto}
                          style={{
                            position: "absolute",
                            right: "16px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: "rgba(255, 255, 255, 0.85)",
                            backdropFilter: "blur(4px)",
                            border: "1px solid var(--line)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            color: "var(--ink)",
                            zIndex: 10,
                            transition: "all 0.2s ease"
                          }}
                          title={language === "es" ? "Siguiente (Flecha Derecha)" : "Next (Right Arrow)"}
                          className="lightbox-nav-btn"
                        >
                          <ChevronRight size={20} />
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="lightbox-details">
                <h2>{language === "es" ? "Detalle de Fotografía" : "Photograph Detail"}</h2>
                {/* Local Folder Integration Section (Only show if permission is denied and needs action) */}
                {activeDirName && localSearchStatus === "permission_denied" && (
                  <div className="lightbox-plate" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <span style={{ fontSize: "0.8rem", color: "#ef4444", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <AlertTriangle size={14} />
                        {language === "es" ? "Acceso denegado a la carpeta" : "Folder access denied"}
                      </span>
                      <button
                        onClick={() => {
                          if (activeDirHandle) {
                            verifyDirectoryPermission(activeDirHandle, true).then(has => {
                              if (has) {
                                setLocalSearchStatus("idle");
                                setPermissionRetry(prev => prev + 1);
                              }
                            });
                          }
                        }}
                        style={{
                          fontSize: "0.75rem",
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "2px 8px",
                          cursor: "pointer"
                        }}
                      >
                        {language === "es" ? "Permitir" : "Allow"}
                      </button>
                    </div>
                  </div>
                )}
                <div className="lightbox-list">
                  <div style={{ justifyContent: "flex-start", gap: "8px" }}>
                    <strong style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-mono)", fontSize: "0.85rem", textAlign: "left", color: "var(--ink)" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "220px" }} title={activeLightboxPhoto.originalFileName}>
                        {activeLightboxPhoto.originalFileName}
                      </span>
                      <button
                        onClick={() => handleCopyLightboxFileName(activeLightboxPhoto.originalFileName, activeLightboxPhoto.id)}
                        title={language === "es" ? "Copiar nombre" : "Copy name"}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "2px",
                          display: "inline-flex",
                          alignItems: "center",
                          color: copiedLightboxId === activeLightboxPhoto.id ? "var(--green)" : "var(--muted)",
                          transition: "color 0.2s ease"
                        }}
                      >
                        {copiedLightboxId === activeLightboxPhoto.id ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </strong>
                  </div>
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
                {!activeDirName && (
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
