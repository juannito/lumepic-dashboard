export type SalesPoint = {
  label: string;
  sales: number;
  revenue: number;
};

export type ConsolidatedPoint = {
  label: string;
  totalRevenue: number;
  totalSales: number;
  [profileId: string]: string | number;
};

export type ActivitySale = {
  name: string;
  sales: number;
  revenue: number;
  share: number;
};

export type AlbumInsight = {
  id: string;
  title: string;
  createdAt: string;
  views: number;
  photos: number;
  soldPhotos: number;
  sales: number;
  revenue: number;
  conversion: number;
};

export type Sale = {
  id: string;
  buyer: string;
  buyerEmail: string;
  album: string;
  activity: string;
  status: string;
  date: string;
  photos: number;
  subtotal: number;
  discount: number;
  total: number;
  grossTotal: number;
  fees: number;
  isComped: boolean;
  detailsLoaded: boolean;
  photographs: SalePhotograph[];
};

export type SalePhotograph = {
  id: string;
  thumbnailUrl: string;
  url: string;
  originalFileName: string;
  albumId: string;
};

export type PhotographerProfile = {
  name: string;
  email: string;
  studio: string;
  fidelityCode?: FidelityCode;
};

export type FidelityCode = {
  id: string;
  code: string;
  amount: number;
  unit: string;
  usability: string;
  validity: string;
  application: string;
  isSuspended: boolean;
};

export type DashboardSummary = {
  id: string;
  label: string;
  color: string;
  currency: string;
  profile: PhotographerProfile;
  totals: {
    revenue: number;
    grossRevenue: number;
    subtotal: number;
    discounts: number;
    fees: number;
    sales: number;
    orders: number;
    albums: number;
    photos: number;
    publishedPhotos: number;
    avgOrder: number;
    conversion: number;
  };
  trend: SalesPoint[];
  activities: ActivitySale[];
  albums: AlbumInsight[];
  sales: Sale[];
  updatedAt: string;
  source: "live" | "demo";
  warning?: string;
};

export type ProfileComparison = {
  id: string;
  label: string;
  color: string;
  photographer: string;
  revenue: number;
  grossRevenue: number;
  sales: number;
  orders: number;
  photos: number;
  avgOrder: number;
};

export type ConsolidatedSummary = {
  currency: string;
  totals: DashboardSummary["totals"];
  trend: ConsolidatedPoint[];
  profiles: ProfileComparison[];
};

export type DashboardPayload = {
  profiles: DashboardSummary[];
  consolidated: ConsolidatedSummary;
  updatedAt: string;
  source: "live" | "demo";
  warning?: string;
};
