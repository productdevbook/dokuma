// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createScrollArea } from "../src/primitives/scroll-area.ts"

beforeEach(() => {
  document.body.innerHTML = ""
})
afterEach(() => {
  document.body.innerHTML = ""
})

describe("createScrollArea", () => {
  it("root props include type + data-scroll-area", () => {
    const sa = createScrollArea({ type: "always" })
    const p = sa.getRootProps()
    expect(p["data-type"]).toBe("always")
    expect(p["data-scroll-area"]).toBe("")
  })

  it("viewport props hide native scrollbars", () => {
    const sa = createScrollArea()
    const p = sa.getViewportProps()
    expect(p.style.overflow).toBe("auto")
    expect(p.style.scrollbarWidth).toBe("none")
  })

  it("mount initializes state (no overflow → ratio 0)", () => {
    const sa = createScrollArea()
    const root = document.createElement("div")
    const viewport = document.createElement("div")
    root.append(viewport)
    document.body.append(root)

    // jsdom: default scrollWidth/scrollHeight === clientWidth/clientHeight (0)
    const cleanup = sa.mount({ root, viewport })
    expect(sa.x.get().scrollable).toBe(false)
    expect(sa.y.get().scrollable).toBe(false)
    cleanup()
  })

  it("measure picks up overflow after mutation", () => {
    const sa = createScrollArea()
    const root = document.createElement("div")
    const viewport = document.createElement("div")
    root.append(viewport)
    document.body.append(root)

    Object.defineProperty(viewport, "scrollHeight", { value: 500, configurable: true })
    Object.defineProperty(viewport, "clientHeight", { value: 100, configurable: true })
    Object.defineProperty(viewport, "scrollWidth", { value: 100, configurable: true })
    Object.defineProperty(viewport, "clientWidth", { value: 100, configurable: true })

    const cleanup = sa.mount({ root, viewport })
    viewport.dispatchEvent(new Event("scroll"))
    expect(sa.y.get().scrollable).toBe(true)
    expect(sa.y.get().ratio).toBeCloseTo(0.2, 2)
    cleanup()
  })
})
