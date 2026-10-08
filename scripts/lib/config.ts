import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const KEBAB = /^[a-z][a-z0-9-]*$/;
const KEBAB_MESSAGE = "must be lowercase kebab-case, like my-system";
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const SEMVER_MESSAGE = "must be an exact version like 16.0.0";
const OUT_DIR = /^\.ai(\/[a-z0-9][a-z0-9-]*)+$/;
const RESERVED_OUT_DIRS = [".ai/briefs"];

const kebab = z.string({ error: "must be text" }).regex(KEBAB, KEBAB_MESSAGE);
const semver = z.string({ error: "must be text" }).regex(SEMVER, SEMVER_MESSAGE);

export const DsConfigSchema = z.strictObject({
  name: kebab,
  scope: z
    .string({ error: "must be text" })
    .regex(/^@[a-z][a-z0-9-]*$/, "must start with @ followed by kebab-case, like @my-system"),
  tokenPrefix: kebab,
  dataPrefix: kebab,
  dsContracts: z.strictObject({
    enabled: z.boolean({ error: "must be true or false" }),
    schema: semver,
    cli: semver,
    outDir: z
      .string({ error: "must be text" })
      .regex(OUT_DIR, "must be a folder inside .ai/ in lowercase kebab-case, like .ai/ds-contracts")
      .refine(
        (value) => !RESERVED_OUT_DIRS.some((dir) => value === dir || value.startsWith(`${dir}/`)),
        {
          message: "must not be .ai/briefs, which the build loop owns",
        },
      ),
  }),
});

export type DsConfig = z.infer<typeof DsConfigSchema>;

export class ConfigError extends Error {
  override name = "ConfigError";
}

const DEFAULT_PATH = fileURLToPath(new URL("../../ds.config.json", import.meta.url));

function describeIssue(issue: z.core.$ZodIssue): string {
  const path = issue.path.map(String).join(".");
  if (issue.code === "unrecognized_keys") {
    const keys = issue.keys.join(", ");
    const reason = `unknown key ${keys}; remove it`;
    return path === "" ? `${keys}: ${reason}` : `${path}.${keys}: ${reason}`;
  }
  const reason =
    issue.code === "invalid_type" && issue.input === undefined ? "is required" : issue.message;
  return `${path === "" ? "(root)" : path}: ${reason}`;
}

export function loadConfig(path: string = DEFAULT_PATH): DsConfig {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ConfigError(`Config file is missing. Expected it at ${path}`);
    }
    throw new ConfigError(`Config file ${path} could not be read: ${String(error)}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new ConfigError(`Config file ${path} is not valid JSON: ${(error as Error).message}`);
  }

  const result = DsConfigSchema.safeParse(data);
  if (!result.success) {
    const lines = result.error.issues.map(describeIssue);
    throw new ConfigError(`Config file ${path} is invalid:\n${lines.join("\n")}`);
  }
  return result.data;
}
