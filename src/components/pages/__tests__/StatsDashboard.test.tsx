import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardState } from "@/lib/analytics/dashboard-session";
const stub = vi.hoisted(() => ({ state: {} as DashboardState }));
vi.mock("@/lib/analytics/dashboard-session", () => ({ DashboardSession: class {
  subscribe = () => () => {};
  getSnapshot = () => stub.state;
  getServerSnapshot = () => stub.state;
} }));
import { StatsDashboard } from "@/components/analytics/StatsDashboard";
beforeEach(() => { stub.state = { connection: "connected", days: 7, history: { status: "success", data: { summary: { views: 25, users: 4, sessions: 6 }, trend: [{ date: "2026-10-15", views: 25 }], pages: [{ label: "/insights/example/", value: 25 }], sources: [{ label: "Direct", value: 6 }], timeZone: "Asia/Shanghai", limited: true }, fetchedAt: 1000 }, realtime: { status: "success", data: 0, fetchedAt: 1000 }, audience: { status: "success", data: { countries: [{ label: "China", value: 4 }], cities: [{ label: "China · Shanghai · (not set)", value: 3 }], devices: [{ label: "mobile", value: 3 }], browsers: [{ label: "Safari", value: 3 }], referrals: [{ label: "github.com / referral", value: 6 }], limited: false }, fetchedAt: 1000 }, userPaths: { status: "idle" } }; });
describe("inline statistics display", () => {
  it.each(["zh", "en"] as const)("renders readable real-data values and accessible trends in %s", (locale) => {
    const html = renderToStaticMarkup(<StatsDashboard locale={locale} />);
    expect(html).toContain("/insights/example/"); expect(html).toContain("Asia/Shanghai");
    expect(html).toContain("2026-10-15"); expect(html).toContain("<table"); expect(html).toContain("<svg");
    expect(html).toContain(">25<"); expect(html).toContain(">4<"); expect(html).toContain(">0<");
    expect(html).toContain(locale === "en" ? "Results may be incomplete" : "结果可能不完整");
    // World map replaced city/country text lists, check for map elements instead
    expect(html).toContain("viewBox=\"0 0 1000 500\""); expect(html).toContain("github.com / referral");
    expect(html).toContain(locale === "en" ? "mobile" : "手机");
  });
  it("does not turn missing or loading counts into zero", () => {
    stub.state.history = { status: "loading" }; stub.state.realtime = { status: "loading" };
    const html = renderToStaticMarkup(<StatsDashboard locale="zh" />);
    expect(html).not.toContain(">0<"); expect(html).toContain("正在读取"); expect(html).toContain("—");
  });
  it("keeps successful overview visible when audience details are unavailable", () => {
    stub.state.audience = { status: "error", error: { code: "quota", name: "AnalyticsError", message: "quota" } };
    const html = renderToStaticMarkup(<StatsDashboard locale="zh" />);
    expect(html).toContain(">25<"); expect(html).toContain("请求额度暂时受限");
    expect(html).not.toContain("github.com / referral");
  });
});
