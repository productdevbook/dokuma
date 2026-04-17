import { highlight } from "/docs/_shared/highlight.mjs"
import { renderMarkdown } from "/docs/_shared/md.mjs"

const $ = (id) => document.getElementById(id)

const state = {
  registry: null,
  currentPrimitive: null,
  currentAdapter: null,
  currentUnmount: null,
}

async function loadRegistry() {
  const res = await fetch("/docs/primitives.json")
  state.registry = await res.json()
}

function renderSidebar() {
  const nav = $("primitive-nav")
  nav.innerHTML = state.registry.primitives
    .map((p) => `<a href="#/${p.id}" data-id="${p.id}" class="nav-item">${p.title}</a>`)
    .join("")
}

function setActiveSidebar() {
  for (const a of document.querySelectorAll("#primitive-nav .nav-item")) {
    a.classList.toggle("active", a.dataset.id === state.currentPrimitive?.id)
  }
}

function renderTabs() {
  const tabs = $("adapter-tabs")
  if (!state.currentPrimitive) {
    tabs.innerHTML = ""
    return
  }
  tabs.innerHTML = state.currentPrimitive.adapters
    .map(
      (a) =>
        `<li><a href="#/${state.currentPrimitive.id}/${a}" data-adapter="${a}" class="${
          a === state.currentAdapter ? "active" : ""
        }">${a[0].toUpperCase() + a.slice(1)}</a></li>`,
    )
    .join("")
}

async function renderApiDoc() {
  const article = $("api-doc")
  try {
    const res = await fetch(`/docs/primitives/${state.currentPrimitive.id}/index.md`)
    if (!res.ok) {
      article.innerHTML = ""
      return
    }
    article.innerHTML = renderMarkdown(await res.text())
    await highlightInPlace(article)
  } catch {
    article.innerHTML = ""
  }
}

async function highlightInPlace(root) {
  const blocks = root.querySelectorAll('pre > code[class^="lang-"]')
  await Promise.all(
    [...blocks].map(async (codeEl) => {
      const lang = codeEl.className.replace(/^lang-/, "")
      const text = codeEl.textContent ?? ""
      const html = await highlight(text, lang)
      const tmp = document.createElement("div")
      tmp.innerHTML = html
      const replacement = tmp.firstElementChild
      if (replacement) codeEl.parentElement.replaceWith(replacement)
    }),
  )
}

async function renderDemo() {
  const mount = $("preview-mount")
  const label = $("preview-label")
  const stateOut = $("preview-state")
  const details = document.querySelector(".source-details")

  if (state.currentUnmount) {
    state.currentUnmount()
    state.currentUnmount = null
  }
  mount.innerHTML = ""
  stateOut.textContent = ""
  label.textContent = state.currentAdapter

  // reset source viewer to a known shape — every render starts from <pre><code>
  const summary = details.querySelector("summary")
  details.innerHTML = ""
  details.append(summary)
  const pre = document.createElement("pre")
  const sourceEl = document.createElement("code")
  sourceEl.id = "demo-source"
  pre.append(sourceEl)
  details.append(pre)

  const path = `/docs/primitives/${state.currentPrimitive.id}/${state.currentAdapter}.mjs`

  try {
    const [mod, sourceRes] = await Promise.all([import(path + `?t=${Date.now()}`), fetch(path)])
    const source = await sourceRes.text()
    sourceEl.textContent = source
    sourceEl.className = "lang-js"

    const result = await mod.mount(mount, {
      onState: (s) => {
        stateOut.textContent = s ?? ""
      },
    })
    state.currentUnmount = typeof result === "function" ? result : null

    const html = await highlight(source, "js")
    const tmp = document.createElement("div")
    tmp.innerHTML = html
    const replacement = tmp.firstElementChild
    if (replacement) pre.replaceWith(replacement)
  } catch (err) {
    mount.innerHTML = `<div class="error">Failed to load demo: ${err.message}</div>`
    sourceEl.textContent = err.stack ?? String(err)
  }
}

function renderHome() {
  $("page-title").textContent = "dokuma"
  $("page-summary").innerHTML =
    "Framework-agnostic, zero-dependency headless UI primitives. The <em>ground</em> every UI sits on. Works in vanilla HTML via CDN, in any framework, and inside native mobile shells."
  $("adapter-tabs").innerHTML = ""
  $("preview").style.display = "none"
  document.querySelector(".source-details").style.display = "none"
  $("api-doc").innerHTML = `
    <h2>Why</h2>
    <p><code>radix-ui</code>, <code>@base-ui-components/react</code>, <code>@headlessui/react</code> — all React-only.
    <code>dokuma</code> is the same idea, but the primitives are plain TypeScript functions and reactive stores,
    with framework integrations layered on top.</p>
    <h2>Primitives</h2>
    <ul>${state.registry.primitives
      .map((p) => `<li><a href="#/${p.id}">${p.title}</a> — ${p.summary}</li>`)
      .join("")}</ul>
  `
}

async function route() {
  const hash = location.hash.slice(1) || "/"
  const [, primitiveId, adapterId] = hash.split("/")

  if (!primitiveId) {
    state.currentPrimitive = null
    state.currentAdapter = null
    if (state.currentUnmount) {
      state.currentUnmount()
      state.currentUnmount = null
    }
    setActiveSidebar()
    renderTabs()
    renderHome()
    return
  }

  const primitive = state.registry.primitives.find((p) => p.id === primitiveId)
  if (!primitive) {
    location.hash = "#/"
    return
  }

  const adapter = primitive.adapters.includes(adapterId) ? adapterId : primitive.adapters[0]

  if (adapter !== adapterId) {
    location.hash = `#/${primitiveId}/${adapter}`
    return
  }

  state.currentPrimitive = primitive
  state.currentAdapter = adapter

  $("page-title").textContent = primitive.title
  $("page-summary").textContent = primitive.summary
  $("preview").style.display = ""
  document.querySelector(".source-details").style.display = ""

  setActiveSidebar()
  renderTabs()
  await renderApiDoc()
  await renderDemo()
}

window.addEventListener("hashchange", route)

await loadRegistry()
renderSidebar()
await route()
