import { demoSummary } from "./lumepic-demo";
import type {
  ActivitySale,
  ConsolidatedPoint,
  ConsolidatedSummary,
  DashboardPayload,
  AlbumInsight,
  DashboardSummary,
  Sale,
  SalePhotograph,
  SalesPoint
} from "./lumepic-types";

const API_BASE_URL = process.env.LUMEPIC_API_BASE_URL || "https://api.lumepic.com";
const PROFILE_COLORS = ["#dceeb1", "#c5b0f4", "#efd4d4", "#c8e6cd", "#f3c9b6"];
const CACHE_TTL_MS = 5 * 60 * 1000;

type AnyRecord = Record<string, unknown>;
type CacheEntry = {
  expiresAt: number;
  value: unknown;
};
type ProfileConfig = {
  id: string;
  label: string;
  token: string;
  color: string;
};

const lumepicCache = new Map<string, CacheEntry>();

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" ? (value as AnyRecord) : {};
}

function arrayFrom(value: unknown): AnyRecord[] {
  if (Array.isArray(value)) return value.map(asRecord);
  const record = asRecord(value);
  for (const key of ["data", "items", "results", "sales", "albums", "photographs"]) {
    if (Array.isArray(record[key])) return (record[key] as unknown[]).map(asRecord);
  }
  return [];
}

function stringFrom(record: AnyRecord, keys: string[], fallback = "Sin datos") {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

function numberFrom(record: AnyRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return fallback;
}

function booleanFrom(record: AnyRecord, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return fallback;
}

function nestedString(record: AnyRecord, keys: string[], fallback = "Sin datos") {
  for (const key of keys) {
    const parts = key.split(".");
    let current: unknown = record;
    for (const part of parts) current = asRecord(current)[part];
    if (typeof current === "string" && current.trim()) return current;
  }
  return fallback;
}

function nestedNumber(record: AnyRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const parts = key.split(".");
    let current: unknown = record;
    for (const part of parts) current = asRecord(current)[part];
    if (typeof current === "number" && Number.isFinite(current)) return current;
    if (typeof current === "string" && Number.isFinite(Number(current))) return Number(current);
  }
  return fallback;
}

function nestedValue(record: AnyRecord, key: string): unknown {
  const parts = key.split(".");
  let current: unknown = record;
  for (const part of parts) current = asRecord(current)[part];
  return current;
}

function normalizeToken(token: string) {
  return token.replace(/^Bearer\s+/i, "").trim();
}

function slugify(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || fallback;
}

function getProfileConfigs(): ProfileConfig[] {
  const parsedProfiles = process.env.LUMEPIC_PROFILES;
  if (parsedProfiles) {
    try {
      const rows = JSON.parse(parsedProfiles) as Array<{
        id?: string;
        label?: string;
        token?: string;
        color?: string;
      }>;
      return rows
        .filter((row) => row.token)
        .map((row, index) => {
          const label = row.label || `Fotografo ${index + 1}`;
          return {
            id: row.id || slugify(label, `profile-${index + 1}`),
            label,
            token: row.token || "",
            color: row.color || PROFILE_COLORS[index % PROFILE_COLORS.length]
          };
        });
    } catch {
      // Fall through to env var profiles.
    }
  }

  const configs: ProfileConfig[] = [];
  for (let index = 1; index <= 5; index += 1) {
    const suffix = index === 1 ? "" : `_${index}`;
    const token = process.env[`LUMEPIC_PHOTOGRAPHER_TOKEN${suffix}`];
    if (!token) continue;
    const label = process.env[`LUMEPIC_PHOTOGRAPHER_LABEL${suffix}`] || `Fotografo ${index}`;
    configs.push({
      id: slugify(label, `profile-${index}`),
      label,
      token,
      color: process.env[`LUMEPIC_PHOTOGRAPHER_COLOR${suffix}`] || PROFILE_COLORS[(index - 1) % PROFILE_COLORS.length]
    });
  }
  return configs;
}

async function lumepicFetch(path: string, token: string) {
  const cacheKey = `${normalizeToken(token).slice(-12)}:${path}`;
  const cached = lumepicCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${normalizeToken(token)}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }

  const value = (await response.json()) as unknown;
  lumepicCache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

