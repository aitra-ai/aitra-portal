import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import DOMPurify from 'dompurify'

// Register commonly used languages
import python from 'highlight.js/lib/languages/python'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import go from 'highlight.js/lib/languages/go'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

hljs.registerLanguage('python', python)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('go', go)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)

// Configure marked with highlight.js
marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderer = new marked.Renderer()

// Custom code block renderer with copy button placeholder and language label
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = lang && hljs.getLanguage(lang) ? lang : ''
  const highlighted = language
    ? hljs.highlight(text, { language }).value
    : hljs.highlightAuto(text).value
  const langLabel = language || 'code'
  return `<div class="code-block-wrapper">
    <div class="code-block-header">
      <span class="code-lang">${langLabel}</span>
      <button class="code-copy-btn" onclick="navigator.clipboard.writeText(this.closest('.code-block-wrapper').querySelector('code').textContent).then(()=>{this.textContent='✓ Copied';setTimeout(()=>{this.textContent='Copy'},1500)})">Copy</button>
    </div>
    <pre><code class="hljs language-${langLabel}">${highlighted}</code></pre>
  </div>`
}

// Inline code styling
renderer.codespan = function ({ text }: { text: string }) {
  return `<code class="inline-code">${text}</code>`
}

marked.use({ renderer })

/**
 * Render markdown string to sanitized HTML.
 * Safe for v-html usage (DOMPurify strips XSS vectors).
 */
export function renderMarkdown(text: string): string {
  if (!text) return ''
  const raw = marked.parse(text) as string
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ['onclick'], // Allow copy button onclick
  })
}
