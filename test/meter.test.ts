// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createMeter } from "../src/primitives/meter.ts"

let root: HTMLElement
let indicator: HTMLElement

beforeEach(() => {
  document.body.innerHTML = ""
  root = document.createElement("div")
  indicator = document.createElement("div")
  document.body.append(root, indicator)
})

afterEach(() => {
  document.body.innerHTML = ""
})

describe("createMeter", () => {
  it("getRootProps emits aria-valuemin/max/now/text", () => {
    const m = createMeter({ value: 40 })
    const props = m.getRootProps()
    expect(props.role).toBe("meter")
    expect(props["aria-valuemin"]).toBe(0)
    expect(props["aria-valuemax"]).toBe(100)
    expect(props["aria-valuenow"]).toBe(40)
    expect(props["aria-valuetext"]).toBe("40")
  })

  it("fraction clamps to 0..1", () => {
    const m = createMeter({ value: 150, min: 0, max: 100 })
    expect(m.fraction()).toBe(1)
    const n = createMeter({ value: -50, min: 0, max: 100 })
    expect(n.fraction()).toBe(0)
  })

  it("formats with Intl.NumberFormat when format given", () => {
    const m = createMeter({ value: 0.42, max: 1, format: { style: "percent" } })
    expect(m.formattedValue()).toMatch(/42/)
  })

  it("mount writes attributes and reacts to value changes", () => {
    const m = createMeter({ value: 20, max: 200 })
    const cleanup = m.mount({ root, indicator })

    expect(root.getAttribute("aria-valuenow")).toBe("20")
    expect(indicator.style.width).toBe("10%")

    m.value.set(100)
    expect(root.getAttribute("aria-valuenow")).toBe("100")
    expect(indicator.style.width).toBe("50%")

    cleanup()
  })
})
