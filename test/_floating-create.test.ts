// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createFloating } from "../src/_floating/create-floating.ts"
import { offset } from "../src/_floating/index.ts"

let reference: HTMLElement
let floating: HTMLElement

const mockRect = (el: HTMLElement, rect: Partial<DOMRect>): void => {
  const full = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...rect,
  } as DOMRect
  el.getBoundingClientRect = () => full
}

const flush = (): Promise<void> =>
  new Promise((r) => {
    setTimeout(r, 0)
  })

beforeEach(() => {
  document.body.innerHTML = ""
  reference = document.createElement("div")
  floating = document.createElement("div")
  document.body.append(reference, floating)
  mockRect(reference, { x: 100, y: 100, width: 40, height: 20, right: 140, bottom: 120 })
  Object.defineProperty(floating, "offsetWidth", { value: 80, configurable: true })
  Object.defineProperty(floating, "offsetHeight", { value: 30, configurable: true })
})

afterEach(() => {
  document.body.innerHTML = ""
})

describe("createFloating", () => {
  it("initial state is unpositioned", () => {
    const f = createFloating()
    expect(f.isPositioned.get()).toBe(false)
    expect(f.x.get()).toBe(0)
    expect(f.y.get()).toBe(0)
    expect(f.placement.get()).toBe("bottom")
    expect(f.strategy.get()).toBe("absolute")
  })

  it("computes position when both elements set", async () => {
    const f = createFloating({ placement: "bottom", middleware: [offset(8)] })
    f.setReference(reference)
    f.setFloating(floating)
    await flush()
    await flush()

    expect(f.isPositioned.get()).toBe(true)
    expect(f.placement.get()).toBe("bottom")
    expect(typeof f.x.get()).toBe("number")
    expect(typeof f.y.get()).toBe("number")
  })

  it("update() re-runs computation", async () => {
    const f = createFloating({ placement: "top" })
    f.setReference(reference)
    f.setFloating(floating)
    await flush()
    await flush()

    const firstY = f.y.get()
    mockRect(reference, { x: 100, y: 500, width: 40, height: 20, top: 500, bottom: 520 })
    f.update()
    await flush()
    await flush()

    expect(f.y.get()).not.toBe(firstY)
  })

  it("destroy() prevents further updates", async () => {
    const f = createFloating()
    f.setReference(reference)
    f.setFloating(floating)
    await flush()
    await flush()

    f.destroy()
    const y = f.y.get()
    f.update()
    await flush()
    await flush()

    expect(f.y.get()).toBe(y)
  })

  it("autoUpdate:true wires updates without throwing", async () => {
    const f = createFloating({ autoUpdate: true })
    f.setReference(reference)
    f.setFloating(floating)
    await flush()
    await flush()

    expect(f.isPositioned.get()).toBe(true)
    f.destroy()
  })

  it("custom whileElementsMounted is invoked + cleanup runs on destroy", async () => {
    let mounted = 0
    let cleaned = 0
    const f = createFloating({
      whileElementsMounted: (_ref, _flo, update) => {
        mounted++
        update()
        return () => {
          cleaned++
        }
      },
    })
    f.setReference(reference)
    f.setFloating(floating)
    await flush()

    expect(mounted).toBe(1)
    expect(cleaned).toBe(0)

    f.destroy()
    expect(cleaned).toBe(1)
  })
})
