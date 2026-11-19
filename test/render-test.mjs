// SSR render check for the browser half of dsh-session-norms.
//
// Usage:
//   node test/render-test.mjs                     # structural checks only
//   node test/render-test.mjs <projection.json>   # plus checks against a real
//                                                 # session projection cache
//
// DSH_PROFILE_DIR points at the DSH profile that provides react/react-dom
// (default: the author's desktop profile). The projection cache file is the
// per-session JSON under `.dsh/storages/session_projcache/sessions/`.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const profileDir = process.env.DSH_PROFILE_DIR ?? 'C:/Users/Administrator/.dsh/profiles/desktop'
const requireFromProfile = createRequire(`${profileDir}/package.json`)
const React = requireFromProfile('react')
const ReactDOMServer = requireFromProfile('react-dom/server')

const clientPath = fileURLToPath(new URL('../client.js', import.meta.url))

let spec
globalThis.window = { __ModuleLoader__: { load(candidate) { spec = candidate } } }
await import(new URL(`file:///${clientPath.replace(/\\/g, '/')}`).href)

const requested = []
const mod = spec.factory((id) => {
  requested.push(id)
  if (id === 'react') return React
  throw new Error(`unexpected module request: ${id}`)
})

const registrations = new Map()
mod.apply({
  effect: (fn) => fn(),
  locale: {
    register: () => () => {},
    bind: () => (key) => key,
    getLocale: () => ({ active: 'zh' }),
    subscribe: () => () => {},
  },
  slots: {
    inject: (_key, callback) => callback(),
    register: (options, component) => {
      registrations.set(options.name, { options, component })
      return () => {}
    },
  },
})

const captured = registrations.get('conversation.view')

