import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ConfigError, DsConfigSchema, loadConfig } from "./config.js";

const valid = {
  name: "ds",
  scope: "@ds",
  tokenPrefix: "ds",
  dataPrefix: "ds",
  dsContracts: { enabled: false, schema: "16.0.0", cli: "0.4.0", outDir: ".ai/ds-contracts" },
};

let dir: string;
let counter = 0;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "ds-config-"));
});
afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(contents: unknown): string {
  const file = join(dir, `config-${counter++}.json`);
  writeFileSync(file, typeof contents === "string" ? contents : JSON.stringify(contents));
  return file;
}

function messageFor(contents: unknown): string {
  try {
    loadConfig(write(contents));
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigError);
    return (error as ConfigError).message;
  }
  throw new Error("expected loadConfig to throw");
}

describe("loadConfig", () => {
  it("loads the committed ds.config.json with ds-contracts off", () => {
    expect(loadConfig().dsContracts.enabled).toBe(false);
  });

  it("refuses a missing name", () => {
    const rest: Record<string, unknown> = { ...valid };
    delete rest["name"];
    expect(messageFor(rest)).toContain("name:");
  });

  it("refuses an uppercase tokenPrefix", () => {
    expect(messageFor({ ...valid, tokenPrefix: "DS" })).toContain("tokenPrefix:");
  });

  it("refuses a scope without @", () => {
    expect(messageFor({ ...valid, scope: "ds" })).toContain("scope:");
  });

  it("refuses a semver range", () => {
    const message = messageFor({
      ...valid,
      dsContracts: { ...valid.dsContracts, schema: "^16.0.0" },
    });
    expect(message).toContain("dsContracts.schema: must be an exact version like 16.0.0");
  });

  it.each(["../out", ".ai/", ".ai", ".ai/ ", ".ai/../out", "/.ai/out", ".ai/Out", ".ai/out/"])(
    "refuses outDir %j",
    (outDir) => {
      const message = messageFor({ ...valid, dsContracts: { ...valid.dsContracts, outDir } });
      expect(message).toContain("dsContracts.outDir:");
    },
  );

  it.each([".ai/briefs", ".ai/briefs/export"])("refuses outDir %j, owned by the loop", (outDir) => {
    const message = messageFor({ ...valid, dsContracts: { ...valid.dsContracts, outDir } });
    expect(message).toContain("dsContracts.outDir: must not be .ai/briefs");
  });

  it.each([".ai/ds-contracts", ".ai/exports/ds-contracts"])("accepts outDir %j", (outDir) => {
    expect(() =>
      DsConfigSchema.parse({ ...valid, dsContracts: { ...valid.dsContracts, outDir } }),
    ).not.toThrow();
  });

  it("refuses an unknown top-level key", () => {
    expect(messageFor({ ...valid, extra: 1 })).toContain("extra");
  });

  it("refuses an unknown key inside dsContracts", () => {
    const message = messageFor({ ...valid, dsContracts: { ...valid.dsContracts, extra: 1 } });
    expect(message).toContain("dsContracts.extra");
  });

  it("reports every problem at once", () => {
    const message = messageFor({ ...valid, scope: "ds", tokenPrefix: "DS" });
    expect(message).toContain("scope:");
    expect(message).toContain("tokenPrefix:");
  });

  it("throws ConfigError for a missing file", () => {
    const missing = join(dir, "nope.json");
    expect(() => loadConfig(missing)).toThrow(ConfigError);
    expect(() => loadConfig(missing)).toThrow(missing);
  });

  it("throws ConfigError for invalid JSON, naming the file", () => {
    const file = write("{ not json");
    expect(() => loadConfig(file)).toThrow(ConfigError);
    expect(() => loadConfig(file)).toThrow(file);
  });
});
