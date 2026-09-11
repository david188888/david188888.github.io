import { describe, expect, it } from "vitest";
import {
  AUTHOR_FLAG_KEY,
  STATS_SESSION_KEY,
  isAuthorUnlocked,
  isStatsAuthenticated,
  lockAuthor,
  matchesAuthorCredentials,
  signInAsAuthor,
  signOutOfStats,
  unlockAuthor,
} from "../author";

describe("matchesAuthorCredentials", () => {
  it("accepts the author credentials", () => {
    expect(matchesAuthorCredentials("davidliu", "Lhy040619")).toBe(true);
  });

  it("rejects a wrong password, a wrong user, and empty input", () => {
    expect(matchesAuthorCredentials("davidliu", "wrong")).toBe(false);
    expect(matchesAuthorCredentials("someone", "Lhy040619")).toBe(false);
    expect(matchesAuthorCredentials("", "")).toBe(false);
  });

  it("rejects non-string input instead of throwing", () => {
    expect(matchesAuthorCredentials(undefined as unknown as string, "x")).toBe(false);
    expect(matchesAuthorCredentials("x", null as unknown as string)).toBe(false);
  });

  it("survives an encoder that throws on non-Latin1 input", () => {
    const throwing = () => {
      throw new Error("InvalidCharacterError");
    };

    expect(matchesAuthorCredentials("中文", "密码", throwing)).toBe(false);
  });

  it("compares against the encoded pair rather than the raw text", () => {
    const calls: string[] = [];
    matchesAuthorCredentials("davidliu", "Lhy040619", (value) => {
      calls.push(value);
      return value === "davidliu" ? "ZGF2aWRsaXU=" : "TGh5MDQwNjE5";
    });

    expect(calls).toEqual(["davidliu", "Lhy040619"]);
  });
});

describe("author unlock without a browser", () => {
  it("reports locked rather than throwing when storage is unavailable", () => {
    expect(isAuthorUnlocked()).toBe(false);
    expect(isStatsAuthenticated()).toBe(false);
  });

  it("does not throw when unlocking or locking without storage", () => {
    expect(() => unlockAuthor()).not.toThrow();
    expect(() => lockAuthor()).not.toThrow();
    expect(() => signInAsAuthor()).not.toThrow();
    expect(() => signOutOfStats()).not.toThrow();
  });

  it("keeps the author flag and the per-tab stats flag separate", () => {
    expect(AUTHOR_FLAG_KEY).not.toBe(STATS_SESSION_KEY);
    expect(AUTHOR_FLAG_KEY).toContain("author");
  });
});
