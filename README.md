# 会话规范视图 · Normative view

为 DeepSeek Harness 增加一个会话视图标签页，把当前会话的记录整理成统一格式：
按「轮次」分组，逐条显示用户消息、助手回复与工具调用（名称、参数、结果状态、时间），
并提供「复制 Markdown」，方便导出或贴到文档里。

同时按同一套规范统一「对话」页里 Markdown 的排版观感（标题层级、段落与列表节奏、
代码块、引用、表格），并让表格收进阅读列：表头浅底、隔行浅底、单元格可换行，
列特别多时才在表格内部横向滚动，不会再把整段对话撑出页面横向滚动条。每条已定稿的
助手回复在操作行里多一个「复制为 Markdown」按钮，复制的是模型写下的原始 Markdown
源码（表格、列表、代码块、引用都保持原样）。

Adds a conversation view tab that lays the current session out in one consistent
format: turns as sections, then every user message, assistant reply and tool call
with its arguments, result status and time. A **Copy Markdown** button exports the
same transcript as Markdown. The same standard also normalizes the Markdown
typography of the Chat view (headings, paragraphs, lists, code, quotes, tables):
tables fit the reading column, and each settled assistant reply gains a
**Copy as Markdown** action that copies the model's original Markdown source.

- 包名 / package: `dsh-session-norms`
- 版本 / version: `1.2.2`
- 许可证 / license: MIT

## 安装 / Install

从 npm 安装。插件页「添加插件」里输入包名即可，也可以直接跑命令：

```sh
dsh plugin --profile desktop add dsh-session-norms
```

装好后重启 DSH，会话上方的视图标签栏里会多出「规范视图」。

固定版本的 Git 安装和本地目录安装仍然可用，但它们**不参与在线更新**（见下一节）：

```sh
# 尝鲜尚未发布的提交
dsh plugin --profile desktop add git+https://github.com/phoenixlucky/dsh-session-norms.git#v1.2.2

# 本地开发目录（Windows 使用绝对路径）
dsh plugin --profile desktop add E:\path\to\dsh-session-norms
```

## 更新 / Update

只有从 npm 注册表安装的组合包可以在线更新：打开「插件」页 → 本插件详情，下面的**版本**区块列出比当前版本新的版本，点**更新到 x.y.z** 即可；工具栏的**刷新**会重新检查一遍。

从 Git（`git+…`、`github:`）或本地 `link:` / 路径安装的包不显示版本区块——DSH 的更新只为注册表安装准备：它先用 `pnpm view` 问注册表有哪些新版本，再用 `pnpm add 名字@版本` 安装，没有 Git 的更新通道。这类安装按固定版本重装：

```sh
dsh plugin --profile desktop remove dsh-session-norms
dsh plugin --profile desktop add git+https://github.com/phoenixlucky/dsh-session-norms.git#v1.2.3
```

## 使用 / Usage

1. 打开任意会话，点会话上方的 **规范视图** 标签页。
2. 顶部显示轮次、消息、工具调用、错误数量；正文按「第 N 轮」分组。
3. 超长消息与工具结果默认折叠，点「展开全文」查看；点「复制 Markdown」导出整份记录。
4. 「对话」页本身不需要切换：插件挂载后，Markdown 正文的标题、段落、列表、代码块、
   引用与表格即按统一规则呈现（深浅色都跟随主题变量）。表格铺满阅读列并与正文对齐，
   表头与隔行使用浅一层的底色；两列表格始终铺满阅读列（与输入框同宽）。
   三列及以上的表格先按表格排，脚本按实际宽度判断：放不下或阅读列窄于 600px 时
   切成「每条记录一张卡片」，表头文案变成字段标签，不再出现横向滚动条。
5. 每条已定稿的助手回复末尾，操作行里有一个 **复制为 Markdown** 图标按钮，
   点击即可把该条回复的原始 Markdown（含表格、列表、代码块）复制到剪贴板。

## 结构 / Layout

| 部分 | 说明 |
| --- | --- |
| `index.js` | 宿主侧：把会话事件折叠成规范化记录，并通过会话投影（`sessionNorms`）发给界面。 |
| `client.js` | 浏览器侧：注册 `conversation.view` 的 `norms` 视图、已定稿助手操作行里的「复制为 Markdown」、多语言文案和排版样式。 |
| `locale/*.json` | 插件列表里显示的标题与说明。 |
| `scripts/release.mjs` | 维护者发版脚本：检查、测试、改版本、提交、打标签、发布、推送。 |

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
- 表格：铺满阅读列，单元格可收缩换行，表头与隔行使用主题的浅层底色；列的最小宽度
  合计超过阅读列时，滚动限制在表格自身的滚动容器内，页面不再出现横向滚动条。
- 窄栏自适应：表格容器铺满阅读列并居中，与正文和输入框同宽，不再缩成一条或伸到
  左侧留白；产品内置的「宽表撑到两侧留白」也会被收回阅读列。两列表格始终铺满宽度；
  三列及以上的表格由脚本按实际布局宽度判断，放不下或阅读列窄于 600px 时把表头写到
  单元格的 `data-sn-label` 上并切成「标签 + 值」卡片，不再出现横向滚动条。脚本只加
  属性，不改动或重排产品节点。
- 复制为 Markdown：在 `conversation.chat.assistant-actions` 里追加一个图标按钮，从
  `useChat` 读取该条已定稿回复的文本块并原样写入剪贴板；流式输出和中断内容没有
  `messageId`，因此不显示按钮。按钮失败时不提示成功，1.8 秒后恢复原图标。
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

## 发版 / Release

`scripts/release.mjs` 把发版串成一条命令：确认工作区干净且在 `main`、跑上面的渲染检查、改版本号（`package.json` 与本文开头的「版本 / version」一行）、提交、打 `v<版本>` 标签、发布到 npm，最后推送提交和标签。

```sh
npm run release patch                  # 1.2.2 → 1.2.3
npm run release minor                  # → 1.3.0
npm run release 1.4.0                  # 指定版本
npm run release patch -- --dry-run     # 只打印将要执行的步骤，不写文件、不发包
```

其他开关：`--no-publish`（只提交和打标签）、`--no-push`、`--skip-tests`、`--otp <code>`（npm 要求一次性密码时）、`--offline`（跳过注册表与登录检查，离线试跑时用）。

脚本会在动任何文件之前检查：版本确实比当前新、`v<版本>` 标签不存在、该版本还没被发布、`npm login` 有效。发布失败时本地的提交和标签会保留，按它打印的命令补一次 `npm publish` 与 `git push --follow-tags` 即可。手工发版是同一套动作：`npm version <patch|minor|major>` → `git push --follow-tags` → `npm publish`。

发布出去的包只含 `package.json` 的 `files` 白名单里的文件（`index.js`、`client.js`、`cordis.patch.yml`、`locale`、`icon.svg`、`README.md`、`LICENSE`），`scripts/` 和 `test/` 不进包。