function normalizeSale(record: AnyRecord): Sale {
  const buyer = asRecord(record.buyer || record.customer || record.user);
  const album = asRecord(record.album);
  const activity = asRecord(record.activity || album.activity);
  const grossTotal = numberFrom(record, ["sellerRevenue", "totalEarnings", "totalPrice", "total", "amount"], 0);
  const subtotal = numberFrom(record, ["value", "subtotalPrice", "subtotal"], grossTotal);
  const discount = numberFrom(record, ["discountTotal", "discount"], Math.max(subtotal - grossTotal, 0));
  const fees = numberFrom(record, ["fees"], 0);

  return {
    id: stringFrom(record, ["id", "uuid", "_id"], "sale"),
    buyer: stringFrom(buyer, ["name", "fullName", "email"], "Comprador"),
    buyerEmail: stringFrom(buyer, ["email"], ""),
    album: stringFrom(album, ["title", "name"], nestedString(record, ["albumName"], "Album")),
    activity: stringFrom(activity, ["name", "title"], nestedString(record, ["activityName"], "General")),
    status: stringFrom(record, ["status"], "approved"),
    date: stringFrom(record, ["createdAt", "created_at", "approvedAt", "date"], new Date().toISOString()),
    photos: numberFrom(record, ["photographsCount", "photosCount", "quantity", "itemsCount"], 1),
    subtotal,
    discount,
    total: Math.max(grossTotal - fees, 0),
    grossTotal,
    fees,
    isComped: grossTotal <= 0,
    detailsLoaded: false,
    photographs: []
  };
}

function normalizePhotograph(record: AnyRecord): SalePhotograph {
  return {
    id: stringFrom(record, ["id"], ""),
    thumbnailUrl: stringFrom(record, ["thumbnailUrl"], ""),
    url: stringFrom(record, ["url"], ""),
    originalFileName: stringFrom(record, ["originalFileName"], ""),
    albumId: stringFrom(record, ["albumId"], "")
  };
}

function normalizeSalePhotographs(value: unknown): SalePhotograph[] {
  const record = asRecord(value);
  const rows = [
    ...arrayFrom(record.eventPhotographs),
    ...arrayFrom(record.albumPhotographs),
    ...arrayFrom(record.photographs),
    ...arrayFrom(record.items)
  ];
  return rows.map(normalizePhotograph).filter((photo) => photo.thumbnailUrl || photo.url);
}

function normalizeDetailedSale(
  record: AnyRecord,
  summaryRecord: AnyRecord,
  sellerId: string,
  photographs: SalePhotograph[]
): Sale {
  const lineItems = arrayFrom(record.lineItems);
  const sellerLineItems = lineItems.filter((item) => nestedString(item, ["metadata.sellerId"], "") === sellerId);
  const relevantLineItems = sellerLineItems.length ? sellerLineItems : lineItems;
  const relevantLineItemIds = new Set(relevantLineItems.map((item) => stringFrom(item, ["id"], "")));
  const payments = arrayFrom(record.payments);
  const fees = payments
    .flatMap((payment) => arrayFrom(payment.fees))
    .filter((fee) => relevantLineItemIds.has(stringFrom(fee, ["lineItemId"], "")))
    .reduce((sum, fee) => sum + numberFrom(fee, ["amount"], 0), 0);
  const firstLineItem = relevantLineItems[0] || asRecord(record);
  const firstAlbum = asRecord(firstLineItem.album || record.album);
  const firstEvent = asRecord(nestedValue(firstAlbum, "event"));
  const firstActivity = asRecord(firstAlbum.activity || firstEvent.activity || record.activity);
  const firstPayment = payments[0] || {};
  const subtotal = relevantLineItems.reduce((sum, item) => sum + numberFrom(item, ["subtotalPrice"], 0), 0);
  const discount = relevantLineItems.reduce((sum, item) => sum + numberFrom(item, ["discountTotal"], 0), 0);
  const grossTotal =
    numberFrom(summaryRecord, ["sellerRevenue", "totalEarnings"], 0) ||
    relevantLineItems.reduce((sum, item) => sum + numberFrom(item, ["totalPrice"], 0), 0);
  const paidPhotoCount = relevantLineItems.filter((item) => numberFrom(item, ["totalPrice"], 0) > 0).length;

  return {
    id: stringFrom(record, ["id", "uuid", "_id"], stringFrom(summaryRecord, ["id"], "sale")),
    buyer: stringFrom(firstPayment, ["payerName", "payerEmail"], "Comprador bonificado"),
    buyerEmail: stringFrom(firstPayment, ["payerEmail"], ""),
    album: stringFrom(firstAlbum, ["description", "title", "name"], stringFrom(firstEvent, ["name"], "Album")),
    activity: stringFrom(firstActivity, ["name", "title"], "General"),
    status: stringFrom(record, ["status"], stringFrom(summaryRecord, ["status"], "approved")),
    date: stringFrom(record, ["createdAt", "created_at", "approvedAt", "date"], new Date().toISOString()),
    photos: paidPhotoCount || relevantLineItems.length || 1,
    subtotal: subtotal || grossTotal + discount,
    discount,
    total: Math.max(grossTotal - fees, 0),
    grossTotal,
    fees,
    isComped: grossTotal <= 0,
    detailsLoaded: true,
    photographs
  };
}

