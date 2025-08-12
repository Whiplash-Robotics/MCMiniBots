import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scanFile } from "./scanner.mjs";
import fs from "fs";
import path from "path";

// Glob-like walk for ./examples/**
function getExampleFiles(dir: string): string[] {
  const files: string[] = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files.push(...getExampleFiles(full));
    } else if (full.endsWith(".ts") || full.endsWith(".js")) {
      files.push(full);
    }
  }
  return files;
}

describe("can enforce allowed modules", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.mocked(console.log).mockRestore();
    vi.mocked(console.error).mockRestore();
  });

  const files = getExampleFiles("./anticheat/examples");

  for (const file of files) {
    it(`Scans ${file}`, async () => {
      const result = await scanFile(file, "./anticheat/allowed.json");
      if (file.includes("bad")) {
        expect(result).toBe(1);
      } else {
        expect(result).toBe(0);
      }
    });
  }
});
