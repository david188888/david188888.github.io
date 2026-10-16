import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalyticsError, historicalRequest, parseHistoricalAnalytics, parseRealtimeAnalytics, fetchHistoricalAnalytics } from "../dashboard-data";
import { ANALYTICS_READONLY_SCOPE, parseGoogleToken, requestGoogleToken } from "../google-auth";
function report(dimensions: string[], metrics: string[], rows: [string[], string[]][] = [], metadata = {}) {
  return { dimensionHeaders: dimensions.map((name) => ({ name })), metricHeaders: metrics.map((name) => ({ name })), rows: rows.map(([dims, values]) => ({ dimensionValues: dims.map((value) => ({ value })), metricValues: values.map((value) => ({ value })) })), metadata };
}
const fixture = () => ({ reports: [report([], ["screenPageViews", "activeUsers", "sessions"], [[[], ["25", "4", "6"]]], { timeZone: "Asia/Shanghai" }), report(["date"], ["screenPageViews"], [[["20261016"], ["15"]], [["20261015"], ["10"]]]), report(["pagePath"], ["screenPageViews"], [[["/insights/post/"], ["20"]], [["/"], ["5"]]]), report(["sessionDefaultChannelGroup"], ["sessions"], [[["Direct"], ["6"]]])] });
afterEach(() => vi.unstubAllGlobals());
describe("GA4 dashboard reports", () => {
  it("requests inclusive seven/thirty day totals without page or date dimensions", () => {
    for (const days of [7, 30] as const) {
      const request = historicalRequest(days);
      expect(request.requests).toHaveLength(4);
      expect(request.requests.every((r) => r.dateRanges[0].startDate === `${days - 1}daysAgo`)).toBe(true);
      expect(request.requests[0]).not.toHaveProperty("dimensions");
      expect(JSON.stringify(request)).not.toContain("dimensionFilter");
      expect(request.requests[2].limit).toBe("10");
    }
  });
  it("uses GA totals, sorts real dates and preserves page paths", () => {
    const result = parseHistoricalAnalytics(fixture());
    expect(result.summary).toEqual({ views: 25, users: 4, sessions: 6 });
    expect(result.trend.map((p) => p.date)).toEqual(["2026-10-15", "2026-10-16"]);
    expect(result.pages[0].label).toBe("/insights/post/");
    expect(result.timeZone).toBe("Asia/Shanghai");
    expect(result.limited).toBe(false);
  });
  it("distinguishes valid empty reports, withheld realtime and a real zero", () => {
    const data = fixture(); data.reports.forEach((r) => { r.rows = []; });
    expect(parseHistoricalAnalytics(data).summary).toBe(null);
    expect(parseRealtimeAnalytics(report([], ["activeUsers"]))).toBe(0);
    expect(parseRealtimeAnalytics(report([], ["activeUsers"], [], { emptyReason: "restricted" }))).toBe(null);
    expect(parseRealtimeAnalytics(report([], ["activeUsers"], [[[], ["0"]]]))).toBe(0);
  });
  it("accepts GA4's kind-only empty realtime response, but rejects ambiguous empties", () => {
    expect(parseRealtimeAnalytics({ kind: "analyticsData#runRealtimeReport" })).toBe(0);
    expect(() => parseRealtimeAnalytics({})).toThrow(AnalyticsError);
    expect(() => parseRealtimeAnalytics({ kind: "analyticsData#runRealtimeReport", rows: [{}] })).toThrow(AnalyticsError);
    expect(() => parseRealtimeAnalytics({ kind: "analyticsData#runReport" })).toThrow(AnalyticsError);
  });
  it("rejects malformed metrics, headers, missing reports and impossible dates", () => {
    expect(() => parseHistoricalAnalytics({})).toThrow(AnalyticsError);
    const badMetric = fixture(); badMetric.reports[0].rows[0].metricValues[0].value = "NaN";
    expect(() => parseHistoricalAnalytics(badMetric)).toThrow(AnalyticsError);
    const badDate = fixture(); badDate.reports[1].rows[0].dimensionValues[0].value = "20260230";
    expect(() => parseHistoricalAnalytics(badDate)).toThrow(AnalyticsError);
    expect(() => parseRealtimeAnalytics(report([], ["sessions"]))).toThrow(AnalyticsError);
  });
  it.each([[401, "expired"], [403, "permission"], [429, "quota"], [500, "network"]])("maps HTTP %s without converting failures to zeros", async (status, code) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: Number(status) })));
    await expect(fetchHistoricalAnalytics("test-only", 7, new AbortController().signal)).rejects.toMatchObject({ code });
  });
  it("detects a disabled API and propagates cancellation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"reason":"SERVICE_DISABLED"}', { status: 403 })));
    await expect(fetchHistoricalAnalytics("test-only", 7, new AbortController().signal)).rejects.toMatchObject({ code: "apiDisabled" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")));
    const abort = new AbortController(); abort.abort();
    await expect(fetchHistoricalAnalytics("test-only", 7, abort.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
});
describe("Google read-only authorization", () => {
  const valid = { access_token: "test-only", expires_in: 3600, token_type: "Bearer", scope: ANALYTICS_READONLY_SCOPE };
  it("validates scope, token type and expiration", () => {
    expect(parseGoogleToken(valid, 1000)).toEqual({ value: "test-only", expiresAt: 3601000 });
    for (const change of [{ scope: "openid" }, { expires_in: 0 }, { token_type: "other" }, { error: "access_denied" }]) {
      expect(() => parseGoogleToken({ ...valid, ...change })).toThrow(AnalyticsError);
    }
  });
  it("requests only readonly scope synchronously and handles denial", () => {
    const success = vi.fn(), failure = vi.fn(), request = vi.fn();
    const init = vi.fn((config) => { config.callback({ error: "access_denied" }); return { requestAccessToken: request }; });
    requestGoogleToken({ initTokenClient: init }, "public-client", success, failure);
    expect(init.mock.calls[0][0]).toMatchObject({ scope: ANALYTICS_READONLY_SCOPE, include_granted_scopes: false });
    expect(request).toHaveBeenCalledWith({ prompt: "" });
    expect(success).not.toHaveBeenCalled(); expect(failure).toHaveBeenCalledWith(expect.objectContaining({ code: "authorization" }));
  });
});