async function settleDetailedSales(salesRows: AnyRecord[], token: string, sellerId: string) {
  const details: Sale[] = [];
  let failed = 0;

  for (const sale of salesRows) {
    const id = stringFrom(sale, ["id"], "");
    if (!id) {
      details.push(normalizeSale(sale));
      continue;
    }

    try {
      const detail = await lumepicFetch(`/sales/${id}`, token);
      const photographsRaw = await lumepicFetch(
        `/sales/${id}/photographs?pagination[limit]=20&pagination[skip]=0`,
        token
      ).catch(() => ({ eventPhotographs: [], albumPhotographs: [] }));
      details.push(normalizeDetailedSale(asRecord(detail), sale, sellerId, normalizeSalePhotographs(photographsRaw)));
    } catch {
      failed += 1;
      details.push(normalizeSale(sale));
    }
  }

  return { details, failed };
}

function applyEstimatedFees(sales: Sale[], feeRate: number) {
  return sales.map((sale) => {
    if (sale.isComped || sale.fees > 0) return sale;
    const fees = sale.grossTotal * feeRate;
    return {
      ...sale,
      fees,
      total: Math.max(sale.grossTotal - fees, 0)
    };
  });
}

function normalizeAlbum(record: AnyRecord): AlbumInsight {
  return {
    id: stringFrom(record, ["id", "uuid", "_id"], "album"),
    title: stringFrom(record, ["description", "title", "name"], "Album"),
    createdAt: stringFrom(record, ["createdAt", "created_at", "takenDate"], new Date().toISOString()),
    views: numberFrom(record, ["views", "visits", "totalViews"], 0),
    photos: numberFrom(record, ["photographCount", "photographsCount", "photosCount", "totalPhotographs"], 0),
    soldPhotos: numberFrom(record, ["photographsSold", "soldPhotos", "photosSold"], 0),
    sales: numberFrom(record, ["salesCount", "sales", "orders"], 0),
    revenue: numberFrom(record, ["grossSalesAmountInUsd", "revenue", "total", "amount"], 0),
    conversion: numberFrom(record, ["ratio", "conversion", "conversionRate"], 0)
  };
}

function normalizeActivities(value: unknown, sales: Sale[]): ActivitySale[] {
  const rows = arrayFrom(value);
  const fromApi = rows.map((row) => ({
    name: stringFrom(row, ["activity", "activityName", "name", "title"], "General"),
    sales: numberFrom(row, ["salesCount", "sales", "count", "orders"], 0),
    revenue: numberFrom(row, ["salesAmountInUsd", "revenue", "total", "amount"], 0),
    share: numberFrom(row, ["share", "percentage"], 0)
  }));

  const meaningful = fromApi.filter((item) => item.sales || item.revenue);
  if (meaningful.length) return withShare(meaningful);

  const grouped = new Map<string, ActivitySale>();
  for (const sale of sales) {
    const current = grouped.get(sale.activity) || {
      name: sale.activity,
      sales: 0,
      revenue: 0,
      share: 0
    };
    current.sales += 1;
    current.revenue += sale.total;
    grouped.set(sale.activity, current);
  }
  return withShare([...grouped.values()]);
}

