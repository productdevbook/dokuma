// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { createVisuallyHidden } from "../src/primitives/visually-hidden.ts"

describe("createVisuallyHidden", () => {
  it("returns the standard sr-only style block", () => {
    const v = createVisuallyHidden()
    const { style } = v.getRootProps()
    expect(style.position).toBe("absolute")
    expect(style.width).toBe("1px")
    expect(style.height).toBe("1px")
    expect(style.overflow).toBe("hidden")
    expect(style.whiteSpace).toBe("nowrap")
    expect(style.clip).toBe("rect(0, 0, 0, 0)")
    expect(style.clipPath).toBe("inset(50%)")
  })

  it("returns a fresh style object on each call (not shared mutable state)", () => {
    const v = createVisuallyHidden()
    const a = v.getRootProps().style
    const b = v.getRootProps().style
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})
