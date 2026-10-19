# AGENTS.md — 分组视图插件开发约定

给改动本仓库的人（和 agent）看的说明书。面向使用者的功能与安装说明在 [README.md](README.md)。

## 这是什么

`dsh-workspace-groups` 是 DeepSeek Harness（DSH）Web 端的客户端插件：注册一个负优先级槽位**替换**侧栏内置的「工作区」区域，而不是在它旁边加面板。仓库就是这几个文件，**没有构建步骤、没有依赖、没有测试套件**——改完 `client.js` 刷新浏览器即生效。

## 仓库地图

| 文件 | 职责 |
|---|---|
| `client.js` | 全部界面逻辑。单文件浏览器半成品，包在 `window.__ModuleLoader__.load({ id, factory })` 内 |
| `index.js` | Host 占位：只有空 `apply()`，作用是让 Loader 激活 Client 模块图并让插件清单有条目 |
| `cordis.patch.yml` | bundle patch：`insert` 一行 `workspace-groups` |
| `package.json` | `dsh.bundle.patch` / `dsh.client.platform: "web"` / `dsh.client.inject`；`version` 即发布版本 |
| `locale/{zh,en}.json` | 只有 `meta`（插件页显示的标题与简介），**不是**界面文案 |
| `icon.svg` | 插件页图标 |
| `README.md` | 面向使用者的功能与安装说明 |
| `LICENSE` | MIT |

## 硬性不变量（破坏会出线上问题，不要"顺手优化"掉）

1. **一个槽位、负优先级**：只 `ctx.slots.inject('sidebar.workspaces', …)` 一次，`priority: -1` 遮蔽内置（内置在 0）。不要再注册 `sidebar.panellist` / `main`，也不要加第二个 `sidebar.workspaces`。
2. **不声明子槽位**：`.directoryFlow`、`.session.menu.item`、`.session.row.action`、`sidebar.session.row.leading` / `.hover` 一律不声明——接管期间这些扩展点对该区域不可用，这是设计取舍，不要为"兼容"加回来。
3. **只允许 `require('react')`**：Client 模块图按包名解析冻结模块，本包单文件打包；不能出现相对路径 require、动态 `import()` 或第三方依赖。
4. **存储键与迁移**：`dsh.workspace-groups.v3`（外加 v2/v1 legacy 键）。改数据结构必须同步更新 `normalizeState` / `fromV2` / `fromV1`，并对损坏数据回退 `defaultState()`；否则老用户丢分组。
5. **文案成对**：`STRINGS` 每条为 `[zh, en]`，两语言同键同序，`ZH` / `EN` 由它派生；`locale/*.json` 只放 meta。
6. **样式只用主题 token**：颜色一律 `--dsw-*` 变量，类名 `wsg-` 前缀；字面色只有两处——遮罩渐变的 `#000` / `#0000`，以及 `BADGE_COLORS` 里用户可选的徽章调色板（只能加在表里，不能散落到 CSS）。
7. **激活失败必须兜底**：`apply()` 的 try/catch 只打 `workspace-groups: activation failed…`，让侧栏回落内置浏览器，不允许带崩整页 boot。
8. **不用 `onMouseEnter`**：宿主在捕获阶段拦 `mouseover`，行内 hover 一律 `onPointerEnter` / `onPointerLeave`；布局换位靠 `data-*` 属性 + CSS（例如 hover 时时间与归档按钮共享同一个 grid 单元格）。
9. **包名固定**：`@local/dsh-workspace-groups` 出现在 `package.json`、`cordis.patch.yml`、`client.js` 的 `id` 三处；改名要同步改 profile 依赖与 `dsh.profile.bundles`，否则装不上。

## client.js 代码地图（按文件顺序）

