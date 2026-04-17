// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createToggleGroup } from "../src/primitives/toggle-group.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createToggleGroup (single)", () => {
  it("pressing one unpresses the previous", () => {
    const g = createToggleGroup()
    g.registerItem("a")
    g.registerItem("b")
    g.press("a")
    expect(g.isPressed("a")).toBe(true)
    g.press("b")
    expect(g.isPressed("a")).toBe(false)
    expect(g.isPressed("b")).toBe(true)
  })

  it("non-collapsible: unpressing the only pressed is a no-op", () => {
    const g = createToggleGroup({ defaultValue: "a" })
    g.registerItem("a")
    const fn = vi.fn()
    g.values.subscribe(fn)
    g.unpress("a")
    expect(g.isPressed("a")).toBe(true)
    expect(fn).not.toHaveBeenCalled()
  })

  it("collapsible: unpressing the only pressed works", () => {
    const g = createToggleGroup({ collapsible: true, defaultValue: "a" })
    g.registerItem("a")
    g.unpress("a")
    expect(g.isPressed("a")).toBe(false)
  })

  it("does not auto-select an item by default", () => {
    const g = createToggleGroup()
    g.registerItem("a")
    g.registerItem("b")
    expect(g.values.get()).toEqual([])
  })

  it("onValueChange fires with single string", () => {
    const onValueChange = vi.fn()
    const g = createToggleGroup({ onValueChange })
    g.registerItem("a")
    g.press("a")
    expect(onValueChange).toHaveBeenLastCalledWith("a")
  })
})

describe("createToggleGroup (multiple)", () => {
  it("presses many", () => {
    const g = createToggleGroup({ type: "multiple" })
    g.registerItem("a")
    g.registerItem("b")
    g.press("a")
    g.press("b")
    expect(g.values.get()).toEqual(["a", "b"])
  })

  it("unpressing keeps others", () => {
    const g = createToggleGroup({ type: "multiple", defaultValue: ["a", "b"] })
    g.registerItem("a")
    g.registerItem("b")
    g.unpress("a")
    expect(g.values.get()).toEqual(["b"])
  })

  it("onValueChange fires with array", () => {
    const onValueChange = vi.fn()
    const g = createToggleGroup({ type: "multiple", onValueChange })
    g.registerItem("a")
    g.press("a")
    expect(onValueChange).toHaveBeenLastCalledWith(["a"])
  })
})

describe("createToggleGroup (controlled)", () => {
  it("reads value via getter", () => {
    let v: string = "a"
    const g = createToggleGroup({ value: () => v })
    g.registerItem("a")
    g.registerItem("b")
    expect(g.isPressed("a")).toBe(true)
    v = "b"
    expect(g.isPressed("a")).toBe(false)
    expect(g.isPressed("b")).toBe(true)
  })
})

describe("createToggleGroup (props shape)", () => {
  it("root has role=group and aria-orientation", () => {
    const g = createToggleGroup({ orientation: "vertical" })
    const r = g.getRootProps()
    expect(r.role).toBe("group")
    expect(r["aria-orientation"]).toBe("vertical")
  })

  it("aria-label passthrough", () => {
    const g = createToggleGroup({ "aria-label": "Text formatting" })
    expect(g.getRootProps()["aria-label"]).toBe("Text formatting")
  })

  it("item uses aria-pressed (not aria-checked or aria-selected)", () => {
    const g = createToggleGroup()
    g.registerItem("a")
    const p = g.getItemProps("a") as unknown as Record<string, unknown>
    expect(p["aria-pressed"]).toBe("false")
    expect(p["aria-checked"]).toBeUndefined()
    expect(p["aria-selected"]).toBeUndefined()
  })

  it("data-state is on/off (not checked/unchecked)", () => {
    const g = createToggleGroup({ defaultValue: "a" })
    g.registerItem("a")
    expect(g.getItemProps("a")["data-state"]).toBe("on")
    g.registerItem("b")
    expect(g.getItemProps("b")["data-state"]).toBe("off")
  })

  it("roving tabindex: focused item=0, others=-1", () => {
    const g = createToggleGroup()
    g.registerItem("a")
    g.registerItem("b")
    g.registerItem("c")
    // initially first non-disabled is the focused fallback
    expect(g.getItemProps("a").tabIndex).toBe(0)
    expect(g.getItemProps("b").tabIndex).toBe(-1)
    g.setFocused("c")
    expect(g.getItemProps("a").tabIndex).toBe(-1)
    expect(g.getItemProps("c").tabIndex).toBe(0)
  })

  it("rovingFocus=false: every item is tabIndex=0", () => {
    const g = createToggleGroup({ rovingFocus: false })
    g.registerItem("a")
    g.registerItem("b")
    expect(g.getItemProps("a").tabIndex).toBe(0)
    expect(g.getItemProps("b").tabIndex).toBe(0)
  })
})

