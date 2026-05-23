import type { DashboardSummary } from "./lumepic-types";

export const demoSummary: DashboardSummary = {
  id: "demo",
  label: "Demo",
  color: "#dceeb1",
  currency: "USD",
  source: "demo",
  updatedAt: new Date().toISOString(),
  profile: {
    name: "Juan Photographer",
    email: "demo@lumepic.local",
    studio: "LumePic Studio",
    fidelityCode: {
      id: "demo-fidelity-code",
      code: "demo25",
      amount: 25,
      unit: "PERCENTAGE",
      usability: "FIDELITY_CODE",
      validity: "UNLIMITED",
      application: "PURCHASE_TOTAL",
      isSuspended: false
    }
  },
  totals: {
    revenue: 8640,
    grossRevenue: 10800,
    subtotal: 12600,
    discounts: 1800,
    fees: 2160,
    sales: 128,
    orders: 134,
    albums: 19,
    photos: 426,
    publishedPhotos: 5200,
    avgOrder: 67.5,
    conversion: 8.7
  },
  trend: [
    { label: "Feb 01", sales: 11, revenue: 640 },
    { label: "Feb 08", sales: 16, revenue: 960 },
    { label: "Feb 15", sales: 13, revenue: 780 },
    { label: "Feb 22", sales: 19, revenue: 1180 },
    { label: "Mar 01", sales: 22, revenue: 1480 },
    { label: "Mar 08", sales: 18, revenue: 1210 },
    { label: "Mar 15", sales: 29, revenue: 2390 }
  ],
  activities: [
    { name: "Carreras", sales: 46, revenue: 3190, share: 36 },
    { name: "Torneos", sales: 31, revenue: 2070, share: 24 },
    { name: "Escuelas", sales: 23, revenue: 1450, share: 18 },
    { name: "Eventos privados", sales: 17, revenue: 1160, share: 13 },
    { name: "Retratos", sales: 11, revenue: 770, share: 9 }
  ],
  albums: [
    {
      id: "alb-001",
      title: "Copa Primavera - Finales",
      createdAt: "2026-03-16T12:30:00.000Z",
      views: 2360,
      photos: 84,
      soldPhotos: 28,
      sales: 28,
      revenue: 1960,
      conversion: 11.9
    },
    {
      id: "alb-002",
      title: "10K Puerto Norte",
      createdAt: "2026-03-10T09:10:00.000Z",
      views: 1840,
      photos: 126,
      soldPhotos: 25,
      sales: 25,
      revenue: 1715,
      conversion: 9.8
    },
    {
      id: "alb-003",
      title: "Padel Night Sessions",
      createdAt: "2026-03-03T19:00:00.000Z",
      views: 990,
      photos: 66,
      soldPhotos: 16,
      sales: 16,
      revenue: 1020,
      conversion: 7.4
    }
  ],
  sales: [
    {
      id: "sale-1007",
      buyer: "Sofia Romero",
      buyerEmail: "sofia@example.com",
      album: "Copa Primavera - Finales",
      activity: "Torneos",
      status: "approved",
      date: "2026-03-18T15:42:00.000Z",
      photos: 7,
      subtotal: 224,
      discount: 32,
      total: 154,
      grossTotal: 192,
      fees: 38,
      isComped: false,
      detailsLoaded: true,
      photographs: []
    },
    {
      id: "sale-1006",
      buyer: "Mateo Silva",
      buyerEmail: "mateo@example.com",
      album: "10K Puerto Norte",
      activity: "Carreras",
      status: "approved",
      date: "2026-03-17T10:24:00.000Z",
      photos: 4,
      subtotal: 130,
      discount: 20,
      total: 88,
      grossTotal: 110,
      fees: 22,
      isComped: false,
      detailsLoaded: true,
      photographs: []
    },
    {
      id: "sale-1005",
      buyer: "Camila Perez",
      buyerEmail: "camila@example.com",
      album: "Padel Night Sessions",
      activity: "Eventos privados",
      status: "approved",
      date: "2026-03-16T20:15:00.000Z",
      photos: 6,
      subtotal: 190,
      discount: 25,
      total: 132,
      grossTotal: 165,
      fees: 33,
      isComped: false,
      detailsLoaded: true,
      photographs: []
    }
  ]
};
