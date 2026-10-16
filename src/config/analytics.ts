export const analyticsConfig = {
  provider: "google-analytics-4",
  trackingId: "G-6S2MZXN5QQ",
  propertyId: "525415859",
  oauthClientId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_CLIENT_ID ?? "",
  hostname: "david188888.github.io",
  dashboardUrl:
    "https://analytics.google.com/analytics/web/#/a385095568p525415859/reports/intelligenthome",
} as const;
