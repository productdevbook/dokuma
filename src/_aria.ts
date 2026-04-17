export type AriaProps = Record<string, string | boolean | number | undefined>

const BOOL_ATTRS = new Set([
  "hidden",
  "disabled",
  "readonly",
  "required",
  "checked",
  "selected",
  "open",
])

const CAMEL_TO_ATTR: Record<string, string> = {
  tabIndex: "tabindex",
}

export function applyAttrs(el: Element, attrs: AriaProps): void {
  for (const rawKey in attrs) {
    const key = CAMEL_TO_ATTR[rawKey] ?? rawKey
    const v = attrs[rawKey]
    if (v === undefined) {
      el.removeAttribute(key)
      continue
    }
    if (typeof v === "boolean") {
      if (BOOL_ATTRS.has(key)) {
        if (v) el.setAttribute(key, "")
        else el.removeAttribute(key)
      } else {
        el.setAttribute(key, v ? "true" : "false")
      }
      continue
    }
    el.setAttribute(key, String(v))
  }
}
