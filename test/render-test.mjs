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

check('module id', spec.id === 'dsh-session-norms', spec.id)
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
        .replace(/&amp;/g, '&')
check('typography renders a style element', typography !== undefined && sheet.length > 0, String(sheet.length))
check('typography scopes to the markdown root', sheet.includes('[class*="_markdown_"]'), 'markdown root selector missing')
check('typography avoids !important', !sheet.includes('!important'), 'override relies on !important')
check('typography uses theme tokens only', !/#[0-9a-f]{3,8}\b/i.test(sheet), 'literal color found')
check('typography normalizes list rhythm', /li\{margin-top:\.22em\}/.test(sheet), 'list rule missing')

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
  check('real payload shows title', real.includes('会话规范化视图'))
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
