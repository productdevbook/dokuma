// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createAvatar } from "../src/primitives/avatar.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createAvatar", () => {
  it("status is idle without src", () => {
    const a = createAvatar()
    expect(a.status.get()).toBe("idle")
    expect(a.getImageProps().hidden).toBe(true)
    expect(a.getFallbackProps().hidden).toBe(false)
  })

  it("status is loading with src; getImageProps reflects src", () => {
    const a = createAvatar({ src: "https://example.com/x.png" })
    expect(a.status.get()).toBe("loading")
    expect(a.getImageProps("Mehmet").src).toBe("https://example.com/x.png")
    expect(a.getImageProps("Mehmet").alt).toBe("Mehmet")
  })

  it("setting status to loaded toggles hidden flags", () => {
    const a = createAvatar({ src: "x" })
    a.status.set("loaded")
    expect(a.getImageProps().hidden).toBe(false)
    expect(a.getFallbackProps().hidden).toBe(true)
  })

  it("onStatusChange fires", () => {
    const onStatusChange = vi.fn()
    const a = createAvatar({ src: "x", onStatusChange })
    a.status.set("error")
    expect(onStatusChange).toHaveBeenCalledWith("error")
  })

  it("mount syncs DOM", () => {
    const image = document.createElement("img")
    const fallback = document.createElement("div")
    document.body.append(image, fallback)
    const a = createAvatar({ src: "x" })
    const destroy = a.mount({ image, fallback })

    expect(image.hasAttribute("hidden")).toBe(true)
    expect(fallback.hasAttribute("hidden")).toBe(false)

    a.status.set("loaded")
    expect(image.hasAttribute("hidden")).toBe(false)
    expect(fallback.hasAttribute("hidden")).toBe(true)

    destroy()
  })
})
