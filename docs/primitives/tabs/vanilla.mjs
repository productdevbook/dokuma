import { mountTabs } from "/dist/adapters/vanilla.mjs"

export function mount(root, ctx) {
  root.innerHTML = `
    <div id="tabs-root" class="tabs">
      <div data-dokuma-tabs-list class="tabs-list">
        <button data-dokuma-tabs-tab="overview" class="tabs-trigger">Overview</button>
        <button data-dokuma-tabs-tab="install" class="tabs-trigger">Install</button>
        <button data-dokuma-tabs-tab="api" class="tabs-trigger">API</button>
      </div>
      <div data-dokuma-tabs-panel="overview" class="tabs-panel">
        <strong>Overview.</strong>
        <p style="margin: 8px 0 0; color: var(--muted)">
          The same headless tabs primitive every framework consumes — including raw HTML from a CDN.
        </p>
      </div>
      <div data-dokuma-tabs-panel="install" class="tabs-panel">
        <strong>Install.</strong>
        <p style="margin: 8px 0 0; color: var(--muted)">
          <code>pnpm add dokuma</code> or import from <code>esm.sh</code> in a single &lt;script type="module"&gt; tag.
        </p>
      </div>
      <div data-dokuma-tabs-panel="api" class="tabs-panel">
        <strong>API.</strong>
        <p style="margin: 8px 0 0; color: var(--muted)">
          One coordinator + per-tab register. ARIA, roving tabindex, and keyboard handled for you.
        </p>
      </div>
    </div>
  `

  const { tabs, destroy } = mountTabs({
    root: "#tabs-root",
    parent: root,
    onValueChange: (v) => ctx.onState(`selected: ${v}`),
  })

  ctx.onState(`selected: ${tabs.value.get()}`)
  return destroy
}
