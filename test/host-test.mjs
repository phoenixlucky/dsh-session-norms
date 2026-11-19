// Host-half check for dsh-session-norms.
//
// Usage:
//   node test/host-test.mjs                       # contract + fold checks
//   node test/host-test.mjs <session.jsonl>       # plus a real event log
//
// The view is only as fast as its data source: the browser half renders what
// the Host projection publishes, so this file pins the registration contract
// (including the `inject` declaration that keeps the entry from activating
// before `sessionProjections` exists) and the fold it produces.
import { readFileSync } from 'node:fs'

const spec = await import(new URL('../index.js', import.meta.url).href)

const checks = []
const failures = []
const check = (label, ok, detail) => {
  checks.push(label)
  if (!ok) failures.push(`${label}${detail === undefined ? '' : `: ${detail}`}`)
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}`)
}

/**
 * Build a Client-independent Host context that serves one projection registry.
 *
 * @param capture Receives every registered definition.
 * @param logs Receives `[level, message]` pairs.
 * @returns A stand-in Cordis context.
 */
function hostContext(capture, logs) {
  const service = {
    register: async (definition) => {
      capture.push(definition)
      return { stateOf: () => undefined, readerFor: () => () => undefined, dispose: async () => {} }
    },
  }
  return {
    get: (name) => (name === 'sessionProjections' ? service : undefined),
    effect: (fn) => {
      const dispose = fn()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    logger: () => ({
      debug: () => {},
      info: () => {},
      warn: (message) => logs.push(['warn', message]),
      error: (message) => logs.push(['error', message]),
    }),
  }
}

/** One committed event, in the shape the Session log hands to `apply`. */
const event = (type, data, time = 0) => ({ type, seq: 0, time, data })

/**
 * Run the real fold over a list of events and return the published view.
 *
 * @param definition Registered projection definition.
 * @param events Committed Session events.
 * @returns The value the browser would receive.
 */
function project(definition, events) {
  let state = definition.init({ version: 4, id: 'session-test', createdAt: 1000, cwd: 'E:/home/work', isSeeded: false }, 0)
  for (const next of events) state = definition.apply(state, next)
  return definition.wire.view(state)
}

// --- Registration contract ------------------------------------------------

check('host half declares its own module name', spec.name === undefined || typeof spec.name === 'string')

const inject = Array.isArray(spec.inject) ? spec.inject : []
check(
  'host half injects sessionProjections',
  inject.includes('sessionProjections'),
  `inject = ${JSON.stringify(spec.inject)}`,
)

const capture = []
const logs = []
await spec.apply(hostContext(capture, logs))

check('apply registers exactly one unit', capture.length === 1, String(capture.length))
const definition = capture[0] ?? {}
check('unit key is sessionNorms', definition.key === 'sessionNorms', String(definition.key))
check('unit exposes a state version', typeof definition.stateVersion === 'number', String(definition.stateVersion))
check('unit folds with init/apply', typeof definition.init === 'function' && typeof definition.apply === 'function')
check('unit publishes a wire view', typeof definition.wire?.view === 'function' && definition.wire?.viewSchema !== undefined)
check('state and view keep sharing one schema', definition.stateSchema === definition.wire?.viewSchema)
check('registration is reported as healthy', logs.length === 0, JSON.stringify(logs))

// A registry that is missing entirely must not fail activation; it reports.
const missingLogs = []
await spec.apply({ get: () => undefined, effect: (fn) => fn(), logger: () => ({ warn: () => {}, error: (m) => missingLogs.push(m) }) })
check('missing registry is reported, not thrown', missingLogs.length === 1, JSON.stringify(missingLogs))

// --- Fold behaviour on a small scripted session ---------------------------

const scripted = [
  event('turn/start', { turn: 1 }, 100),
  event('step/start', { turn: 1, step: 1 }, 110),
  event('user/message', { role: 'user', content: [{ type: 'text', text: '帮我看一下今天的行情' }] }, 120),
  event('assistant/message', { turn: 1, step: 1, message: { role: 'assistant', content: [{ type: 'text', text: '我先查数据。' }] } }, 130),
  event('tool/call', { turn: 1, step: 1, callId: 'call-1', name: 'bash', arguments: '{"command":"  ls   -la  "}' }, 140),
  event('tool/result', { turn: 1, step: 1, message: { role: 'tool', toolCallId: 'call-1', content: [{ type: 'text', text: 'total 0\nother line' }] } }, 150),
  event('tool/call', { turn: 1, step: 1, callId: 'call-2', name: 'read', arguments: '' }, 160),
  event('tool/result', { turn: 1, step: 1, message: { role: 'tool', toolCallId: 'call-2', isError: true, content: [{ type: 'text', text: 'ENOENT' }] } }, 170),
  event('assistant/message', { turn: 1, step: 1, message: { role: 'assistant', content: [{ type: 'text', text: '中断了' }] }, interrupted: true }, 180),
  event('turn/end', { turn: 1, reason: { kind: 'error', error: { message: 'boom', code: 'x' } } }, 190),
  event('turn/start', { turn: 2 }, 200),
  event('ignored/type', {}, 210),
]

const view = project(definition, scripted)

check('view reports the turn count', view.turns === 2, String(view.turns))
check('view counts tool calls', view.tools === 2, String(view.tools))
check('view counts messages', view.messages === 3, String(view.messages))
check('view counts errors once per failed turn and call', view.errors === 2, String(view.errors))
check('view carries no truncation flag for a short log', view.truncated === false, String(view.truncated))
check(
  'view keeps the recorded rows in order',
  view.rows.map((row) => row.k).join(',') === 'turn,user,assistant,tool,tool,assistant,turn',
  view.rows.map((row) => row.k).join(','),
)
check('view keeps the session header fields', view.createdAt === 1000 && view.cwd === 'E:/home/work', `${view.createdAt} ${view.cwd}`)

const toolOk = view.rows.find((row) => row.callId === 'call-1')
check('tool row settles as ok', toolOk?.status === 'ok', JSON.stringify(toolOk)?.slice(0, 120))
check('tool row flattens recorded arguments', toolOk?.args === '{"command":" ls -la "}', String(toolOk?.args))
check('tool row keeps the first result line', toolOk?.result === 'total 0', String(toolOk?.result))
const toolFailed = view.rows.find((row) => row.callId === 'call-2')
check('failed tool call is marked', toolFailed?.status === 'error' && toolFailed?.result === 'ENOENT', JSON.stringify(toolFailed))
const interrupted = view.rows.find((row) => row.k === 'assistant' && row.interrupted === true)
check('interrupted reply is marked', interrupted !== undefined)

// Budgets: the published value may never grow without bound.
const many = []
for (let index = 0; index < 260; index += 1) {
  many.push(event('turn/start', { turn: index + 1 }, index))
}
const capped = project(definition, many)
check('row budget keeps the newest rows', capped.rows.length === 200, String(capped.rows.length))
check('row budget reports truncation', capped.truncated === true)
check('row budget keeps the last turn', capped.rows.at(-1)?.turn === 260, String(capped.rows.at(-1)?.turn))

const longText = 'x'.repeat(5000)
const clamped = project(definition, [event('turn/start', { turn: 1 }), event('user/message', { role: 'user', content: [{ type: 'text', text: longText }] })])
check('message text is clamped', clamped.rows.at(-1).text.length === 3001, String(clamped.rows.at(-1).text.length))

// --- Optional: a real session log ----------------------------------------

const logPath = process.argv[2]
if (logPath === undefined) {
  console.log('\n(no session log given; contract and fold checks only)')
} else {
  const events = []
  // A Windows-authored log may carry a byte-order mark; it is not content.
  const text = readFileSync(logPath, 'utf8').replace(/^\ufeff/, '')
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue
    try {
      const parsed = JSON.parse(line)
      if (parsed?.type !== 'session') events.push(parsed)
    } catch {
      failures.push('session log contains a line that is not JSON')
    }
  }
  const started = performance.now()
  const real = project(definition, events)
  const elapsed = performance.now() - started
  check('real log folds into rows', real.rows.length > 0, `${events.length} events`)
  check('real log fold stays within the frame budget', elapsed < 250, `${elapsed.toFixed(1)}ms`)
  check('real log payload stays small enough to ship per event', JSON.stringify(real).length < 400000, `${JSON.stringify(real).length} bytes`)
  console.log(`\nfolded ${events.length} events in ${elapsed.toFixed(1)}ms, payload ${JSON.stringify(real).length} bytes`)
}

// --- Package metadata ----------------------------------------------------
// DSH reads `icon` from the manifest, inlines it, and only accepts
// svg/png/jpg/jpeg/webp that resolves inside the package and stays under
// 256 KiB — so the icon is a shipped, sized artifact, not a build leftover.
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
check('manifest declares a shipped icon', manifest.icon === 'icon.webp' && manifest.files.includes('icon.webp'), manifest.icon)
check('icon export points at the same file', manifest.exports['./icon'] === './icon.webp', manifest.exports['./icon'])
check('the retired svg icon is gone', !manifest.files.includes('icon.svg'))

const iconBytes = readFileSync(new URL(`../${manifest.icon}`, import.meta.url))
const chunk = iconBytes.subarray(12, 16).toString('latin1')
check(
  'icon is a WebP container',
  iconBytes.subarray(0, 4).toString('latin1') === 'RIFF' && iconBytes.subarray(8, 12).toString('latin1') === 'WEBP',
  iconBytes.subarray(0, 12).toString('latin1'),
)
check('icon uses a VP8 family chunk', ['VP8 ', 'VP8L', 'VP8X'].includes(chunk), chunk)
check('icon fits the 256 KiB budget', iconBytes.length <= 256 * 1024, `${(iconBytes.length / 1024).toFixed(1)} KiB`)
check('icon carries real pixels', iconBytes.length > 4096, `${iconBytes.length} bytes`)

console.log('')
console.log(`checks: ${checks.length}, failures: ${failures.length}`)
if (failures.length > 0) {
  for (const failure of failures) console.log(` - ${failure}`)
  process.exitCode = 1
} else {
  console.log('all checks passed')
}
