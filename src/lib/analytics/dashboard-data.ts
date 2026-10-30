import { analyticsConfig } from "@/config/analytics";

export type ReportDays = 0 | 7 | 30; // 0 = today only
export type AnalyticsErrorCode = "expired" | "permission" | "apiDisabled" | "quota" | "network" | "invalidResponse" | "authorization" | "popup";
export class AnalyticsError extends Error {
  constructor(public readonly code: AnalyticsErrorCode) { super(code); }
}

export interface RankedValue { label: string; value: number }
export interface DailyViews { date: string; views: number }
export interface HistoricalAnalytics {
  summary: { views: number; users: number; sessions: number } | null;
  trend: DailyViews[];
  pages: RankedValue[];
  sources: RankedValue[];
  timeZone: string | null;
  limited: boolean;
}
export interface AudienceAnalytics {
  countries: RankedValue[];
  cities: RankedValue[];
  devices: RankedValue[];
  browsers: RankedValue[];
  referrals: RankedValue[];
  limited: boolean;
}

export interface UserPathEvent {
  timestamp: string; // ISO format
  pagePath: string;
}

export interface UserPath {
  userId: string; // GA4 clientId
  country: string;
  city: string;
  device: string;
  browser: string;
  events: UserPathEvent[];
}

export interface UserPathAnalytics {
  paths: UserPath[];
  limited: boolean;
}

const audienceReports = [
  { key: "countries", dimensions: ["country"], metric: "activeUsers" },
  { key: "cities", dimensions: ["country", "region", "city"], metric: "activeUsers" },
  { key: "devices", dimensions: ["deviceCategory"], metric: "activeUsers" },
  { key: "browsers", dimensions: ["browser"], metric: "activeUsers" },
  { key: "referrals", dimensions: ["sessionSourceMedium"], metric: "sessions" },
] as const;

type JsonObject = Record<string, unknown>;
function object(value: unknown): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AnalyticsError("invalidResponse");
  return value as JsonObject;
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new AnalyticsError("invalidResponse");
  return value;
}
function count(value: unknown): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) throw new AnalyticsError("invalidResponse");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new AnalyticsError("invalidResponse");
  return parsed;
}

function report(value: unknown, dimensions: string[], metrics: string[]) {
  const source = object(value);
  const headers = (key: string) => array(source[key] ?? []).map((item) => object(item).name);
  if (JSON.stringify(headers("dimensionHeaders")) !== JSON.stringify(dimensions) ||
      JSON.stringify(headers("metricHeaders")) !== JSON.stringify(metrics)) throw new AnalyticsError("invalidResponse");
  const rows = array(source.rows ?? []).map((item) => {
    const row = object(item);
    const labels = array(row.dimensionValues ?? []).map((cell) => {
      const label = object(cell).value;
      if (typeof label !== "string") throw new AnalyticsError("invalidResponse");
      return label;
    });
    const values = array(row.metricValues).map((cell) => count(object(cell).value));
    if (labels.length !== dimensions.length || values.length !== metrics.length) throw new AnalyticsError("invalidResponse");
    return { labels, values };
  });
  if (source.rowCount !== undefined && (!Number.isSafeInteger(source.rowCount) || Number(source.rowCount) < rows.length)) {
    throw new AnalyticsError("invalidResponse");
  }
  if (!rows.length && Number(source.rowCount ?? 0) > 0) throw new AnalyticsError("invalidResponse");
  const metadata = source.metadata === undefined ? {} : object(source.metadata);
  return { rows, metadata };
}

function isLimited(metadata: JsonObject) {
  return metadata.subjectToThresholding === true || metadata.dataLossFromOtherRow === true ||
    (Array.isArray(metadata.samplingMetadatas) && metadata.samplingMetadatas.length > 0) ||
    (Array.isArray(metadata.dataTruncationReasons) && metadata.dataTruncationReasons.length > 0) ||
    !!metadata.emptyReason || !!metadata.schemaRestrictionResponse;
}

