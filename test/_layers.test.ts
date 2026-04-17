// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { pushDismissibleLayer, pushFocusScope } from "../src/_layers.ts"

beforeEach(() => {
  document.body.innerHTML = ""
})

const fireKey = (key: string, opts: KeyboardEventInit = {}): boolean => {
  const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...opts })
  document.dispatchEvent(ev)
  return !ev.defaultPrevented
}

describe("pushFocusScope (single scope)", () => {
  it("focuses the first focusable inside root on push", () => {
    const root = document.createElement("div")
    const a = document.createElement("button")
    a.textContent = "a"
    root.append(a)
    document.body.append(root)
    const release = pushFocusScope(root)
    expect(document.activeElement).toBe(a)
    release()
  })

  it("Tab from the last focusable wraps to the first", () => {
    const root = document.createElement("div")
    const a = document.createElement("button")
    const b = document.createElement("button")
    root.append(a, b)
    document.body.append(root)
    const release = pushFocusScope(root)
    b.focus()
    fireKey("Tab")
    expect(document.activeElement).toBe(a)
    release()
  })

  it("Shift+Tab from the first focusable wraps to the last", () => {
    const root = document.createElement("div")
    const a = document.createElement("button")
    const b = document.createElement("button")
    root.append(a, b)
    document.body.append(root)
    const release = pushFocusScope(root)
    a.focus()
    fireKey("Tab", { shiftKey: true })
    expect(document.activeElement).toBe(b)
    release()
  })

  it("cleanup is idempotent", () => {
    const root = document.createElement("div")
    root.append(document.createElement("button"))
    document.body.append(root)
    const release = pushFocusScope(root)
    release()
    expect(() => release()).not.toThrow()
  })
})

describe("pushFocusScope (nested)", () => {
  it("only the topmost scope handles Tab", () => {
    const outer = document.createElement("div")
    const outerBtn = document.createElement("button")
    outerBtn.textContent = "outer"
    outer.append(outerBtn)
    document.body.append(outer)

    const inner = document.createElement("div")
    const innerA = document.createElement("button")
    const innerB = document.createElement("button")
    innerA.textContent = "innerA"
    innerB.textContent = "innerB"
    inner.append(innerA, innerB)
    document.body.append(inner)

    const releaseOuter = pushFocusScope(outer)
    const releaseInner = pushFocusScope(inner)

    // Tab inside inner should wrap within inner only.
    innerB.focus()
    fireKey("Tab")
    expect(document.activeElement).toBe(innerA)

    // Outer scope's handler must NOT have moved focus to outerBtn.
    expect(document.activeElement).not.toBe(outerBtn)

    releaseInner()

    // After cleanup, outer scope is active again.
    outerBtn.focus()
    fireKey("Tab")
    expect(document.activeElement).toBe(outerBtn)

    releaseOuter()
  })
})

describe("pushDismissibleLayer (single layer)", () => {
  it("Escape calls onDismiss", () => {
    const onDismiss = vi.fn()
    const release = pushDismissibleLayer(onDismiss)
    fireKey("Escape")
    expect(onDismiss).toHaveBeenCalledOnce()
    release()
  })

  it("non-Escape keys are ignored", () => {
    const onDismiss = vi.fn()
    const release = pushDismissibleLayer(onDismiss)
    fireKey("Enter")
    fireKey("a")
    expect(onDismiss).not.toHaveBeenCalled()
    release()
  })

  it("after release, Escape no longer fires", () => {
    const onDismiss = vi.fn()
    const release = pushDismissibleLayer(onDismiss)
    release()
    fireKey("Escape")
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it("cleanup is idempotent", () => {
    const release = pushDismissibleLayer(() => {})
    release()
    expect(() => release()).not.toThrow()
  })
})

describe("pushDismissibleLayer (stacked)", () => {
  it("only the topmost layer's onDismiss fires", () => {
    const outer = vi.fn()
    const inner = vi.fn()
    const releaseOuter = pushDismissibleLayer(outer)
    const releaseInner = pushDismissibleLayer(inner)

    fireKey("Escape")
    expect(inner).toHaveBeenCalledOnce()
    expect(outer).not.toHaveBeenCalled()

    releaseInner()
    fireKey("Escape")
    expect(outer).toHaveBeenCalledOnce()
    expect(inner).toHaveBeenCalledOnce()

    releaseOuter()
  })
})
