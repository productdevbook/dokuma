#!/usr/bin/env node
import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const DIST = "dist"
const DEFAULT_BUDGET = 6 * 1024
const BUDGETS = {}

let failed = false

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const s = statSync(full)
    if (s.isDirectory()) {
      walk(full)
      continue
    }
    if (!entry.endsWith(".mjs")) continue
    const rel = full.slice(DIST.length + 1)
    const budget = BUDGETS[rel] ?? DEFAULT_BUDGET
    const ok = s.size <= budget
    const tag = ok ? "ok" : "FAIL"
    console.log(`[${tag}] ${rel} — ${s.size}B (budget ${budget}B)`)
    if (!ok) failed = true
  }
}

try {
  walk(DIST)
} catch {
  console.error("bundle-budget: dist/ missing — run `pnpm build` first")
  process.exit(1)
}

if (failed) process.exit(1)