function withShare(activities: ActivitySale[]) {
  const totalSales = activities.reduce((sum, item) => sum + item.sales, 0) || 1;
  return activities
    .map((item) => ({ ...item, share: item.share || Math.round((item.sales / totalSales) * 100) }))
    .sort((a, b) => b.revenue - a.revenue);
}

function buildTrend(sales: Sale[]): SalesPoint[] {
  const groups = new Map<string, { label: string; sales: number; revenue: number }>();
  for (const sale of sales) {
    const date = new Date(sale.date);
    if (isNaN(date.getTime())) continue;
    const key = date.toISOString().split("T")[0];
    let current = groups.get(key);
    if (!current) {
      const label = date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      current = { label, sales: 0, revenue: 0 };
      groups.set(key, current);
    }
    current.sales += 1;
    current.revenue += sale.total;
  }
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
  const points = sortedKeys.map((key) => {
    const item = groups.get(key)!;
    return {
      label: item.label,
      sales: item.sales,
      revenue: Number(item.revenue.toFixed(2))
    };
  });
  return points.slice(-8);
}

function normalizeProfile(value: unknown) {
  const record = asRecord(value);
  const fullName = [stringFrom(record, ["firstName"], ""), stringFrom(record, ["lastName"], "")]
    .filter(Boolean)
    .join(" ");
  const personalCodeDiscount = asRecord(record.personalCodeDiscount);
  const code = stringFrom(personalCodeDiscount, ["code"], "");
  return {
    name: stringFrom(record, ["name", "fullName", "displayName"], fullName || "Photographer"),
    email: stringFrom(record, ["email"], "Sin email"),
    studio: nestedString(record, ["studio.name", "company.name", "businessName"], "Lumepic"),
    fidelityCode: code
      ? {
          id: stringFrom(personalCodeDiscount, ["id"], ""),
          code,
          amount: numberFrom(personalCodeDiscount, ["amount"], 0),
          unit: stringFrom(personalCodeDiscount, ["unit"], ""),
          usability: stringFrom(personalCodeDiscount, ["usability"], ""),
          validity: stringFrom(personalCodeDiscount, ["validity"], ""),
          application: stringFrom(personalCodeDiscount, ["application"], ""),
          isSuspended: booleanFrom(personalCodeDiscount, ["isSuspended"], false)
        }
      : undefined
  };
}

