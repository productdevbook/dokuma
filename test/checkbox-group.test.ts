// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createCheckboxGroup } from "../src/primitives/checkbox-group.ts"

beforeEach(() => {
  document.body.innerHTML = ""
})
afterEach(() => {
  document.body.innerHTML = ""
})

describe("createCheckboxGroup", () => {
  it("initial value comes from defaultValue", () => {
    const g = createCheckboxGroup({ defaultValue: ["a"] })
    expect(g.getItem("a").isChecked()).toBe(true)
    expect(g.getItem("b").isChecked()).toBe(false)
  })

  it("toggle adds/removes from the value array", () => {
    const g = createCheckboxGroup()
    const a = g.getItem("a")
    a.toggle()
    expect(g.value.get()).toEqual(["a"])
    a.toggle()
    expect(g.value.get()).toEqual([])
  })

  it("onValueChange fires on change", () => {
    const onValueChange = vi.fn()
    const g = createCheckboxGroup({ onValueChange })
    g.getItem("a").setChecked(true)
    expect(onValueChange).toHaveBeenCalledWith(["a"])
  })

  it("mount syncs native input.checked", () => {
    const g = createCheckboxGroup({ defaultValue: ["a"] })
    const el = document.createElement("input")
    document.body.append(el)
    const cleanup = g.getItem("a").mount(el)
    expect(el.checked).toBe(true)
    el.checked = false
    el.dispatchEvent(new Event("change"))
    expect(g.value.get()).toEqual([])
    cleanup()
  })
})