export function parseAudienceAnalytics(value: unknown): AudienceAnalytics {
  const reports = array(object(value).reports);
  if (reports.length !== audienceReports.length) throw new AnalyticsError("invalidResponse");
  const result: AudienceAnalytics = { countries: [], cities: [], devices: [], browsers: [], referrals: [], limited: false };
  audienceReports.forEach(({ key, dimensions, metric }, index) => {
    const parsed = report(reports[index], [...dimensions], [metric]);
    result[key] = parsed.rows.map(({ labels, values: [value] }) => ({
      label: labels.map((label) => label.trim() || "(not set)").join(" · "), value,
    }));
    result.limited ||= isLimited(parsed.metadata);
  });
  return result;
}

// GA4 date ranges include both endpoints: 6daysAgo..today is seven days; 0 means today only.
const startDate = (days: ReportDays) => (days === 0 ? "today" : `${days - 1}daysAgo`);

export function audienceRequest(days: ReportDays) {
  return { requests: audienceReports.map(({ dimensions, metric }) => ({
    dateRanges: [{ startDate: startDate(days), endDate: "today" }],
    dimensions: dimensions.map((name) => ({ name })), metrics: [{ name: metric }],
    orderBys: [{ metric: { metricName: metric }, desc: true }], limit: "10",
  })) };
}

