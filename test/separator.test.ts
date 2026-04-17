// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { createSeparator } from "../src/primitives/separator.ts"

describe("createSeparator", () => {
  it("defaults to horizontal, non-decorative (role=separator + aria-orientation)", () => {
    const s = createSeparator()
    const p = s.getRootProps()
    expect(p.role).toBe("separator")
    expect(p["aria-orientation"]).toBe("horizontal")
    expect(p["data-orientation"]).toBe("horizontal")
  })

  it("vertical orientation sets aria-orientation + data-orientation", () => {
    const s = createSeparator({ orientation: "vertical" })
    const p = s.getRootProps()
    expect(p["aria-orientation"]).toBe("vertical")
    expect(p["data-orientation"]).toBe("vertical")
  })

  it("decorative=true uses role=none and omits aria-orientation", () => {
    const s = createSeparator({ decorative: true, orientation: "vertical" })
    const p = s.getRootProps()
    expect(p.role).toBe("none")
    expect(p["aria-orientation"]).toBeUndefined()
    // data-orientation is still emitted for CSS hooks
    expect(p["data-orientation"]).toBe("vertical")
  })

  it("exposes orientation and decorative on the returned object", () => {
    const s = createSeparator({ orientation: "vertical", decorative: true })
    expect(s.orientation).toBe("vertical")
    expect(s.decorative).toBe(true)
  })
})
