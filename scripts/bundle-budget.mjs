#!/usr/bin/env node
import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const DIST = "dist"
const DEFAULT_BUDGET = 6 * 1024
const BUDGETS = {
  // primitives with coordinator + keyboard + per-item registry are larger
  "primitives/accordion.mjs": 9 * 1024,
  "primitives/tabs.mjs": 9 * 1024,
  "primitives/toggle-group.mjs": 9 * 1024,
  "primitives/menu.mjs": 12 * 1024,
  "primitives/slider.mjs": 12 * 1024,
  "primitives/radio-group.mjs": 9 * 1024,
  "primitives/toaster.mjs": 9 * 1024,
  "primitives/combobox.mjs": 18 * 1024,
  "primitives/context-menu.mjs": 7 * 1024,
  "primitives/number-input.mjs": 9 * 1024,
  "primitives/otp-input.mjs": 9 * 1024,
  "primitives/pagination.mjs": 9 * 1024,
  "primitives/field.mjs": 9 * 1024,
  "primitives/menubar.mjs": 9 * 1024,
  "primitives/select.mjs": 16 * 1024,
  "primitives/autocomplete.mjs": 14 * 1024,
  "primitives/navigation-menu.mjs": 9 * 1024,
  "primitives/scroll-area.mjs": 9 * 1024,
  "primitives/drawer.mjs": 9 * 1024,
  // adapters bundle every primitive's hooks; budget grows with primitive count
  "adapters/react.mjs": 48 * 1024,
  "adapters/vue.mjs": 40 * 1024,
  "adapters/vanilla.mjs": 20 * 1024,
}

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
