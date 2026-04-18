// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createDrawer } from "../src/primitives/drawer.ts"

let content: HTMLElement
let overlay: HTMLElement

beforeEach(() => {
  document.body.innerHTML = ""
  content = document.createElement("div")
  overlay = document.createElement("div")
  document.body.append(overlay, content)
})
afterEach(() => {
  document.body.innerHTML = ""
})

describe("createDrawer", () => {
  it("default state is closed", () => {
    const d = createDrawer()
    expect(d.open.get()).toBe(false)
    expect(d.getRootProps()["data-state"]).toBe("closed")
  })

  it("show() opens + sets default snap", () => {
    const d = createDrawer({ snapPoints: [0.5, 1] })
    d.show()
    expect(d.open.get()).toBe(true)
    expect(d.snap.get()).toBe(1)
  })

  it("setSnap clamps to valid range", () => {
    const d = createDrawer({ snapPoints: [0.25, 0.5, 1] })
    d.show()
    d.setSnap(5)
    expect(d.snap.get()).toBe(2)
    d.setSnap(-1)
    expect(d.snap.get()).toBe(0)
  })

  it("overlay click dismisses", () => {
    const onOpenChange = vi.fn()
    const d = createDrawer({ defaultOpen: true, onOpenChange })
    const cleanup = d.mount({ content, overlay })
    overlay.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    expect(d.open.get()).toBe(false)
    cleanup()
  })

  it("contentProps carry role=dialog + aria-labelledby", () => {
    const d = createDrawer()
    const p = d.getContentProps()
    expect(p.role).toBe("dialog")
    expect(p["aria-labelledby"]).toBe(d.titleId)
  })
})
