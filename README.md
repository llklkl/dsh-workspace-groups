# 分组视图 (Workspace Groups)

DeepSeek Harness（DSH）Web 端插件。**直接替换**侧栏的「工作区」区域：装好后侧栏里就是分组视图，不再有内置的工作区列表，也没有额外的面板图标或独立页面。

版本 `3.2.0`（tag `v3.2.0`）· MIT · <https://github.com/llklkl/dsh-workspace-groups>

## 功能

### 视图

- **两个页签**：`分组 / 项目`。分组是自定义归类；项目把宿主 Workspaces 原样列成一个一个项目节。
- **排序**：右上「排序方式」切换「最近更新 / 手动排序」（切换时快照当前顺序，仅本浏览器）。
- **搜索**：页签行右侧的搜索图标展开输入框（失焦自动收起），按会话标题或工作区名过滤（不区分大小写）；过滤时自动展开所有分组、隐藏无匹配的分组，拖拽与组排序暂时禁用，Esc 或 ✕ 清空。
- **新建分组 / 添加工作区**：页签行右侧的「新建分组」（项目页签为「添加工作区」）。

### 会话行

- 左键打开会话；固定 14px 行首状态槽（不挤压标题；三种状态与内置一致：进行中转圈、等待交互黄点、未读绿点，多个进行中会话的转圈相位同步）。
- 置顶会话在时间前显示图钉，并始终排在账号最前。
- **hover 换位**：行尾时间隐藏、原位换成归档按钮。时间与按钮叠在同一格里，格宽只等于时间本身——按钮不常驻、不额外占位，标题宽度与行布局都不位移；键盘聚焦同样生效。
- **标题滚动**：标题溢出时 hover（pointer 事件，不受宿主拦截 `mouseover` 影响）横向滚动到末尾并在两侧渐隐；速度按溢出长度自适应（约 2.4s 走完，长标题最快 160px/s、短标题最低沿用内置的 30px/s），滚动期间省略号收起、改用两侧渐隐表示截断；移开立即复位并恢复省略号；系统开启「减少动态效果」时直接跳到末尾。

### 分组与项目

- **分组节**：圆形徽章（默认 `#`，可换常用 emoji）、组名、空心折叠箭头、会话数、`⊕` 新建会话；会话缩进在一条左侧竖线内；空组显示虚线框「新建会话，或拖拽到这里」（图标与组头的聊天气泡加号一致）；组头可上下拖拽调整分组顺序（拖动时显示插入线，被拖组头变淡）。
- **未分组**：没有可见会话时整节隐藏（不再显示 `未分组 0`）；拖拽会话期间临时以组头形式出现，作为「移出分组」的落点。
- **项目节**：每个工作区一节，徽章为文件夹字形，其余结构相同；空项目虚线框只写「新建会话」（会话不能改工作区，所以不支持跨项目拖拽）。
- **新建会话**：分组里的 `⊕` 或空组虚线框先弹工作区选择（按该工作区最近会话倒序）；项目里的 `⊕` 直接在该工作区创建。

### 右键与拖拽

- **会话行**右键 → 移动到分组 / 新建分组并移入 / 移出分组 / 重命名会话 / 分叉会话 / 归档会话。
- **组头**右键 → 重命名分组 / 更换徽章 / 上移 / 下移 / 删除分组。
- **项目头**右键 → 新建会话 / 重命名工作区 / 删除工作区。
- **拖拽**：分组页签内跨组=归组并按落点插入，同组=排序，拖到「未分组」=移出，拖到空组虚线框=归组；拖动组头=调整分组顺序。项目页签仅同项目内排序（工作区顺序属于宿主，不可拖）。
- **已归档**：侧栏里始终不显示；取消归档请用内置的归档入口（命令面板 / 会话内操作）。

## 安装

**环境**：DSH Web（本插件只提供浏览器端，`dsh.client.platform = "web"`）。不需要 Node 依赖，也没有构建步骤。

