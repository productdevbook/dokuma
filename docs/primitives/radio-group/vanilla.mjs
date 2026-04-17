import { mountRadioGroup } from "/dist/adapters/vanilla.mjs"

const PLANS = [
  { value: "free", label: "Free", desc: "All the basics for getting started." },
  { value: "pro", label: "Pro", desc: "Everything in Free plus advanced features." },
  { value: "team", label: "Team", desc: "Collaboration tools and shared workspaces." },
]

export function mount(root, ctx) {
  root.innerHTML = `
    <div id="rg-root" class="radio-group" aria-label="Plan">
      ${PLANS.map(
        (p) => `
        <label class="radio-row">
          <button data-dokuma-radio="${p.value}" class="radio"></button>
          <div>
            <div style="font-weight:600;">${p.label}</div>
            <div style="color:var(--muted); font-size:13px;">${p.desc}</div>
          </div>
        </label>
      `,
      ).join("")}
    </div>
  `
  const { radioGroup, destroy } = mountRadioGroup({
    root: "#rg-root",
    parent: root,
    defaultValue: "pro",
    "aria-label": "Plan",
    onValueChange: (v) => ctx.onState(`selected: ${v}`),
  })
  ctx.onState(`selected: ${radioGroup.value.get() || "—"}`)
  return destroy
}
