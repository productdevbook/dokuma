// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createNavigationMenu } from "../src/primitives/navigation-menu.ts"

let list: HTMLElement
let t0: HTMLButtonElement
let t1: HTMLButtonElement

beforeEach(() => {
  document.body.innerHTML = ""
  list = document.createElement("ul")
  t0 = document.createElement("button")
  t1 = document.createElement("button")
  list.append(t0, t1)
  document.body.append(list)
})
afterEach(() => {
  document.body.innerHTML = ""
})

describe("createNavigationMenu", () => {
  it("root props carry role=navigation", () => {
    const nm = createNavigationMenu()
    expect(nm.getRootProps().role).toBe("navigation")
    expect(nm.getListProps().role).toBe("menubar")
  })

  it("click on trigger opens the item", () => {
    const nm = createNavigationMenu()
    const cleanup = nm.mount(list)
    const h = nm.registerItem({ value: "a" })
    nm.registerTrigger(h, t0)
    t0.click()
    expect(h.isOpen()).toBe(true)
    expect(nm.value.get()).toBe("a")
    cleanup()
  })

  it("clicking an already-open trigger closes it", () => {
    const nm = createNavigationMenu()
    const cleanup = nm.mount(list)
    const h = nm.registerItem({ value: "a" })
    nm.registerTrigger(h, t0)
    t0.click()
    t0.click()
    expect(h.isOpen()).toBe(false)
    cleanup()
  })

  it("ArrowRight moves focus between triggers", () => {
    const nm = createNavigationMenu({ orientation: "horizontal" })
    const cleanup = nm.mount(list)
    const h0 = nm.registerItem({ value: "a" })
    const h1 = nm.registerItem({ value: "b" })
    nm.registerTrigger(h0, t0)
    nm.registerTrigger(h1, t1)
    t0.focus()
    list.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }))
    expect(document.activeElement).toBe(t1)
    cleanup()
  })
})
