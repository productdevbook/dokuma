// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  arrow,
  computePosition,
  detectOverflow,
  flip,
  offset,
  shift,
} from "../src/_floating/index.ts"
import { computeCoordsFromPlacement } from "../src/_floating/compute-coords-from-placement.ts"
import {
  getAlignment,
  getAlignmentAxis,
  getOppositeAxisPlacements,
  getOppositePlacement,
  getSide,
  getSideAxis,
  placements,
  rectToClientRect,
} from "../src/_floating/utils.ts"

let reference: HTMLElement
let floating: HTMLElement

beforeEach(() => {
  document.body.innerHTML = ""
  reference = document.createElement("div")
  floating = document.createElement("div")
  document.body.append(reference, floating)
})

afterEach(() => {
  document.body.innerHTML = ""
})

describe("floating utils", () => {
  it("getSide / getAlignment / axes", () => {
    expect(getSide("bottom")).toBe("bottom")
    expect(getSide("bottom-start")).toBe("bottom")
    expect(getAlignment("bottom-start")).toBe("start")
    expect(getAlignment("top")).toBeUndefined()
    expect(getSideAxis("left")).toBe("x")
    expect(getSideAxis("bottom")).toBe("y")
    expect(getAlignmentAxis("bottom-end")).toBe("x")
  })

  it("getOppositePlacement preserves alignment", () => {
    expect(getOppositePlacement("top")).toBe("bottom")
    expect(getOppositePlacement("top-start")).toBe("bottom-start")
    expect(getOppositePlacement("left-end")).toBe("right-end")
  })

  it("placements list has all 12", () => {
    expect(placements).toHaveLength(12)
  })

  it("getOppositeAxisPlacements base placement", () => {
    const list = getOppositeAxisPlacements("bottom", true, "start")
    expect(list).toEqual(["left", "right"])
  })

  it("rectToClientRect adds top/right/bottom/left", () => {
    expect(rectToClientRect({ x: 10, y: 20, width: 30, height: 40 })).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      top: 20,
      left: 10,
      right: 40,
      bottom: 60,
    })
  })
})

describe("computeCoordsFromPlacement", () => {
  const rects = {
    reference: { x: 100, y: 200, width: 40, height: 20 },
    floating: { x: 0, y: 0, width: 80, height: 30 },
  }

  it("bottom (centered)", () => {
    expect(computeCoordsFromPlacement(rects, "bottom")).toEqual({
      x: 100 + 20 - 40, // 80
      y: 220,
    })
  })

  it("top", () => {
    expect(computeCoordsFromPlacement(rects, "top")).toEqual({
      x: 80,
      y: 200 - 30,
    })
  })

  it("right-start", () => {
    const r = computeCoordsFromPlacement(rects, "right-start")
    // reference.x + width, y aligned to reference.y (start)
    expect(r.x).toBe(140)
    expect(r.y).toBe(200)
  })

  it("left-end", () => {
    const r = computeCoordsFromPlacement(rects, "left-end")
    expect(r.x).toBe(100 - 80)
    expect(r.y).toBe(220 - 30)
  })
})

describe("computePosition (DOM platform)", () => {
  it("bottom placement returns coords + placement", async () => {
    // Mock getBoundingClientRect so jsdom returns usable rects.
    reference.getBoundingClientRect = () =>
      ({
        x: 100,
        y: 100,
        width: 40,
        height: 20,
        top: 100,
        left: 100,
        right: 140,
        bottom: 120,
      }) as DOMRect
    Object.defineProperty(floating, "offsetWidth", { value: 80, configurable: true })
    Object.defineProperty(floating, "offsetHeight", { value: 30, configurable: true })

    const result = await computePosition(reference, floating, {
      placement: "bottom",
      middleware: [offset(0)],
    })

    expect(result.placement).toBe("bottom")
    expect(result.strategy).toBe("absolute")
    expect(typeof result.x).toBe("number")
    expect(typeof result.y).toBe("number")
  })

  it("offset middleware shifts along main axis", async () => {
    reference.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: 40, height: 20, top: 0, left: 0, right: 40, bottom: 20 }) as DOMRect
    Object.defineProperty(floating, "offsetWidth", { value: 80, configurable: true })
    Object.defineProperty(floating, "offsetHeight", { value: 30, configurable: true })

    const noOff = await computePosition(reference, floating, {
      placement: "bottom",
      middleware: [offset(0)],
    })
    const withOff = await computePosition(reference, floating, {
      placement: "bottom",
      middleware: [offset(10)],
    })

    expect(withOff.y - noOff.y).toBe(10)
  })

  it("shift middleware runs without throwing", async () => {
    reference.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: 40, height: 20, top: 0, left: 0, right: 40, bottom: 20 }) as DOMRect
    Object.defineProperty(floating, "offsetWidth", { value: 80, configurable: true })
    Object.defineProperty(floating, "offsetHeight", { value: 30, configurable: true })

    const result = await computePosition(reference, floating, {
      placement: "bottom",
      middleware: [offset(0), shift()],
    })

    expect(result.middlewareData.shift).toBeDefined()
  })

  it("flip middleware produces middlewareData", async () => {
    reference.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: 40, height: 20, top: 0, left: 0, right: 40, bottom: 20 }) as DOMRect
    Object.defineProperty(floating, "offsetWidth", { value: 80, configurable: true })
    Object.defineProperty(floating, "offsetHeight", { value: 30, configurable: true })

    const result = await computePosition(reference, floating, {
      placement: "bottom",
      middleware: [flip()],
    })

    expect(result.middlewareData.flip).toBeDefined()
  })

  it("arrow middleware returns centerOffset", async () => {
    const arrowEl = document.createElement("div")
    Object.defineProperty(arrowEl, "offsetWidth", { value: 10, configurable: true })
    Object.defineProperty(arrowEl, "offsetHeight", { value: 10, configurable: true })
    floating.append(arrowEl)

    reference.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: 40, height: 20, top: 0, left: 0, right: 40, bottom: 20 }) as DOMRect
    Object.defineProperty(floating, "offsetWidth", { value: 80, configurable: true })
    Object.defineProperty(floating, "offsetHeight", { value: 30, configurable: true })

    const result = await computePosition(reference, floating, {
      placement: "bottom",
      middleware: [arrow({ element: arrowEl })],
    })

    expect(result.middlewareData.arrow).toBeDefined()
    expect(result.middlewareData.arrow).toHaveProperty("centerOffset")
  })

  it("detectOverflow returns side offsets (referenced via middleware state)", async () => {
    reference.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: 40, height: 20, top: 0, left: 0, right: 40, bottom: 20 }) as DOMRect
    Object.defineProperty(floating, "offsetWidth", { value: 80, configurable: true })
    Object.defineProperty(floating, "offsetHeight", { value: 30, configurable: true })

    let captured: Awaited<ReturnType<typeof detectOverflow>> | null = null
    await computePosition(reference, floating, {
      placement: "bottom",
      middleware: [
        {
          name: "probe",
          async fn(state) {
            captured = await detectOverflow(state)
            return {}
          },
        },
      ],
    })

    expect(captured).not.toBeNull()
    expect(captured).toHaveProperty("top")
    expect(captured).toHaveProperty("bottom")
    expect(captured).toHaveProperty("left")
    expect(captured).toHaveProperty("right")
  })
})
