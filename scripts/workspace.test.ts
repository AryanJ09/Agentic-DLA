import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("workspace", () => {
  const yaml = readFileSync(new URL("../pnpm-workspace.yaml", import.meta.url), "utf8");

  it.each(["packages/*", "apps/*", "prototypes/*"])("includes %s", (glob) => {
    expect(yaml).toContain(`"${glob}"`);
  });
});
