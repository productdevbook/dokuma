// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createAccordion } from "../src/primitives/accordion.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createAccordion (single)", () => {
  it("opens one and closes the previous", () => {
    const a = createAccordion()
    a.registerItem("a")
    a.registerItem("b")
    a.open("a")
    expect(a.isOpen("a")).toBe(true)
    a.open("b")
    expect(a.isOpen("a")).toBe(false)
    expect(a.isOpen("b")).toBe(true)
  })

  it("non-collapsible: closing the only open is a no-op", () => {
    const a = createAccordion({ defaultValue: "a" })
    a.registerItem("a")
    const fn = vi.fn()
    a.values.subscribe(fn)
    a.close("a")
    expect(a.isOpen("a")).toBe(true)
    expect(fn).not.toHaveBeenCalled()
  })

  it("collapsible: closing the only open works", () => {
    const a = createAccordion({ collapsible: true, defaultValue: "a" })
    a.registerItem("a")
    a.close("a")
    expect(a.isOpen("a")).toBe(false)
  })

  it("toggle on a different item swaps", () => {
    const a = createAccordion({ defaultValue: "a" })
    a.registerItem("a")
    a.registerItem("b")
    a.toggle("b")
    expect(a.isOpen("a")).toBe(false)
    expect(a.isOpen("b")).toBe(true)
  })

  it("onValueChange fires with single string", () => {
    const onValueChange = vi.fn()
    const a = createAccordion({ onValueChange })
    a.registerItem("a")
    a.open("a")
    expect(onValueChange).toHaveBeenLastCalledWith("a")
  })
})

describe("createAccordion (multiple)", () => {
  it("opens many", () => {
    const a = createAccordion({ type: "multiple" })
    a.registerItem("a")
    a.registerItem("b")
    a.open("a")
    a.open("b")
    expect(a.values.get()).toEqual(["a", "b"])
  })

  it("close one keeps others", () => {
    const a = createAccordion({ type: "multiple", defaultValue: ["a", "b"] })
    a.registerItem("a")
    a.registerItem("b")
    a.close("a")
    expect(a.values.get()).toEqual(["b"])
  })

  it("onValueChange fires with array", () => {
    const onValueChange = vi.fn()
    const a = createAccordion({ type: "multiple", onValueChange })
    a.registerItem("a")
    a.open("a")
    expect(onValueChange).toHaveBeenLastCalledWith(["a"])
  })
})

describe("createAccordion (controlled)", () => {
  it("reads value via getter", () => {
    let v: string = "a"
    const a = createAccordion({ value: () => v })
    a.registerItem("a")
    a.registerItem("b")
    expect(a.isOpen("a")).toBe(true)
    v = "b"
    expect(a.isOpen("a")).toBe(false)
    expect(a.isOpen("b")).toBe(true)
  })

  it("does not mutate internal state", () => {
    let v: string = ""
    const onValueChange = vi.fn()
    const a = createAccordion({ value: () => v, onValueChange })
    a.registerItem("a")
    a.open("a")
    expect(onValueChange).toHaveBeenCalledWith("a")
    expect(a.isOpen("a")).toBe(false) // still controlled
  })
})

describe("createAccordion (disabled)", () => {
  it("root disabled blocks open/close/toggle", () => {
    let disabled = true
    const a = createAccordion({ disabled: () => disabled })
    a.registerItem("a")
    a.open("a")
    expect(a.isOpen("a")).toBe(false)
    disabled = false
    a.open("a")
    expect(a.isOpen("a")).toBe(true)
  })

  it("per-item disabled blocks only that item", () => {
    let aDisabled = true
    const acc = createAccordion()
    acc.registerItem("a", { disabled: () => aDisabled })
    acc.registerItem("b")
    acc.open("a")
    expect(acc.isOpen("a")).toBe(false)
    acc.open("b")
    expect(acc.isOpen("b")).toBe(true)
  })

  it("trigger props expose aria-disabled when disabled", () => {
    const a = createAccordion()
    a.registerItem("a", { disabled: () => true })
    const props = a.getTriggerProps("a")
    expect(props["aria-disabled"]).toBe(true)
    expect(props["data-disabled"]).toBe(true)
  })
})

