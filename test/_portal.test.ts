// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { getDefaultPortalTarget, resolvePortalTarget } from "../src/_portal.ts"
import { mountPortal } from "../src/adapters/vanilla.ts"

beforeEach(() => {
  document.body.innerHTML = ""
})

describe("getDefaultPortalTarget", () => {
  it("returns document.body in the browser", () => {
    expect(getDefaultPortalTarget()).toBe(document.body)
  })
})

describe("resolvePortalTarget", () => {
  it("returns document.body for null/undefined", () => {
    expect(resolvePortalTarget(null)).toBe(document.body)
    expect(resolvePortalTarget(undefined)).toBe(document.body)
  })

  it("resolves a CSS selector", () => {
    const host = document.createElement("div")
    host.id = "host"
    document.body.append(host)
    expect(resolvePortalTarget("#host")).toBe(host)
  })

  it("returns null when selector misses", () => {
    expect(resolvePortalTarget("#never")).toBe(null)
  })

  it("passes an element through unchanged", () => {
    const el = document.createElement("div")
    expect(resolvePortalTarget(el)).toBe(el)
  })
})

describe("mountPortal", () => {
  it("moves content into document.body by default", () => {
    const parent = document.createElement("div")
    const content = document.createElement("section")
    parent.append(content)
    document.body.append(parent)

    const release = mountPortal({ content })
    expect(release).not.toBeNull()
    expect(content.parentNode).toBe(document.body)
    release?.()
  })

  it("restores content to original position on cleanup", () => {
    const parent = document.createElement("div")
    const before = document.createElement("a")
    const content = document.createElement("section")
    const after = document.createElement("a")
    parent.append(before, content, after)
    document.body.append(parent)

    const release = mountPortal({ content })
    expect(content.parentNode).toBe(document.body)

    release?.()
    expect(content.parentNode).toBe(parent)
    // Order preserved: before, content, after
    expect(parent.children[1]).toBe(content)
  })

  it("moves to a custom target by selector", () => {
    const target = document.createElement("div")
    target.id = "destination"
    document.body.append(target)

    const content = document.createElement("section")
    document.body.append(content)

    const release = mountPortal({ content, target: "#destination" })
    expect(content.parentNode).toBe(target)
    release?.()
  })

  it("returns null when target selector misses", () => {
    const content = document.createElement("section")
    document.body.append(content)
    expect(mountPortal({ content, target: "#never" })).toBeNull()
  })

  it("cleanup is idempotent", () => {
    const content = document.createElement("section")
    document.body.append(content)
    const release = mountPortal({ content })
    release?.()
    expect(() => release?.()).not.toThrow()
  })
})
