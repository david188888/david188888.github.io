import { defineConfig, s } from "velite";

export default defineConfig({
  root: "content",
  collections: {
    publications: {
      name: "Publication",
      pattern: "publications/**/*.mdx",
      schema: s
        .object({
          title: s.string(),
          collection: s.string().default("publications"),
          category: s.string(),
          permalink: s.string(),
          excerpt: s.string().optional(),
          date: s.string().optional(),
          venue: s.string().optional(),
          paperurl: s.string().optional(),
          slidesurl: s.string().optional(),
          bibtexurl: s.string().optional(),
          citation: s.string().optional(),
          content: s.markdown(),
        })
        .transform((data) => ({
          ...data,
          slug: data.permalink?.replace(/^\/|\/$/g, "").split("/").pop() || "",
        })),
    },
    teaching: {
      name: "Teaching",
      pattern: "teaching/**/*.mdx",
      schema: s
        .object({
          title: s.string(),
          collection: s.string().default("teaching"),
          type: s.string().optional(),
          permalink: s.string(),
          venue: s.string().optional(),
          date: s.string().optional(),
          location: s.string().optional(),
          content: s.markdown(),
        })
        .transform((data) => ({
          ...data,
          slug: data.permalink?.replace(/^\/|\/$/g, "").split("/").pop() || "",
        })),
    },
    talks: {
      name: "Talk",
      pattern: "talks/**/*.mdx",
      schema: s
        .object({
          title: s.string(),
          collection: s.string().default("talks"),
          type: s.string().optional(),
          permalink: s.string(),
          venue: s.string().optional(),
          date: s.string().optional(),
          location: s.string().optional(),
          content: s.markdown(),
        })
        .transform((data) => ({
          ...data,
          slug: data.permalink?.replace(/^\/|\/$/g, "").split("/").pop() || "",
        })),
    },
    posts: {
      name: "Post",
      pattern: "posts/**/*.mdx",
      schema: s
        .object({
          title: s.string(),
          date: s.string().optional(),
          permalink: s.string(),
          tags: s.array(s.string()).optional(),
          content: s.markdown(),
        })
        .transform((data) => ({
          ...data,
          slug: data.permalink?.replace(/^\/|\/$/g, "").split("/").pop() || "",
        })),
    },
  },
  output: {
    data: "src/lib/velite-data.json",
    base: "./src/lib/velite/",
  },
});
