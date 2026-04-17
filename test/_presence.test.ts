// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createPresence } from "../src/_presence.ts"
import { createSignal } from "../src/_signal.ts"

let el: HTMLElement

beforeEach(() => {
  document.body.innerHTML = ""
  el = document.createElement("div")
  document.body.append(el)
})

afterEach(() => {
  document.body.innerHTML = ""
})

const flushMicrotasks = (): Promise<void> => Promise.resolve()

describe("createPresence (initial state)", () => {
  it("starts mounted when open=true", () => {
    const open = createSignal(true)
    const p = createPresence(open, () => el)
    expect(p.status.get()).toBe("mounted")
    expect(p.isMounted.get()).toBe(true)
    p.destroy()
  })

  it("starts unmounted when open=false", () => {
    const open = createSignal(false)
    const p = createPresence(open, () => el)
    expect(p.status.get()).toBe("unmounted")
    expect(p.isMounted.get()).toBe(false)
    p.destroy()
  })
})

describe("createPresence (open → close, no animation)", () => {
  it("transitions to unmounted on the next microtask", async () => {
    const open = createSignal(true)
    const p = createPresence(open, () => el)
    open.set(false)
    expect(p.status.get()).toBe("unmounting")
    expect(p.isMounted.get()).toBe(true)
    await flushMicrotasks()
    expect(p.status.get()).toBe("unmounted")
    expect(p.isMounted.get()).toBe(false)
    p.destroy()
  })
})

describe("createPresence (open → close, with animation)", () => {
  it("stays unmounting until transitionend fires", async () => {
    el.style.transition = "opacity 200ms"
    el.style.transitionDuration = "200ms"

    const open = createSignal(true)
    const p = createPresence(open, () => el)
    open.set(false)
    expect(p.status.get()).toBe("unmounting")
    await flushMicrotasks()
    // Still unmounting because transitionDuration > 0s.
    expect(p.status.get()).toBe("unmounting")
    expect(p.isMounted.get()).toBe(true)

    el.dispatchEvent(new Event("transitionend"))
    expect(p.status.get()).toBe("unmounted")
    expect(p.isMounted.get()).toBe(false)
    p.destroy()
  })

  it("ignores transitionend from a child element", async () => {
    el.style.transitionDuration = "200ms"
    const child = document.createElement("span")
    el.append(child)

    const open = createSignal(true)
    const p = createPresence(open, () => el)
    open.set(false)
    await flushMicrotasks()
    expect(p.status.get()).toBe("unmounting")

    child.dispatchEvent(new Event("transitionend", { bubbles: true }))
    expect(p.status.get()).toBe("unmounting")

    el.dispatchEvent(new Event("transitionend"))
    expect(p.status.get()).toBe("unmounted")
    p.destroy()
  })
})

describe("createPresence (re-open during exit)", () => {
  it("cancels unmounting and returns to mounted", async () => {
    el.style.transitionDuration = "200ms"

    const open = createSignal(true)
    const p = createPresence(open, () => el)
    open.set(false)
    await flushMicrotasks()
    expect(p.status.get()).toBe("unmounting")

    open.set(true)
    expect(p.status.get()).toBe("mounted")
    expect(p.isMounted.get()).toBe(true)

    // A late transitionend after re-open must not flip back to unmounted.
    el.dispatchEvent(new Event("transitionend"))
    expect(p.status.get()).toBe("mounted")
    p.destroy()
  })
})

describe("createPresence (destroy)", () => {
  it("stops subscribing after destroy", () => {
    const open = createSignal(true)
    const p = createPresence(open, () => el)
    p.destroy()
    open.set(false)
    expect(p.status.get()).toBe("mounted")
  })
})