describe("createAccordion (props shape)", () => {
  it("trigger and panel ids are wired", () => {
    const a = createAccordion()
    a.registerItem("a")
    const t = a.getTriggerProps("a")
    const p = a.getPanelProps("a")
    expect(t["aria-controls"]).toBe(p.id)
    expect(p["aria-labelledby"]).toBe(t.id)
  })

  it("root has data-orientation", () => {
    const a = createAccordion({ orientation: "horizontal" })
    expect(a.getRootProps()["data-orientation"]).toBe("horizontal")
  })

  it("panel hidden reflects open state", () => {
    const a = createAccordion()
    a.registerItem("a")
    expect(a.getPanelProps("a").hidden).toBe(true)
    a.open("a")
    expect(a.getPanelProps("a").hidden).toBe(false)
  })

  it("getTriggerProps onClick toggles", () => {
    const a = createAccordion()
    a.registerItem("a")
    const onClick = a.getTriggerProps("a").onClick
    onClick()
    expect(a.isOpen("a")).toBe(true)
  })
})

describe("createAccordion (registration)", () => {
  it("unregisterItem closes if open", () => {
    const a = createAccordion({ defaultValue: "a" })
    const handle = a.registerItem("a")
    expect(a.isOpen("a")).toBe(true)
    handle.unregister()
    expect(a.values.get()).toEqual([])
  })

  it("re-register with same value updates disabled but keeps ids", () => {
    const a = createAccordion()
    const h1 = a.registerItem("a")
    const h2 = a.registerItem("a", { disabled: () => true })
    expect(h2.triggerId).toBe(h1.triggerId)
    expect(a.isItemDisabled("a")).toBe(true)
  })

  it("getTriggerProps throws for unknown value", () => {
    const a = createAccordion()
    expect(() => a.getTriggerProps("x")).toThrow(/not registered/)
  })
})

describe("createAccordion (keyboard)", () => {
  it("ArrowDown moves focus to next trigger; End moves to last", async () => {
    const a = createAccordion()
    const handles = ["a", "b", "c"].map((v) => a.registerItem(v))

    const buttons = handles.map((h) => {
      const btn = document.createElement("button")
      btn.id = h.triggerId
      document.body.append(btn)
      return btn
    })

    buttons[0]!.focus()
    const onKeyDown = a.getTriggerProps("a").onKeyDown
    onKeyDown({ key: "ArrowDown", preventDefault: () => {}, stopPropagation: () => {} })
    expect(document.activeElement).toBe(buttons[1])
    onKeyDown({ key: "End", preventDefault: () => {}, stopPropagation: () => {} })
    expect(document.activeElement).toBe(buttons[2])
    onKeyDown({ key: "Home", preventDefault: () => {}, stopPropagation: () => {} })
    expect(document.activeElement).toBe(buttons[0])
  })

  it("ArrowDown skips disabled items", () => {
    const a = createAccordion()
    const ha = a.registerItem("a")
    const hb = a.registerItem("b", { disabled: () => true })
    const hc = a.registerItem("c")

    const ba = document.createElement("button")
    ba.id = ha.triggerId
    const bb = document.createElement("button")
    bb.id = hb.triggerId
    bb.setAttribute("aria-disabled", "true")
    const bc = document.createElement("button")
    bc.id = hc.triggerId
    document.body.append(ba, bb, bc)

    ba.focus()
    a.getTriggerProps("a").onKeyDown({
      key: "ArrowDown",
      preventDefault: () => {},
      stopPropagation: () => {},
    })
    expect(document.activeElement).toBe(bc)
  })
})

describe("createAccordion.mount (DOM auto-discovery)", () => {
  it("wires up triggers and panels from data-dokuma-* attributes", () => {
    document.body.innerHTML = `
      <div id="root">
        <div data-dokuma-accordion-item="a">
          <button data-dokuma-accordion-trigger>A</button>
          <div data-dokuma-accordion-panel>panel A</div>
        </div>
        <div data-dokuma-accordion-item="b">
          <button data-dokuma-accordion-trigger>B</button>
          <div data-dokuma-accordion-panel>panel B</div>
        </div>
      </div>
    `
    const root = document.getElementById("root") as HTMLElement
    const a = createAccordion()
    const destroy = a.mount(root)

    const triggerA = root.querySelector(
      '[data-dokuma-accordion-item="a"] [data-dokuma-accordion-trigger]',
    ) as HTMLButtonElement
    const panelA = root.querySelector(
      '[data-dokuma-accordion-item="a"] [data-dokuma-accordion-panel]',
    ) as HTMLElement

    expect(triggerA.getAttribute("aria-expanded")).toBe("false")
    expect(panelA.hasAttribute("hidden")).toBe(true)

    triggerA.click()
    expect(a.isOpen("a")).toBe(true)
    expect(triggerA.getAttribute("aria-expanded")).toBe("true")
    expect(panelA.hasAttribute("hidden")).toBe(false)

    destroy()
    triggerA.click()
    expect(a.isOpen("a")).toBe(true) // listener removed
  })
})
