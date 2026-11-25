window.__ModuleLoader__.load({
  id: '@tinyforge/dsh-session-norms',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NAMESPACE = 'session-norms'
    const PROJECTION_KEY = 'sessionNorms'

    /** Visible text, registered with the Client locale service. */
    const DICTS = {
      en: {
        view: { label: 'Session norms' },
        title: 'Session norms',
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
        noText: '(no text)',
        stalled: 'The transcript is not arriving.',
        stalledHint: 'The Host registered this projection but has published nothing yet. Reload the page; if it stays empty, check the plugin.',
        showMore: 'Show full text',
        showLess: 'Show less',
      },
      zh: {
        view: { label: '会话规范' },
        title: '会话规范',
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
        noText: '（无正文）',
        stalled: '会话汇总没有到达。',
        stalledHint: '宿主已注册该投影，却一直没有发布数据。可刷新页面；若仍为空，检查插件状态。',
        showMore: '展开全文',
        showLess: '收起',
      },
    }

    const CSS = `
/*
 * One reading edge. The role rail is a margin note, so the title block, the
 * turn label and every message line up on the content edge; the rail itself
 * stays outdented. Two left edges made the eye jump a hundred pixels per row.
 */
.sn-root{--sn-gutter:96px;--sn-gap:16px;--sn-edge:calc(var(--sn-gutter) + var(--sn-gap));display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.65}
.sn-head{flex:0 0 auto;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;padding:16px 24px 12px var(--sn-edge);border-bottom:1px solid var(--dsw-alias-border-l1)}
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
.sn-turn{display:flex;align-items:center;gap:12px;margin:24px 0 6px;padding-inline-start:var(--sn-edge);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.sn-turn::after{content:"";flex:1 1 auto;height:1px;background:var(--dsw-alias-border-l1)}
.sn-row{display:grid;grid-template-columns:var(--sn-gutter) minmax(0,1fr);gap:var(--sn-gap);padding:12px 0;border-top:1px solid var(--dsw-alias-border-l1)}
.sn-side{display:flex;flex-direction:column;gap:4px;min-width:0}
.sn-role{align-self:flex-start;padding:1px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.sn-role-user{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.sn-role-tool{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.sn-clock{font-size:11px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.sn-content{min-width:0;display:flex;flex-direction:column;gap:8px}
.sn-text{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
/*
 * A collapsed message is capped on whole lines and fades out at the bottom, so
 * the reader sees "there is more" instead of a slice through a line. The cap is
 * six lines at the root's 1.65 line-height (6 × 1.65 = 9.9em, 128.7px).
 *
 * The fade is a mask, not an overlay: an overlay would have to know the row's
 * background, and the theme changes it underneath. A line-clamp box was tried
 * first and left its ellipsis alone on a line whenever the cut fell on one of
 * the blank lines between paragraphs.
 */
.sn-clamped{position:relative;max-height:9.9em;overflow:hidden;-webkit-mask-image:linear-gradient(to bottom,#000 80%,transparent);mask-image:linear-gradient(to bottom,#000 80%,transparent)}
.sn-toggle{align-self:flex-start;appearance:none;font:inherit;font-size:11px;padding:2px 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-link);cursor:pointer}
.sn-toggle:hover{background:var(--dsw-alias-bg-layer-2)}
.sn-toggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.sn-code{margin:0;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.55;white-space:pre-wrap;overflow-wrap:break-word;color:var(--dsw-alias-label-secondary)}
.sn-code-open{max-height:60vh;overflow:auto}
.sn-toolhead{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.sn-name{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;font-weight:600}
.sn-badge{font-size:11px;padding:0 7px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary)}
.sn-badge-ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}
.sn-badge-error{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}
.sn-badge-warn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}
.sn-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:64px 24px;text-align:center}
.sn-empty-title{font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.sn-empty-text{margin:0;font-size:12px;color:var(--dsw-alias-label-tertiary)}
.sn-note{margin:10px 0 0;padding-inline-start:var(--sn-edge);font-size:11px;color:var(--dsw-alias-label-tertiary)}
/*
 * Copy feedback lives beside the button instead of inside it. Swapping the
 * label changed the button's width and the whole stat row slid sideways on
 * every copy; a reserved status slot keeps the header still.
 */
.sn-notice{min-width:5.5em;text-align:end;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.sn-notice[data-state=ok]{color:var(--dsw-alias-state-success-primary)}
.sn-notice[data-state=failed]{color:var(--dsw-alias-state-error-primary)}
.sn-empty-line{font-size:12px;color:var(--dsw-alias-label-tertiary)}
@media (max-width:720px){.sn-head{padding:12px 16px}.sn-body{padding:4px 16px 40px}.sn-row{grid-template-columns:1fr;gap:6px}.sn-side{flex-direction:row;align-items:center;gap:8px}.sn-turn{padding-inline-start:0}.sn-note{padding-inline-start:0}.sn-notice{min-width:0}}
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
html body [class*="_markdown_"][class] :where([class*="_tableScroll_"]){box-sizing:border-box;width:100%;max-width:var(--dsh-chat-content-width,748px);margin-left:auto;margin-right:auto;padding-left:0;padding-right:0;min-width:0;overflow-x:auto;overscroll-behavior-x:contain}
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
 * so it lines up with the composer. Three or more columns stay a table while
 * they fit; the script that mounts this sheet measures each table and marks
 * the ones that would overflow or read badly as labeled cards.
 */
html body [class*="_markdown_"][class] table[data-sn-cols="1"],
html body [class*="_markdown_"][class] table[data-sn-cols="2"]{width:100%}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"]{display:block;width:100%;max-width:100%;border-collapse:separate;border-spacing:0;margin:.7em 0;font-size:.95em}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] thead{display:none}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody{display:block}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody tr{display:block;margin:0 0 8px;padding:8px 12px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-1)}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody tr:last-child{margin-bottom:0}
/*
 * Label and value are a hanging indent, not a grid. The renderer leaves a cell
 * as several inline runs (plain text, code spans, links, and one KaTeX block
 * per dollar-delimited formula), and a grid container turns every run into its
 * own grid item: a cell holding inline math scattered down the card, and the
 * nowrap math ran over the value beside it. An absolutely placed label keeps
 * the value in one inline flow, so whatever the renderer emits stays in
 * reading order.
 *
 * The label runs at .9em, so its own em is smaller than the cell's: the width
 * divides by .9 to hold the grid's 5.2em column (the 10px gap is absolute and
 * stays as it is).
 */
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody td,
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody td:first-child,
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody td:last-child{display:block;position:relative;min-width:0;max-width:none;padding:3px 0 3px calc(5.2em + 10px);border:0;text-align:start;vertical-align:top}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody td::before{content:attr(data-sn-label);position:absolute;inset-inline-start:0;top:3px;width:calc(5.2em / .9);color:var(--dsw-alias-label-tertiary);font-weight:600;font-size:.9em;line-height:1.75;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody td:not([data-sn-label]){padding-left:0}
html body [class*="_markdown_"][class] table[data-sn-cards="ready"] tbody td:not([data-sn-label])::before{content:none}
/*
 * A dollar pair in prose — a price, a discount — parses as inline math, so the
 * renderer paints that run in KaTeX's serif at 1.21em and swallows both signs:
 * one sentence grows a second typeface and half of it loses its dollars. The
 * script marks a formula whose source carries CJK (prose, not TeX) with
 * data-sn-tex; these rules put that text back into the document's own font,
 * delimiters included, and keep the hidden MathML arm for assistive tech.
 */
html body [class*="_markdown_"][class] .katex[data-sn-tex]{font:inherit;font-size:1em;line-height:inherit;white-space:normal;vertical-align:baseline;color:inherit}
html body [class*="_markdown_"][class] .katex[data-sn-tex]>.katex-html{display:none}
html body [class*="_markdown_"][class] .katex[data-sn-tex]::before{content:"$" attr(data-sn-tex) "$";white-space:normal}
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

    /** Longest code preview rendered without a disclosure. */
    const CODE_PREVIEW = 320

    /** Most lines a code preview keeps before the disclosure. */
    const CODE_PREVIEW_LINES = 8

    /** Counter behind the disclosure ids allocated by `useStableId`. */
    let idSeed = 0

    /** How long the pending state waits before it admits nothing is coming. */
    const STALL_MS = 8000

    /** Quiet period a prose block must hold before its stray markers are rebuilt. */
    const BOLD_QUIET_MS = 400

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
     * Format a recorded timestamp for the side rail.
     *
     * Seconds are dropped here on purpose: a burst of tool calls shares one
     * second, so the finest reading repeats down the rail without telling the
     * reader anything. The exact time stays in the element's `title` and in the
     * exported Markdown.
     *
     * @param time Milliseconds since the epoch.
     * @returns `HH:MM`, or an empty string.
     */
    function clock(time) {
      return clockReading(time).slice(0, 5)
    }

    /**
     * Format a recorded timestamp down to the second.
     *
     * @param time Milliseconds since the epoch.
     * @returns `HH:MM:SS`, or an empty string.
     */
    function clockExact(time) {
      return clockReading(time)
    }

    /**
     * Format a recorded timestamp.
     *
     * @param time Milliseconds since the epoch.
     * @returns `HH:MM:SS`, or an empty string.
     */
    function clockReading(time) {
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
      const value = clockExact(time)
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
     * Plain text of a tool result's content blocks, unabridged.
     *
     * The Host projection only ships a one-line preview, so the view reads the
     * full result from the loaded Chat snapshot instead. Images and files become
     * the same markers the Host uses, keeping both sources consistent.
     *
     * @param content Tool result content blocks.
     * @returns Joined text, or an empty string.
     */
    function textOfContent(content) {
      if (!Array.isArray(content)) return ''
      const parts = []
      for (const block of content) {
        if (block === undefined || block === null || typeof block !== 'object') continue
        const kind = typeof block.kind === 'string' ? block.kind : block.type
        if (kind === 'text' && typeof block.text === 'string') {
          if (block.text !== '') parts.push(block.text)
          continue
        }
        if (kind === 'image') parts.push('[image]')
        if (kind === 'file') {
          const attachment = block.attachment
          const name = attachment !== undefined && attachment !== null && typeof attachment.name === 'string' ? attachment.name : ''
          parts.push(name === '' ? '[file]' : `[file] ${name}`)
        }
      }
      return parts.join('\n\n')
    }

    /**
     * Lay recorded JSON argument text out for reading.
     *
     * A recorded argument string is one long line, and the Host projection
     * additionally flattens its whitespace for the preview. Re-indenting it
     * makes a SQL statement or a nested patch readable; anything that is not a
     * JSON object or array (or that the projection cut short) stays as it is.
     *
     * @param raw Recorded argument text.
     * @returns Readable text.
     */
    function prettyJson(raw) {
      const text = typeof raw === 'string' ? raw : ''
      const trimmed = text.trim()
      if (trimmed === '') return ''
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return text
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2)
      } catch {
        return text
      }
    }

    /**
     * Index every loaded tool call by identity: full arguments and full result.
     *
     * The projection is the index of the transcript (order, names, status,
     * times) and stays deliberately small, so a Tool row carries a preview. The
     * Chat snapshot of the same Session holds the recorded payload the built-in
     * Tool card renders, and it is already in memory: reading it here is what
     * makes a row expandable without growing the wire value of every event.
     *
     * Nested calls are visited too, so a sub-agent's tool rows resolve as well.
     *
     * @param snapshot Chat snapshot read through the `useChat` standard prop.
     * @returns Map of call id to `{ args, result }`.
     */
    function collectToolTexts(snapshot) {
      const texts = new Map()
      const nodes = snapshot === undefined || snapshot === null ? undefined : snapshot.nodes
      if (nodes === undefined || nodes === null || typeof nodes.values !== 'function') return texts

      /**
       * Record one call block and descend into its subcalls.
       *
       * @param block Tool call block from the Chat tree.
       */
      function visit(block) {
        if (block === undefined || block === null || typeof block !== 'object') return
        const callId = typeof block.callId === 'string' ? block.callId : ''
        if (callId !== '') {
          const call = block.call !== undefined && block.call !== null ? block.call : undefined
          const args = typeof block.argsRaw === 'string'
            ? block.argsRaw
            : call !== undefined && typeof call.argsRaw === 'string' ? call.argsRaw : ''
          const result = block.kind === 'tool-result' ? textOfContent(block.content) : ''
          const previous = texts.get(callId)
          texts.set(callId, {
            args: args !== '' ? args : previous === undefined ? '' : previous.args,
            result: result !== '' ? result : previous === undefined ? '' : previous.result,
          })
        }
        if (Array.isArray(block.subCalls)) for (const child of block.subCalls) visit(child)
      }

      for (const node of nodes.values()) {
        if (node === undefined || node === null || node.kind !== 'tool-call') continue
        const data = node.data
        if (data === undefined || data === null) continue
        visit(data.root)
      }
      return texts
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
     * Tool payloads come from the same resolved text the rows render, so an
     * export no longer stops at the projection's 200-character preview.
     *
     * @param data Normalized data.
     * @param t Translator.
     * @param texts Call id to full argument and result text.
     * @returns Markdown document.
     */
    function toMarkdown(data, t, texts) {
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
          const full = texts === undefined ? undefined : texts.get(row.callId)
          const args = prettyJson(full !== undefined && full.args !== '' ? full.args : row.args)
          const result = full !== undefined && full.result !== '' ? full.result : row.result
          lines.push(`**${t('roleTool')}** \`${row.name === '' ? '?' : row.name}\`${stamp(row.time)} · ${status}`, '')
          if (args !== '') lines.push('```json', args, '```', '')
          if (typeof result === 'string' && result !== '') {
            lines.push(result.split('\n').map((line) => (line === '' ? '>' : `> ${line}`)).join('\n'), '')
          }
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
        value === '' ? null : h('span', { key: 'clock', className: 'sn-clock', title: clockExact(time) }, value),
      ])
    }

    /**
     * Shorten recorded text to the preview budget, on both axes.
     *
     * A character budget alone is not enough: 300 characters of ten-character
     * lines is a three-hundred-line block. Both bounds are applied so a
     * collapsed row never depends on a CSS clamp — a clamp would cut the text
     * without saying so, which is what the reader saw as "cannot expand".
     *
     * @param text Full text.
     * @returns Preview text ending in an ellipsis.
     */
    function previewOf(text) {
      const cut = text.length > CODE_PREVIEW ? text.slice(0, CODE_PREVIEW) : text
      const lines = cut.split('\n')
      const head = lines.length > CODE_PREVIEW_LINES ? lines.slice(0, CODE_PREVIEW_LINES).join('\n') : cut
      return `${head.replace(/\s+$/, '')}…`
    }

    /**
     * Allocate one stable DOM id per mounted component.
     *
     * `aria-controls` needs an id that survives re-renders. A counter read once
     * into a ref does that without depending on `useId`, which the Host's React
     * may predate.
     *
     * @param prefix Id prefix.
     * @returns The component's id.
     */
    function useStableId(prefix) {
      const ref = React.useRef('')
      if (ref.current === '') {
        idSeed += 1
        ref.current = `${prefix}-${idSeed}`
      }
      return ref.current
    }

    /**
     * Monospace block with a disclosure for a payload that does not fit.
     *
     * The collapsed state renders a shortened excerpt, not the whole text behind
     * a CSS clamp: a 200 KB tool result would otherwise still be measured and
     * laid out on mount. Expanding is what puts the rest into the DOM, and only
     * the expanded block is height-capped (and scrollable).
     *
     * @param props Text and the translator.
     * @returns A React element.
     */
    function CodeBlock(props) {
      const t = props.t
      const text = props.text
      const [open, setOpen] = React.useState(false)
      const id = useStableId('sn-code')
      const long = text.length > CODE_PREVIEW || text.split('\n').length > CODE_PREVIEW_LINES
      if (!long) return h('pre', { className: 'sn-code' }, text)
      return h('div', { className: 'sn-content' }, [
        h('pre', { key: 'code', id, className: open ? 'sn-code sn-code-open' : 'sn-code' }, open ? text : previewOf(text)),
        h(
          'button',
          {
            key: 'toggle',
            type: 'button',
            className: 'sn-toggle',
            onClick: () => setOpen(!open),
            'aria-expanded': open,
            'aria-controls': id,
          },
          open ? t('showLess') : t('showMore'),
        ),
      ])
    }

    /**
     * Message text with a disclosure for very long injected content.
     *
     * The collapsed state caps on whole lines and fades at the bottom, so the
     * reader sees "there is more" instead of a half-sliced line.
     *
     * @param props Text and the translator.
     * @returns A React element.
     */
    function MessageText(props) {
      const t = props.t
      const text = props.text
      const [open, setOpen] = React.useState(false)
      const id = useStableId('sn-message')
      if (text.length <= LONG_TEXT) return h('p', { className: 'sn-text' }, text)
      return h('div', { className: 'sn-content' }, [
        h('div', { key: 'text', id, className: open ? '' : 'sn-clamped' }, [
          h('p', { key: 'body', className: 'sn-text' }, text),
        ]),
        h(
          'button',
          {
            key: 'toggle',
            type: 'button',
            className: 'sn-toggle',
            onClick: () => setOpen(!open),
            'aria-expanded': open,
            'aria-controls': id,
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
        // An assistant reply can carry only tool calls; a lone dash there reads
        // as a lost character, so the empty case names itself.
        row.text === ''
          ? h('span', { key: 'text', className: 'sn-empty-line' }, t('noText'))
          : h(MessageText, { key: 'text', t, text: row.text }),
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
     * Tool call row: recorded arguments and result, expandable on demand.
     *
     * The projection ships a preview per field, so the row renders the full
     * recorded text when the Chat snapshot has it and falls back to the preview
     * otherwise. Only the visible part reaches the DOM: a huge tool result stays
     * one collapsed line until the reader asks for it, which keeps a long
     * transcript cheap to mount.
     *
     * @param row Tool row.
     * @param t Translator.
     * @param index React key.
     * @param texts Call id to full argument and result text.
     * @returns A React element.
     */
    function toolRow(row, t, index, texts) {
      const status = row.status === 'error' ? 'sn-badge-error' : row.status === 'ok' ? 'sn-badge-ok' : ''
      const statusText = row.status === 'error' ? t('failed') : row.status === 'ok' ? t('ok') : t('pending')
      const head = h('div', { key: 'head', className: 'sn-toolhead' }, [
        h('span', { key: 'name', className: 'sn-name' }, row.name === '' ? '?' : row.name),
        h('span', { key: 'status', className: `sn-badge ${status}` }, statusText),
      ])
      const full = texts === undefined ? undefined : texts.get(row.callId)
      const args = prettyJson(full !== undefined && full.args !== '' ? full.args : row.args)
      const result = full !== undefined && full.result !== '' ? full.result : row.result
      const content = [head]
      if (args !== '') content.push(h(CodeBlock, { key: 'args', t, text: args }))
      if (typeof result === 'string' && result !== '') content.push(h(CodeBlock, { key: 'result', t, text: result }))
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
      const [noticeState, setNoticeState] = React.useState('')
      const [stalled, setStalled] = React.useState(false)
      // The Chat snapshot is only consulted for tool payloads the projection
      // truncated. Reading it whole (and memoizing off that reference) keeps the
      // selector stable, which a per-call Map would not be.
      const useChat = props !== undefined && typeof props.useChat === 'function' ? props.useChat : null
      const chat = useChat === null ? undefined : useChat((snapshot) => snapshot)
      const texts = React.useMemo(() => collectToolTexts(chat), [chat])

      React.useEffect(() => {
        if (notice === '') return undefined
        const timer = setTimeout(() => {
          setNotice('')
          setNoticeState('')
        }, 1800)
        return () => clearTimeout(timer)
      }, [notice])

      // A projection that registered but never published looks exactly like one
      // still folding. After a few seconds the waiting copy says which it is,
      // instead of leaving the reader in front of "collecting…" forever.
      const pending = data === null
      React.useEffect(() => {
        if (!pending) return undefined
        const timer = setTimeout(() => setStalled(true), STALL_MS)
        return () => clearTimeout(timer)
      }, [pending])

      const rows = data === null ? [] : data.rows
      const canCopy = data !== null && rows.length > 0
      const showNotice = React.useCallback(
        (ok) => {
          setNotice(ok ? t('copied') : t('copyFailed'))
          setNoticeState(ok ? 'ok' : 'failed')
        },
        [t],
      )
      const onCopy = React.useCallback(() => {
        if (data === null) return
        writeClipboard(toMarkdown(data, t, texts)).then(showNotice, () => showNotice(false))
      }, [data, t, texts, showNotice])

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
            'span',
            {
              key: 'notice',
              className: 'sn-notice',
              role: 'status',
              'aria-live': 'polite',
              ...(noticeState === '' ? {} : { 'data-state': noticeState }),
            },
            notice,
          ),
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
            t('copy'),
          ),
        ]),
      ])

      let body
      if (data === null) {
        body = h(
          'div',
          { key: 'body', className: 'sn-body' },
          stalled
            ? emptyState({ title: t('stalled'), text: t('stalledHint') })
            : emptyState({ title: t('waiting'), text: t('waitHint') }),
        )
      } else if (rows.length === 0) {
        body = h('div', { key: 'body', className: 'sn-body' }, emptyState({ title: t('empty'), text: t('emptyHint') }))
      } else {
        const children = []
        for (let index = 0; index < rows.length; index += 1) {
          const row = rows[index]
          if (row.k === 'turn') children.push(turnRow(row, t, index))
          else if (row.k === 'user' || row.k === 'assistant') children.push(messageRow(row, t, index))
          else if (row.k === 'tool') children.push(toolRow(row, t, index, texts))
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

    /** Reading column narrower than this cannot carry a three-column table. */
    const CARD_BREAKPOINT = 600

    /**
     * Characters that mean a formula is really prose.
     *
     * TeX has no CJK: a dollar pair wrapped around Chinese text is two prices in
     * one sentence, not a formula. KaTeX still paints that text (as italic
     * serif, with the signs gone), so CJK in the source is the reliable tell.
     */
    const PROSE_MATH = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef\u3000-\u303f]/

    /** Strong-emphasis marker, as the renderer leaves it when it refuses to open. */
    const BOLD_MARK = '**'

    /**
     * Whether the text between two markers is prose the author meant to embolden.
     *
     * @param inner Text between the markers.
     * @returns `true` when the pair is worth rebuilding.
     */
    function usableBold(inner) {
      return inner !== '' && inner.trim() === inner && !inner.startsWith('*') && !inner.endsWith('*')
    }

    /**
     * Split a text run that still carries literal `**` markers.
     *
     * CommonMark only lets a delimiter run open when it is left-flanking:
     * not followed by whitespace, and — when followed by punctuation — preceded
     * by whitespace or punctuation. Chinese prose breaks that rule constantly,
     * because it puts punctuation right after the opening run and a letter right
     * before it: `变**「硬件兑现」**——`. micromark is right to leave the markers
     * alone; the author still meant bold, so the pair is rebuilt here.
     *
     * A run with an odd marker count, an empty pair, a pair whose content starts
     * or ends with whitespace (`用 ** 表示通配符`), or a nested `***` is left as
     * text — those are the cases where the markers are more likely content than
     * markup.
     *
     * @param text Text content of one node.
     * @returns Ordered segments, or `null` when nothing can be paired.
     */
    function pairBold(text) {
      if (typeof text !== 'string' || !text.includes(BOLD_MARK)) return null
      const parts = []
      let cursor = 0
      while (cursor <= text.length) {
        const open = text.indexOf(BOLD_MARK, cursor)
        if (open < 0) break
        const close = text.indexOf(BOLD_MARK, open + BOLD_MARK.length)
        if (close < 0) break
        const inner = text.slice(open + BOLD_MARK.length, close)
        if (!usableBold(inner)) {
          // Keep the marker as text and keep looking past it.
          cursor = open + BOLD_MARK.length
          continue
        }
        if (open > cursor) parts.push({ text: text.slice(cursor, open), bold: false })
        parts.push({ text: inner, bold: true })
        cursor = close + BOLD_MARK.length
      }
      if (cursor < text.length) parts.push({ text: text.slice(cursor), bold: false })
      return parts.some((part) => part.bold) ? parts : null
    }

    /** Prose containers whose text is markup or code, never emphasis. */
    const BOLD_SKIP = 'pre,code,kbd,samp,script,style,textarea,[data-sn-bold],[data-sn-measure]'

    /** Elements that hold one run of prose; markers never pair across them. */
    const BOLD_BLOCKS = 'p,li,h1,h2,h3,h4,h5,h6,td,th,dt,dd,figcaption'

    /**
     * Rebuild the literal `**` pairs a prose container still carries.
     *
     * The markers do not always sit in one text node: a run the parser refused
     * to open can leave its two markers on either side of a `<strong>` it did
     * open (`变成**「硬件兑现」**：…定性上这是**换挡**——`). Pairing therefore
     * works on the whole block's text and rewraps the range with a Range, which
     * keeps whatever inline markup sits between the markers inside the result.
     *
     * Markers are only paired inside one block, and the inserted `<strong>`
     * carries `data-sn-bold` so a later pass — including this plugin's own
     * observer — can tell repaired markup from prose.
     *
     * @param root Element to repair.
     * @returns How many marker pairs were rebuilt.
     */
    function repairBoldDom(root) {
      if (root === null || root === undefined || typeof root.nodeType !== 'number') return 0
      if (typeof document === 'undefined' || typeof document.createTreeWalker !== 'function') return 0
      // NodeFilter.SHOW_TEXT is 4; the constant is not always a global here.
      const walker = document.createTreeWalker(root, 4)
      const groups = new Map()
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        if (typeof node.data !== 'string' || !node.data.includes(BOLD_MARK)) continue
        const parent = node.parentElement
        if (parent === null || parent.closest(BOLD_SKIP) !== null) continue
        const block = parent.closest(BOLD_BLOCKS)
        if (block === null) continue
        const marks = groups.get(block) ?? []
        let at = node.data.indexOf(BOLD_MARK)
        while (at >= 0) {
          marks.push({ node, index: at })
          at = node.data.indexOf(BOLD_MARK, at + BOLD_MARK.length)
        }
        groups.set(block, marks)
      }
      let repaired = 0
      for (const marks of groups.values()) {
        for (let index = 0; index + 1 < marks.length; index += 2) {
          if (repairedInline(marks[index], marks[index + 1])) repaired += 1
        }
      }
      return repaired
    }

    /**
     * Rebuild one marker pair as `<strong>`, wherever its content sits.
     *
     * @param open Opening marker position.
     * @param close Closing marker position.
     * @returns Whether the pair was rebuilt.
     */
    function repairedInline(open, close) {
      const range = document.createRange()
      range.setStart(open.node, open.index + BOLD_MARK.length)
      range.setEnd(close.node, close.index)
      const inner = range.toString()
      if (!usableBold(inner)) return false
      // Drop the closing marker first; removing it cannot move the opening one.
      // In one node the opening removal then shifts the end position left too.
      const startNode = open.node
      const endNode = close.node
      const startIndex = open.index
      const endIndex = endNode === startNode ? close.index - BOLD_MARK.length : close.index
      close.node.deleteData(close.index, BOLD_MARK.length)
      open.node.deleteData(open.index, BOLD_MARK.length)
      range.setStart(startNode, startIndex)
      range.setEnd(endNode, endIndex)
      const strong = document.createElement('strong')
      strong.setAttribute('data-sn-bold', '')
      strong.appendChild(range.extractContents())
      range.insertNode(strong)
      return true
    }

    /**
     * Copy each table header onto its cells, record the column count, and mark
     * prose that the renderer mistook for math.
     *
     * The card layout used in narrow reading columns needs a visible label per
     * value, but the Markdown renderer owns the table DOM and only emits a
     * header row. This observes the transcript and adds attributes only; it
     * never moves, replaces or re-renders product nodes. Two-column tables keep
     * their header and simply take the reading width, so cards are only marked
     * for three or more columns.
     *
     * Every pass is idempotent: a table already in the mode the decision asks
     * for is left alone. That matters for the reader — swapping a card table
     * back to table layout collapses it for a frame, the browser clamps the
     * scrollport to the shorter content, and the tail the reader just scrolled
     * to is lost even though the final layout is identical.
     */
    function useMarkdownAttributes() {
      React.useEffect(() => {
        if (typeof document === 'undefined' || typeof MutationObserver !== 'function') return undefined
        let frame = 0
        let resize = null
        const widths = new WeakMap()
        const watched = new WeakSet()
        const queued = new Set()
        const maths = new Set()
        const bolds = new Set()
        // Last text a prose block was seen with, so a leftover marker that cannot
        // be paired (`** 开口未闭`) is not re-examined until the text changes.
        const boldSeen = new WeakMap()
        // The product owns these text nodes with its own reconciler: pulling one
        // out from under a paragraph that is still streaming would leave React
        // writing into a detached node. Repair therefore waits for the block to
        // go quiet first.
        const boldTimers = new Set()
        const boldTimeouts = new WeakMap()

        /**
         * Find the scrollport a table lives in, so a layout change can keep the
         * reader's position when the product's own follow logic is at the tail.
         *
         * @param element Starting element.
         * @returns The scrolling ancestor, the document scroller, or `null`.
         */
        function scrollportOf(element) {
          for (let node = element === null ? null : element.parentElement; node !== null; node = node.parentElement) {
            if (node.hasAttribute('data-conversation-scroll')) return node
            let overflow = ''
            try {
              overflow = getComputedStyle(node).overflowY
            } catch {
              overflow = ''
            }
            if (overflow === 'auto' || overflow === 'scroll') return node
          }
          return document.scrollingElement ?? null
        }

        /**
         * Measure the width a table needs as a table, without touching the live
         * node. Removing `data-sn-cards` in place would be cheaper, but it
         * collapses the table for a frame and that is exactly what moves the
         * reader; a detached copy is invisible to the transcript.
         *
         * @param table Table element.
         * @returns Needed width in CSS pixels.
         */
        function naturalWidth(table) {
          const host = document.createElement('div')
          host.setAttribute('aria-hidden', 'true')
          host.setAttribute('data-sn-measure', '')
          host.style.cssText =
            'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;z-index:-1;width:max-content;max-width:none'
          // Carry the Markdown root's class so the copy is measured under the
          // same cell minimums and font metrics as the node it stands in for.
          const root = table.closest('[class*="_markdown_"]')
          if (root !== null && root.className !== '') host.className = root.className
          const copy = table.cloneNode(true)
          copy.removeAttribute('data-sn-cards')
          copy.style.cssText = 'display:table;width:max-content;max-width:none;margin:0'
          host.appendChild(copy)
          document.body.appendChild(host)
          const width = copy.getBoundingClientRect().width
          host.remove()
          return width
        }

        /**
         * Switch one table between table and card layout.
         *
         * A switch changes the height of everything below the table. When the
         * reader sits at the tail, the product pins the scrollport to the floor,
         * so pin it again once the new height is in; elsewhere the browser's own
         * scroll anchoring keeps the visible row still.
         *
         * @param table Table element.
         * @param cards Whether the table becomes labeled cards.
         */
        function setCards(table, cards) {
          const wrapper = table.closest('[class*="_tableScroll_"]')
          const scroller = scrollportOf(wrapper ?? table)
          const pinned = scroller !== null && scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= 1
          if (cards) table.setAttribute('data-sn-cards', 'ready')
          else table.removeAttribute('data-sn-cards')
          // Re-read the floor after the swap: the browser clamps a shrinking
          // scrollport silently, so adding the delta would overshoot.
          if (pinned) scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight
        }

        /**
         * Label one table and decide whether it must render as cards.
         *
         * The decision reads the wrapper's width and, only when that width is
         * inconclusive, the table's own need: a table-layout node reports
         * horizontal overflow through its scroll width, a card node through an
         * off-document measurement. Split panes, browser zoom and the
         * reading-width control therefore all get the same answer.
         *
         * @param table Table element.
         */
        function label(table) {
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

          const wrapper = table.closest('[class*="_tableScroll_"]')
          if (wrapper !== null && resize !== null && !watched.has(wrapper)) {
            watched.add(wrapper)
            widths.set(wrapper, wrapper.clientWidth)
            resize.observe(wrapper)
          }
          const available = wrapper === null ? 0 : wrapper.clientWidth
          const cards = table.getAttribute('data-sn-cards') === 'ready'
          let wanted = false
          if (labelled > 0 && heads.length >= 3 && available > 0) {
            if (available < CARD_BREAKPOINT) {
              wanted = true
            } else if (!cards && table.getBoundingClientRect().width < available - 1) {
              // Narrower than the column already: the table fits as a table, so
              // skip the detached measurement.
              wanted = false
            } else {
              // A table is `width:max-content` capped at the column, so a
              // squeezed table reports exactly the column width and its
              // scrollWidth never overflows — the scroll test could never fire
              // and the table stayed a table, wrapping every cell into a tall
              // stack. Only the detached copy says how much room the table
              // really wants.
              wanted = naturalWidth(table) > available + 1
            }
          }
          if (wanted !== cards) setCards(table, wanted)
        }

        /**
         * Record a formula's TeX source when the formula is really prose.
         *
         * The stylesheet reads the attribute back and prints `$source$` in the
         * document's font, which is what the sentence said before the renderer
         * read the dollars as math. Display math and real formulas are left as
         * KaTeX painted them.
         *
         * @param formula The `.katex` element of one rendered formula.
         */
        function markProseMath(formula) {
          if (formula.hasAttribute('data-sn-tex')) return
          if (formula.closest('.katex-display') !== null) return
          const annotation = formula.querySelector('annotation[encoding="application/x-tex"]')
          const tex = annotation === null || annotation.textContent === null ? '' : annotation.textContent.trim()
          if (tex === '' || !PROSE_MATH.test(tex)) return
          formula.setAttribute('data-sn-tex', tex)
        }

        /**
         * Repair one prose block once it stops changing.
         *
         * Each touch of the block restarts the wait, so a paragraph that is still
         * streaming is never rewritten mid-flight; the repair lands on the
         * settled text.
         *
         * @param element Block that still carries a marker.
         */
        function settleBold(element) {
          const previous = boldTimeouts.get(element)
          if (previous !== undefined) clearTimeout(previous)
          const timer = setTimeout(() => {
            boldTimeouts.delete(element)
            boldTimers.delete(timer)
            if (!element.isConnected) return
            repairBoldDom(element)
            boldSeen.set(element, element.textContent)
          }, BOLD_QUIET_MS)
          boldTimeouts.set(element, timer)
          boldTimers.add(timer)
        }

        /**
         * Queue one prose block that still carries a bold marker.
         *
         * Reading `textContent` per mutation is cheap next to a layout, and the
         * snapshot stops an unpaired marker from being re-examined every time a
         * neighbour changes.
         *
         * @param element Container touched by a mutation.
         */
        function markBold(element) {
          if (element.closest(BOLD_SKIP) !== null) return
          const text = element.textContent
          if (text === null || !text.includes(BOLD_MARK)) return
          if (boldSeen.get(element) === text) return
          bolds.add(element)
        }

        /**
         * Collect the tables, formulas and bold markers a mutation touched, so a
         * frame's work stays proportional to what changed instead of the whole
         * transcript.
         *
         * @param node Added or changed node.
         */
        function collect(node) {
          const element = node !== null && node.nodeType === 1 ? node : node?.parentElement
          if (element === undefined || element === null) return
          if (element.closest('[data-sn-measure]') !== null) return
          if (element.closest('[class*="_markdown_"]') === null) return
          markBold(element)
          if (element.matches('.katex')) maths.add(element)
          for (const formula of element.querySelectorAll('.katex')) maths.add(formula)
          const table = element.closest('table')
          if (table !== null) {
            queued.add(table)
            return
          }
          if (element.matches('table')) queued.add(element)
          for (const found of element.querySelectorAll('table')) queued.add(found)
        }

        const scan = () => {
          frame = 0
          const targets = Array.from(queued)
          queued.clear()
          const formulas = Array.from(maths)
          maths.clear()
          const prose = Array.from(bolds)
          bolds.clear()
          for (const table of targets) {
            if (table.isConnected) label(table)
          }
          for (const formula of formulas) {
            if (formula.isConnected) markProseMath(formula)
          }
          for (const element of prose) {
            if (element.isConnected) settleBold(element)
          }
        }
        const scanAll = () => {
          for (const table of document.querySelectorAll('[class*="_markdown_"] table')) label(table)
          for (const formula of document.querySelectorAll('[class*="_markdown_"] .katex')) markProseMath(formula)
          for (const root of document.querySelectorAll('[class*="_markdown_"]')) {
            if (root.textContent !== null && root.textContent.includes(BOLD_MARK)) settleBold(root)
          }
        }
        const schedule = () => {
          if (frame !== 0 || (queued.size === 0 && maths.size === 0 && bolds.size === 0)) return
          if (typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(scan)
          else frame = setTimeout(scan, 16)
        }
        resize =
          typeof ResizeObserver === 'function'
            ? new ResizeObserver((entries) => {
                for (const entry of entries) {
                  const width = entry.contentRect.width
                  if (widths.get(entry.target) === width) continue
                  widths.set(entry.target, width)
                  const table = entry.target.querySelector('table')
                  if (table !== null) label(table)
                }
              })
            : null
        scanAll()
        const observer = new MutationObserver((records) => {
          for (const record of records) {
            if (record.type === 'characterData') collect(record.target.parentElement)
            else if (record.type === 'childList') {
              for (const node of record.addedNodes) collect(node)
            }
          }
          schedule()
        })
        observer.observe(document.body, { childList: true, subtree: true, characterData: true })
        return () => {
          observer.disconnect()
          if (resize !== null) resize.disconnect()
          if (frame !== 0) {
            if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
            else clearTimeout(frame)
          }
          for (const timer of boldTimers) clearTimeout(timer)
          boldTimers.clear()
        }
      }, [])
    }

    /**
     * Mount the typography sheet, label tables for the narrow card layout, and
     * mark prose the renderer mistook for math. A `<style>` element renders no
     * box, so the host slot keeps its layout; the rules are global by design
     * and scoped by the Markdown root's own class.
     *
     * @returns A React element.
     */
    function TypographyStyle() {
      useMarkdownAttributes()
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

    // `__pairBold` and `__repairBold` are the pure and DOM halves of the marker
    // repair, exposed so the checks can pin them without a React tree.
    return { name: NAMESPACE, inject: ['slots', 'locale'], apply, __pairBold: pairBold, __repairBold: repairBoldDom }
  },
})