### 方式一：Web「插件」页（推荐）

1. 侧栏打开「插件」（Plugins）页，点「添加插件」（Add plugin）。
2. 包名输入框接受 **npm 包名 / Git 地址 / tarball / 本地目录绝对路径**。填：

   ```text
   https://github.com/llklkl/dsh-workspace-groups
   ```

   想改代码即时生效的话，先 clone 再把本地仓库的绝对路径填进去（等价于 `link:` 安装）。
3. 安装完成点「立即启用」（Enable now），侧栏立刻变成分组视图；若 profile 未启用 HMR，重启 `dsh web` 后生效。

### 方式二：CLI

```bash
git clone https://github.com/llklkl/dsh-workspace-groups.git ~/src/dsh-workspace-groups
dsh plugin --profile web add link:$HOME/src/dsh-workspace-groups
```

锁定版本（tag）：

```bash
dsh plugin --profile web add "github:llklkl/dsh-workspace-groups#v3.2.0"
```

`dsh plugin` 只装依赖、不选层；装完到「插件」页启用（或往 profile `package.json` 的 `dsh.profile.bundles` 数组追加 `@local/dsh-workspace-groups`，再重启）。profile 名默认 `web`，按你实际使用的 profile 替换。

### 方式三：会话里用工具装（可选）

在能调用 `plugin_manager` 的会话里：

```text
plugin_manager install_bundle  target: "link:/abs/path/dsh-workspace-groups"
```

Git 地址同理；`install_bundle` 会顺手启用。

### 生效、升级与卸载

| 场景 | 做法 |
|---|---|
| 本地 `link:` 安装 | 改仓库代码 → 刷新页面即生效，不用重装 |
| Git 安装升级 | 卸载后重装，或在 clone 目录 `git pull` 后刷新 |
| 禁用 / 卸载 | 「插件」页关掉开关或移除 → 侧栏立刻恢复内置工作区列表；分组数据留在 localStorage，重新启用即恢复 |

> 本插件暂未发布到 npm；版本以仓库 tag 为准（当前 `v3.2.0`）。

## 排错

- **侧栏仍是内置列表**：Console 里搜 `workspace-groups: activation failed;`（激活异常已兜底，不会白屏），或确认插件行没被其它 patch 禁用。
- **另一个插件也接管侧栏**：`sidebar.workspaces` 是单槽位，按最低 priority 生效；本插件用 `-1` 遮蔽内置（内置在 0），两个接管插件不能共存。
- **分组不见 / 顺序回到默认**：数据只在本浏览器 localStorage；损坏时自动回退默认值，Console 会有 `reading saved state failed`。

## 数据

- 键 `dsh.workspace-groups.v3`，浏览器 localStorage；字段：`tab`、`orderBy`、`groupExpansion`、`sessionOrder`、`groups[{id,name,badge}]`、`assignment`。
- 首次加载会迁移旧记录：v2（侧栏接管版）→ 分组方式映射为页签、账号键加 `project:` 前缀、分组补默认徽章；v1 → 同样映射。迁移结果在首次挂载时写回 v3。
- 损坏或禁用 localStorage 时回退默认值（分组页签、最近更新、全部展开）。
- 搜索词、弹层位置等是内存态，不落盘。不写会话日志、不对模型可见、不跨浏览器同步。

## 与内置的差异

- 内置的「视图选项」菜单（分组方式 / 归档筛选）由页签与「始终隐藏已归档」取代；工作区行拖拽排序、目录浏览流程、会话行 hover 操作按钮不再提供（新建会话改由 `⊕` + 工作区选择弹层完成）。
- 内置的搜索（跨标题/内容模糊匹配）由本地子串搜索取代。
- 「未分组」只在分组页签出现，项目页签只列工作区。

## 实现约束（开发者）

