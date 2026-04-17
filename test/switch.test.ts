// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createSwitch } from "../src/primitives/switch.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createSwitch (uncontrolled)", () => {
  it("starts unchecked by default", () => {
    const s = createSwitch()
    expect(s.checked.get()).toBe(false)
    expect(s.getRootProps()["aria-checked"]).toBe("false")
    expect(s.getRootProps()["data-state"]).toBe("unchecked")
  })

  it("respects defaultChecked", () => {
    const s = createSwitch({ defaultChecked: true })
    expect(s.checked.get()).toBe(true)
    expect(s.getRootProps()["aria-checked"]).toBe("true")
    expect(s.getRootProps()["data-state"]).toBe("checked")
  })

  it("toggle flips state", () => {
    const s = createSwitch()
    s.toggle()
    expect(s.checked.get()).toBe(true)
    s.toggle()
    expect(s.checked.get()).toBe(false)
  })

  it("check / uncheck are explicit", () => {
    const s = createSwitch()
    s.check()
    expect(s.checked.get()).toBe(true)
    s.check()
    expect(s.checked.get()).toBe(true)
    s.uncheck()
    expect(s.checked.get()).toBe(false)
  })

  it("notifies subscribers", () => {
    const s = createSwitch()
    const fn = vi.fn()
    s.checked.subscribe(fn)
    s.toggle()
    s.toggle()
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, true)
    expect(fn).toHaveBeenNthCalledWith(2, false)
  })

  it("calls onCheckedChange", () => {
    const onCheckedChange = vi.fn()
    const s = createSwitch({ onCheckedChange })
    s.toggle()
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})

describe("createSwitch (disabled)", () => {
  it("ignores actions while disabled", () => {
    let disabled = true
    const s = createSwitch({ disabled: () => disabled })
    s.toggle()
    expect(s.checked.get()).toBe(false)
    s.check()
    expect(s.checked.get()).toBe(false)
    disabled = false
    s.check()
    expect(s.checked.get()).toBe(true)
  })

  it("exposes aria-disabled and data-disabled", () => {
    const s = createSwitch({ disabled: () => true })
    const r = s.getRootProps()
    expect(r["aria-disabled"]).toBe(true)
    expect(r["data-disabled"]).toBe(true)
    expect(s.getThumbProps()["data-disabled"]).toBe(true)
  })
})

describe("createSwitch (controlled)", () => {
  it("reads checked via getter", () => {
    let v = false
    const s = createSwitch({ checked: () => v })
    expect(s.checked.get()).toBe(false)
    v = true
    expect(s.checked.get()).toBe(true)
    expect(s.getRootProps()["aria-checked"]).toBe("true")
  })

  it("does not mutate internal state in controlled mode", () => {
    let v = false
    const onCheckedChange = vi.fn()
    const s = createSwitch({ checked: () => v, onCheckedChange })
    s.toggle()
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(s.checked.get()).toBe(false)
  })
})

describe("createSwitch (props shape)", () => {
  it("root has role=switch and tabIndex=0", () => {
    const s = createSwitch()
    const p = s.getRootProps()
    expect(p.role).toBe("switch")
    expect(p.tabIndex).toBe(0)
    expect(p.type).toBe("button")
  })

  it("aria-checked is a string token, not a boolean", () => {
    const s = createSwitch({ defaultChecked: true })
    const v = s.getRootProps()["aria-checked"]
    expect(typeof v).toBe("string")
    expect(v).toBe("true")
  })

  it("thumb has aria-hidden", () => {
    const s = createSwitch()
    expect(s.getThumbProps()["aria-hidden"]).toBe(true)
  })

  it("getRootProps onClick toggles", () => {
    const s = createSwitch()
    s.getRootProps().onClick()
    expect(s.checked.get()).toBe(true)
  })
})

describe("createSwitch (form integration)", () => {
  it("getHiddenInputProps returns null without name", () => {
    const s = createSwitch()
    expect(s.getHiddenInputProps()).toBeNull()
  })

  it("getHiddenInputProps returns props when name given", () => {
    const s = createSwitch({ name: "newsletter", value: "yes" })
    const p = s.getHiddenInputProps()!
    expect(p.type).toBe("checkbox")
    expect(p.name).toBe("newsletter")
    expect(p.value).toBe("yes")
    expect(p.checked).toBe(false)
    expect(p["aria-hidden"]).toBe(true)
    expect(p.tabIndex).toBe(-1)
  })

  it("hidden input value defaults to 'on'", () => {
    const s = createSwitch({ name: "x" })
    expect(s.getHiddenInputProps()!.value).toBe("on")
  })

  it("hidden input style is hoisted (stable reference)", () => {
    const s1 = createSwitch({ name: "a" })
    const s2 = createSwitch({ name: "b" })
    expect(s1.getHiddenInputProps()!.style).toBe(s2.getHiddenInputProps()!.style)
  })

  it("required propagates to hidden input", () => {
    const s = createSwitch({ name: "x", required: true })
    expect(s.getHiddenInputProps()!.required).toBe(true)
    expect(s.getRootProps()["aria-required"]).toBe(true)
  })

  it("disabled propagates to hidden input", () => {
    const s = createSwitch({ name: "x", disabled: () => true })
    expect(s.getHiddenInputProps()!.disabled).toBe(true)
  })
})

describe("createSwitch.mount (DOM)", () => {
  it("toggles on click and syncs ARIA + hidden input", () => {
    const root = document.createElement("button")
    const hidden = document.createElement("input") as HTMLInputElement
    document.body.append(root, hidden)

    const s = createSwitch({ name: "x" })
    const destroy = s.mount({ root, hiddenInput: hidden })

    expect(root.getAttribute("aria-checked")).toBe("false")
    expect(root.getAttribute("data-state")).toBe("unchecked")
    expect(hidden.checked).toBe(false)

    root.click()
    expect(s.checked.get()).toBe(true)
    expect(root.getAttribute("aria-checked")).toBe("true")
    expect(root.getAttribute("data-state")).toBe("checked")
    expect(hidden.checked).toBe(true)

    destroy()
    root.click()
    expect(s.checked.get()).toBe(true)
  })
})
