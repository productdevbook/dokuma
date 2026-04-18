import { describe, expect, it, vi } from "vitest"
import { createDirectionProvider } from "../src/primitives/direction-provider.ts"

describe("createDirectionProvider", () => {
  it("defaults to ltr", () => {
    const d = createDirectionProvider()
    expect(d.get()).toBe("ltr")
  })

  it("accepts initial direction + allows set() + fires subscribers", () => {
    const d = createDirectionProvider({ direction: "rtl" })
    expect(d.get()).toBe("rtl")

    const spy = vi.fn()
    d.direction.subscribe(spy)
    d.set("ltr")
    expect(spy).toHaveBeenCalledWith("ltr")
    expect(d.get()).toBe("ltr")
  })
})
