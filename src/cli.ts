/**
 * The CLI. `npx se-conformance validate <path>` runs the validators against
 * a COTS file. Exits with code 0 on pass, 1 on fail.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { run, format } from "./runner.js";
import type { Cots } from "./types.js";

const program = new Command();

program
  .name("se-conformance")
  .description("Source Engineering conformance validator")
  .version("0.1.0");

program
  .command("validate")
  .description("Validate a COTS against the Source Engineering spec")
  .argument("<path>", "Path to a COTS JSON file (or '-' for stdin)")
  .action((path: string) => {
    const resolved = path === "-" ? 0 : resolve(path);
    const contents =
      path === "-"
        ? readFileSync(0, "utf-8")
        : readFileSync(resolved, "utf-8");
    const cots: Cots = JSON.parse(contents);
    const result = run(cots);
    console.log(format(result));
    process.exit(result.status === "pass" ? 0 : 1);
  });

program.parse();
