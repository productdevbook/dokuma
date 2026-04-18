import { describe, expect, it } from "vitest"
import { createFieldset } from "../src/primitives/fieldset.ts"

describe("createFieldset", () => {
  it("root aria-labelledby points to legend id", () => {
    const f = createFieldset()
    expect(f.getRootProps()["aria-labelledby"]).toBe(f.legendId)
    expect(f.getLegendProps().id).toBe(f.legendId)
  })

  it("disabled adds data-disabled + disabled attr", () => {
    const f = createFieldset({ disabled: true })
    const props = f.getRootProps()
    expect(props.disabled).toBe(true)
    expect(props["data-disabled"]).toBe("")
  })
})
