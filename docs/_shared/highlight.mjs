// thin wrapper around shiki CDN — lazy-loads core + theme + langs on first call.
// exports `highlight(code, lang)` -> Promise<string of HTML>, suitable for innerHTML.

const SHIKI = "https://esm.sh/shiki@3"
const THEME = "vitesse-dark"
const SUPPORTED = new Set([
  "js",
  "ts",
  "jsx",
  "tsx",
  "html",
  "vue",
  "bash",
  "sh",
  "md",
  "markdown",
  "json",
  "css",
])

let highlighterPromise

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import(SHIKI).then((m) => ({ codeToHtml: m.codeToHtml }))
  }
  return highlighterPromise
}

function escape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export async function highlight(code, lang) {
  const normalised = lang && SUPPORTED.has(lang) ? lang : "txt"
  if (normalised === "txt") {
    return `<pre class="shiki"><code>${escape(code)}</code></pre>`
  }
  try {
    const { codeToHtml } = await getHighlighter()
    return await codeToHtml(code, { lang: normalised, theme: THEME })
  } catch {
    return `<pre class="shiki"><code>${escape(code)}</code></pre>`
  }
}
