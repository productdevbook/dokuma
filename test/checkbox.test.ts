// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createCheckbox } from "../src/primitives/checkbox.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createCheckbox (basic)", () => {
  it("starts unchecked", () => {
    const c = createCheckbox()
    expect(c.checked.get()).toBe(false)
    expect(c.getRootProps()["aria-checked"]).toBe("false")
    expect(c.getRootProps()["data-state"]).toBe("unchecked")
  })

  it("toggle flips", () => {
    const c = createCheckbox()
    c.toggle()
    expect(c.checked.get()).toBe(true)
    c.toggle()
    expect(c.checked.get()).toBe(false)
  })

  it("aria-checked is a string token", () => {
    const c = createCheckbox({ defaultChecked: true })
    expect(typeof c.getRootProps()["aria-checked"]).toBe("string")
    expect(c.getRootProps()["aria-checked"]).toBe("true")
  })

  it("onCheckedChange fires", () => {
    const onCheckedChange = vi.fn()
    const c = createCheckbox({ onCheckedChange })
    c.toggle()
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})

describe("createCheckbox (indeterminate)", () => {
  it("aria-checked=mixed when indeterminate", () => {
    const c = createCheckbox({ defaultChecked: "indeterminate" })
    expect(c.getRootProps()["aria-checked"]).toBe("mixed")
    expect(c.getRootProps()["data-state"]).toBe("indeterminate")
  })

  it("clicking an indeterminate checkbox sets it to true", () => {
    const c = createCheckbox({ defaultChecked: "indeterminate" })
    c.toggle()
    expect(c.checked.get()).toBe(true)
  })

  it("setIndeterminate works", () => {
    const c = createCheckbox({ defaultChecked: true })
    c.setIndeterminate()
    expect(c.checked.get()).toBe("indeterminate")
  })

  it("indicator is visible in indeterminate state", () => {
    const c = createCheckbox({ defaultChecked: "indeterminate" })
    expect(c.getIndicatorProps().hidden).toBe(false)
  })
})

describe("createCheckbox (form)", () => {
  it("getHiddenInputProps returns null without name", () => {
    const c = createCheckbox()
    expect(c.getHiddenInputProps()).toBeNull()
  })

  it("hidden input: indeterminate is NOT checked for form submission", () => {
    const c = createCheckbox({ defaultChecked: "indeterminate", name: "x" })
    const p = c.getHiddenInputProps()!
    expect(p.checked).toBe(false)
  })

  it("hidden input checked when true", () => {
    const c = createCheckbox({ defaultChecked: true, name: "x" })
    const p = c.getHiddenInputProps()!
    expect(p.checked).toBe(true)
  })
})

describe("createCheckbox (disabled)", () => {
  it("blocks toggle", () => {
    const c = createCheckbox({ disabled: () => true })
    c.toggle()
    expect(c.checked.get()).toBe(false)
  })
})

describe("createCheckbox.mount", () => {
  it("syncs DOM and hidden input", () => {
    const root = document.createElement("button")
    const hidden = document.createElement("input") as HTMLInputElement
    document.body.append(root, hidden)

    const c = createCheckbox({ name: "x" })
    const destroy = c.mount({ root, hiddenInput: hidden })

    expect(root.getAttribute("aria-checked")).toBe("false")
    root.click()
    expect(c.checked.get()).toBe(true)
    expect(root.getAttribute("aria-checked")).toBe("true")
    expect(hidden.checked).toBe(true)

    c.setIndeterminate()
    expect(root.getAttribute("aria-checked")).toBe("mixed")
    expect(hidden.indeterminate).toBe(true)

    destroy()
  })
})
