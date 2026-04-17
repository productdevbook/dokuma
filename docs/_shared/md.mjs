// zero-dep mini markdown — supports: # / ## / ### headings, fenced code (```lang),
// tables (| col | col |), `inline code`, [text](href), **bold**, *em*, paragraphs, ul/ol lists.
// not exhaustive — only what the docs need.

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
}

function renderTable(lines) {
  const split = (l) => {
    const cells = []
    let buf = ""
    for (let i = 0; i < l.length; i++) {
      const ch = l[i]
      if (ch === "\\" && l[i + 1] === "|") {
        buf += "|"
        i++
        continue
      }
      if (ch === "|") {
        cells.push(buf.trim())
        buf = ""
        continue
      }
      buf += ch
    }
    cells.push(buf.trim())
    if (cells.length && cells[0] === "") cells.shift()
    if (cells.length && cells[cells.length - 1] === "") cells.pop()
    return cells
  }
  const head = split(lines[0])
  const body = lines.slice(2).map(split)
  const ths = head.map((c) => `<th>${inline(c)}</th>`).join("")
  const trs = body
    .map((row) => `<tr>${row.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
    .join("")
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`
}

export function renderMarkdown(src) {
  const lines = src.replace(/\r\n/g, "\n").split("\n")
  const out = []
  let i = 0
  let para = []

  const flushPara = () => {
    if (!para.length) return
    out.push(`<p>${inline(para.join(" "))}</p>`)
    para = []
  }

  while (i < lines.length) {
    const line = lines[i]

    // fenced code
    if (line.startsWith("```")) {
      flushPara()
      const lang = line.slice(3).trim()
      const buf = []
      i++
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i])
        i++
      }
      i++ // skip closing fence
      const cls = lang ? ` class="lang-${lang}"` : ""
      out.push(`<pre><code${cls}>${escapeHtml(buf.join("\n"))}</code></pre>`)
      continue
    }

    // headings
    const h = /^(#{1,3})\s+(.*)$/.exec(line)
    if (h) {
      flushPara()
      const level = h[1].length
      out.push(`<h${level}>${inline(h[2])}</h${level}>`)
      i++
      continue
    }

    // table (header line followed by --- separator)
    if (line.startsWith("|") && lines[i + 1] && /^\s*\|?\s*:?-+/.test(lines[i + 1])) {
      flushPara()
      const buf = [line, lines[i + 1]]
      i += 2
      while (i < lines.length && lines[i].startsWith("|")) {
        buf.push(lines[i])
        i++
      }
      out.push(renderTable(buf))
      continue
    }

    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara()
      const items = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""))
        i++
      }
      out.push(`<ul>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</ul>`)
      continue
    }

    // blank line
    if (!line.trim()) {
      flushPara()
      i++
      continue
    }

    // paragraph accumulator
    para.push(line.trim())
    i++
  }
  flushPara()

  return out.join("\n")
}
