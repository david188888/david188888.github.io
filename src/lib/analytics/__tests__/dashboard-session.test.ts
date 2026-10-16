import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardSession } from "../dashboard-session";
import { AnalyticsError, type HistoricalAnalytics } from "../dashboard-data";
import type { GoogleAccessToken, GoogleOAuth2 } from "../google-auth";
const data: HistoricalAnalytics = { summary: { views: 8, users: 2, sessions: 3 }, trend: [], pages: [], sources: [], timeZone: "UTC", limited: false };
function setup() {
  let callback: (token: GoogleAccessToken) => void = () => {};
  const history = vi.fn().mockResolvedValue(data), realtime = vi.fn().mockResolvedValue(1);
  const session = new DashboardSession({ history, realtime, now: Date.now, authorize: (_api, _id, success) => { callback = success; } });
  const connect = () => { session.connect({} as GoogleOAuth2); callback({ value: "test-only", expiresAt: Date.now() + 3600000 }); };
  return { session, history, realtime, connect, callback: () => callback };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
afterEach(() => vi.useRealTimers());
describe("in-memory dashboard lifecycle", () => {
  it("discards late OAuth callbacks after disconnect", () => {
    const test = setup(); test.session.connect({} as GoogleOAuth2); const callback = test.callback();
    test.session.disconnect(); callback({ value: "test-only", expiresAt: Date.now() + 3600000 });
    expect(test.session.getSnapshot().connection).toBe("disconnected"); expect(test.history).not.toHaveBeenCalled();
  });
  it("ignores callbacks from an earlier connection and duplicate completion", async () => {
    const test = setup(); test.session.connect({} as GoogleOAuth2); const earlier = test.callback();
    test.connect(); const current = test.callback();
    earlier({ value: "old", expiresAt: Date.now() + 3600000 });
    current({ value: "duplicate", expiresAt: Date.now() + 3600000 });
    await settle(); expect(test.history).toHaveBeenCalledTimes(1);
    expect(test.history.mock.calls[0][0]).toBe("test-only"); test.session.dispose();
  });
  it("keeps valid history when realtime fails", async () => {
    const test = setup(); test.realtime.mockRejectedValue(new AnalyticsError("quota")); test.connect(); await settle();
    expect(test.session.getSnapshot().history.data).toEqual(data);
    expect(test.session.getSnapshot().realtime.error?.code).toBe("quota"); test.session.dispose();
  });
  it("aborts old ranges and ignores their later responses", async () => {
    const test = setup(); let resolveOld: (data: HistoricalAnalytics) => void = () => {};
    test.history.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
    test.connect(); const oldSignal = test.history.mock.calls[0][2];
    test.session.setDays(7); await settle(); resolveOld({ ...data, summary: { views: 999, users: 999, sessions: 999 } }); await settle();
    expect(oldSignal.aborted).toBe(true); expect(test.session.getSnapshot().days).toBe(7);
    expect(test.session.getSnapshot().history.data?.summary?.views).toBe(8); test.session.dispose();
  });
  it("clears reports and aborts requests before token expiry", async () => {
    vi.useFakeTimers(); const test = setup(); test.connect(); await settle();
    expect(test.session.getSnapshot().history.data).toBeDefined();
    vi.advanceTimersByTime(3585000);
    expect(test.session.getSnapshot().connection).toBe("expired");
    expect(test.session.getSnapshot().history.data).toBeUndefined(); expect(test.history.mock.calls[0][2].aborted).toBe(true);
  });
  it("expires the whole session on a 401, ignoring other pending reports", async () => {
    const test = setup(); test.history.mockRejectedValue(new AnalyticsError("expired")); test.connect(); await settle();
    expect(test.session.getSnapshot().connection).toBe("expired"); expect(test.session.getSnapshot().realtime.data).toBeUndefined();
  });
});
