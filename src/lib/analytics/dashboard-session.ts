import { analyticsConfig } from "@/config/analytics";
import { AnalyticsError, fetchHistoricalAnalytics, fetchRealtimeAnalytics, fetchAudienceAnalytics, fetchUserPathAnalytics, type AudienceAnalytics, type HistoricalAnalytics, type UserPathAnalytics, type ReportDays } from "./dashboard-data";
import { requestGoogleToken, type GoogleAccessToken, type GoogleOAuth2 } from "./google-auth";

export type Remote<T> = { status: "idle" | "loading" | "success" | "error"; data?: T; error?: AnalyticsError; fetchedAt?: number };
export interface DashboardState {
  connection: "disconnected" | "authorizing" | "connected" | "expired";
  days: ReportDays;
  error?: AnalyticsError;
  history: Remote<HistoricalAnalytics>;
  realtime: Remote<number | null>;
  audience: Remote<AudienceAnalytics>;
  userPaths: Remote<UserPathAnalytics>;
}
const initial: DashboardState = { connection: "disconnected", days: 7, history: { status: "idle" }, realtime: { status: "idle" }, audience: { status: "idle" }, userPaths: { status: "idle" } };
const defaults = { history: fetchHistoricalAnalytics, realtime: fetchRealtimeAnalytics, audience: fetchAudienceAnalytics, userPaths: fetchUserPathAnalytics, authorize: requestGoogleToken, now: Date.now };

// Owns the in-memory token and invalidates both late OAuth callbacks and reports.
// No credentials or report rows are persisted by this controller.
export class DashboardSession {
  private state: DashboardState = initial;
  private token?: GoogleAccessToken;
  private generation = 0;
  private request = 0;
  private controller?: AbortController;
  private timer?: ReturnType<typeof setTimeout>;
  private listeners = new Set<() => void>();
  constructor(private dependencies = defaults) {}
  getSnapshot = () => this.state;
  getServerSnapshot = () => initial;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(next: DashboardState) { this.state = next; this.listeners.forEach((listener) => listener()); }
  private cancel() { this.request++; this.controller?.abort(); }
  private clear(connection: DashboardState["connection"]) {
    this.generation++; this.cancel(); clearTimeout(this.timer); this.token = undefined;
    this.update({ connection, days: this.state.days, history: { status: "idle" }, realtime: { status: "idle" }, audience: { status: "idle" }, userPaths: { status: "idle" } });
  }
  disconnect = () => this.clear("disconnected");
  dispose = () => this.clear("disconnected");
  checkExpiry = () => {
    if (this.token && this.token.expiresAt - 15000 <= this.dependencies.now()) this.clear("expired");
  };
  connect = (api: GoogleOAuth2) => {
    this.clear("authorizing");
    const generation = this.generation;
    const fail = (error: AnalyticsError) => {
      if (generation === this.generation && this.state.connection === "authorizing") this.update({ ...this.state, connection: "disconnected", error });
    };
    try {
      this.dependencies.authorize(api, analyticsConfig.oauthClientId, (token) => {
        if (generation !== this.generation || this.state.connection !== "authorizing") return;
        this.token = token;
        this.update({ ...this.state, connection: "connected", error: undefined });
        this.timer = setTimeout(() => this.checkExpiry(), Math.max(0, token.expiresAt - this.dependencies.now() - 15000));
        this.refresh();
      }, fail);
    } catch { fail(new AnalyticsError("popup")); }
  };
  setDays = (days: ReportDays) => {
    if (days === this.state.days) return;
    this.cancel();
    this.update({ ...this.state, days, history: { status: "idle" }, realtime: { status: "idle" }, audience: { status: "idle" }, userPaths: { status: "idle" } });
    this.refresh();
  };
  refresh = () => {
    this.checkExpiry();
    const token = this.token;
    if (!token) return;
    this.cancel();
    const request = this.request;
    const generation = this.generation;
    const controller = new AbortController(); this.controller = controller;

    // Update loading state for all relevant sections
    const loadingState = this.state.days === 0
      ? { history: { status: "loading" as const }, realtime: { status: "loading" as const }, audience: { status: "loading" as const }, userPaths: { status: "loading" as const } }
      : { history: { status: "loading" as const }, realtime: { status: "loading" as const }, audience: { status: "loading" as const }, userPaths: { status: "idle" as const } };

    this.update({ ...this.state, ...loadingState });

    const current = () => request === this.request && generation === this.generation && !controller.signal.aborted;
    const success = <K extends "history" | "realtime" | "audience" | "userPaths">(key: K, data: DashboardState[K]["data"]) => {
      if (current()) this.update({ ...this.state, [key]: { status: "success", data, fetchedAt: this.dependencies.now() } });
    };
    const failure = (key: "history" | "realtime" | "audience" | "userPaths", error: unknown) => {
      if (!current()) return;
      const problem = error instanceof AnalyticsError ? error : new AnalyticsError("network");
      if (problem.code === "expired") this.clear("expired");
      else this.update({ ...this.state, [key]: { status: "error", error: problem } });
    };

    void this.dependencies.history(token.value, this.state.days, controller.signal).then((data) => success("history", data), (error) => failure("history", error));
    void this.dependencies.realtime(token.value, controller.signal).then((data) => success("realtime", data), (error) => failure("realtime", error));
    void this.dependencies.audience(token.value, this.state.days, controller.signal).then((data) => success("audience", data), (error) => failure("audience", error));

    // Only fetch user paths when viewing "today"
    if (this.state.days === 0) {
      void this.dependencies.userPaths(token.value, controller.signal).then((data) => success("userPaths", data), (error) => failure("userPaths", error));
    }
  };
}