const failures = []
const checks = []
const check = (label, ok, detail) => {
  checks.push(label)
  if (!ok) failures.push(`${label}${detail === undefined ? '' : `: ${detail}`}`)
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}`)
}

check('module id', spec.id === '@tinyforge/dsh-session-norms', spec.id)
check('factory requested only react', requested.length === 1 && requested[0] === 'react', requested.join(','))
check('slot name', captured?.options?.name === 'conversation.view', captured?.options?.name)
check('slot id', captured?.options?.id === 'norms', captured?.options?.id)
check('slot order', captured?.options?.order === 40, String(captured?.options?.order))
check('label thunk returns text', typeof captured?.options?.label === 'function' && captured.options.label().length > 0)

const typography = registrations.get('conversation.session.header.utilities')
check('typography anchor registered', typography !== undefined, [...registrations.keys()].join(','))
const sheet =
  typography === undefined
    ? ''
    : ReactDOMServer.renderToStaticMarkup(React.createElement(typography.component, {}))
        .replace(/^<style[^>]*>/, '')
        .replace(/<\/style>$/, '')
        // SSR markup escapes the CSS text; the browser receives it verbatim.
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
check('typography renders a style element', typography !== undefined && sheet.length > 0, String(sheet.length))
check('typography scopes to the markdown root', sheet.includes('[class*="_markdown_"]'), 'markdown root selector missing')
check('typography avoids !important', !sheet.includes('!important'), 'override relies on !important')
check('typography uses theme tokens only', !/#[0-9a-f]{3,8}\b/i.test(sheet), 'literal color found')
check('typography normalizes list rhythm', /li\{margin-top:\.22em\}/.test(sheet), 'list rule missing')
check(
  'typography fits tables to the reading column',
  sheet.includes('table{width:max-content;max-width:100%'),
  'table width rule missing',
)
check('typography lets table cells shrink', sheet.includes('min-width:7.5em;max-width:none'), 'cell width rule missing')
check(
  'typography switches wide tables to labeled cards when needed',
  sheet.includes('table[data-sn-cards="ready"]') && sheet.includes('content:attr(data-sn-label)'),
  'narrow table card rules missing',
)
// A card cell must stay a block holding one inline flow: the renderer emits a
// cell as several inline runs (text, code, links, one KaTeX block per formula),
// and a grid or flex container would turn every run into its own item.
check(
  'typography keeps card cell values in one inline flow',
  !/table\[data-sn-cards="ready"\] tbody td[^{}]*\{[^}]*display:(grid|flex)/.test(sheet) &&
    sheet.includes('padding:3px 0 3px calc(5.2em + 10px)'),
  'card cell is a grid/flex container or lost its hanging indent',
)
// Dollar pairs around Chinese text are prices, not formulas: the marked node
// prints its source with the delimiters back, in the document's own font.
check(
  'typography restores prose that reads as math',
  sheet.includes('content:"$" attr(data-sn-tex) "$"') && sheet.includes('.katex[data-sn-tex]>.katex-html{display:none}'),
  'prose-math rules missing',
)
check(
  'typography keeps two-column tables tabular at full width',
  sheet.includes('table[data-sn-cols="2"]{width:100%}'),
  'two-column narrow width rule missing',
)
check(
  'typography keeps wide tables inside their own scroller',
  sheet.includes('_tableScroll_') && sheet.includes('overscroll-behavior-x:contain'),
  'table scroller rule missing',
)
check('typography styles the Markdown copy action', sheet.includes('.sn-md-copy'), 'action rule missing')

const actions = registrations.get('conversation.chat.assistant-actions')
check('assistant actions registered', actions !== undefined, [...registrations.keys()].join(','))
check('assistant action id', actions?.options?.id === 'norms-copy', actions?.options?.id)
check('assistant action order', actions?.options?.order === 20, String(actions?.options?.order))
check('assistant action locale', actions?.options?.locale === 'session-norms', actions?.options?.locale)

const markdownText = '| 优先级 | 改什么 |\n| --- | --- |\n| P0 | 修复口径 |'
const chatSnapshot = {
  nodes: new Map([
    [
      'assistant-1',
      {
        kind: 'assistant-step',
        data: {
          blocks: [{ kind: 'text', text: markdownText }],
          finalNode: {
            messageId: 'message-1',
            blocks: [{ kind: 'text', text: markdownText }],
          },
        },
      },
    ],
  ]),
}
const withChat = (selector) => selector(chatSnapshot)
const copyButton = ReactDOMServer.renderToStaticMarkup(
  React.createElement(actions.component, { messageId: 'message-1', useChat: withChat }),
)
check('markdown copy renders a button', copyButton.includes('sn-md-copy'), copyButton.slice(0, 120))
check('markdown copy is labelled', copyButton.includes('复制为 Markdown'), 'aria-label missing')
check('markdown copy uses the markdown glyph', copyButton.includes('<svg'), 'icon missing')
check('markdown copy exposes a test hook', copyButton.includes('data-session-norms="copy-markdown"'))

const noMessage = ReactDOMServer.renderToStaticMarkup(
  React.createElement(actions.component, { messageId: 'missing', useChat: withChat }),
)
check('markdown copy hides without a matching message', noMessage === '', noMessage.slice(0, 80))


const render = (props) =>
  ReactDOMServer.renderToStaticMarkup(React.createElement(captured.component, props)).replace(/<style>[\s\S]*?<\/style>/g, '')

const meta = render({})
check('missing hook renders waiting state', meta.includes('正在汇总当前会话'))

const pending = render({ useProjection: () => undefined })
check('pending state renders waiting copy', pending.includes('正在汇总当前会话'))

const empty = render({ useProjection: () => ({ rows: [], turns: 0, messages: 0, tools: 0, errors: 0 }) })
check('empty state renders empty copy', empty.includes('当前会话还没有内容'))

const malformed = render({ useProjection: () => ({ rows: [null, 5, { k: 'nope' }], turns: 'x' }) })
check('malformed payload renders empty state', malformed.includes('当前会话还没有内容'))

let rethrown = ''
try {
  render({
    useProjection: () => {
      throw new Error('projection unavailable')
    },
  })
} catch (error) {
  rethrown = String(error?.message ?? error)
}
check('throwing hook surfaces, boundary owns the fallback in browser', rethrown.includes('projection unavailable'), rethrown)

// --- Tool payload resolution ---------------------------------------------

const toolRowValue = (over) => ({
  turns: 1,
  messages: 0,
  tools: 1,
  errors: 0,
  rows: [{ k: 'tool', turn: 1, step: 1, time: 0, callId: 'call-1', name: 'query', status: 'ok', args: '', result: '', ...over }],
})

const previewOnly = render({ useProjection: () => toolRowValue({ args: '{"sql":"SELECT 1"}', result: '页面：进度' }) })
check('tool row shows the projected argument preview', previewOnly.includes('&quot;sql&quot;'), previewOnly.slice(0, 160))
check('tool row keeps a short preview collapsed', !previewOnly.includes('展开全文'), 'a 200-character preview must not pretend to offer more')

const longPreview = render({ useProjection: () => toolRowValue({ args: `{"sql":"${'x'.repeat(400)}"}` }) })
check('tool row offers a disclosure for a long payload', longPreview.includes('展开全文'))
check('tool row renders only the collapsed excerpt', longPreview.includes('x'.repeat(300)) && !longPreview.includes('x'.repeat(340)))

// A Chat snapshot carries what the projection previews: the recorded arguments
// and the full result content.
const toolCallNode = (callId, over) => ({
  kind: 'tool-call',
  data: {
    root: {
      kind: 'tool-result',
      seq: 1,
      time: 0,
      callId,
      name: 'query',
      args: {},
      call: { name: 'query', argsRaw: '' },
      callTime: 0,
      content: [],
      isError: false,
      subCalls: [],
      ...over,
    },
  },
})
const chatWith = (nodes) => ({ nodes: new Map(Object.entries(nodes)) })
const useChatOf = (snapshot) => (selector) => selector(snapshot)

const fullArgs = '{"sql":"SELECT platform_account,\\n       SUM(spend_amount) AS spend\\nFROM ad_campaign_performance","limit":100}'
const fullResult = `页面：公司运营部门本月人员业绩进度
第二行：完整结果不应该被截断`

const enriched = render({
  useProjection: () => toolRowValue({ args: '{"sql":"SELECT plat…', result: '页面：公司运营部门' }),
  useChat: useChatOf(chatWith({
    'tool-1': toolCallNode('call-1', {
      call: { name: 'query', argsRaw: fullArgs },
      content: [{ kind: 'text', text: fullResult }],
    }),
  })),
})
check('tool row replaces the preview with the recorded arguments', enriched.includes('SELECT platform_account') && !enriched.includes('SELECT plat&hellip;'))
check('tool row indents recorded JSON', /\n {2}&quot;sql&quot;/.test(enriched), 'pretty-printed JSON missing')
check('tool row uses the whole result content', enriched.includes('第二行：完整结果不应该被截断'))
check('a short payload needs no disclosure', !enriched.includes('展开全文'), 'a payload that fits must not offer expansion')

const longArgs = JSON.stringify({ sql: `SELECT ${'a'.repeat(500)}` })
const longResult = render({
  useProjection: () => toolRowValue({ args: '{"sql":"SELECT a…', result: '页面：进度' }),
  useChat: useChatOf(chatWith({
    'tool-2': toolCallNode('call-1', {
      call: { name: 'query', argsRaw: longArgs },
      content: [{ kind: 'text', text: `结果 ${'r'.repeat(500)}` }],
    }),
  })),
})
check('a long payload offers expansion', longResult.includes('展开全文'))
check('the collapsed row stops before the tail', longResult.includes('a'.repeat(300)) && !longResult.includes('a'.repeat(400)))
check('the collapsed row hides the full result too', longResult.includes('r'.repeat(300)) && !longResult.includes('r'.repeat(400)))

const unrelatedChat = render({
  useProjection: () => toolRowValue({ args: '{"sql":"SELECT 1"}', result: '页面：进度' }),
  useChat: useChatOf(chatWith({ 'tool-1': toolCallNode('other-call', { content: [{ kind: 'text', text: 'wrong result' }] }) })),
})
check('a call id mismatch keeps the projected preview', unrelatedChat.includes('SELECT 1') && !unrelatedChat.includes('wrong result'))

const noChatSnapshot = render({
  useProjection: () => toolRowValue({ args: '{"sql":"SELECT 1"}', result: '页面：进度' }),
  useChat: () => undefined,
})
check('a missing chat snapshot still renders the row', noChatSnapshot.includes('sn-name') && noChatSnapshot.includes('SELECT 1'))

// A character budget alone would let 300 characters of short lines grow into a
// three-hundred-line block, and a CSS clamp would hide the tail without saying
// so — the exact "truncated and cannot expand" symptom.
const manyLines = Array.from({ length: 12 }, (_, index) => `第${index + 1}行`).join('\n')
const lineBounded = render({
  useProjection: () => toolRowValue({ args: '', result: '页面：进度' }),
  useChat: useChatOf(chatWith({
    'tool-3': toolCallNode('call-1', { call: { name: 'query', argsRaw: '{}' }, content: [{ kind: 'text', text: manyLines }] }),
  })),
})
check('a payload of many short lines still offers expansion', manyLines.length < 320 && lineBounded.includes('展开全文'))
check('the line-bounded preview keeps the leading lines only', lineBounded.includes('第8行') && !lineBounded.includes('第9行'))
check('the collapsed block never relies on a CSS clamp', lineBounded.includes('sn-code') && !/sn-code[^"]*style="[^"]*max-height/.test(lineBounded))

const payloadPath = process.argv[2]
if (payloadPath === undefined) {
  console.log('\n(no projection payload given; structural checks only)')
} else {
  const raw = JSON.parse(readFileSync(payloadPath, 'utf8'))
  const state = raw?.record?.rows?.sessionNorms?.val
  const stateRows = state?.rows
  const messages = (stateRows ?? []).filter((row) => row?.k === 'user' || row?.k === 'assistant').length
  const value =
    state === undefined
      ? undefined
      : {
          createdAt: state.createdAt,
          cwd: state.cwd,
          turns: state.turn,
          steps: state.steps,
          tools: state.tools,
          errors: state.errors,
          messages,
          rows: stateRows,
          truncated: (stateRows ?? []).length >= 200,
        }
  check('cached projection state found', state !== undefined)
  check('projection view has rows', Array.isArray(value?.rows), typeof value?.rows)

  const real = render({ useProjection: (key) => (key === 'sessionNorms' ? value : undefined) })
  check('real payload renders root', real.includes('sn-root'))
  check('real payload shows title', real.includes('会话规范'))
  check('real payload shows role chips', real.includes('用户'), 'user chip missing')
  check('real payload shows turn header', /第\s*\d+\s*轮/.test(real), 'turn header missing')
  check('real payload shows stat pills', (real.match(/sn-stat/g) ?? []).length >= 4, String((real.match(/sn-stat/g) ?? []).length))
  check('real payload shows copy button', real.includes('复制 Markdown'))
  check('real payload has no fallback copy', !real.includes('暂时无法读取会话汇总'))
  check('real payload shows tool rows', real.includes('sn-name'), 'tool name cell missing')
  check('real payload shows assistant rows', real.includes('助手'), 'assistant chip missing')
  check('real payload shows tool status badges', real.includes('成功') || real.includes('失败') || real.includes('已记录'), 'status badge missing')
  check('long injected text is collapsed behind a disclosure', real.includes('sn-clamped') || real.includes('展开全文'), 'disclosure missing')
  check('real payload uses theme tokens only', !/style="[^"]*#[0-9a-f]{3,8}/i.test(real), 'literal color found in inline styles')

  const kinds = new Set((value?.rows ?? []).map((row) => row?.k))
  for (const kind of ['turn', 'user', 'assistant', 'tool']) {
    check(`real payload contains ${kind} rows`, kinds.has(kind), [...kinds].join(','))
  }
  const toolRow = (value?.rows ?? []).find((row) => row?.k === 'tool')
  check('tool rows carry name and status', typeof toolRow?.name === 'string' && typeof toolRow?.status === 'string', JSON.stringify(toolRow)?.slice(0, 120))
}

console.log('')
console.log(`checks: ${checks.length}, failures: ${failures.length}`)
if (failures.length > 0) {
  for (const failure of failures) console.log(` - ${failure}`)
  process.exitCode = 1
} else {
  console.log('all checks passed')
}