describe("createToggleGroup (disabled)", () => {
  it("per-item disabled blocks only that item", () => {
    const g = createToggleGroup()
    g.registerItem("a", { disabled: () => true })
    g.registerItem("b")
    g.press("a")
    expect(g.isPressed("a")).toBe(false)
    g.press("b")
    expect(g.isPressed("b")).toBe(true)
  })

  it("disabled item is skipped as default focus fallback", () => {
    const g = createToggleGroup()
    g.registerItem("a", { disabled: () => true })
    g.registerItem("b")
    expect(g.getItemProps("a").tabIndex).toBe(-1)
    expect(g.getItemProps("b").tabIndex).toBe(0)
  })
})

describe("createToggleGroup (keyboard)", () => {
  it("Space toggles current value", () => {
    const g = createToggleGroup({ type: "multiple" })
    g.registerItem("a")
    g.registerItem("b")
    g.getItemProps("a").onKeyDown({
      key: " ",
      preventDefault: () => {},
      stopPropagation: () => {},
    })
    expect(g.isPressed("a")).toBe(true)
  })

  it("ArrowRight moves focus to next enabled item", () => {
    const g = createToggleGroup()
    const ha = g.registerItem("a")
    const hb = g.registerItem("b")
    g.registerItem("c")

    const ba = document.createElement("button")
    ba.id = ha.itemId
    const bb = document.createElement("button")
    bb.id = hb.itemId
    document.body.append(ba, bb)

    ba.focus()
    g.getItemProps("a").onKeyDown({
      key: "ArrowRight",
      preventDefault: () => {},
      stopPropagation: () => {},
    })
    expect(document.activeElement).toBe(bb)
  })

  it("loop:false stops at the end", () => {
    const g = createToggleGroup({ loop: false })
    const ha = g.registerItem("a")
    const hb = g.registerItem("b")
    const ba = document.createElement("button")
    ba.id = ha.itemId
    const bb = document.createElement("button")
    bb.id = hb.itemId
    document.body.append(ba, bb)
    bb.focus()
    g.getItemProps("b").onKeyDown({
      key: "ArrowRight",
      preventDefault: () => {},
      stopPropagation: () => {},
    })
    expect(document.activeElement).toBe(bb)
  })
})

describe("createToggleGroup.mount (DOM)", () => {
  it("wires items via data-dokuma-toggle-group-item", () => {
    document.body.innerHTML = `
      <div id="root">
        <button data-dokuma-toggle-group-item="left">L</button>
        <button data-dokuma-toggle-group-item="center">C</button>
        <button data-dokuma-toggle-group-item="right">R</button>
      </div>
    `
    const root = document.getElementById("root") as HTMLElement
    const g = createToggleGroup()
    const destroy = g.mount(root)

    const left = root.querySelector('[data-dokuma-toggle-group-item="left"]') as HTMLButtonElement
    const center = root.querySelector(
      '[data-dokuma-toggle-group-item="center"]',
    ) as HTMLButtonElement

    expect(left.getAttribute("aria-pressed")).toBe("false")
    expect(left.getAttribute("data-state")).toBe("off")

    center.click()
    expect(g.isPressed("center")).toBe(true)
    expect(center.getAttribute("aria-pressed")).toBe("true")
    expect(left.getAttribute("aria-pressed")).toBe("false")

    destroy()
  })
})
