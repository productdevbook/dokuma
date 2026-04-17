// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createTabs } from "../src/primitives/tabs.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createTabs (init)", () => {
  it("auto-selects first non-disabled tab silently", () => {
    const onValueChange = vi.fn()
    const t = createTabs({ onValueChange })
    t.registerTab("a")
    t.registerTab("b")
    expect(t.value.get()).toBe("a")
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("respects defaultValue over auto-select", () => {
    const t = createTabs({ defaultValue: "b" })
    t.registerTab("a")
    t.registerTab("b")
    expect(t.value.get()).toBe("b")
  })

  it("skips disabled when auto-selecting", () => {
    const t = createTabs()
    t.registerTab("a", { disabled: () => true })
    t.registerTab("b")
    expect(t.value.get()).toBe("b")
  })
})

describe("createTabs (selection)", () => {
  it("select changes value and notifies", () => {
    const onValueChange = vi.fn()
    const t = createTabs({ onValueChange })
    t.registerTab("a")
    t.registerTab("b")
    t.select("b")
    expect(t.value.get()).toBe("b")
    expect(onValueChange).toHaveBeenCalledWith("b")
  })

  it("disabled tab cannot be selected", () => {
    const t = createTabs()
    t.registerTab("a")
    t.registerTab("b", { disabled: () => true })
    t.select("b")
    expect(t.value.get()).toBe("a")
  })
})

describe("createTabs (controlled)", () => {
  it("reads value via getter", () => {
    let v = "a"
    const t = createTabs({ value: () => v })
    t.registerTab("a")
    t.registerTab("b")
    expect(t.value.get()).toBe("a")
    v = "b"
    expect(t.value.get()).toBe("b")
    expect(t.isSelected("b")).toBe(true)
  })

  it("does not auto-select in controlled mode", () => {
    let v = ""
    const onValueChange = vi.fn()
    const t = createTabs({ value: () => v, onValueChange })
    t.registerTab("a")
    expect(onValueChange).not.toHaveBeenCalled()
    expect(t.value.get()).toBe("")
  })
})

describe("createTabs (props shape)", () => {
  it("emits aria-selected, not aria-expanded", () => {
    const t = createTabs()
    t.registerTab("a")
    const props = t.getTabProps("a") as unknown as Record<string, unknown>
    expect(props["aria-selected"]).toBe(true)
    expect(props["aria-expanded"]).toBeUndefined()
  })

  it("roving tabindex: selected tab=0, others=-1", () => {
    const t = createTabs({ defaultValue: "a" })
    t.registerTab("a")
    t.registerTab("b")
    expect(t.getTabProps("a").tabIndex).toBe(0)
    expect(t.getTabProps("b").tabIndex).toBe(-1)
    t.select("b")
    expect(t.getTabProps("a").tabIndex).toBe(-1)
    expect(t.getTabProps("b").tabIndex).toBe(0)
  })

  it("panel always has tabIndex 0 and role tabpanel", () => {
    const t = createTabs()
    t.registerTab("a")
    const p = t.getPanelProps("a")
    expect(p.role).toBe("tabpanel")
    expect(p.tabIndex).toBe(0)
  })

  it("list has role=tablist and aria-orientation", () => {
    const t = createTabs({ orientation: "vertical" })
    expect(t.getListProps().role).toBe("tablist")
    expect(t.getListProps()["aria-orientation"]).toBe("vertical")
  })

  it("getTabProps onClick selects", () => {
    const t = createTabs()
    t.registerTab("a")
    t.registerTab("b")
    t.getTabProps("b").onClick()
    expect(t.value.get()).toBe("b")
  })
})

