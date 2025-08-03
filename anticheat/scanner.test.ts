import { describe, it, expect } from "vitest";
import {scanFile} from "./scanner.mjs"; // adjust path if needed
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

// Allowed modules for this test
const allowed = new Set(["react"]);

describe("Scanner Test", () => {
    const files = getExampleFiles("./anticheat/examples");

    for (const file of files) {
        it(`Scans ${file}`, async () => {
            //const path = file.replace("anticheat", ".");
            //console.log(path);
            const result = await scanFile(file, "./anticheat/allowed.json");
            console.log(result);
            console.log(file.replace("anticheat", "."));
            if (file.includes("bad")) {
                expect(result).toBe(1);
            } else {
                expect(result).toBe(0);
            }
        });
    }
});
