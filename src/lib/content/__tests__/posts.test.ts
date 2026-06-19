import { describe, expect, it } from "vitest";
import type { LocalizedPost } from "../posts";
import { selectPublishedPosts } from "../posts";

function post(slug: string, date?: string): LocalizedPost {
  return {
    slug,
    title: slug,
    excerpt: `${slug} excerpt`,
    date,
    tags: [],
    body: slug,
    bodyHtml: `<p>${slug}</p>`,
    locale: "en",
  };
}

describe("selectPublishedPosts", () => {
  const today = new Date("2026-06-19T12:00:00.000Z");

  it("excludes future-dated posts and sorts newest first", () => {
    const result = selectPublishedPosts(
      [
        post("older", "2025-01-01"),
        post("future", "2199-01-01"),
        post("latest", "2026-06-19"),
      ],
      today
    );

    expect(result.map(({ slug }) => slug)).toEqual(["latest", "older"]);
  });

  it("keeps undated or non-date metadata after dated posts", () => {
    const result = selectPublishedPosts(
      [post("undated"), post("invalid", "draft"), post("dated", "2024-08-01")],
      today
    );

    expect(result.map(({ slug }) => slug)).toEqual(["dated", "undated", "invalid"]);
  });

  it("does not mutate the source array", () => {
    const source = [post("older", "2024-01-01"), post("newer", "2025-01-01")];
    selectPublishedPosts(source, today);
    expect(source.map(({ slug }) => slug)).toEqual(["older", "newer"]);
  });
});
