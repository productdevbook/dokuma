// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createMenubar } from "../src/primitives/menubar.ts"

let root: HTMLElement
let t0: HTMLButtonElement
let t1: HTMLButtonElement
let t2: HTMLButtonElement

beforeEach(() => {
  document.body.innerHTML = ""
  root = document.createElement("div")
  document.body.append(root)
  t0 = document.createElement("button")
  t1 = document.createElement("button")
  t2 = document.createElement("button")
  root.append(t0, t1, t2)
})

afterEach(() => {
  document.body.innerHTML = ""
})

describe("createMenubar", () => {
  it("root props carry role=menubar + orientation", () => {
    const m = createMenubar()
    expect(m.getRootProps().role).toBe("menubar")
    expect(m.getRootProps()["aria-orientation"]).toBe("horizontal")
  })

  it("triggers get role=menuitem + aria-haspopup", () => {
    const m = createMenubar()
    const h = m.registerMenu()
    m.registerTrigger(h, t0)
    expect(t0.getAttribute("role")).toBe("menuitem")
    expect(t0.getAttribute("aria-haspopup")).toBe("menu")
  })

  it("click on trigger opens and aria-expanded=true", () => {
    const onOpenChange = vi.fn()
    const m = createMenubar()
    const h = m.registerMenu({ onOpenChange })
    m.registerTrigger(h, t0)
    t0.click()
    expect(h.isOpen()).toBe(true)
    expect(t0.getAttribute("aria-expanded")).toBe("true")
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it("ArrowRight moves focus to the next menu trigger", () => {
    const m = createMenubar()
    const cleanup = m.mount(root)
    const h0 = m.registerMenu()
    const h1 = m.registerMenu()
    const h2 = m.registerMenu()
    m.registerTrigger(h0, t0)
    m.registerTrigger(h1, t1)
    m.registerTrigger(h2, t2)
    t0.focus()
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
    expect(document.activeElement).toBe(t1)
    cleanup()
  })

  it("Escape closes the open menu", () => {
    const m = createMenubar()
    const cleanup = m.mount(root)
    const h = m.registerMenu()
    m.registerTrigger(h, t0)
    h.open()
    expect(h.isOpen()).toBe(true)
    root.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    expect(h.isOpen()).toBe(false)
    cleanup()
  })
})
