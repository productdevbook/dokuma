// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createNumberInput } from "../src/primitives/number-input.ts"

beforeEach(() => {
  vi.useRealTimers()
})

describe("createNumberInput — value + clamp", () => {
  it("starts null when no defaultValue", () => {
    const ni = createNumberInput()
    expect(ni.value.get()).toBeNull()
    expect(ni.inputValue.get()).toBe("")
  })

  it("respects defaultValue and seeds inputValue", () => {
    const ni = createNumberInput({ defaultValue: 5 })
    expect(ni.value.get()).toBe(5)
    expect(ni.inputValue.get()).toBe("5")
  })

  it("clamps to [min, max] on setValue", () => {
    const ni = createNumberInput({ min: 0, max: 10, defaultValue: 5 })
    ni.setValue(99)
    expect(ni.value.get()).toBe(10)
    ni.setValue(-3)
    expect(ni.value.get()).toBe(0)
  })

  it("rounds to precision inferred from step", () => {
    const ni = createNumberInput({ step: 0.1, defaultValue: 1 })
    ni.setValue(1.123456)
    expect(ni.value.get()).toBe(1.1)
  })

  it("explicit precision overrides step inference", () => {
    const ni = createNumberInput({ step: 0.1, precision: 3 })
    ni.setValue(1.123456)
    expect(ni.value.get()).toBe(1.123)
  })

  it("onValueChange fires on changes", () => {
    const onValueChange = vi.fn()
    const ni = createNumberInput({ onValueChange })
    ni.setValue(7)
    expect(onValueChange).toHaveBeenLastCalledWith(7)
  })

  it("formats integer values verbatim (regression: 10 must not become 1)", () => {
    // Regex `/\.?0+$/` used to munch trailing zeros from the integer part.
    const ni = createNumberInput({ defaultValue: 10 })
    expect(ni.inputValue.get()).toBe("10")
    ni.setValue(100)
    expect(ni.inputValue.get()).toBe("100")
    ni.setValue(20)
    expect(ni.inputValue.get()).toBe("20")
    ni.setValue(0)
    expect(ni.inputValue.get()).toBe("0")
  })

  it("strips trailing zeros only after the decimal point", () => {
    const ni = createNumberInput({ precision: 3, defaultValue: 1.5 })
    expect(ni.inputValue.get()).toBe("1.5")
    ni.setValue(1.1)
    expect(ni.inputValue.get()).toBe("1.1")
    ni.setValue(1)
    expect(ni.inputValue.get()).toBe("1")
    ni.setValue(10)
    expect(ni.inputValue.get()).toBe("10")
  })
})

describe("createNumberInput — increment / decrement", () => {
  it("increment and decrement by step", () => {
    const ni = createNumberInput({ defaultValue: 5, step: 2 })
    ni.increment()
    expect(ni.value.get()).toBe(7)
    ni.decrement()
    expect(ni.value.get()).toBe(5)
  })

  it("increment from null seeds with min (or 0)", () => {
    const ni = createNumberInput({ min: 10 })
    ni.increment()
    expect(ni.value.get()).toBe(11)
  })

  it("clamps at max on increment", () => {
    const ni = createNumberInput({ defaultValue: 9, max: 10 })
    ni.increment()
    ni.increment()
    expect(ni.value.get()).toBe(10)
  })

  it("disabled state freezes increment/decrement", () => {
    const ni = createNumberInput({ defaultValue: 5, disabled: () => true })
    ni.increment()
    expect(ni.value.get()).toBe(5)
  })
})

describe("createNumberInput — props", () => {
  it("input is role=spinbutton with aria-value attrs when set", () => {
    const ni = createNumberInput({ defaultValue: 3, min: 0, max: 10 })
    const p = ni.getInputProps()
    expect(p.role).toBe("spinbutton")
    expect(p.inputmode).toBe("decimal")
    expect(p["aria-valuenow"]).toBe(3)
    expect(p["aria-valuemin"]).toBe(0)
    expect(p["aria-valuemax"]).toBe(10)
  })

  it("ArrowUp / ArrowDown step the value via keydown handler", () => {
    const ni = createNumberInput({ defaultValue: 5, step: 1 })
    const p = ni.getInputProps()
    p.onKeyDown({ key: "ArrowUp" })
    expect(ni.value.get()).toBe(6)
    p.onKeyDown({ key: "ArrowDown" })
    expect(ni.value.get()).toBe(5)
  })

  it("increment button is disabled at max", () => {
    const ni = createNumberInput({ defaultValue: 10, max: 10 })
    expect(ni.getIncrementProps().disabled).toBe(true)
    expect(ni.getDecrementProps().disabled).toBe(false)
  })

  it("hidden input emits when name is provided", () => {
    const ni = createNumberInput({ defaultValue: 7, name: "qty" })
    expect(ni.getHiddenInputProps()).toEqual({ type: "hidden", name: "qty", value: "7" })
  })

  it("hidden input is null without a name", () => {
    expect(createNumberInput({ defaultValue: 7 }).getHiddenInputProps()).toBeNull()
  })

  it("blur clamps value when clampValueOnBlur=true (default)", () => {
    const ni = createNumberInput({ min: 0, max: 10 })
    const p = ni.getInputProps()
    // Simulate a typed-out-of-range value via onInput, then blur
    p.onInput({ currentTarget: { value: "99" } })
    expect(ni.value.get()).toBe(99) // not clamped during typing
    p.onBlur()
    expect(ni.value.get()).toBe(10)
  })
})
