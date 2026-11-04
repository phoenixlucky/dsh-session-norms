window.__ModuleLoader__.load({
  id: 'dsh-session-norms',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NAMESPACE = 'session-norms'
    const PROJECTION_KEY = 'sessionNorms'

    /** Visible text, registered with the Client locale service. */
    const DICTS = {
      en: {
        view: { label: 'Normative view' },
        title: 'Normalized transcript',
        subtitle: 'Every turn, message and tool call of this session in one consistent format.',
        empty: 'This session has no content yet.',
        waiting: 'Collecting this session…',
        emptyHint: 'Send a message and the transcript appears here.',
        waitHint: 'The summary follows the session log and refreshes as the turn runs.',
        unavailable: 'The transcript is unavailable.',
        unavailableHint: 'The Host projection did not deliver a value. Reload the page or check the plugin.',
        copy: 'Copy Markdown',
        copied: 'Copied',
        copyFailed: 'Copy failed',
        copyMd: 'Copy as Markdown',
        copyMdDone: 'Markdown copied',
        copyMdFailed: 'Copy failed',
        turnLabel: 'Turn {n}',
        roleUser: 'User',
        roleAssistant: 'Assistant',
        roleTool: 'Tool',
        statTurns: 'Turns',
        statMessages: 'Messages',
        statTools: 'Tool calls',
        statErrors: 'Errors',
        interrupted: 'Interrupted',
        ok: 'ok',
        failed: 'failed',
        pending: 'recorded',
        truncated: 'Showing the most recent part of this session only.',
        noArgs: 'No arguments recorded.',
        showMore: 'Show full text',
        showLess: 'Show less',
      },
      zh: {
        view: { label: '规范视图' },
        title: '会话规范化视图',
        subtitle: '把这一会话的每一轮、每条消息和每次工具调用整理成统一格式。',
        empty: '当前会话还没有内容。',
        waiting: '正在汇总当前会话…',
        emptyHint: '发送一条消息后，规范化内容会显示在这里。',
        waitHint: '汇总跟随会话日志，并随回合推进自动刷新。',
        unavailable: '暂时无法读取会话汇总。',
        unavailableHint: '宿主侧投影没有提供数据，请刷新页面或检查插件状态。',
        copy: '复制 Markdown',
        copied: '已复制',
        copyFailed: '复制失败',
        copyMd: '复制为 Markdown',
        copyMdDone: '已复制 Markdown',
        copyMdFailed: '复制失败',
        turnLabel: '第 {n} 轮',
        roleUser: '用户',
        roleAssistant: '助手',
        roleTool: '工具',
        statTurns: '轮次',
        statMessages: '消息',
        statTools: '工具调用',
        statErrors: '错误',
        interrupted: '已中断',
        ok: '成功',
        failed: '失败',
        pending: '已记录',
        truncated: '仅显示本会话最近的内容。',
        noArgs: '没有记录到参数。',
        showMore: '展开全文',
        showLess: '收起',
      },
    }

    const CSS = `
.sn-root{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.65}
.sn-head{flex:0 0 auto;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;padding:16px 24px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.sn-titles{display:flex;flex-direction:column;gap:3px;min-width:0}
.sn-title{margin:0;font-size:15px;font-weight:600;letter-spacing:.01em}
.sn-subtitle{margin:0;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.sn-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sn-stat{display:inline-flex;align-items:baseline;gap:5px;padding:3px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-1);font-size:11px;color:var(--dsw-alias-label-secondary)}
.sn-stat b{font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}
.sn-btn{appearance:none;font:inherit;font-size:12px;padding:5px 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);cursor:pointer;transition:background .12s ease}
.sn-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.sn-btn:disabled{opacity:.5;cursor:default}
.sn-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.sn-body{flex:1 1 auto;min-height:0;overflow-y:auto;padding:4px 24px 48px}
.sn-turn{display:flex;align-items:center;gap:12px;margin:24px 0 6px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.sn-turn::after{content:"";flex:1 1 auto;height:1px;background:var(--dsw-alias-border-l1)}
.sn-row{display:grid;grid-template-columns:96px minmax(0,1fr);gap:16px;padding:12px 0;border-top:1px solid var(--dsw-alias-border-l1)}
.sn-side{display:flex;flex-direction:column;gap:4px;min-width:0}
.sn-role{align-self:flex-start;padding:1px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.sn-role-user{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.sn-role-tool{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.sn-clock{font-size:11px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.sn-content{min-width:0;display:flex;flex-direction:column;gap:8px}
.sn-text{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
.sn-clamped{max-height:9.5em;overflow:hidden}
.sn-toggle{align-self:flex-start;appearance:none;font:inherit;font-size:11px;padding:2px 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-link);cursor:pointer}
.sn-toggle:hover{background:var(--dsw-alias-bg-layer-2)}
.sn-toggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.sn-code{margin:0;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;max-height:132px;overflow:hidden;color:var(--dsw-alias-label-secondary)}
.sn-toolhead{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sn-name{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;font-weight:600}
.sn-badge{font-size:11px;padding:0 7px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary)}
.sn-badge-ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}
.sn-badge-error{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}
.sn-badge-warn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}
.sn-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:64px 24px;text-align:center}
.sn-empty-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.sn-empty-text{margin:0;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.sn-note{margin:10px 0 0;font-size:11px;color:var(--dsw-alias-label-tertiary)}
@media (max-width:720px){.sn-head{padding:12px 16px}.sn-body{padding:4px 16px 40px}.sn-row{grid-template-columns:1fr;gap:6px}.sn-side{flex-direction:row;align-items:center;gap:8px}}
`

    /**
     * Typography of the Chat view's rendered Markdown, plus the in-chat
     * Markdown-copy affordance.
     *
     * The built-in renderer owns the DOM, so this layer only restates spacing,
     * scale and table layout. The product stylesheet gives table cells a
     * `min(30vw, 320px)` maximum and the table `max-content` width, so a wide
     * four-column answer grows past the reading column and the whole transcript
     * gains a horizontal scrollbar. Here the table fills the column instead,
     * cells may shrink and wrap, and only a genuinely wide table scrolls inside
     * its own wrapper. Colours are left to the product rules, so light and dark
     * keep following the theme; only `li::marker` is dimmed to the tertiary
     * label colour and table headers get the layer-1 surface.
     *
     * `[class*="_markdown_"]` targets the CSS-module class of the Markdown root;
     * the trailing `[class]` keeps the override above the product rules that use
     * `:not()` or child combinators, and `html body` adds the remaining weight.
     */
    const TYPOGRAPHY_CSS = `
html body [class*="_markdown_"][class]{font-size:14px;line-height:1.72;min-width:0;max-width:100%}
html body [class*="_markdown_"][class] p{margin:.55em 0}
html body [class*="_markdown_"][class] p:first-child{margin-top:0}
html body [class*="_markdown_"][class] p:last-child{margin-bottom:0}
html body [class*="_markdown_"][class] h1,
html body [class*="_markdown_"][class] h2,
html body [class*="_markdown_"][class] h3,
html body [class*="_markdown_"][class] h4,
html body [class*="_markdown_"][class] h5,
html body [class*="_markdown_"][class] h6{margin:1.25em 0 .5em;line-height:1.35;font-weight:600;letter-spacing:0}
html body [class*="_markdown_"][class] h1{font-size:1.42em}
html body [class*="_markdown_"][class] h2{font-size:1.22em}
html body [class*="_markdown_"][class] h3{font-size:1.1em}
html body [class*="_markdown_"][class] h4{font-size:1em}
html body [class*="_markdown_"][class] h5,
html body [class*="_markdown_"][class] h6{font-size:.95em}
html body [class*="_markdown_"][class] ul,
html body [class*="_markdown_"][class] ol{margin:.55em 0;padding-left:1.35em}
html body [class*="_markdown_"][class] li{margin-top:.22em}
html body [class*="_markdown_"][class] li>p{margin:.15em 0}
html body [class*="_markdown_"][class] li::marker{color:var(--dsw-alias-label-tertiary)}
html body [class*="_markdown_"][class] li>ul,
html body [class*="_markdown_"][class] li>ol{margin:.2em 0}
html body [class*="_markdown_"][class] blockquote{margin:.7em 0;padding-left:.9em;border-left:2px solid var(--dsw-alias-label-caption);color:var(--dsw-alias-label-secondary)}
html body [class*="_markdown_"][class] hr{margin:1.5em 0}
html body [class*="_markdown_"][class] pre{margin:.35em 0}
html body [class*="_markdown_"][class] :where([class*="_tableScroll_"]){width:100%;container-type:inline-size;min-width:0;max-width:100%;overflow-x:auto;overscroll-behavior-x:contain}
html body [class*="_markdown_"][class] :where([class*="_tableScroll_"][class*="md-table-wide"]){overflow-x:auto;padding-bottom:0}
html body [class*="_markdown_"][class] table{width:max-content;max-width:100%;table-layout:auto;border-collapse:collapse;margin:.8em 0;font-size:.94em}
html body [class*="_markdown_"][class] thead th{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-weight:600;border-bottom:1px solid var(--dsw-alias-border-l2)}
html body [class*="_markdown_"][class] :where(th,td){min-width:7.5em;max-width:none;padding:8px 12px;text-align:start;vertical-align:top;border-bottom:.5px solid var(--dsw-alias-border-l1);overflow-wrap:anywhere}
html body [class*="_markdown_"][class] tbody tr:nth-child(even){background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 60%,transparent)}
html body [class*="_markdown_"][class] tbody tr:last-child :where(td){border-bottom:none}
html body [class*="_markdown_"][class] :where(th,td):first-child{padding-left:12px}
html body [class*="_markdown_"][class] :where(th,td):last-child{padding-right:12px}
@media (max-width:720px){
html body [class*="_markdown_"][class] table{font-size:.9em}
html body [class*="_markdown_"][class] :where(th,td){min-width:6em;padding:6px 9px}
}
/*
 * A two-column table is a definition list: it always takes the reading width
 * so it lines up with the composer. Three or more columns cannot be squeezed
 * into a narrow column without becoming unreadable, so below 600px they become
 * labeled cards instead.
 */
html body [class*="_markdown_"][class] table[data-sn-cols="1"],
html body [class*="_markdown_"][class] table[data-sn-cols="2"]{width:100%}
@container (max-width:600px){
html body [class*="_markdown_"][class] table[data-sn-cards="ready"]{display:block;width:100%;max-width:100%;border-collapse:separate;border-spacing:0;margin:.7em 0;font-size:.95em}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] thead{display:none}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody{display:block}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody tr{display:block;margin:0 0 8px;padding:8px 12px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1)}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody tr:last-child{margin-bottom:0}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody td,
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody td:first-child,
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody td:last-child{display:grid;grid-template-columns:5.2em minmax(0,1fr);gap:10px;min-width:0;max-width:none;padding:3px 0;border:0;text-align:start;vertical-align:top}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody td::before{content:attr(data-sn-label);color:var(--dsw-alias-label-tertiary);font-weight:600;font-size:.9em;line-height:1.75;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody td:not([data-sn-label]){display:block;padding-left:0}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody td:not([data-sn-label])::before{content:none}
}
/* Copy-as-Markdown action, sized like the built-in icon actions beside it. */
.sn-md-copy{box-sizing:border-box;flex:none;display:inline-flex;align-items:center;justify-content:center;width:calc(28px + var(--dsh-content-font-delta,0px));height:calc(28px + var(--dsh-content-font-delta,0px));padding:6px;border:0;border-radius:var(--dsw-radius-sm);background:0 0;color:var(--dsw-alias-label-tertiary);cursor:pointer;transition:background .12s ease,color .12s ease}
.sn-md-copy svg{width:calc(16px + var(--dsh-content-font-delta,0px));height:calc(16px + var(--dsh-content-font-delta,0px))}
@media (hover:hover){.sn-md-copy:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}}
.sn-md-copy:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.sn-md-copy[data-state=done]{color:var(--dsw-alias-state-success-primary)}
.sn-md-copy[data-state=failed]{color:var(--dsw-alias-state-error-primary)}
`

    let lang = 'en'
    let boundTranslate = null
    const langListeners = new Set()
    /** Longest message rendered without a disclosure. */
    const LONG_TEXT = 700

    /**
     * Switch the active dictionary language.
     *
     * @param next Locale id.
     */
    function setLang(next) {
      const value = next === 'zh' ? 'zh' : 'en'
      if (value === lang) return
      lang = value
      for (const listener of Array.from(langListeners)) {
        try {
          listener()
        } catch {
          // A failing listener must not break the registry.
        }
      }
    }

    /**
     * Read the active language of the locale service.
     *
     * @param ctx Client context.
     * @returns `zh` or `en`.
     */
    function readLang(ctx) {
      try {
        const snapshot = ctx.locale.getLocale()
        const active = snapshot === undefined || snapshot === null ? '' : String(snapshot.active ?? '')
        return active.toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en'
      } catch {
        return 'en'
      }
    }

    /**
     * Subscribe to dictionary changes.
     *
     * @param listener Change callback.
     * @returns Unsubscribe.
     */
    function subscribeLang(listener) {
      langListeners.add(listener)
      return () => {
        langListeners.delete(listener)
      }
    }

    /**
     * Resolve one dotted key in a dictionary.
     *
     * @param dict Dictionary root.
     * @param key Dotted key.
     * @returns The string, or `undefined`.
     */
    function lookup(dict, key) {
      const root = dict === undefined || dict === null ? undefined : dict
      if (root === undefined) return undefined
      let current = root
      for (const part of key.split('.')) {
        if (current === null || typeof current !== 'object') return undefined
        current = current[part]
      }
      return typeof current === 'string' ? current : undefined
    }

    /**
     * Translate one key through the active dictionary.
     *
     * @param key Dotted key.
     * @returns Visible text.
     */
    function translate(key) {
      if (boundTranslate !== null) {
        try {
          const value = boundTranslate(key)
          if (typeof value === 'string' && value !== '' && value !== key) return value
        } catch {
          // Fall back to the packaged dictionaries below.
        }
      }
      return lookup(DICTS[lang], key) ?? lookup(DICTS.en, key) ?? key
    }

    /**
     * Read the active language reactively and return the translator.
     *
     * @returns The translate function.
     */
    function useT() {
      if (typeof React.useSyncExternalStore === 'function') {
        React.useSyncExternalStore(subscribeLang, () => lang, () => lang)
      } else {
        const [, force] = React.useState(0)
        React.useEffect(() => subscribeLang(() => force((count) => count + 1)), [])
      }
      return translate
    }

    /**
     * Read the Host-published transcript for the bound Session.
     *
     * @param props Slot props.
     * @returns The projection value, or `undefined`.
     */
    function readProjection(props) {
      const useProjection = props === undefined || props === null ? undefined : props.useProjection
      if (typeof useProjection !== 'function') return undefined
      return useProjection(PROJECTION_KEY)
    }

    /**
     * Normalize the projection value into the shape the view renders.
     *
     * @param value Projection value.
     * @returns Data, or `null` when nothing arrived yet.
     */
    function normalize(value) {
      if (value === undefined || value === null || typeof value !== 'object') return null
      const rows = Array.isArray(value.rows) ? value.rows.filter(isRow) : []
      return {
        createdAt: countOf(value.createdAt),
        turns: countOf(value.turns),
        steps: countOf(value.steps),
        tools: countOf(value.tools),
        errors: countOf(value.errors),
        messages: countOf(value.messages),
        rows,
        truncated: value.truncated === true,
      }
    }

    /**
     * Whether one projected row is renderable.
     *
     * @param row Candidate row.
     * @returns True for a known row kind.
     */
    function isRow(row) {
      if (row === undefined || row === null || typeof row !== 'object') return false
      return row.k === 'turn' || row.k === 'user' || row.k === 'assistant' || row.k === 'tool'
    }

    /**
     * Coerce a finite non-negative integer.
     *
     * @param value Candidate.
     * @returns The number, or 0.
     */
    function countOf(value) {
      return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
    }

    /**
     * Format a recorded timestamp as a clock reading.
     *
     * @param time Milliseconds since the epoch.
     * @returns `HH:MM:SS`, or an empty string.
     */
    function clock(time) {
      if (typeof time !== 'number' || !Number.isFinite(time) || time <= 0) return ''
      const date = new Date(time)
      if (Number.isNaN(date.getTime())) return ''
      const pad = (n) => String(n).padStart(2, '0')
      return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }

    /**
     * Text excerpt used by the Markdown export.
     *
     * @param time Milliseconds since the epoch.
     * @returns A leading separator plus the clock reading, or an empty string.
     */
    function stamp(time) {
      const value = clock(time)
      return value === '' ? '' : ` · ${value}`
    }

    /**
     * Render the clipboard write.
     *
     * @param text Markdown source.
     * @returns Whether the write succeeded.
     */
    function writeClipboard(text) {
      const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard
      if (clipboard === undefined || clipboard === null || typeof clipboard.writeText !== 'function') {
        return Promise.resolve(false)
      }
      return clipboard.writeText(text).then(
        () => true,
        () => false,
      )
    }

    /**
     * Join the text blocks of one assistant step as Markdown source.
     *
     * Text blocks are exactly what the model wrote, so tables, lists, code
     * fences and quotes survive the round trip; reasoning and tool calls are
     * presentation sides of the turn and are not part of the answer.
     *
     * @param blocks Assistant content blocks.
     * @returns Trimmed Markdown, or an empty string.
     */
    function blocksToMarkdown(blocks) {
      if (!Array.isArray(blocks)) return ''
      const parts = []
      for (const block of blocks) {
        if (block === undefined || block === null || typeof block !== 'object') continue
        const kind = typeof block.kind === 'string' ? block.kind : block.type
        if (kind !== 'text' || typeof block.text !== 'string') continue
        const text = block.text.trim()
        if (text !== '') parts.push(text)
      }
      return parts.join('\n\n')
    }

    /**
     * Markdown source of the settled assistant reply carrying `messageId`.
     *
     * @param snapshot Chat snapshot read through the `useChat` standard prop.
     * @param messageId Message identity handed to the action slot.
     * @returns Markdown, or an empty string when the message is not loaded.
     */
    function markdownOfMessage(snapshot, messageId) {
      if (messageId === '' || snapshot === undefined || snapshot === null) return ''
      const nodes = snapshot.nodes
      if (nodes === undefined || nodes === null || typeof nodes.values !== 'function') return ''
      for (const node of nodes.values()) {
        if (node === undefined || node === null || node.kind !== 'assistant-step') continue
        const data = node.data
        if (data === undefined || data === null) continue
        const finalNode = data.finalNode
        const id =
          finalNode !== undefined && finalNode !== null && typeof finalNode.messageId === 'string'
            ? finalNode.messageId
            : ''
        if (id !== messageId) continue
        const blocks = finalNode !== undefined && finalNode !== null && Array.isArray(finalNode.blocks)
          ? finalNode.blocks
          : data.blocks
        return blocksToMarkdown(blocks)
      }
      return ''
    }

    /**
     * Copy-as-Markdown icon.
     *
     * @returns A React element.
     */
    function markdownIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' },
        [
          h('path', {
            key: 'letter',
            d: 'M2.2 11.8V4.2l2.6 3.1 2.6-3.1v7.6',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.35,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }),
          h('path', {
            key: 'arrow',
            d: 'M12.3 4.2v7.6m0 0L10.2 9.7m2.1 2.1 2.1-2.1',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.35,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }),
        ],
      )
    }

    /**
     * Success icon shown briefly after the Markdown lands on the clipboard.
     *
     * @returns A React element.
     */
    function checkIcon() {
      return h('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' }, [
        h('path', {
          key: 'check',
          d: 'M3.4 8.3l3 3 6.2-6.4',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      ])
    }

    /**
     * Slot entry in the settled assistant action row: copy the reply as Markdown.
     *
     * The `useChat` standard prop resolves the message body from the loaded
     * transcript, so the clipboard receives the original source rather than the
     * rendered text. Only settled answers carry a `messageId`, which is why the
     * action disappears for interrupted or still-streaming output.
     *
     * @param props Slot props.
     * @returns A React element, or `null` when there is nothing to copy.
     */
    function CopyMarkdownAction(props) {
      const t = useT()
      const messageId = props !== undefined && typeof props.messageId === 'string' ? props.messageId : ''
      const useChat = props !== undefined && typeof props.useChat === 'function' ? props.useChat : null
      const markdown =
        useChat === null ? '' : useChat((snapshot) => markdownOfMessage(snapshot, messageId))
      const [state, setState] = React.useState('idle')

      React.useEffect(() => {
        if (state === 'idle') return undefined
        const timer = setTimeout(() => setState('idle'), 1800)
        return () => clearTimeout(timer)
      }, [state])

      if (typeof markdown !== 'string' || markdown.trim() === '') return null

      const label =
        state === 'done' ? t('copyMdDone') : state === 'failed' ? t('copyMdFailed') : t('copyMd')
      const onCopy = () => {
        writeClipboard(markdown).then(
          (ok) => setState(ok ? 'done' : 'failed'),
          () => setState('failed'),
        )
      }

      return h(
        'button',
        {
          type: 'button',
          className: 'sn-md-copy',
          'data-state': state === 'idle' ? undefined : state,
          'data-session-norms': 'copy-markdown',
          title: label,
          'aria-label': label,
          onClick: onCopy,
        },
        state === 'done' ? checkIcon() : markdownIcon(),
      )
    }

    /**
     * Describe a caught render error.
     *
     * @param error Thrown value.
     * @returns One-line description.
     */
    function describeError(error) {
      if (error instanceof Error) return error.message
      return typeof error === 'string' ? error : 'unknown error'
    }

    /**
     * Build the Markdown mirror of the normalized transcript.
     *
     * @param data Normalized data.
     * @param t Translator.
     * @returns Markdown document.
     */
    function toMarkdown(data, t) {
      const lines = [`# ${t('title')}`, '']
      lines.push(`- ${t('statTurns')}: ${data.turns}`)
      lines.push(`- ${t('statMessages')}: ${data.messages}`)
      lines.push(`- ${t('statTools')}: ${data.tools}`)
      lines.push(`- ${t('statErrors')}: ${data.errors}`)
      lines.push('')
      for (const row of data.rows) {
        if (row.k === 'turn') {
          lines.push('', `## ${t('turnLabel').replace('{n}', String(row.turn))}`, '')
          continue
        }
        if (row.k === 'user' || row.k === 'assistant') {
          const label = row.k === 'user' ? t('roleUser') : t('roleAssistant')
          const extra = row.k === 'assistant' && row.interrupted === true ? ` · ${t('interrupted')}` : ''
          lines.push(`**${label}**${stamp(row.time)}${extra}`, '')
          const text = row.text === undefined || row.text === '' ? '' : row.text
          if (text !== '') lines.push(text, '')
          continue
        }
        if (row.k === 'tool') {
          const status = row.status === 'error' ? t('failed') : row.status === 'ok' ? t('ok') : t('pending')
          lines.push(`**${t('roleTool')}** \`${row.name === '' ? '?' : row.name}\`${stamp(row.time)} · ${status}`, '')
          if (typeof row.args === 'string' && row.args !== '') lines.push('```json', row.args, '```', '')
          if (typeof row.result === 'string' && row.result !== '') lines.push(`> ${row.result}`, '')
        }
      }
      return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`
    }

    /**
     * One stat pill.
     *
     * @param key React key.
     * @param label Visible label.
     * @param value Count, or a placeholder.
     * @returns A React element.
     */
    function statPill(key, label, value) {
      return h('span', { key, className: 'sn-stat' }, [
        h('span', { key: 'label' }, label),
        h('b', { key: 'value' }, String(value)),
      ])
    }

    /**
     * Turn separator row.
     *
     * @param row Turn row.
     * @param t Translator.
     * @param index React key.
     * @returns A React element.
     */
    function turnRow(row, t, index) {
      return h('div', { key: `turn-${index}`, className: 'sn-turn' }, t('turnLabel').replace('{n}', String(row.turn)))
    }

    /**
     * Side rail with the role chip and the clock reading.
     *
     * @param role Visible role label.
     * @param roleClass Extra role class.
     * @param time Recorded time.
     * @returns A React element.
     */
    function sideRail(role, roleClass, time) {
      const value = clock(time)
      return h('div', { key: 'side', className: 'sn-side' }, [
        h('span', { key: 'role', className: `sn-role ${roleClass}` }, role),
        value === '' ? null : h('span', { key: 'clock', className: 'sn-clock' }, value),
      ])
    }

    /**
     * Message text with a disclosure for very long injected content.
     *
     * @param props Text and the translator.
     * @returns A React element.
     */
    function MessageText(props) {
      const t = props.t
      const text = props.text
      const [open, setOpen] = React.useState(false)
      if (text.length <= LONG_TEXT) return h('p', { className: 'sn-text' }, text)
      return h('div', { className: 'sn-content' }, [
        h('p', { key: 'text', className: open ? 'sn-text' : 'sn-text sn-clamped' }, text),
        h(
          'button',
          {
            key: 'toggle',
            type: 'button',
            className: 'sn-toggle',
            onClick: () => setOpen(!open),
            'aria-expanded': open,
          },
          open ? t('showLess') : t('showMore'),
        ),
      ])
    }

    /**
     * Message row (user or assistant).
     *
     * @param row Message row.
     * @param t Translator.
     * @param index React key.
     * @returns A React element.
     */
    function messageRow(row, t, index) {
      const isUser = row.k === 'user'
      const label = isUser ? t('roleUser') : t('roleAssistant')
      const content = [
        h(MessageText, { key: 'text', t, text: row.text === '' ? '—' : row.text }),
      ]
      if (!isUser && row.interrupted === true) {
        content.push(h('div', { key: 'badge', className: 'sn-toolhead' }, [
          h('span', { key: 'chip', className: 'sn-badge sn-badge-warn' }, t('interrupted')),
        ]))
      }
      return h('div', { key: `row-${index}`, className: 'sn-row' }, [
        sideRail(label, isUser ? 'sn-role-user' : '', row.time),
        h('div', { key: 'content', className: 'sn-content' }, content),
      ])
    }

    /**
     * Tool call row with its recorded arguments and settled status.
     *
     * @param row Tool row.
     * @param t Translator.
     * @param index React key.
     * @returns A React element.
     */
    function toolRow(row, t, index) {
      const status = row.status === 'error' ? 'sn-badge-error' : row.status === 'ok' ? 'sn-badge-ok' : ''
      const statusText = row.status === 'error' ? t('failed') : row.status === 'ok' ? t('ok') : t('pending')
      const head = h('div', { key: 'head', className: 'sn-toolhead' }, [
        h('span', { key: 'name', className: 'sn-name' }, row.name === '' ? '?' : row.name),
        h('span', { key: 'status', className: `sn-badge ${status}` }, statusText),
      ])
      const content = [head]
      if (row.args !== '') {
        content.push(h('pre', { key: 'args', className: 'sn-code' }, row.args))
      }
      if (typeof row.result === 'string' && row.result !== '') {
        content.push(h('pre', { key: 'result', className: 'sn-code' }, row.result))
      }
      return h('div', { key: `row-${index}`, className: 'sn-row' }, [
        sideRail(t('roleTool'), 'sn-role-tool', row.time),
        h('div', { key: 'content', className: 'sn-content' }, content),
      ])
    }

    /**
     * Empty, loading, or unavailable state.
     *
     * @param props Title, text, and the translator.
     * @returns A React element.
     */
    function emptyState(props) {
      return h('div', { className: 'sn-empty' }, [
        h('div', { key: 'title', className: 'sn-empty-title' }, props.title),
        props.text === '' ? null : h('p', { key: 'text', className: 'sn-empty-text' }, props.text),
      ])
    }

    /**
     * Fallback rendered when the transcript cannot be read at all.
     *
     * @param props Error message.
     * @returns A React element.
     */
    function BrokenView(props) {
      const t = useT()
      return h('div', { className: 'sn-root' }, [
        h('style', { key: 'css' }, CSS),
        emptyState({ title: t('unavailable'), text: t('unavailableHint') }),
        h('p', { key: 'detail', className: 'sn-note' }, props.message),
      ])
    }

    /** Error boundary that keeps one bad render inside this view. */
    class Guard extends React.Component {
      constructor(props) {
        super(props)
        this.state = { message: '' }
      }

      static getDerivedStateFromError(error) {
        return { message: describeError(error) }
      }

      render() {
        if (this.state.message !== '') return h(BrokenView, { message: this.state.message })
        return this.props.children
      }
    }

    /**
     * The normalized transcript view body.
     *
     * @param props Slot props.
     * @returns A React element.
     */
    function Transcript(props) {
      const t = useT()
      const data = normalize(readProjection(props))
      const [notice, setNotice] = React.useState('')

      React.useEffect(() => {
        if (notice === '') return undefined
        const timer = setTimeout(() => setNotice(''), 1800)
        return () => clearTimeout(timer)
      }, [notice])

      const rows = data === null ? [] : data.rows
      const canCopy = data !== null && rows.length > 0
      const onCopy = React.useCallback(() => {
        if (data === null) return
        writeClipboard(toMarkdown(data, t)).then(
          (ok) => setNotice(ok ? t('copied') : t('copyFailed')),
          () => setNotice(t('copyFailed')),
        )
      }, [data, t])

      const head = h('header', { key: 'head', className: 'sn-head' }, [
        h('div', { key: 'titles', className: 'sn-titles' }, [
          h('h2', { key: 'title', className: 'sn-title' }, t('title')),
          h('p', { key: 'subtitle', className: 'sn-subtitle' }, t('subtitle')),
        ]),
        h('div', { key: 'tools', className: 'sn-tools' }, [
          statPill('turns', t('statTurns'), data === null ? '—' : data.turns),
          statPill('messages', t('statMessages'), data === null ? '—' : data.messages),
          statPill('tools', t('statTools'), data === null ? '—' : data.tools),
          statPill('errors', t('statErrors'), data === null ? '—' : data.errors),
          h(
            'button',
            {
              key: 'copy',
              type: 'button',
              className: 'sn-btn',
              onClick: onCopy,
              disabled: !canCopy,
              'aria-label': t('copy'),
            },
            notice === '' ? t('copy') : notice,
          ),
        ]),
      ])

      let body
      if (data === null) {
        body = h('div', { key: 'body', className: 'sn-body' }, emptyState({ title: t('waiting'), text: t('waitHint') }))
      } else if (rows.length === 0) {
        body = h('div', { key: 'body', className: 'sn-body' }, emptyState({ title: t('empty'), text: t('emptyHint') }))
      } else {
        const children = []
        for (let index = 0; index < rows.length; index += 1) {
          const row = rows[index]
          if (row.k === 'turn') children.push(turnRow(row, t, index))
          else if (row.k === 'user' || row.k === 'assistant') children.push(messageRow(row, t, index))
          else if (row.k === 'tool') children.push(toolRow(row, t, index))
        }
        if (data.truncated) {
          children.push(h('p', { key: 'truncated', className: 'sn-note' }, t('truncated')))
        }
        body = h('div', { key: 'body', className: 'sn-body' }, children)
      }

      return h('div', { className: 'sn-root', role: 'region', 'aria-label': t('title') }, [
        h('style', { key: 'css' }, CSS),
        head,
        body,
      ])
    }

    /**
     * Slot entry for `conversation.view`.
     *
     * @param props Slot props.
     * @returns A React element.
     */
    function NormsView(props) {
      return h(Guard, null, h(Transcript, props))
    }

    /**
     * Copy each table header onto its cells and record the column count.
     *
     * The card layout used in narrow reading columns needs a visible label per
     * value, but the Markdown renderer owns the table DOM and only emits a
     * header row. This observes the transcript and adds attributes only; it
     * never moves, replaces or re-renders product nodes, and re-running it is
     * idempotent. Two-column tables keep their header and simply take the
     * reading width, so cards are only marked for three or more columns.
     */
    function useTableLabels() {
      React.useEffect(() => {
        if (typeof document === 'undefined' || typeof MutationObserver !== 'function') return undefined
        let timer = 0
        const label = (table) => {
          const heads = table.querySelectorAll('thead th')
          if (heads.length === 0) return
          const columns = String(heads.length)
          if (table.getAttribute('data-sn-cols') !== columns) table.setAttribute('data-sn-cols', columns)
          let labelled = 0
          for (const row of table.querySelectorAll('tbody tr')) {
            const cells = row.children
            for (let index = 0; index < cells.length; index += 1) {
              const head = heads[index]
              const text =
                head === undefined || head.textContent === null
                  ? ''
                  : head.textContent.replace(/\s+/g, ' ').trim().slice(0, 24)
              const cell = cells[index]
              if (text === '') {
                if (cell.hasAttribute('data-sn-label')) cell.removeAttribute('data-sn-label')
                continue
              }
              labelled += 1
              if (cell.getAttribute('data-sn-label') !== text) cell.setAttribute('data-sn-label', text)
            }
          }
          if (labelled > 0 && heads.length >= 3) {
            if (table.getAttribute('data-sn-cards') !== 'ready') table.setAttribute('data-sn-cards', 'ready')
          } else if (table.hasAttribute('data-sn-cards')) {
            table.removeAttribute('data-sn-cards')
          }
        }
        const scan = () => {
          timer = 0
          for (const table of document.querySelectorAll('[class*="_markdown_"] table')) label(table)
        }
        const schedule = () => {
          if (timer !== 0) return
          timer = setTimeout(scan, 60)
        }
        scan()
        const observer = new MutationObserver(schedule)
        observer.observe(document.body, { childList: true, subtree: true })
        return () => {
          observer.disconnect()
          if (timer !== 0) clearTimeout(timer)
        }
      }, [])
    }

    /**
     * Mount the typography sheet and label tables for the narrow card layout.
     * A `<style>` element renders no box, so the host slot keeps its layout;
     * the rules are global by design and scoped by the Markdown root's own
     * class.
     *
     * @returns A React element.
     */
    function TypographyStyle() {
      useTableLabels()
      return h('style', { 'data-session-norms': 'typography' }, TYPOGRAPHY_CSS)
    }

    /**
     * Host slots that stay mounted while any Session view is on screen. The
     * header utilities list is the primary anchor; the composer dock is the
     * fallback for embedded layouts that hide the header.
     */
    const STYLE_ANCHORS = ['conversation.session.header.utilities', 'conversation.composer.dock']

    /** Settled assistant action row owned by the Chat view. */
    const CHAT_ACTIONS_SLOT = 'conversation.chat.assistant-actions'

    /**
     * Register the typography sheet in the first anchor the Client accepts.
     *
     * @param ctx Client context.
     */
    function installTypography(ctx) {
      for (const name of STYLE_ANCHORS) {
        try {
          ctx.slots.inject(name, () => {
            try {
              ctx.slots.register({ name, id: 'norms-typography', order: 60 }, TypographyStyle)
            } catch {
              // A rejected declaration leaves the conversation as it was.
            }
          })
          return
        } catch {
          // Try the next anchor; a missing slot must not fail activation.
        }
      }
    }

    /**
     * Add the Markdown-copy button to the settled assistant action row.
     *
     * The Chat view renders that row itself (next to its own copy and branch
     * buttons), so a rejected registration leaves the row untouched instead of
     * failing activation on a Client that does not declare the list.
     *
     * @param ctx Client context.
     */
    function installChatActions(ctx) {
      try {
        ctx.slots.inject(CHAT_ACTIONS_SLOT, () => {
          try {
            ctx.slots.register(
              { name: CHAT_ACTIONS_SLOT, id: 'norms-copy', order: 20, locale: NAMESPACE },
              CopyMarkdownAction,
            )
          } catch {
            // A rejected declaration leaves the built-in actions unchanged.
          }
        })
      } catch {
        // The Client does not declare the assistant action list.
      }
    }

    /**
     * Register dictionaries, follow the locale, and add the view entry.
     *
     * @param ctx Client context.
     */
    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NAMESPACE, { en: DICTS.en, zh: DICTS.zh }), 'session-norms: dictionaries')
      try {
        boundTranslate = ctx.locale.bind(NAMESPACE)
      } catch {
        boundTranslate = null
      }
      setLang(readLang(ctx))
      ctx.effect(() => ctx.locale.subscribe(() => setLang(readLang(ctx))), 'session-norms: locale')

      ctx.slots.inject('conversation.view', () =>
        ctx.slots.register(
          {
            name: 'conversation.view',
            id: 'norms',
            order: 40,
            locale: NAMESPACE,
            label: () => translate('view.label'),
          },
          NormsView,
        ),
      )

      installTypography(ctx)
      installChatActions(ctx)
    }

    return { name: NAMESPACE, inject: ['slots', 'locale'], apply }
  },
})
