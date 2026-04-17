// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createOtpInput } from "../src/primitives/otp-input.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createOtpInput — basic state", () => {
  it("default length 6, empty value, not complete", () => {
    const o = createOtpInput()
    expect(o.length).toBe(6)
    expect(o.value.get()).toBe("")
    expect(o.isComplete.get()).toBe(false)
  })

  it("respects defaultValue, clipping past length", () => {
    const o = createOtpInput({ length: 4, defaultValue: "12345" })
    expect(o.value.get()).toBe("1234")
    expect(o.isComplete.get()).toBe(true)
  })

  it("setValue clips and notifies", () => {
    const onValueChange = vi.fn()
    const o = createOtpInput({ length: 4, onValueChange })
    o.setValue("12")
    expect(o.value.get()).toBe("12")
    expect(onValueChange).toHaveBeenLastCalledWith("12")
  })

  it("clear empties the value", () => {
    const o = createOtpInput({ defaultValue: "abc" })
    o.clear()
    expect(o.value.get()).toBe("")
  })
})

describe("createOtpInput — onComplete", () => {
  it("fires once when value becomes full", () => {
    const onComplete = vi.fn()
    const o = createOtpInput({ length: 3, onComplete })
    o.setValue("1")
    o.setValue("12")
    o.setValue("123")
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenLastCalledWith("123")
  })

  it("doesn't re-fire while still complete", () => {
    const onComplete = vi.fn()
    const o = createOtpInput({ length: 3, defaultValue: "abc", onComplete })
    // setValue with same value does nothing — already complete on construction.
    o.setValue("abc")
    expect(onComplete).not.toHaveBeenCalled()
  })

  it("fires again after going incomplete then complete", () => {
    const onComplete = vi.fn()
    const o = createOtpInput({ length: 3, defaultValue: "abc", onComplete })
    o.setValue("ab")
    o.setValue("abc")
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

describe("createOtpInput — cell props", () => {
  it("type is text by default, password when masked", () => {
    expect(createOtpInput().getCellProps(0).type).toBe("text")
    expect(createOtpInput({ mask: true }).getCellProps(0).type).toBe("password")
  })

  it("inputmode is numeric for the default digits pattern", () => {
    expect(createOtpInput().getCellProps(0).inputmode).toBe("numeric")
  })

  it("custom pattern switches inputmode to text", () => {
    expect(createOtpInput({ pattern: "a-zA-Z" }).getCellProps(0).inputmode).toBe("text")
  })

  it("each cell has a stable unique id, exposed via getCellId", () => {
    const o = createOtpInput({ length: 3 })
    expect(o.getCellId(0)).not.toBe(o.getCellId(1))
    expect(o.getCellProps(2).id).toBe(o.getCellId(2))
  })

  it("cell value reflects the corresponding character of value", () => {
    const o = createOtpInput({ length: 4, defaultValue: "12" })
    expect(o.getCellProps(0).value).toBe("1")
    expect(o.getCellProps(1).value).toBe("2")
    expect(o.getCellProps(2).value).toBe("")
  })
})

describe("createOtpInput — input event", () => {
  it("typing a digit fills the cell", () => {
    const o = createOtpInput({ length: 4 })
    const p = o.getCellProps(0)
    p.onInput({ currentTarget: { value: "5" } })
    expect(o.value.get()).toBe("5")
  })

  it("non-matching char is ignored (default digits pattern)", () => {
    const o = createOtpInput({ length: 4 })
    o.getCellProps(0).onInput({ currentTarget: { value: "a" } })
    expect(o.value.get()).toBe("")
  })

  it("paste distributes characters and stops at length", () => {
    const o = createOtpInput({ length: 6 })
    o.getCellProps(0).onPaste({
      clipboardData: { getData: () => "123456789" },
      preventDefault: () => {},
    })
    expect(o.value.get()).toBe("123456")
    expect(o.isComplete.get()).toBe(true)
  })
})

describe("createOtpInput — hidden input", () => {
  it("returns hidden input props when name is set", () => {
    const o = createOtpInput({ length: 4, defaultValue: "1234", name: "code" })
    expect(o.getHiddenInputProps()).toEqual({ type: "hidden", name: "code", value: "1234" })
  })

  it("returns null when no name set", () => {
    expect(createOtpInput().getHiddenInputProps()).toBeNull()
  })
})
