// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createContextMenu } from "../src/primitives/context-menu.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
  vi.useRealTimers()
})

function setupAnchor(): { anchor: HTMLElement; content: HTMLElement } {
  const anchor = document.createElement("div")
  anchor.style.width = "200px"
  anchor.style.height = "200px"
  document.body.append(anchor)
  const content = document.createElement("div")
  document.body.append(content)
  return { anchor, content }
}

describe("createContextMenu (basic)", () => {
  it("starts closed; show/hide/toggle wire through underlying menu", () => {
    const cm = createContextMenu()
    expect(cm.open.get()).toBe(false)
    cm.show()
    expect(cm.open.get()).toBe(true)
    cm.hide()
    expect(cm.open.get()).toBe(false)
    cm.toggle()
    expect(cm.open.get()).toBe(true)
  })

  it("anchor props expose data-state and contextmenu handler", () => {
    const cm = createContextMenu()
    const ap = cm.getAnchorProps()
    expect(ap["data-state"]).toBe("closed")
    expect(typeof ap.onContextMenu).toBe("function")
  })

  it("contextmenu handler opens the menu and prevents default", () => {
    const cm = createContextMenu()
    const preventDefault = vi.fn()
    cm.getAnchorProps().onContextMenu({ clientX: 10, clientY: 20, preventDefault })
    expect(preventDefault).toHaveBeenCalled()
    expect(cm.open.get()).toBe(true)
  })

  it("content props pass through from menu (role=menu, aria-labelledby)", () => {
    const cm = createContextMenu()
    const cp = cm.getContentProps()
    expect(cp.role).toBe("menu")
    expect(cp.id).toBe(cm.contentId)
    expect(cp.tabIndex).toBe(-1)
  })

  it("registerItem + getItemProps return menuitem props", () => {
    const cm = createContextMenu()
    cm.registerItem("a", { label: "Cut" })
    const ip = cm.getItemProps("a")
    expect(ip.role).toBe("menuitem")
    expect(ip.tabIndex).toBe(-1)
  })

  it("select fires onSelect and closes", () => {
    const onSelect = vi.fn()
    const cm = createContextMenu({ defaultOpen: true })
    cm.registerItem("a", { onSelect })
    cm.select("a")
    expect(onSelect).toHaveBeenCalled()
    expect(cm.open.get()).toBe(false)
  })
})

describe("createContextMenu (mount: right-click + dismiss)", () => {
  it("right-click on anchor opens; positions content at cursor coords", async () => {
    const { anchor, content } = setupAnchor()
    const cm = createContextMenu()
    const destroy = cm.mount({ anchor, content })

    const evt = new MouseEvent("contextmenu", { bubbles: true, clientX: 50, clientY: 60 })
    anchor.dispatchEvent(evt)

    expect(cm.open.get()).toBe(true)
    expect(content.style.position).toBe("fixed")
    // autoPosition uses requestAnimationFrame; wait one frame for the apply callback.
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
    expect(content.style.transform).toMatch(/translate3d\(\d+px, \d+px, 0\)/)

    destroy()
  })

  it("contextmenu while already open repositions without flash (no extra open event)", () => {
    const { anchor, content } = setupAnchor()
    const cm = createContextMenu({ defaultOpen: true })
    const onChange = vi.fn()
    const off = cm.open.subscribe(onChange)
    const destroy = cm.mount({ anchor, content })

    anchor.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 5, clientY: 5 }))
    expect(onChange).not.toHaveBeenCalled()
    expect(cm.open.get()).toBe(true)

    off()
    destroy()
  })

  it("scroll closes the menu when closeOnScroll is true (default)", () => {
    const { anchor, content } = setupAnchor()
    const cm = createContextMenu()
    const destroy = cm.mount({ anchor, content })
    anchor.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 0, clientY: 0 }))
    expect(cm.open.get()).toBe(true)

    window.dispatchEvent(new Event("scroll"))
    expect(cm.open.get()).toBe(false)

    destroy()
  })

  it("closeOnScroll=false keeps the menu open on scroll", () => {
    const { anchor, content } = setupAnchor()
    const cm = createContextMenu({ closeOnScroll: false })
    const destroy = cm.mount({ anchor, content })
    anchor.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 0, clientY: 0 }))
    window.dispatchEvent(new Event("scroll"))
    expect(cm.open.get()).toBe(true)
    destroy()
  })

  it("destroy removes contextmenu listener", () => {
    const { anchor, content } = setupAnchor()
    const cm = createContextMenu()
    const destroy = cm.mount({ anchor, content })
    destroy()
    anchor.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 0, clientY: 0 }))
    expect(cm.open.get()).toBe(false)
  })
})

describe("createContextMenu (long-press)", () => {
  it("long-press on touch opens the menu after threshold", () => {
    vi.useFakeTimers()
    const { anchor, content } = setupAnchor()
    const cm = createContextMenu({ longPressThreshold: 100 })
    const destroy = cm.mount({ anchor, content })

    const touchStart = new Event("touchstart", { bubbles: true }) as TouchEvent
    Object.defineProperty(touchStart, "touches", {
      value: [{ clientX: 30, clientY: 40 } as Touch],
    })
    anchor.dispatchEvent(touchStart)

    vi.advanceTimersByTime(150)
    expect(cm.open.get()).toBe(true)

    destroy()
    vi.useRealTimers()
  })

  it("touchmove past threshold cancels long-press timer", () => {
    vi.useFakeTimers()
    const { anchor, content } = setupAnchor()
    const cm = createContextMenu({ longPressThreshold: 100 })
    const destroy = cm.mount({ anchor, content })

    const touchStart = new Event("touchstart", { bubbles: true }) as TouchEvent
    Object.defineProperty(touchStart, "touches", {
      value: [{ clientX: 0, clientY: 0 } as Touch],
    })
    anchor.dispatchEvent(touchStart)

    const touchMove = new Event("touchmove", { bubbles: true }) as TouchEvent
    Object.defineProperty(touchMove, "touches", {
      value: [{ clientX: 50, clientY: 50 } as Touch], // > 4px drift
    })
    anchor.dispatchEvent(touchMove)

    vi.advanceTimersByTime(200)
    expect(cm.open.get()).toBe(false)

    destroy()
    vi.useRealTimers()
  })
})