- 仅浏览器半成品：`index.js` 是空 `apply()`；行只为激活 Client 模块图与插件清单。
- 注册 `sidebar.workspaces`（**priority: -1**）遮蔽内置浏览器：单槽位按最低 priority 生效，内置在 0，负数即替换；不声明内置的 `sidebar.workspaces.directoryFlow` / `.session.menu.item` / `.session.row.action` / `sidebar.session.row.leading` / `.hover` 子槽位，因此这些扩展点在本插件接管期间不可用。
- 不再注册 `sidebar.panellist` 与 `main`：没有独立页面，也没有额外图标。
- `apply` 有 try/catch 兜底：激活失败只在控制台报 `workspace-groups: activation failed…`，此时槽位保持内置浏览器，不影响整页 boot。
- 只从冻结模块表取 `react`；样式只用 `--dsw-*` 主题 token，文案走自有 `workspace-groups` 字典（zh/en）。

完整约定、代码地图与验证清单见 [AGENTS.md](AGENTS.md)。

## 实现与性能

3.2.0 做过一轮全量优化：

- **共享工具层**：`classes()` 拼类名、`svgIcon()` 统一 16px 图标外壳、`originAt`/`originUnder` 统一浮层定位、`dropHalf`/`rowOver`/`isHeadOver`/`groupOver`/`sameMarker` 统一拖拽落点、`isRecord()` 统一持久化校验；浮层间距、最小高度、空值哨兵集中为常量。
- **面板钩子**：`usePersistedView`（读取 + 迁移 + 首次写回）、`useLayerDismissal`（浮层与对话框共用一个 document 监听）、`useDocumentDragAccept`（拖拽期间放行整页落点）取代原先 5 个内联 effect。
- **状态与数据**：宿主 store 改为细粒度切片订阅（`ids`/`byId`/`phase`、`items`/`archivedSessionIds`/`pinnedSessionIds`），无关更新不再重建派生数据；分组模型改为单趟分桶（O(会话数)，原先是组数 × 会话数）；搜索索引只在搜索打开时构建；新会话选择器的工作区排序下沉到弹层打开时；翻译函数不再进入 memo 依赖（改用已解析的文案）。
- **渲染**：行元素按原始值签名复用（`rowCacheRef`），命中时 React 直接跳过该行子树；相对时间按「时间戳 + 分钟 + 语言」缓存；行级文案每次渲染只解析一次。
- **规范化**：菜单项与对话框全部表驱动（`DIALOG_SPEC` 带 `local`/`remote` 提交目标，`menuItem`/`menuHeading`/`menuSeparator` 为模块级构造器）；命名统一（`settle` 处理 Promise、菜单项字段 `action`）；JSDoc 覆盖全部助手；浮层定位统一走 `originAt`/`originUnder`，水平与垂直都夹在视口内（含上边界），极矮视口下浮层不再跑到屏幕外。
- **性能（300 会话 × 20 组，测试装置 A/B，5 次中位数，React 18 开发版）**：50 次 store 更新 115.3 → 82.2 ms（-28.7%）；宿主重渲染 20 次 43.9 → 34.5 ms（-21.4%）；同目标 dragover 50 次 4.7 → 3.9 ms（-17.0%）；弹窗输入 5 次 14.4 → 11.6 ms（-19.4%）；搜索输入 5 次 33.5 → 32.2 ms（-3.9%）；首屏挂载 41.4 → 38.7 ms（-6.5%，多次运行波动 6–22%）。
- **等价性验证**：同一装置对 30 个交互状态做 DOM 快照比对（挂载、hover 换位、标题滚动、右键菜单、徽章、排序、新建与重命名对话框、折叠、搜索、六种拖拽、键盘、持久化）全部一致；v1/v2 迁移与损坏数据回退结果一致；另在隔离宿主 + 无头 Edge 的真实环境中冒烟 12 项通过（含重命名、滚动、归档、右键菜单、搜索、对话框、拖拽排序、刷新后保持）。

## 许可

[MIT](LICENSE) © 2026 llklkl。仓库：<https://github.com/llklkl/dsh-workspace-groups>，版本 tag：`v3.2.0`。