async function getLumepicSummaryForProfile(config: ProfileConfig, limit: number = 500): Promise<DashboardSummary> {
  try {
    const token = config.token;
    const [salesRaw, albumsRaw, activityRaw, insightsRaw, publishedRaw, metricsRaw, profileRaw] =
      await Promise.all([
        lumepicFetch(`/sales?pagination%5Blimit%5D=${limit}&pagination%5Bskip%5D=0&status=approved`, token),
        lumepicFetch("/albums?pagination%5Blimit%5D=20&pagination%5Bskip%5D=0&order%5Bfield%5D=CREATED_AT&order%5Bsort%5D=DESC", token),
        lumepicFetch("/dashboard/photographer/sales-by-activity", token),
        lumepicFetch("/dashboard/photographer/albums/insights?order%5B0%5D%5Bfield%5D=CREATED_AT&order%5B0%5D%5Bsort%5D=DESC&pagination%5Blimit%5D=9&pagination%5Bskip%5D=0", token),
        lumepicFetch("/dashboard/photographer/published-albums", token),
        lumepicFetch("/dashboard/photographer/metrics", token),
        lumepicFetch("/users/profile", token)
      ]);

    const profile = normalizeProfile(profileRaw);
    const sellerId = stringFrom(asRecord(profileRaw), ["id"], "");
    const salesRows = arrayFrom(salesRaw);
    const albumInsights = arrayFrom(insightsRaw).map(normalizeAlbum);
    const albumFallbacks = arrayFrom(albumsRaw).map(normalizeAlbum);
    const albums = albumInsights.length ? albumInsights : albumFallbacks;
    const detailResult = sellerId
      ? await settleDetailedSales(salesRows, token, sellerId)
      : { details: salesRows.map(normalizeSale), failed: 0 };
    const observedFeeRate =
      detailResult.details
        .filter((sale) => sale.grossTotal > 0 && sale.fees > 0)
        .reduce(
          (acc, sale) => ({
            fees: acc.fees + sale.fees,
            gross: acc.gross + sale.grossTotal
          }),
          { fees: 0, gross: 0 }
        );
    const feeRate = observedFeeRate.gross ? observedFeeRate.fees / observedFeeRate.gross : 0.2;
    const detailedSales = applyEstimatedFees(detailResult.details, feeRate);
    const paidSales = detailedSales.filter((sale) => !sale.isComped && sale.grossTotal > 0);
    const activities = normalizeActivities(activityRaw, paidSales);
    const published = asRecord(publishedRaw);
    const metrics = asRecord(metricsRaw);
    const earnings = asRecord(metrics.earnings);
    const grossRevenue =
      activities.reduce((sum, activity) => sum + activity.revenue, 0) ||
      paidSales.reduce((sum, sale) => sum + sale.grossTotal, 0);
    const revenue = nestedNumber(earnings, ["totalEarningsInUsd", "earningsByCurrency.usd"], Math.max(grossRevenue - paidSales.reduce((sum, sale) => sum + sale.fees, 0), 0));
    const fees = Math.max(grossRevenue - revenue, 0);
    const loadedPaidSales = paidSales.filter((sale) => sale.detailsLoaded);
    const loadedGross = loadedPaidSales.reduce((sum, sale) => sum + sale.grossTotal, 0);
    const loadedDiscounts = loadedPaidSales.reduce((sum, sale) => sum + sale.discount, 0);
    const discountRate = loadedGross ? loadedDiscounts / loadedGross : 0;
    const missingGross = Math.max(grossRevenue - loadedGross, 0);
    const estimatedMissingDiscounts = missingGross * discountRate;
    const discounts = loadedDiscounts + estimatedMissingDiscounts;
    const subtotal = grossRevenue + discounts;
    const photos =
      numberFrom(metrics, ["numberOfSoldPhotographs"], 0) ||
      albums.reduce((sum, album) => sum + album.soldPhotos, 0) ||
      paidSales.reduce((sum, sale) => sum + sale.photos, 0);
    const publishedPhotos =
      numberFrom(metrics, ["numberOfUploadedPhotographs"], 0) ||
      albums.reduce((sum, album) => sum + album.photos, 0);
    const conversion = numberFrom(metrics, ["rating"], 0) * 100 || (publishedPhotos ? (photos / publishedPhotos) * 100 : 0);

    return {
      id: config.id,
      label: config.label,
      color: config.color,
      currency: "USD",
      source: "live",
      updatedAt: new Date().toISOString(),
      profile,
      totals: {
        revenue,
        grossRevenue,
        subtotal,
        discounts,
        fees,
        sales: numberFrom(metrics, ["salesCount"], paidSales.length),
        orders: numberFrom(asRecord(salesRaw), ["count"], detailedSales.length),
        albums: numberFrom(metrics, ["albumsCount"], nestedNumber(published, ["published", "count", "total"], albums.length)),
        publishedPhotos,
        photos,
        avgOrder: numberFrom(metrics, ["averageTicket"], paidSales.length ? grossRevenue / paidSales.length : 0),
        conversion
      },
      trend: buildTrend(paidSales),
      activities,
      albums,
      sales: detailedSales,
      warning: detailResult.failed
        ? `Algunas ventas no cargaron detalle por limite de Lumepic; estime fees con ${(feeRate * 100).toFixed(1)}%.`
        : undefined
    };
  } catch (error) {
    return {
      ...demoSummary,
      id: config.id,
      label: config.label,
      color: config.color,
      updatedAt: new Date().toISOString(),
      warning: `No pude conectar ${config.label}: ${error instanceof Error ? error.message : "error desconocido"}.`
    };
  }
}