- **常量与字符串**：`NS`、`STORAGE_KEY`、`TABS`、`ORDERS`、`STRINGS` / `ZH` / `EN`、`BADGE_COLORS` / `BADGE_ICONS`（徽章调色板与图标表，zh/en 名称自动进字典）、浮层尺寸（`MENU_WIDTH`、`FLYOUT_*`）、`CSS`。
- **图标**：`svgIcon` / `strokeIcon` / `glyphIcon`，统一 16px 视框，字形取自宿主。
- **持久化**：`defaultState` → `pick` / `normalizeBadge` / `mapRecord` / `orderArray` → `normalizeState` → `loadState`（含 v2/v1 迁移与 try/catch）→ `persistState`。
- **派生**：`sessionEligible` / `sessionVisible`（归档与当前会话）、`pinRanks` / `recencyOrder` / `partitioned` / `accountOrder`（置顶与排序）、`buildModel`（单趟分桶出「未分组 + 各分组 + 各项目」）。
- **呈现辅助**：`sessionStatusMark` / `statusMark`（进行中 / 等待交互 / 未读，转圈相位同步）、`formatRelative` / `relativeLabel`（按时间戳 + 分钟 + 语言缓存）。
- **浮层定位**：`originAt` / `originUnder`（含视口夹取与最小高度）。
- **拖拽谓词**：`isSessionDrag` / `isGroupDrag` / `dragAllowed` / `dropHalf` / `rowOver` / `isHeadOver` / `groupOver` / `sameMarker`，顺序调整 `insertIndex` / `moveGroupInList`。
- **标题跑马灯**：`scrollTitleTo` / `placeTitle` / `restTitle` 与 `SessionRow` 内的 `startTitleMarquee` / `stopTitleMarquee`（`data-marquee` 把省略号换成两侧渐隐，速度按溢出长度自适应）。
- **行组件**：`SessionRow`（`memo`；props 全是原始值，便于行缓存命中）。
- **面板元数据**：`DIALOG_SPEC`（六种对话框：`local` 改视图状态、`remote` 调注入方法）与 `menuItem` / `menuHeading` / `menuSeparator`。
- **面板钩子**：`usePersistedView`（读取 + 迁移 + 首次写回 + 唯一写入口）、`useLayerDismissal`（浮层与对话框共用一个 document 监听）、`useDocumentDragAccept`（拖拽期间放行整页落点）。
- **面板体**：`GroupedWorkspacePanel`——状态、mutators（`assign` / `createGroup` / `patchGroup` / `moveGroup` / `deleteGroup` / `switchTab` / `setOrder` / `createSessionIn` / `requestNewSession` / `addWorkspace`）、拖拽（`beginDrag` / `acceptOver` / `setOver` / `takeDrop` / `finishDrag` / `finishGroupDrag`）、渲染（`renderToolbar` / `renderSearchBar` / `renderBody` / `renderAccount` / `renderRow` / `renderDropzone` / `renderEmptyState` / `renderPopover` / `renderDialog` / `renderError`）。
- **激活**：`activate(ctx)` 组装 `injected`（`openSession` / `createSession` / `forkSession` / `renameSession` / `archiveSession` / `renameWorkspace` / `deleteWorkspace` / `addWorkspace`）并注册槽位；文件末尾导出 `{ inject, apply }`。

## 常见改动落点

| 想改什么 | 动哪里 |
|---|---|
| 新增 / 修改界面文案 | `STRINGS`（同时给 zh/en）；`locale/*.json` 只在改插件页说明时动 |
| 新增图标 | `strokeIcon`（描边）或 `glyphIcon`（填充），保持 16px 视框 |
| 徽章配色 / 图标 | `BADGE_COLORS` / `BADGE_ICONS`（`ink`+`wash`、`shapes`、zh/en 名称自动进字典） |
| 持久化字段 | `defaultState` + `normalizeState`（含迁移），并走 `usePersistedView` 的写入口 |
| 右键菜单项 | 菜单构造处用 `menuItem` / `menuHeading` / `menuSeparator`，动作落到 mutator 或 `settle(injected.*)` |
| 对话框 | `DIALOG_SPEC` 加一条：`local` 用本地面板 mutator，`remote` 用注入方法，说明文案放 `desc` |
| 拖拽行为 | 先改谓词（`rowOver` / `isHeadOver` / `groupOver` / `sameMarker`），再改 `finishDrag` / `finishGroupDrag` |
| 排序规则 | `recencyOrder` / `accountOrder` / `buildModel`；不要写进渲染层 |
| 会话行视觉 | `SessionRow` + `CSS`；hover 换位用 grid 叠层，别引入额外宽度 |

