import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The translation skill must ship where DSH can discover it: DSH scans
 * `.agents/skills` but never `.claude/skills`.
 *
 * `.claude/skills/hy-mt2-translator` is a local copy for Claude Code. The
 * repository deliberately does not track `.claude/`, so that copy can be absent
 * on a fresh clone and the drift check is skipped there rather than failing.
 */
const PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
const SHIPPED_DIR = path.join(PROJECT_ROOT, ".agents/skills/hy-mt2-translator");
const CLAUDE_DIR = path.join(PROJECT_ROOT, ".claude/skills/hy-mt2-translator");

/** Relative paths of every file under `root`, sorted for a stable comparison. */
async function listFiles(root, prefix = "") {
  const entries = await fs.readdir(path.join(root, prefix), { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, relative)));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }

  return files.sort();
}

async function directoryExists(directory) {
  try {
    return (await fs.stat(directory)).isDirectory();
  } catch {
    return false;
  }
}

describe("hy-mt2-translator skill ships where DSH can discover it", () => {
  it("ships a SKILL.md under .agents/skills", async () => {
    expect(await listFiles(SHIPPED_DIR)).toContain("SKILL.md");
  });

  it("declares the directory name as the skill name", async () => {
    const source = await fs.readFile(path.join(SHIPPED_DIR, "SKILL.md"), "utf8");
    expect(source).toMatch(/^---\n[\s\S]*?^name: hy-mt2-translator$/m);
  });

  it("ships the CLI script and references the skill documents", async () => {
    const files = await listFiles(SHIPPED_DIR);
    expect(files).toContain("scripts/hy_translate.py");
    expect(files).toContain("references/translation-modes.md");
    expect(files).toContain("references/supported-languages.md");
  });

  it("keeps the local Claude Code copy in sync while it exists", async () => {
    if (!(await directoryExists(CLAUDE_DIR))) {
      return;
    }

    const shipped = await listFiles(SHIPPED_DIR);
    expect(await listFiles(CLAUDE_DIR)).toEqual(shipped);

    for (const relative of shipped) {
      const [expected, actual] = await Promise.all([
        fs.readFile(path.join(SHIPPED_DIR, relative), "utf8"),
        fs.readFile(path.join(CLAUDE_DIR, relative), "utf8"),
      ]);

      expect(actual, `${relative} drifted; re-copy .agents/skills/hy-mt2-translator`).toBe(expected);
    }
  });
});
