/**
 * Session norms — Host half.
 *
 * Folds the committed Session log into one normalized transcript and publishes
 * it to the browser through the Session projection wire, so the Client renders
 * a value that was already computed here instead of folding events itself.
 */

/** Projection key read by the browser half through `useProjection`. */
const PROJECTION_KEY = 'sessionNorms'

/** Bumped whenever the folded state or its meaning changes. */
const PROJECTION_VERSION = 1

/** Row budget of one published transcript (oldest rows are dropped first). */
const MAX_ROWS = 200

/** Per-message text budget, in characters. */
const MAX_TEXT = 3000

/** Tool argument preview budget, in characters. */
const MAX_ARGS = 200

/** Tool result preview budget, in characters. */
const MAX_RESULT = 240

/**
 * Register the projection. A missing projection service or a rejected schema
 * leaves the plugin silent rather than failing its activation.
 *
 * @param ctx Cordis context of this plugin.
 */
export async function apply(ctx) {
  const projections = readService(ctx, 'sessionProjections')
  if (projections === undefined || typeof projections.register !== 'function') {
    report(ctx, 'warn', 'sessionProjections is unavailable; the normalized transcript stays empty')
    return
  }

  const schema = await loadSchema()
  try {
    await projections.register({
      key: PROJECTION_KEY,
      stateSchema: schema,
      init: createState,
      apply: fold,
      wire: { viewSchema: schema, view: viewOf },
      stateVersion: PROJECTION_VERSION,
    })
  } catch (error) {
    report(ctx, 'error', `projection registration failed: ${describe(error)}`)
  }
}

/**
 * Read one optional Host service without failing activation when it is absent.
 *
 * @param ctx Cordis context.
 * @param name Service name.
 * @returns The service, or `undefined`.
 */
function readService(ctx, name) {
  try {
    return ctx.get(name)
  } catch {
    return undefined
  }
}

/**
 * Resolve a schema for the projection. `zod` is preferred; a permissive
 * stand-in keeps registration working when the package cannot be resolved
 * from the installed location (a linked checkout, for example).
 *
 * @returns A schema accepted by the projection service.
 */
async function loadSchema() {
  try {
    const module = await import('zod')
    const z = module.z ?? module.default ?? module
    if (z !== undefined && typeof z.any === 'function') return z.any()
  } catch {
    // Fall through to the stand-in below.
  }
  return looseSchema()
}

/**
 * Minimal schema stand-in that satisfies parse-style validation.
 *
 * @returns A permissive schema object.
 */
function looseSchema() {
  const schema = {
    parse: (value) => value,
    safeParse: (value) => ({ success: true, data: value }),
    optional: () => schema,
    nullable: () => schema,
    catch: () => schema,
    strip: () => schema,
    _def: { typeName: 'ZodAny' },
  }
  return schema
}

/**
 * Initial folded state of one Session.
 *
 * @param header Immutable Session header supplied by the projection service.
 * @returns Plain, checkpointable state.
 */
function createState(header) {
  const createdAt = header !== undefined && typeof header.createdAt === 'number' ? header.createdAt : 0
  const cwd = header !== undefined && typeof header.cwd === 'string' ? header.cwd : ''
  return { createdAt, cwd, turn: 0, steps: 0, tools: 0, errors: 0, rows: [] }
}

/**
 * Pure fold over one committed Session event. Unknown types return the same
 * reference so unchanged state costs nothing downstream.
 *
 * @param state Current state.
 * @param event Committed Session event.
 * @returns The next state, or `state` itself when nothing changed.
 */
function fold(state, event) {
  const type = event === undefined || event === null ? undefined : event.type
  const data = event === undefined || event === null ? undefined : event.data
  const time = event !== undefined && event !== null && typeof event.time === 'number' ? event.time : 0

  switch (type) {
    case 'turn/start': {
      const turn = intOf(data === undefined || data === null ? undefined : data.turn, state.turn + 1)
      return { ...state, turn, rows: appendRow(state.rows, { k: 'turn', turn, time }) }
    }

    case 'step/start':
      return { ...state, steps: state.steps + 1 }

    case 'user/message':
      return {
        ...state,
        rows: appendRow(state.rows, {
          k: 'user',
          turn: state.turn,
          time,
          text: messageText(data),
        }),
      }

    case 'assistant/message': {
      const message = data === undefined || data === null ? undefined : data.message
      const interrupted = data !== undefined && data !== null && data.interrupted === true
      return {
        ...state,
        rows: appendRow(state.rows, {
          k: 'assistant',
          turn: intOf(data === undefined || data === null ? undefined : data.turn, state.turn),
          step: intOf(data === undefined || data === null ? undefined : data.step, 0),
          time,
          text: messageText(message),
          ...(interrupted ? { interrupted: true } : {}),
        }),
      }
    }

    case 'tool/call': {
      const row = {
        k: 'tool',
        turn: intOf(data === undefined || data === null ? undefined : data.turn, state.turn),
        step: intOf(data === undefined || data === null ? undefined : data.step, 0),
        time,
        callId: strOf(data === undefined || data === null ? undefined : data.callId),
        name: strOf(data === undefined || data === null ? undefined : data.name),
        args: argumentPreview(data === undefined || data === null ? undefined : data.arguments),
      }
      return { ...state, tools: state.tools + 1, rows: appendRow(state.rows, row) }
    }

    case 'tool/result': {
      const message = data === undefined || data === null ? undefined : data.message
      const failed = Boolean(
        (message !== undefined && message !== null && message.isError === true) ||
          (data !== undefined && data !== null && data.error !== undefined && data.error !== null),
      )
      const callId = strOf(message === undefined || message === null ? undefined : message.toolCallId)
      const rows = markResult(state.rows, callId, failed, firstLine(messageText(message)))
      if (rows === state.rows) return state
      return { ...state, errors: failed ? state.errors + 1 : state.errors, rows }
    }

    case 'turn/end': {
      const reason = data === undefined || data === null ? undefined : data.reason
      const kind = reason === undefined || reason === null ? '' : strOf(reason.kind)
      if (kind !== 'error' && kind !== 'max-tokens') return state
      return { ...state, errors: state.errors + 1 }
    }

    default:
      return state
  }
}