function buildConsolidatedTrend(profiles: DashboardSummary[]): ConsolidatedPoint[] {
  const groups = new Map<string, {
    label: string;
    totalRevenue: number;
    totalSales: number;
    profileRevenues: Record<string, number>;
  }>();

  for (const profile of profiles) {
    for (const sale of profile.sales) {
      if (sale.isComped) continue;
      const date = new Date(sale.date);
      if (isNaN(date.getTime())) continue;
      const key = date.toISOString().split("T")[0];
      
      let current = groups.get(key);
      if (!current) {
        const label = date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
        current = {
          label,
          totalRevenue: 0,
          totalSales: 0,
          profileRevenues: {}
        };
        groups.set(key, current);
      }
      current.totalRevenue += sale.total;
      current.totalSales += 1;
      current.profileRevenues[profile.id] = (current.profileRevenues[profile.id] || 0) + sale.total;
    }
  }

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
  
  const points = sortedKeys.map((key) => {
    const item = groups.get(key)!;
    const point: ConsolidatedPoint = {
      label: item.label,
      totalRevenue: Number(item.totalRevenue.toFixed(2)),
      totalSales: item.totalSales
    };
    for (const profile of profiles) {
      point[profile.id] = Number((item.profileRevenues[profile.id] || 0).toFixed(2));
    }
    return point;
  });

  return points.slice(-10);
}

function buildConsolidatedSummary(profiles: DashboardSummary[]): ConsolidatedSummary {
  const totals = profiles.reduce<DashboardSummary["totals"]>(
    (acc, profile) => {
      acc.revenue += profile.totals.revenue;
      acc.grossRevenue += profile.totals.grossRevenue;
      acc.subtotal += profile.totals.subtotal;
      acc.discounts += profile.totals.discounts;
      acc.fees += profile.totals.fees;
      acc.sales += profile.totals.sales;
      acc.orders += profile.totals.orders;
      acc.albums += profile.totals.albums;
      acc.photos += profile.totals.photos;
      acc.publishedPhotos += profile.totals.publishedPhotos;
      return acc;
    },
    {
      revenue: 0,
      grossRevenue: 0,
      subtotal: 0,
      discounts: 0,
      fees: 0,
      sales: 0,
      orders: 0,
      albums: 0,
      photos: 0,
      publishedPhotos: 0,
      avgOrder: 0,
      conversion: 0
    }
  );

  totals.avgOrder = totals.sales ? totals.grossRevenue / totals.sales : 0;
  totals.conversion = totals.publishedPhotos ? (totals.photos / totals.publishedPhotos) * 100 : 0;

  return {
    currency: "USD",
    totals,
    trend: buildConsolidatedTrend(profiles),
    profiles: profiles.map((profile) => ({
      id: profile.id,
      label: profile.label,
      color: profile.color,
      photographer: profile.profile.name,
      revenue: profile.totals.revenue,
      grossRevenue: profile.totals.grossRevenue,
      sales: profile.totals.sales,
      orders: profile.totals.orders,
      photos: profile.totals.photos,
      avgOrder: profile.totals.avgOrder
    }))
  };
}

export async function getLumepicDashboard(limit: number = 500): Promise<DashboardPayload> {
  const configs = getProfileConfigs();
  const updatedAt = new Date().toISOString();

  if (!configs.length) {
    const profile = {
      ...demoSummary,
      updatedAt,
      warning: "Modo demo: agrega LUMEPIC_PHOTOGRAPHER_TOKEN para conectar datos reales."
    };

    return {
      profiles: [profile],
      consolidated: buildConsolidatedSummary([profile]),
      updatedAt,
      source: "demo",
      warning: profile.warning
    };
  }

  const profiles = await Promise.all(configs.map((config) => getLumepicSummaryForProfile(config, limit)));
  const warnings = profiles.map((profile) => profile.warning).filter(Boolean);

  return {
    profiles,
    consolidated: buildConsolidatedSummary(profiles),
    updatedAt,
    source: profiles.some((profile) => profile.source === "live") ? "live" : "demo",
    warning: warnings.length ? warnings.join(" ") : undefined
  };
}

export async function getLumepicSummary(): Promise<DashboardSummary> {
  const dashboard = await getLumepicDashboard();
  return dashboard.profiles[0] || demoSummary;
}