describe("createTabs (keyboard, automatic)", () => {
  it("ArrowRight focuses and selects next tab", () => {
    const t = createTabs({ defaultValue: "a" })
    const ha = t.registerTab("a")
    const hb = t.registerTab("b")
    t.registerTab("c")

    const ba = document.createElement("button")
    ba.id = ha.tabId
    const bb = document.createElement("button")
    bb.id = hb.tabId
    document.body.append(ba, bb)

    ba.focus()
    t.getTabProps("a").onKeyDown({
      key: "ArrowRight",
      preventDefault: () => {},
      stopPropagation: () => {},
    })
    expect(document.activeElement).toBe(bb)
    expect(t.value.get()).toBe("b")
  })

  it("Space activates current tab regardless of mode", () => {
    const t = createTabs({ activationMode: "manual", defaultValue: "a" })
    t.registerTab("a")
    t.registerTab("b")
    t.getTabProps("b").onKeyDown({
      key: " ",
      preventDefault: () => {},
      stopPropagation: () => {},
    })
    expect(t.value.get()).toBe("b")
  })
})

describe("createTabs (keyboard, manual)", () => {
  it("ArrowRight focuses next but does not select", () => {
    const t = createTabs({ activationMode: "manual", defaultValue: "a" })
    const ha = t.registerTab("a")
    const hb = t.registerTab("b")

    const ba = document.createElement("button")
    ba.id = ha.tabId
    const bb = document.createElement("button")
    bb.id = hb.tabId
    document.body.append(ba, bb)

    ba.focus()
    t.getTabProps("a").onKeyDown({
      key: "ArrowRight",
      preventDefault: () => {},
      stopPropagation: () => {},
    })
    expect(document.activeElement).toBe(bb)
    expect(t.value.get()).toBe("a") // not selected
  })
})

describe("createTabs (loop)", () => {
  it("loop true: ArrowRight from last wraps to first", () => {
    const t = createTabs({ defaultValue: "b" })
    const ha = t.registerTab("a")
    const hb = t.registerTab("b")

    const ba = document.createElement("button")
    ba.id = ha.tabId
    const bb = document.createElement("button")
    bb.id = hb.tabId
    document.body.append(ba, bb)

    bb.focus()
    t.getTabProps("b").onKeyDown({
      key: "ArrowRight",
      preventDefault: () => {},
      stopPropagation: () => {},
    })
    expect(document.activeElement).toBe(ba)
  })

  it("loop false: ArrowRight from last is no-op", () => {
    const t = createTabs({ defaultValue: "b", loop: false })
    const ha = t.registerTab("a")
    const hb = t.registerTab("b")

    const ba = document.createElement("button")
    ba.id = ha.tabId
    const bb = document.createElement("button")
    bb.id = hb.tabId
    document.body.append(ba, bb)

    bb.focus()
    t.getTabProps("b").onKeyDown({
      key: "ArrowRight",
      preventDefault: () => {},
      stopPropagation: () => {},
    })
    expect(document.activeElement).toBe(bb)
  })
})

describe("createTabs.mount (DOM auto-discovery)", () => {
  it("wires tabs and panels", () => {
    document.body.innerHTML = `
      <div id="tabs-root">
        <div data-dokuma-tabs-list>
          <button data-dokuma-tabs-tab="a">A</button>
          <button data-dokuma-tabs-tab="b">B</button>
        </div>
        <div data-dokuma-tabs-panel="a">A panel</div>
        <div data-dokuma-tabs-panel="b">B panel</div>
      </div>
    `
    const root = document.getElementById("tabs-root") as HTMLElement
    const t = createTabs()
    const destroy = t.mount(root)

    const tabA = root.querySelector('[data-dokuma-tabs-tab="a"]') as HTMLButtonElement
    const tabB = root.querySelector('[data-dokuma-tabs-tab="b"]') as HTMLButtonElement
    const panelA = root.querySelector('[data-dokuma-tabs-panel="a"]') as HTMLElement
    const panelB = root.querySelector('[data-dokuma-tabs-panel="b"]') as HTMLElement

    expect(tabA.getAttribute("aria-selected")).toBe("true")
    expect(tabA.getAttribute("tabindex")).toBe("0")
    expect(tabB.getAttribute("tabindex")).toBe("-1")
    expect(panelA.hasAttribute("hidden")).toBe(false)
    expect(panelB.hasAttribute("hidden")).toBe(true)

    tabB.click()
    expect(t.value.get()).toBe("b")
    expect(tabA.getAttribute("aria-selected")).toBe("false")
    expect(tabB.getAttribute("aria-selected")).toBe("true")

    destroy()
  })
})
