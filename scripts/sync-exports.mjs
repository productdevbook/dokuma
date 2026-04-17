#!/usr/bin/env node
/**
 * Regenerates the primitive sub-path entries in `package.json` `exports`
 * from the file list in `src/primitives/`. Run `pnpm sync-exports` after
 * adding a new primitive; CI runs `--check` to fail on drift.
 *
 * Manual entries (".", adapter entries) are preserved.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"

const CHECK = process.argv.includes("--check")
const ROOT = new URL("..", import.meta.url).pathname
const PKG_PATH = join(ROOT, "package.json")
const PRIMITIVES_DIR = join(ROOT, "src/primitives")

const slugs = readdirSync(PRIMITIVES_DIR)
  .filter((f) => f.endsWith(".ts") && !f.startsWith("_"))
  .map((f) => basename(f, ".ts"))
  .sort()

const primitiveExports = Object.fromEntries(
  slugs.map((slug) => [
    `./${slug}`,
    {
      types: `./dist/primitives/${slug}.d.mts`,
      default: `./dist/primitives/${slug}.mjs`,
    },
  ]),
)

const pkg = JSON.parse(readFileSync(PKG_PATH, "utf8"))
const MANUAL_KEYS = [".", "./vanilla", "./react", "./react-hooks", "./vue", "./vue-composables"]
const manual = Object.fromEntries(MANUAL_KEYS.map((k) => [k, pkg.exports[k]]))
const next = { ...manual, ...primitiveExports }

const before = JSON.stringify(pkg.exports)
const after = JSON.stringify(next)

if (before === after) {
  console.log("sync-exports: up to date")
  process.exit(0)
}

if (CHECK) {
  console.error("sync-exports: package.json exports out of sync — run `pnpm sync-exports`")
  process.exit(1)
}

pkg.exports = next
writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n")
console.log(`sync-exports: wrote ${slugs.length} primitive entries`)