## 本地开发

1. clone 到任意目录，把该目录以 `link:` 方式装进 DSH profile（Web「插件」页「添加插件」填**绝对路径**最省事），并在插件页启用。
2. 改完**刷新浏览器**（Ctrl+Shift+R）即生效：没有 build、没有 watch、没有编译步骤。
3. 调试：Console 过滤 `workspace-groups:`；槽位是否被别的插件抢占、`priority` 是否被覆盖，都在激活处看。
4. 回退：插件页关掉本插件（或临时改 `priority`），侧栏立刻回内置浏览器，localStorage 数据保留。

## 验证清单（动过渲染 / 派生 / 拖拽才需要跑）

- [ ] 侧栏只剩分组视图：没有内置工作区列表，也没有多余图标或独立页面。
- [ ] 页签切换、折叠、搜索（失焦收起、Esc 清空、无匹配组隐藏）。
- [ ] hover 会话行：时间原位换成归档按钮，标题与行布局不位移；移开复原。
- [ ] 溢出标题 hover 横向滚动到末尾、两侧渐隐；移开复位并恢复省略号；系统「减少动态效果」时直接跳末尾。
- [ ] 六种拖拽：跨组归组并插入、同组排序、拖到「未分组」=移出、拖到空组虚线框=归组、组头调整顺序、项目页签仅同项目内排序。
- [ ] 右键三类对象（会话行 / 组头 / 项目头）菜单项齐全且动作正确；对话框提交与删除生效。
- [ ] 徽章：选色 → 选图标立即生效，搜索过滤、清除、`#` 默认项、旧 emoji 徽章回显都正常；置顶会话排最前、最近更新 / 手动排序切换。
- [ ] 刷新后页签、顺序、折叠、分组与归属不变；v2/v1 旧数据迁移正确；写坏 JSON 时回退默认值。
- [ ] 新建会话：分组 `⊕` 先选工作区（按该工作区最近会话倒序），项目 `⊕` 直接创建。

性能回归用独立的 Node 假宿主装置（React 18 + 300 会话 × 20 组 + Profiler 中位数）跑 A/B，装置不入库；只有改动碰到派生 / 渲染热路径时才需要跑。

## 版本、提交与发布

- 版本在 `package.json.version`，语义化；行为变更 bump，纯文档改动不 bump。
- 提交信息：`<type>(<scope>): <subject>`（feat / fix / refactor / perf / docs / chore），正文用 `- ` 列表说明「改了什么、为什么」。
- 发布：提交 → `git tag -a vX.Y.Z -m "vX.Y.Z"`（tag 与 `version` 一致，带 `v` 前缀）→ `git push origin main --follow-tags`。
- 本地 `link:` 安装改完刷新即生效；Git 安装的实例升级需卸载重装，或 `git pull` 后刷新。

## 禁止

- 不引入依赖、不写相对路径 require、不拆分成多文件。
- 不提交 `node_modules/`、本机绝对路径、token/凭据；文档里的路径用 `~` 或占位符。
- 不在提交信息、代码或文档里写 AI 工具署名。
- 不删除 v1/v2 迁移与损坏回退逻辑，不擅自改存储键。
- 不把颜色写死进 `CSS`，不新增非 `wsg-` 前缀的类名。
