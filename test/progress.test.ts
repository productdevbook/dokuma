// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { createProgress } from "../src/primitives/progress.ts"

beforeEach(() => {
  document.body.innerHTML = ""
})

describe("createProgress", () => {
  it("indeterminate when value is null", () => {
    const p = createProgress()
    expect(p.value.get()).toBeNull()
    expect(p.getRootProps()["data-state"]).toBe("indeterminate")
    expect(p.getRootProps()["aria-valuenow"]).toBeUndefined()
  })

  it("loading when 0 < value < max", () => {
    const p = createProgress({ defaultValue: 50 })
    expect(p.getRootProps()["data-state"]).toBe("loading")
    expect(p.getRootProps()["aria-valuenow"]).toBe(50)
    expect(p.getIndicatorProps().style?.width).toBe("50%")
  })

  it("complete when value >= max", () => {
    const p = createProgress({ defaultValue: 100 })
    expect(p.getRootProps()["data-state"]).toBe("complete")
  })

  it("custom max", () => {
    const p = createProgress({ defaultValue: 25, max: 50 })
    expect(p.getRootProps()["aria-valuemax"]).toBe(50)
    expect(p.fraction()).toBe(0.5)
  })

  it("aria-valuetext uses default label", () => {
    const p = createProgress({ defaultValue: 33 })
    expect(p.getRootProps()["aria-valuetext"]).toBe("33%")
  })

  it("custom getValueLabel", () => {
    const p = createProgress({
      defaultValue: 7,
      max: 10,
      getValueLabel: (v, m) => `${v} of ${m}`,
    })
    expect(p.getRootProps()["aria-valuetext"]).toBe("7 of 10")
  })

  it("controlled mode", () => {
    let v: number | null = 30
    const p = createProgress({ value: () => v })
    expect(p.value.get()).toBe(30)
    v = 60
    expect(p.value.get()).toBe(60)
  })

  it("mount syncs DOM", () => {
    const root = document.createElement("div")
    const indicator = document.createElement("div")
    document.body.append(root, indicator)
    const p = createProgress({ defaultValue: 25 })
    const destroy = p.mount({ root, indicator })

    expect(root.getAttribute("role")).toBe("progressbar")
    expect(root.getAttribute("aria-valuenow")).toBe("25")
    expect(indicator.style.width).toBe("25%")

    p.value.set(75)
    expect(root.getAttribute("aria-valuenow")).toBe("75")
    expect(indicator.style.width).toBe("75%")

    destroy()
  })
})
