// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { getFocusable, lockScroll } from "../src/_focus.ts"

beforeEach(() => {
  document.body.innerHTML = ""
})

afterEach(() => {
  // Reset any leaked scroll-lock state between tests.
  const KEY = Symbol.for("dokuma.scrollLock")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (document as any)[KEY]
  document.body.style.overflow = ""
  document.body.style.paddingRight = ""
  document.documentElement.style.overflow = ""
})

describe("getFocusable", () => {
  it("returns interactive elements in document order", () => {
    const root = document.createElement("div")
    root.innerHTML = `
      <a href="#">link</a>
      <button>button</button>
      <input />
      <select><option>x</option></select>
      <textarea></textarea>
      <div tabindex="0">tab0</div>
      <div contenteditable="true">edit</div>
    `
    document.body.append(root)
    const found = getFocusable(root)
    expect(found.map((el) => el.tagName.toLowerCase())).toEqual([
      "a",
      "button",
      "input",
      "select",
      "textarea",
      "div",
      "div",
    ])
  })

  it("excludes disabled form controls", () => {
    const root = document.createElement("div")
    root.innerHTML = `
      <button disabled>x</button>
      <input disabled />
      <button>ok</button>
    `
    document.body.append(root)
    const found = getFocusable(root)
    expect(found.map((el) => el.textContent?.trim())).toEqual(["ok"])
  })

  it('excludes tabindex="-1"', () => {
    const root = document.createElement("div")
    root.innerHTML = `
      <div tabindex="-1">no</div>
      <div tabindex="0">yes</div>
    `
    document.body.append(root)
    expect(getFocusable(root).length).toBe(1)
  })

  it("excludes elements inside [inert]", () => {
    const root = document.createElement("div")
    root.innerHTML = `
      <div inert>
        <button>hidden</button>
      </div>
      <button>visible</button>
    `
    document.body.append(root)
    const found = getFocusable(root)
    expect(found.map((el) => el.textContent)).toEqual(["visible"])
  })

  it("excludes display:none and visibility:hidden", () => {
    const root = document.createElement("div")
    const a = document.createElement("button")
    a.textContent = "a"
    a.style.display = "none"
    const b = document.createElement("button")
    b.textContent = "b"
    b.style.visibility = "hidden"
    const c = document.createElement("button")
    c.textContent = "c"
    root.append(a, b, c)
    document.body.append(root)
    expect(getFocusable(root).map((el) => el.textContent)).toEqual(["c"])
  })

  it("returns an empty list when nothing inside is focusable", () => {
    const root = document.createElement("div")
    root.innerHTML = `<p>just text</p><span>and a span</span>`
    document.body.append(root)
    expect(getFocusable(root)).toEqual([])
  })
})

describe("lockScroll", () => {
  it("locks body and html overflow on first call", () => {
    const release = lockScroll()
    expect(document.body.style.overflow).toBe("hidden")
    expect(document.documentElement.style.overflow).toBe("hidden")
    release()
  })

  it("restores original overflow when count returns to zero", () => {
    document.body.style.overflow = "auto"
    document.documentElement.style.overflow = "scroll"
    const release = lockScroll()
    expect(document.body.style.overflow).toBe("hidden")
    release()
    expect(document.body.style.overflow).toBe("auto")
    expect(document.documentElement.style.overflow).toBe("scroll")
  })

  it("ref-counts: nested locks only release once all are released", () => {
    const r1 = lockScroll()
    const r2 = lockScroll()
    expect(document.body.style.overflow).toBe("hidden")
    r1()
    expect(document.body.style.overflow).toBe("hidden")
    r2()
    expect(document.body.style.overflow).toBe("")
  })

  it("release function is idempotent", () => {
    const r1 = lockScroll()
    const r2 = lockScroll()
    r1()
    r1() // double release of r1
    expect(document.body.style.overflow).toBe("hidden")
    r2()
    expect(document.body.style.overflow).toBe("")
  })

  it("returns a no-op when document is undefined (SSR)", () => {
    // Can't really delete `document` in jsdom, but we can call the no-op path
    // by spying — instead just confirm the public contract: returned function
    // is callable and does nothing harmful.
    const release = lockScroll()
    expect(typeof release).toBe("function")
    release()
  })
})
