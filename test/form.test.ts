// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createField } from "../src/primitives/field.ts"
import { createForm } from "../src/primitives/form.ts"

beforeEach(() => {
  document.body.innerHTML = ""
})
afterEach(() => {
  document.body.innerHTML = ""
})

describe("createForm", () => {
  it("submit returns false if any field fails", async () => {
    const form = createForm()
    const f1 = createField({ name: "a", validate: () => null })
    const f2 = createField({ name: "b", validate: () => "err" })
    form.registerField(f1)
    form.registerField(f2)
    const ok = await form.submit()
    expect(ok).toBe(false)
    expect(f2.invalid.get()).toBe(true)
  })

  it("submit passes + calls onSubmit with values", async () => {
    const onSubmit = vi.fn()
    const form = createForm({ onSubmit })
    const f = createField({ name: "email", validate: () => null })
    form.registerField(f)
    f.setValue("x@example.com")
    const ok = await form.submit()
    expect(ok).toBe(true)
    expect(onSubmit).toHaveBeenCalled()
    expect(onSubmit.mock.calls[0][0].values.email).toBe("x@example.com")
  })

  it("mount intercepts native submit event", () => {
    const form = createForm()
    const el = document.createElement("form")
    document.body.append(el)
    const cleanup = form.mount(el)
    const ev = new Event("submit", { cancelable: true, bubbles: true })
    el.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    cleanup()
  })
})
