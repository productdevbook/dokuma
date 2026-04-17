// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createToggle } from "../src/primitives/toggle.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createToggle (uncontrolled)", () => {
  it("starts off by default", () => {
    const t = createToggle()
    expect(t.pressed.get()).toBe(false)
    expect(t.getRootProps()["aria-pressed"]).toBe("false")
    expect(t.getRootProps()["data-state"]).toBe("off")
  })

  it("respects defaultPressed", () => {
    const t = createToggle({ defaultPressed: true })
    expect(t.pressed.get()).toBe(true)
    expect(t.getRootProps()["data-state"]).toBe("on")
  })

  it("toggle/press/unpress flip state", () => {
    const t = createToggle()
    t.toggle()
    expect(t.pressed.get()).toBe(true)
    t.unpress()
    expect(t.pressed.get()).toBe(false)
    t.press()
    expect(t.pressed.get()).toBe(true)
  })

  it("aria-pressed is a string token", () => {
    const t = createToggle({ defaultPressed: true })
    const v = t.getRootProps()["aria-pressed"]
    expect(typeof v).toBe("string")
    expect(v).toBe("true")
  })

  it("calls onPressedChange", () => {
    const onPressedChange = vi.fn()
    const t = createToggle({ onPressedChange })
    t.toggle()
    expect(onPressedChange).toHaveBeenCalledWith(true)
  })

  it("ignores actions while disabled", () => {
    const t = createToggle({ disabled: () => true })
    t.toggle()
    expect(t.pressed.get()).toBe(false)
  })

  it("getRootProps onClick toggles", () => {
    const t = createToggle()
    t.getRootProps().onClick()
    expect(t.pressed.get()).toBe(true)
  })
})

describe("createToggle (controlled)", () => {
  it("reads pressed via getter", () => {
    let v = false
    const t = createToggle({ pressed: () => v })
    expect(t.pressed.get()).toBe(false)
    v = true
    expect(t.pressed.get()).toBe(true)
  })

  it("does not mutate internal state in controlled", () => {
    let v = false
    const t = createToggle({ pressed: () => v })
    t.toggle()
    expect(t.pressed.get()).toBe(false)
  })
})

describe("createToggle.mount (DOM)", () => {
  it("toggles on click and syncs ARIA", () => {
    const root = document.createElement("button")
    document.body.append(root)
    const t = createToggle()
    const destroy = t.mount(root)

    expect(root.getAttribute("aria-pressed")).toBe("false")
    expect(root.getAttribute("data-state")).toBe("off")

    root.click()
    expect(t.pressed.get()).toBe(true)
    expect(root.getAttribute("aria-pressed")).toBe("true")
    expect(root.getAttribute("data-state")).toBe("on")

    destroy()
  })
})