/**
 * Project folded state into the value the browser receives.
 *
 * @param state Folded Session state.
 * @returns Plain JSON view.
 */
function viewOf(state) {
  let messages = 0
  for (const row of state.rows) {
    if (row.k === 'user' || row.k === 'assistant') messages += 1
  }
  return {
    createdAt: state.createdAt,
    cwd: state.cwd,
    turns: state.turn,
    steps: state.steps,
    tools: state.tools,
    errors: state.errors,
    messages,
    rows: state.rows,
    truncated: state.rows.length >= MAX_ROWS,
  }
}

/**
 * Append one row, dropping the oldest when the budget is reached.
 *
 * @param rows Current rows.
 * @param row Row to append.
 * @returns A new rows array.
 */
function appendRow(rows, row) {
  const next = rows.length >= MAX_ROWS ? rows.slice(rows.length - MAX_ROWS + 1) : rows.slice()
  next.push(row)
  return next
}

/**
 * Attach a settled result to the tool row that produced it.
 *
 * @param rows Current rows.
 * @param callId Tool call identity.
 * @param failed Whether the call failed.
 * @param result Result preview.
 * @returns New rows, or the same reference when no row matched.
 */
function markResult(rows, callId, failed, result) {
  if (callId === '') return rows
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index]
    if (row.k !== 'tool' || row.callId !== callId || row.status !== undefined) continue
    const next = rows.slice()
    next[index] = { ...row, status: failed ? 'error' : 'ok', result }
    return next
  }
  return rows
}

/**
 * Render one message's content blocks as normalized text.
 *
 * @param message Message or event payload carrying `content`.
 * @returns Clamped plain text.
 */
function messageText(message) {
  if (message === undefined || message === null) return ''
  if (typeof message === 'string') return clampText(message, MAX_TEXT)
  if (typeof message.content === 'string') return clampText(message.content, MAX_TEXT)
  const text = blocksToText(message.content)
  if (text !== '') return text
  return typeof message.text === 'string' ? clampText(message.text, MAX_TEXT) : ''
}

/**
 * Join text-bearing content blocks, keeping markers for non-text content.
 *
 * @param content Content block list.
 * @returns Clamped plain text.
 */
function blocksToText(content) {
  if (!Array.isArray(content)) return ''
  const parts = []
  for (const block of content) {
    if (block === undefined || block === null || typeof block !== 'object') continue
    if (block.type === 'text') {
      if (typeof block.text === 'string' && block.text !== '') parts.push(block.text)
      continue
    }
    if (block.type === 'image') {
      parts.push('[image]')
      continue
    }
    if (block.type === 'file') {
      const attachment = block.attachment
      const name = attachment !== undefined && attachment !== null && typeof attachment.name === 'string' ? attachment.name : ''
      parts.push(name === '' ? '[file]' : `[file] ${name}`)
    }
  }
  return clampText(parts.join('\n\n'), MAX_TEXT)
}

/**
 * Summarize recorded tool arguments on one line.
 *
 * @param raw Recorded JSON argument text.
 * @returns A short preview.
 */
function argumentPreview(raw) {
  const text = strOf(raw).trim()
  if (text === '') return ''
  let value = text
  try {
    const parsed = JSON.parse(text)
    if (parsed !== null && typeof parsed === 'object') value = JSON.stringify(parsed)
  } catch {
    // Keep the recorded text as it is.
  }
  const flat = value.replace(/\s+/g, ' ')
  return clampText(flat, MAX_ARGS)
}

/**
 * First non-empty line of a text.
 *
 * @param text Multi-line text.
 * @returns One clamped line.
 */
function firstLine(text) {
  const line = strOf(text).split('\n').find((entry) => entry.trim() !== '') ?? ''
  return clampText(line.trim(), MAX_RESULT)
}

/**
 * Clamp text to a character budget.
 *
 * @param text Source text.
 * @param limit Maximum length.
 * @returns Clamped text.
 */
function clampText(text, limit) {
  const value = strOf(text)
  return value.length > limit ? `${value.slice(0, limit)}…` : value
}

/**
 * Coerce a finite integer.
 *
 * @param value Candidate.
 * @param fallback Value used when the candidate is not a finite number.
 * @returns An integer.
 */
function intOf(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback
}

/**
 * Coerce a string.
 *
 * @param value Candidate.
 * @returns The string, or an empty string.
 */
function strOf(value) {
  return typeof value === 'string' ? value : ''
}

/**
 * Describe an error for a log line.
 *
 * @param error Thrown value.
 * @returns One-line description.
 */
function describe(error) {
  if (error instanceof Error) return error.message
  return typeof error === 'string' ? error : 'unknown error'
}

/**
 * Report a Host-side problem without failing activation.
 *
 * @param ctx Cordis context.
 * @param level Log level.
 * @param message Message text.
 */
function report(ctx, level, message) {
  try {
    const logger = typeof ctx.logger === 'function' ? ctx.logger('session-norms') : ctx.logger
    if (logger !== undefined && logger !== null && typeof logger[level] === 'function') {
      logger[level](message)
      return
    }
  } catch {
    // Fall back to the process console below.
  }
  try {
    const write = level === 'error' ? console.error : console.warn
    write(`[session-norms] ${message}`)
  } catch {
    // Logging must never fail the plugin.
  }
}
