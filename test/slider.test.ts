// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { resetIdCounter } from "../src/_id.ts"
import { createSlider } from "../src/primitives/slider.ts"

beforeEach(() => {
  resetIdCounter()
  document.body.innerHTML = ""
})

describe("createSlider (single)", () => {
  it("starts at min by default", () => {
    const s = createSlider()
    expect(s.value.get()).toBe(0)
  })

  it("respects defaultValue", () => {
    const s = createSlider({ defaultValue: 50 })
    expect(s.value.get()).toBe(50)
  })

  it("clamps to min/max and snaps to step", () => {
    const s = createSlider({ min: 0, max: 100, step: 10, defaultValue: 0 })
    s.setValue(47)
    expect(s.value.get()).toBe(50)
    s.setValue(999)
    expect(s.value.get()).toBe(100)
    s.setValue(-5)
    expect(s.value.get()).toBe(0)
  })

  it("thumb props include aria-valuemin/max/now", () => {
    const s = createSlider({ min: 0, max: 200, defaultValue: 42 })
    const tp = s.getThumbProps()
    expect(tp["aria-valuemin"]).toBe(0)
    expect(tp["aria-valuemax"]).toBe(200)
    expect(tp["aria-valuenow"]).toBe(42)
    expect(tp["aria-valuetext"]).toBe("42")
    expect(tp.role).toBe("slider")
  })

  it("keyboard ArrowRight steps up, ArrowLeft steps down", () => {
    const s = createSlider({ defaultValue: 50, step: 5 })
    const tp = s.getThumbProps()
    tp.onKeyDown({ key: "ArrowRight", preventDefault: () => {} })
    expect(s.value.get()).toBe(55)
    tp.onKeyDown({ key: "ArrowLeft", preventDefault: () => {} })
    expect(s.value.get()).toBe(50)
  })

  it("Shift+Arrow uses largeStep", () => {
    const s = createSlider({ defaultValue: 50, step: 1 })
    s.getThumbProps().onKeyDown({ key: "ArrowRight", shiftKey: true, preventDefault: () => {} })
    expect(s.value.get()).toBe(60)
  })

  it("Home/End jump", () => {
    const s = createSlider({ min: 10, max: 90, defaultValue: 50 })
    const tp = s.getThumbProps()
    tp.onKeyDown({ key: "End", preventDefault: () => {} })
    expect(s.value.get()).toBe(90)
    tp.onKeyDown({ key: "Home", preventDefault: () => {} })
    expect(s.value.get()).toBe(10)
  })

  it("calls onValueChange", () => {
    const onValueChange = vi.fn()
    const s = createSlider({ onValueChange })
    s.setValue(30)
    expect(onValueChange).toHaveBeenCalledWith(30)
  })
})

describe("createSlider (range)", () => {
  it("infers range from tuple defaultValue", () => {
    const s = createSlider({ defaultValue: [20, 80] })
    expect(s.range).toBe(true)
    expect(s.value.get()).toEqual([20, 80])
  })

  it("clamps start thumb to end, end thumb to start", () => {
    const s = createSlider({ defaultValue: [30, 70] })
    s.setThumbValue(0, 80)
    expect(s.value.get()).toEqual([70, 70])
    s.setThumbValue(1, 50)
    expect(s.value.get()).toEqual([70, 70])
  })

  it("thumb 0 and 1 get distinct ids", () => {
    const s = createSlider({ defaultValue: [10, 90] })
    const t0 = s.getThumbProps(0)
    const t1 = s.getThumbProps(1)
    expect(t0.id).not.toBe(t1.id)
    expect(t0["aria-valuenow"]).toBe(10)
    expect(t1["aria-valuenow"]).toBe(90)
  })
})

describe("createSlider (form)", () => {
  it("getHiddenInputProps returns null without name", () => {
    const s = createSlider({ defaultValue: 50 })
    expect(s.getHiddenInputProps()).toBeNull()
  })

  it("single mode returns one input", () => {
    const s = createSlider({ defaultValue: 42, name: "volume" })
    const p = s.getHiddenInputProps()
    expect(p).toEqual({ type: "hidden", name: "volume", value: "42" })
  })

  it("range mode returns two inputs with dot notation", () => {
    const s = createSlider({ defaultValue: [20, 80], name: "range" })
    const p = s.getHiddenInputProps()
    expect(Array.isArray(p)).toBe(true)
    const arr = p as Array<{ name: string; value: string }>
    expect(arr[0]).toMatchObject({ name: "range.0", value: "20" })
    expect(arr[1]).toMatchObject({ name: "range.1", value: "80" })
  })
})

describe("createSlider (disabled)", () => {
  it("blocks keyboard actions", () => {
    const s = createSlider({ defaultValue: 50, disabled: () => true })
    s.getThumbProps().onKeyDown({ key: "ArrowRight", preventDefault: () => {} })
    expect(s.value.get()).toBe(50)
    expect(s.getThumbProps().tabIndex).toBe(-1)
  })
})

describe("createSlider (orientation/dir/inverted)", () => {
  it("vertical adds aria-orientation=vertical", () => {
    const s = createSlider({ orientation: "vertical", defaultValue: 50 })
    expect(s.getThumbProps()["aria-orientation"]).toBe("vertical")
  })

  it("inverted flips range fill direction (no crash)", () => {
    const s = createSlider({ inverted: true, defaultValue: 50 })
    const rp = s.getRangeProps()
    expect(rp.style).toBeDefined()
  })
})