export function parseHistoricalAnalytics(value: unknown): HistoricalAnalytics {
  const reports = array(object(value).reports);
  if (reports.length !== 4) throw new AnalyticsError("invalidResponse");
  const total = report(reports[0], [], ["screenPageViews", "activeUsers", "sessions"]);
  const daily = report(reports[1], ["date"], ["screenPageViews"]);
  const pages = report(reports[2], ["pagePath"], ["screenPageViews"]);
  const sources = report(reports[3], ["sessionDefaultChannelGroup"], ["sessions"]);
  if (total.rows.length > 1) throw new AnalyticsError("invalidResponse");
  const trend = daily.rows.map(({ labels: [raw], values: [views] }) => {
    if (!/^\d{8}$/.test(raw)) throw new AnalyticsError("invalidResponse");
    const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    const parsed = new Date(`${date}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new AnalyticsError("invalidResponse");
    return { date, views };
  }).sort((a, b) => a.date.localeCompare(b.date));
  if (new Set(trend.map((point) => point.date)).size !== trend.length) throw new AnalyticsError("invalidResponse");
  const first = total.rows[0]?.values;
  const ranked = (rows: typeof pages.rows) => rows.map(({ labels: [label], values: [value] }) => ({ label, value }));
  const metadata = [total, daily, pages, sources].map((item) => item.metadata);
  return {
    summary: first ? { views: first[0], users: first[1], sessions: first[2] } : null,
    trend, pages: ranked(pages.rows), sources: ranked(sources.rows),
    timeZone: typeof total.metadata.timeZone === "string" ? total.metadata.timeZone : null,
    limited: metadata.some(isLimited),
  };
}

export function parseRealtimeAnalytics(value: unknown): number | null {
  const source = object(value);
  // With no realtime activity GA4 can return HTTP 200 with only its response
  // kind, omitting headers and rows. Accept exactly that observed empty shape;
  // a missing/malformed response must still fail instead of inventing a zero.
  if (source.kind === "analyticsData#runRealtimeReport" && Object.keys(source).length === 1) return 0;
  const realtime = report(value, [], ["activeUsers"]);
  if (realtime.rows.length > 1) throw new AnalyticsError("invalidResponse");
  if (realtime.metadata.emptyReason || realtime.metadata.subjectToThresholding === true) return realtime.rows[0]?.values[0] ?? null;
  return realtime.rows[0]?.values[0] ?? 0;
}

export function historicalRequest(days: ReportDays) {
  const dateRanges = [{ startDate: startDate(days), endDate: "today" }];
  return { requests: [
    { dateRanges, metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "sessions" }] },
    { dateRanges, dimensions: [{ name: "date" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ dimension: { dimensionName: "date" } }] },
    { dateRanges, dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: "10" },
    { dateRanges, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: "10" },
  ] };
}

async function postReport(method: string, token: string, body: unknown, signal: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted) controller.abort();
  const timeout = setTimeout(cancel, 15000);
  try {
    const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${analyticsConfig.propertyId}:${method}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: controller.signal, cache: "no-store", credentials: "omit",
    });
    if (response.status === 401) throw new AnalyticsError("expired");
    if (response.status === 429) throw new AnalyticsError("quota");
    const data: unknown = await response.json().catch(() => { throw new AnalyticsError("invalidResponse"); });
    if (response.status === 403) {
      const disabled = JSON.stringify(data).includes("SERVICE_DISABLED");
      throw new AnalyticsError(disabled ? "apiDisabled" : "permission");
    }
    if (!response.ok) throw new AnalyticsError("network");
    return data;
  } catch (error) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    throw error instanceof AnalyticsError ? error : new AnalyticsError("network");
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", cancel);
  }
}

export async function fetchHistoricalAnalytics(token: string, days: ReportDays, signal: AbortSignal) {
  return parseHistoricalAnalytics(await postReport("batchRunReports", token, historicalRequest(days), signal));
}
export async function fetchRealtimeAnalytics(token: string, signal: AbortSignal) {
  return parseRealtimeAnalytics(await postReport("runRealtimeReport", token, { metrics: [{ name: "activeUsers" }] }, signal));
}
export async function fetchAudienceAnalytics(token: string, days: ReportDays, signal: AbortSignal) {
  return parseAudienceAnalytics(await postReport("batchRunReports", token, audienceRequest(days), signal));
}

export function userPathRequest() {
  // Fetch page-level data grouped by user fingerprint (location + device)
  return {
    dateRanges: [{ startDate: "today", endDate: "today" }],
    dimensions: [
      { name: "pagePath" },
      { name: "country" },
      { name: "city" },
      { name: "deviceCategory" },
      { name: "browser" }
    ],
    metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
    orderBys: [
      { dimension: { dimensionName: "country" } },
      { dimension: { dimensionName: "city" } },
      { metric: { metricName: "screenPageViews" }, desc: true }
    ],
    limit: "200",
  };
}

export function parseUserPathAnalytics(value: unknown): UserPathAnalytics {
  const parsed = report(value,
    ["pagePath", "country", "city", "deviceCategory", "browser"],
    ["screenPageViews", "activeUsers"]
  );

  // Group by location + device to approximate individual users
  const userMap = new Map<string, UserPath>();

  for (const { labels, values } of parsed.rows) {
    const [pagePath, country, city, device, browser] = labels;
    const [views, users] = values;

    // Create a composite key for grouping (location + device fingerprint)
    const userKey = `${country}|${city}|${device}|${browser}`;

    if (!userMap.has(userKey)) {
      // Generate a readable user ID from the fingerprint
      const countryCode = country.substring(0, 2).toUpperCase();
      const cityCode = city.substring(0, 2).toLowerCase();
      const deviceCode = device.substring(0, 1).toLowerCase();
      userMap.set(userKey, {
        userId: `${countryCode}${cityCode}${deviceCode}`,
        country: country || "Unknown",
        city: city || "Unknown",
        device: device || "Unknown",
        browser: browser || "Unknown",
        events: [],
      });
    }

    const user = userMap.get(userKey)!;
    // Add page view event (timestamp will be set to current time as approximation)
    user.events.push({
      timestamp: new Date().toISOString(),
      pagePath: pagePath || "/"
    });
  }

  return {
    paths: Array.from(userMap.values()).filter(u => u.events.length > 0),
    limited: isLimited(parsed.metadata),
  };
}

export async function fetchUserPathAnalytics(token: string, signal: AbortSignal) {
  return parseUserPathAnalytics(await postReport("runReport", token, userPathRequest(), signal));
}
