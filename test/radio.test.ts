// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createRadio } from "../src/primitives/radio.ts"

let el: HTMLButtonElement

beforeEach(() => {
  document.body.innerHTML = ""
  el = document.createElement("button")
  document.body.append(el)
})
afterEach(() => {
  document.body.innerHTML = ""
})

describe("createRadio", () => {
  it("unchecked default produces aria-checked=false + tabIndex=-1", () => {
    const r = createRadio({ value: "a" })
    const p = r.getRootProps()
    expect(p["aria-checked"]).toBe("false")
    expect(p.tabIndex).toBe(-1)
  })

  it("checked=true puts element in tab order", () => {
    const r = createRadio({ value: "a", checked: true })
    expect(r.getRootProps().tabIndex).toBe(0)
    expect(r.getRootProps()["aria-checked"]).toBe("true")
  })

  it("click sets checked + fires onCheckedChange", () => {
    const onCheckedChange = vi.fn()
    const r = createRadio({ value: "a", onCheckedChange })
    const cleanup = r.mount(el)
    el.click()
    expect(r.checked.get()).toBe(true)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    cleanup()
  })

  it("disabled blocks click", () => {
    const onCheckedChange = vi.fn()
    const r = createRadio({ value: "a", disabled: true, onCheckedChange })
    const cleanup = r.mount(el)
    el.click()
    expect(onCheckedChange).not.toHaveBeenCalled()
    cleanup()
  })

  it("hidden input emits only when name provided", () => {
    expect(createRadio({ value: "x" }).getHiddenInputProps()).toBeNull()
    const p = createRadio({ value: "x", name: "grp", checked: true }).getHiddenInputProps()
    expect(p?.name).toBe("grp")
    expect(p?.checked).toBe(true)
  })
})
