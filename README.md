# 会话规范视图 · Normative view

为 DeepSeek Harness 增加一个会话视图标签页，把当前会话的记录整理成统一格式：
按「轮次」分组，逐条显示用户消息、助手回复与工具调用（名称、参数、结果状态、时间），
并提供「复制 Markdown」，方便导出或贴到文档里。

同时按同一套规范统一「对话」页里 Markdown 的排版观感（标题层级、段落与列表节奏、
代码块、引用、表格），让长回复读起来是一篇连贯的文档，而不是松散的段落堆叠。

Adds a conversation view tab that lays the current session out in one consistent
format: turns as sections, then every user message, assistant reply and tool call
with its arguments, result status and time. A **Copy Markdown** button exports the
same transcript as Markdown. The same standard also normalizes the Markdown
typography of the Chat view (headings, paragraphs, lists, code, quotes, tables).

- 包名 / package: `dsh-session-norms`
- 版本 / version: `1.1.0`
- 许可证 / license: MIT

## 安装 / Install

插件市场收录后，可在「插件」页直接安装。也可以按固定提交从 Git 安装：

```sh
dsh plugin --profile desktop add git+https://github.com/phoenixlucky/dsh-session-norms.git#<commit>
```

本地开发目录安装（Windows 使用绝对路径）：

```sh
dsh plugin --profile desktop add E:\path\to\dsh-session-norms
```

安装后重启 DSH，会话上方的视图标签栏里会多出「规范视图」。

## 使用 / Usage

1. 打开任意会话，点会话上方的 **规范视图** 标签页。
2. 顶部显示轮次、消息、工具调用、错误数量；正文按「第 N 轮」分组。
3. 超长消息与工具结果默认折叠，点「展开全文」查看；点「复制 Markdown」导出整份记录。
4. 「对话」页本身不需要切换：插件挂载后，Markdown 正文的标题、段落、列表、代码块、
   引用与表格即按统一规则呈现（深浅色都跟随主题变量）。

## 结构 / Layout

| 部分 | 说明 |
| --- | --- |
| `index.js` | 宿主侧：把会话事件折叠成规范化记录，并通过会话投影（`sessionNorms`）发给界面。 |
| `client.js` | 浏览器侧：注册 `conversation.view` 的 `norms` 视图、多语言文案和样式。 |
| `locale/*.json` | 插件列表里显示的标题与说明。 |

## 行为 / Behavior

- 只读：不写入会话事件、不改变会话数据。
- 增量：汇总跟随已提交的会话事件（`turn/start`、`user/message`、`assistant/message`、
  `tool/call`、`tool/result`、`turn/end`），随回合推进自动刷新。
- 有界：最多保留最近 200 行，单条消息文本最多 3000 字符，超出时在视图底部提示。
- 排版层：只注入样式，不接管渲染器——不注册 `conversation.chat.node` 的 keyed cell，
  因此 Markdown 渲染、工具行、助手操作按钮和主题切换都保持内置行为。样式挂载在
  `conversation.session.header.utilities`（嵌入布局时回退到 `conversation.composer.dock`），
  规则作用域为 Markdown 根节点的 CSS Modules 类（`[class*="_markdown_"]`），
  深浅色全部取自 `--dsw-alias-*` 主题变量。
- 跟随主题：颜色全部取自 `--dsw-alias-*` 主题变量，自动适配浅色/深色；
  文案跟随界面语言（中文 / English）。

## 兼容性 / Compatibility

已在 DeepSeek Harness `0.2.2-alpha.2` 上验证，`engines.dsh` 声明为
`>=0.2.2-alpha.2 <0.3.0-0`。其他版本未验证。

## 卸载 / Uninstall

在「插件」页面停用并卸载 `dsh-session-norms` 即可，视图标签页会同时消失。

## 开发 / Development

`test/render-test.mjs` 用 React SSR 对浏览器侧做静态渲染检查：

```sh
node test/render-test.mjs                      # 结构检查
node test/render-test.mjs <projection.json>    # 追加真实会话投影数据检查
```

`<projection.json>` 是 `.dsh/storages/session_projcache/sessions/` 下某个会话的缓存；
`DSH_PROFILE_DIR` 可指定提供 react 的 profile 目录。
