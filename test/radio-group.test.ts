// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createRadioGroup } from "../src/primitives/radio-group.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createRadioGroup (basic)", () => {
  it("select changes value and fires callback", () => {
    const onValueChange = vi.fn()
    const g = createRadioGroup({ onValueChange })
    g.registerItem("a")
    g.registerItem("b")
    g.select("b")
    expect(g.value.get()).toBe("b")
    expect(g.isChecked("b")).toBe(true)
    expect(onValueChange).toHaveBeenCalledWith("b")
  })

  it("respects defaultValue", () => {
    const g = createRadioGroup({ defaultValue: "a" })
    g.registerItem("a")
    g.registerItem("b")
    expect(g.isChecked("a")).toBe(true)
  })

  it("only one item can be checked at a time", () => {
    const g = createRadioGroup()
    g.registerItem("a")
    g.registerItem("b")
    g.select("a")
    g.select("b")
    expect(g.isChecked("a")).toBe(false)
    expect(g.isChecked("b")).toBe(true)
  })
})

describe("createRadioGroup (props shape)", () => {
  it("root has role=radiogroup", () => {
    const g = createRadioGroup({ orientation: "horizontal" })
    const p = g.getRootProps()
    expect(p.role).toBe("radiogroup")
    expect(p["aria-orientation"]).toBe("horizontal")
  })

  it("item has role=radio and aria-checked", () => {
    const g = createRadioGroup({ defaultValue: "a" })
    g.registerItem("a")
    g.registerItem("b")
    expect(g.getItemProps("a").role).toBe("radio")
    expect(g.getItemProps("a")["aria-checked"]).toBe("true")
    expect(g.getItemProps("b")["aria-checked"]).toBe("false")
  })

  it("roving tabindex: checked is 0, others are -1", () => {
    const g = createRadioGroup({ defaultValue: "b" })
    g.registerItem("a")
    g.registerItem("b")
    g.registerItem("c")
    expect(g.getItemProps("a").tabIndex).toBe(-1)
    expect(g.getItemProps("b").tabIndex).toBe(0)
    expect(g.getItemProps("c").tabIndex).toBe(-1)
  })

  it("when nothing is checked, first non-disabled item is the tab stop", () => {
    const g = createRadioGroup()
    g.registerItem("a", { disabled: () => true })
    g.registerItem("b")
    expect(g.getItemProps("a").tabIndex).toBe(-1)
    expect(g.getItemProps("b").tabIndex).toBe(0)
  })
})

describe("createRadioGroup (keyboard)", () => {
  it("ArrowDown moves focus and selects next item (WAI-ARIA)", () => {
    const g = createRadioGroup({ defaultValue: "a", orientation: "vertical" })
    const ha = g.registerItem("a")
    const hb = g.registerItem("b")
    const ba = document.createElement("button")
    ba.id = ha.itemId
    const bb = document.createElement("button")
    bb.id = hb.itemId
    document.body.append(ba, bb)

    ba.focus()
    g.getItemProps("a").onKeyDown({
      key: "ArrowDown",
      preventDefault: () => {},
      stopPropagation: () => {},
    })
    expect(document.activeElement).toBe(bb)
    expect(g.value.get()).toBe("b")
  })

  it("Space selects current item", () => {
    const g = createRadioGroup()
    g.registerItem("a")
    g.getItemProps("a").onKeyDown({
      key: " ",
      preventDefault: () => {},
      stopPropagation: () => {},
    })
    expect(g.isChecked("a")).toBe(true)
  })
})

describe("createRadioGroup (form)", () => {
  it("getHiddenInputProps returns null without name", () => {
    const g = createRadioGroup()
    g.registerItem("a")
    expect(g.getHiddenInputProps("a")).toBeNull()
  })

  it("getHiddenInputProps returns hidden radio when name is set", () => {
    const g = createRadioGroup({ name: "plan", defaultValue: "pro" })
    g.registerItem("free")
    g.registerItem("pro")
    const p = g.getHiddenInputProps("pro")
    expect(p).toMatchObject({ type: "radio", name: "plan", value: "pro", checked: true })
  })
})

describe("createRadioGroup (disabled)", () => {
  it("disabled root blocks all selection", () => {
    let disabled = true
    const g = createRadioGroup({ disabled: () => disabled })
    g.registerItem("a")
    g.select("a")
    expect(g.isChecked("a")).toBe(false)
    disabled = false
    g.select("a")
    expect(g.isChecked("a")).toBe(true)
  })

  it("per-item disabled blocks selection of that item only", () => {
    const g = createRadioGroup()
    g.registerItem("a", { disabled: () => true })
    g.registerItem("b")
    g.select("a")
    expect(g.isChecked("a")).toBe(false)
    g.select("b")
    expect(g.isChecked("b")).toBe(true)
  })
})
