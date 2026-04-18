// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createSelect } from "../src/primitives/select.ts"

beforeEach(() => {
  document.body.innerHTML = ""
})
afterEach(() => {
  document.body.innerHTML = ""
})

describe("createSelect", () => {
  it("trigger props carry aria-haspopup + aria-expanded", () => {
    const s = createSelect()
    const p = s.getTriggerProps()
    expect(p["aria-haspopup"]).toBe("listbox")
    expect(p["aria-expanded"]).toBe("false")
  })

  it("show() opens + highlights first enabled item", () => {
    const s = createSelect()
    s.registerItem("a")
    s.registerItem("b")
    s.show()
    expect(s.open.get()).toBe(true)
    expect(s.highlighted.get()).toBe("a")
  })

  it("select() commits value + closes popup", () => {
    const onValueChange = vi.fn()
    const s = createSelect({ onValueChange })
    s.registerItem("a", { label: "Apple" })
    s.registerItem("b", { label: "Banana" })
    s.show()
    s.select("b")
    expect(s.value.get()).toBe("b")
    expect(s.open.get()).toBe(false)
    expect(onValueChange).toHaveBeenCalledWith("b")
  })

  it("displayValue returns the label of the current value", () => {
    const s = createSelect({ defaultValue: "a" })
    s.registerItem("a", { label: "Apple" })
    expect(s.displayValue()).toBe("Apple")
  })

  it("type-ahead jumps to first match by label prefix", () => {
    const s = createSelect()
    s.registerItem("a", { label: "Apple" })
    s.registerItem("b", { label: "Banana" })
    s.registerItem("c", { label: "Cherry" })
    s.show()
    s.typeAhead("c")
    expect(s.highlighted.get()).toBe("c")
  })

  it("hidden input emits name+value when `name` provided", () => {
    const s = createSelect({ name: "fruit", defaultValue: "a" })
    const p = s.getHiddenInputProps()
    expect(p).toEqual({ type: "hidden", name: "fruit", value: "a" })
  })
})
