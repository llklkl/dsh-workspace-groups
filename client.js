/**
 * Workspace Groups — the browser half of the bundle.
 *
 * Replaces the sidebar's workspace region: one `sidebar.workspaces`
 * registration at a negative priority shadows the shipped workspace browser,
 * so the sidebar itself now shows the grouped view (the built-in list, its view
 * options and its archive filter are gone; its search returns below).
 *
 * The region has two tabs over the same row language: user-defined groups
 * (`groups`) and the Host's Workspaces as projects (`projects`), plus a local
 * session search. Session operations live in the row context menu; manual
 * ordering is browser-local, exactly like the shipped sidebar. Only viewing
 * state is stored, in this browser's localStorage; nothing is written to
 * session logs.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-workspace-groups',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'workspace-groups'
    const STORAGE_KEY = 'dsh.workspace-groups.v3'
    const LEGACY_V2_KEY = 'dsh.workspace-groups.v2'
    const LEGACY_V1_KEY = 'dsh.workspace-groups.v1'
    /** Sessions outside every Workspace use this account key. */
    const UNGROUPED_KEY = ''
    const GROUP_PREFIX = 'group:'
    const PROJECT_PREFIX = 'project:'
    const DEFAULT_BADGE = '#'
    /** Badge choices offered when creating a group or changing its badge. */
    const BADGE_CHOICES = [
      '#',
      '📁', '📌', '🚀', '🧪', '🐞', '📝', '💡', '🎯', '🔧', '📦',
      '🧭', '🗂️', '📊', '🧩', '🛒', '💬', '⚙️', '🧠', '🌱', '🔥',
      '⭐', '✅', '🧾', '🧵', '🏷️', '🧮', '🌍',
    ]
    const MENU_WIDTH = 208
    const PICKER_WIDTH = 232
    /** Duration of the running spin; mirrors the `wsg-spin` keyframes. */
    const SPIN_MS = 1500
    /** A clipped title crawls on hover, with the shipped sidebar's feel. */
    const MIN_TITLE_REVEAL_PX = 8
    const TITLE_MARQUEE_PX_PER_MS = 0.03
    /** A long title must not crawl for many seconds: the speed follows the range. */
    const TITLE_MARQUEE_FAST_PX_PER_MS = 0.16
    const TITLE_MARQUEE_TARGET_MS = 2400
    const TABS = ['groups', 'projects']
    const ORDERS = ['updated', 'manual']

    /** All copy in one table: `[zh, en]` per key, so the two languages cannot drift. */
    const STRINGS = {
      'tab.groups':               ['分组', 'Groups'],
      'tab.projects':             ['项目', 'Projects'],
      'search.placeholder':       ['搜索会话', 'Search sessions'],
      'search.open':              ['搜索', 'Search'],
      'search.close':             ['关闭搜索', 'Close search'],
      'search.empty':             ['没有匹配的会话', 'No matching sessions'],
      'sort.label':               ['排序方式', 'Sort by'],
      'sort.updated':             ['最近更新', 'Last updated'],
      'sort.manual':              ['手动排序', 'Manual order'],
      'account.ungrouped':        ['未分组', 'Ungrouped'],
      'group.create':             ['新建分组', 'New group'],
      'group.rename':             ['重命名分组', 'Rename group'],
      'group.badge':              ['更换徽章', 'Change badge'],
      'group.badgeTitle':         ['选择徽章', 'Choose a badge'],
      'group.moveUp':             ['上移', 'Move up'],
      'group.moveDown':           ['下移', 'Move down'],
      'group.delete':             ['删除分组', 'Delete group'],
      'group.deleteDesc':         ['删除「{name}」后，组内会话会回到「未分组」。', 'Deleting "{name}" returns its sessions to Ungrouped.'],
      'group.defaultName':        ['新分组', 'New group'],
      'group.emptyTitle':         ['还没有分组', 'No groups yet'],
      'group.emptyHint':          ['建一个分组，再把会话拖进去，或在会话右键菜单里「移动到分组」。', 'Create a group, then drag sessions in or use the row context menu.'],
      'session.new':              ['新会话', 'New session'],
      'session.create':           ['新建会话', 'New session'],
      'session.rename':           ['重命名会话', 'Rename session'],
      'session.fork':             ['分叉会话', 'Fork session'],
      'session.archive':          ['归档会话', 'Archive session'],
      'session.moveTo':           ['移动到分组', 'Move to group'],
      'session.moveToNew':        ['新建分组并移入', 'New group and move here'],
      'session.removeFromGroup':  ['移出分组', 'Remove from group'],
      'project.newSession':       ['新建会话', 'New session'],
      'workspace.rename':         ['重命名工作区', 'Rename workspace'],
      'workspace.delete':         ['删除工作区', 'Delete workspace'],
      'workspace.deleteDesc':     ['将把「{name}」从工作区列表移除；文件夹与会话记录都会保留，其会话会显示在「未分组」下。', 'Removes "{name}" from the workspace list; the folder and session logs stay, and its sessions move to Ungrouped.'],
      'workspace.add':            ['添加工作区', 'Add workspace'],
      'workspace.none':           ['还没有工作区', 'No workspaces yet'],
      'workspace.noneHint':       ['先添加一个工作区，再用它承载会话。', 'Add a workspace first; sessions live inside one.'],
      'workspace.pickTitle':      ['在哪个工作区新建会话', 'Create the session in'],
      'workspace.default':        ['默认工作区', 'Default workspace'],
      'dropzone.newOrDrop':       ['新建会话，或拖拽到这里', 'New session, or drop here'],
      'dropzone.newOnly':         ['新建会话', 'New session'],
      'empty.sessions':           ['还没有会话', 'No sessions yet'],
      'dialog.cancel':            ['取消', 'Cancel'],
      'dialog.create':            ['创建', 'Create'],
      'dialog.save':              ['保存', 'Save'],
      'dialog.delete':            ['删除', 'Delete'],
      'loading':                  ['加载中…', 'Loading…'],
      'error.dismiss':            ['关闭提示', 'Dismiss this notice'],
      'time.justNow':             ['刚刚', 'just now'],
      'status.running':           ['进行中', 'Running'],
      'status.completed':         ['已完成', 'Completed'],
      'status.waitingApproval':   ['等待审批', 'Waiting for approval'],
      'status.planReview':        ['计划待审', 'Plan awaiting review'],
      'status.waitingAnswer':     ['等待回答', 'Waiting for answer'],
      'time.minutes':             ['{n}分钟', '{n}min'],
      'time.hours':               ['{n}小时', '{n}h'],
      'time.days':                ['{n}天', '{n}d'],
    }

    const ZH = Object.fromEntries(Object.entries(STRINGS).map(([key, pair]) => [key, pair[0]]))
    const EN = Object.fromEntries(Object.entries(STRINGS).map(([key, pair]) => [key, pair[1]]))

    /** Page styles: only host theme tokens carry color; class names are prefixed. */
    const CSS = `
.wsg-panel{box-sizing:border-box;display:flex;flex-direction:column;flex:1;min-height:0;padding:2px 8px 8px;color:var(--dsw-alias-label-primary);font-size:14px;line-height:20px}
.wsg-toolbar{display:flex;align-items:center;gap:2px;flex:none;padding-bottom:6px;min-width:0}
.wsg-tabs{display:inline-flex;align-items:center;gap:2px;padding:2px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-layer-2)}
.wsg-tab{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 8px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.wsg-tab:hover{color:var(--dsw-alias-label-primary)}
.wsg-session:hover,.wsg-session-current,.wsg-account-head:hover,.wsg-menu-item:hover,.wsg-btn:hover,.wsg-inline-btn:hover,.wsg-badge-cell:hover{background:var(--dsw-alias-interactive-bg-hover)}
.wsg-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.wsg-tab-active{background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-soft);color:var(--dsw-alias-label-primary)}
.wsg-tab:focus-visible,.wsg-icon-btn:focus-visible,.wsg-session:focus-visible,.wsg-account-head:focus-visible,.wsg-add:focus-visible,.wsg-dropzone:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:-2px}
.wsg-tab-hash{display:inline-flex;align-items:center;justify-content:center;width:12px;height:12px;font-size:13px;font-weight:600;line-height:1}
.wsg-head-spacer{flex:1;min-width:0}
.wsg-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;flex:none;padding:0;border:0;border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.wsg-searchbar{display:flex;align-items:center;gap:6px;flex:1;min-width:0;height:28px;padding:0 8px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-3)}
.wsg-searchbar:focus-within{border-color:var(--dsw-alias-brand-primary)}
.wsg-search-icon{display:inline-flex;align-items:center;justify-content:center;flex:none;color:var(--dsw-alias-label-tertiary)}
.wsg-search-input{flex:1;min-width:0;height:100%;border:0;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px}
.wsg-search-input::placeholder{color:var(--dsw-alias-label-dimmed)}
.wsg-search-clear{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex:none;padding:0;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.wsg-search-clear:hover{color:var(--dsw-alias-label-primary)}
.wsg-body{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding-right:2px}
.wsg-account{margin-bottom:4px}
.wsg-account-head{box-sizing:border-box;position:relative;display:flex;align-items:center;gap:6px;height:30px;padding:0 2px;border-radius:var(--dsw-radius-md);cursor:pointer;user-select:none}
.wsg-badge{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;flex:none;border-radius:50%;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1}
.wsg-badge-project{color:var(--dsw-alias-label-tertiary)}
.wsg-account-title{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:20px}
.wsg-chevron{display:inline-flex;align-items:center;justify-content:center;width:12px;height:12px;flex:none;margin-left:-2px;color:var(--dsw-alias-label-tertiary);opacity:.75}
.wsg-chevron-open{transform:rotate(90deg)}
.wsg-count{flex:none;min-width:14px;text-align:right;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.wsg-add{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;flex:none;padding:0;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.wsg-add:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
.wsg-rail{display:flex;flex-direction:column;margin:0 0 4px 10px;padding-left:2px;border-left:1px solid var(--dsw-alias-border-l2)}
.wsg-session{box-sizing:border-box;position:relative;display:flex;align-items:center;height:30px;padding:0 2px 0 16px;border-radius:var(--dsw-radius-md);cursor:pointer;user-select:none;color:var(--dsw-alias-label-primary)}
.wsg-session-title{flex:1;min-width:0;margin:0 6px 0 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;line-height:20px}
.wsg-session-title[data-scrolled]{mask-image:linear-gradient(90deg,#0000,#000 12px)}
.wsg-session-title[data-clipped]{mask-image:linear-gradient(270deg,#0000,#000 12px)}
.wsg-session-title[data-scrolled][data-clipped]{mask-image:linear-gradient(90deg,#0000,#000 12px calc(100% - 12px),#0000)}
/* While crawling, the ellipsis would sit on top of the text being revealed. */
.wsg-session-title[data-marquee]{text-overflow:clip}
/* Time and archive share one grid cell: the cell is exactly as wide as the
   time, so the archive button never adds width and the row never shifts. */
.wsg-row-tail{display:grid;flex:none;align-items:center;justify-items:end}
.wsg-row-tail>*{grid-area:1/1}
.wsg-time{font-size:10px;line-height:16px;color:var(--dsw-alias-label-tertiary)}
.wsg-row-action{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-tertiary);opacity:0;pointer-events:none;cursor:pointer}
.wsg-row-action:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
.wsg-session:hover .wsg-row-action,.wsg-session:focus-within .wsg-row-action{opacity:1;pointer-events:auto}
.wsg-session:hover .wsg-time,.wsg-session:focus-within .wsg-time{visibility:hidden}
.wsg-row-action:focus-visible{opacity:1;pointer-events:auto;outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:-2px}
.wsg-status{position:absolute;left:0;top:50%;transform:translateY(-50%);display:inline-flex;align-items:center;justify-content:center;width:14px;pointer-events:none}
.wsg-state{position:relative;display:inline-block;flex:none;width:10px;height:10px}
.wsg-state:after{content:'';position:absolute;inset:20%;border-radius:50%;background:currentColor}
.wsg-state[data-state=done]{color:var(--dsw-alias-state-success-primary)}
.wsg-state[data-state=warning]{color:var(--dsw-alias-state-warn-primary)}
.wsg-spinner{flex:none;width:14px;height:14px;color:var(--dsw-alias-label-tertiary)}
.wsg-spinner-track,.wsg-spinner-arc{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.wsg-spinner-track{opacity:.25}
.wsg-spinner-arc{stroke-dasharray:12 150}
.wsg-spinner-motion{transform-origin:center;animation:wsg-spin 1.5s linear infinite}
.wsg-visually-hidden{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
@keyframes wsg-spin{to{transform:rotate(1turn)}}
@media (prefers-reduced-motion:reduce){.wsg-spinner-motion{animation:none}}
.wsg-pin{display:inline-flex;align-items:center;justify-content:center;width:14px;height:16px;flex:none;margin-right:2px;color:var(--dsw-alias-label-caption)}
.wsg-drop-before:before,.wsg-drop-after:after{content:'';position:absolute;left:6px;right:6px;height:2px;border-radius:1px;background:var(--dsw-alias-brand-primary)}
.wsg-drop-before:before{top:-1px}
.wsg-drop-after:after{bottom:-1px}
.wsg-drop-head{background:var(--dsw-alias-interactive-bg-hover);box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary)}
.wsg-head-drop-before:before,.wsg-head-drop-after:after{content:'';position:absolute;left:2px;right:2px;height:2px;border-radius:1px;background:var(--dsw-alias-brand-primary);pointer-events:none}
.wsg-head-drop-before:before{top:-1px}
.wsg-head-drop-after:after{bottom:-1px}
.wsg-dragging{opacity:.5}
.wsg-dropzone{display:flex;align-items:center;justify-content:center;gap:4px;width:100%;min-height:44px;margin:2px 0 4px;padding:6px;border:1px dashed var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:12px;line-height:17px;cursor:pointer}
.wsg-dropzone:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-secondary)}
.wsg-dropzone-active{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-interactive-bg-hover)}
.wsg-empty-state{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:16px 2px 20px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.wsg-empty-title{font-size:13px;color:var(--dsw-alias-label-primary)}
.wsg-empty-hint{color:var(--dsw-alias-label-tertiary)}
.wsg-inline-btn{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer}
.wsg-popover{position:fixed;z-index:60;box-sizing:border-box;padding:4px;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg);background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-prominent);overflow-y:auto}
.wsg-menu-heading{display:flex;align-items:center;height:24px;padding:0 8px;font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary)}
.wsg-menu-sep{height:1px;margin:4px 6px;background:var(--dsw-alias-border-l1)}
.wsg-menu-item{display:flex;align-items:center;gap:8px;width:100%;min-height:32px;padding:4px 8px;border:0;border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer;white-space:nowrap;overflow:hidden}
.wsg-menu-item-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.wsg-menu-item-check{display:inline-flex;width:16px;flex:none;justify-content:center;color:var(--dsw-alias-brand-primary)}
.wsg-menu-item-danger{color:var(--dsw-alias-state-error-primary)}
.wsg-menu-item:disabled{color:var(--dsw-alias-state-idle-primary);background:transparent;cursor:default}
.wsg-menu-icon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:20px;flex:none;color:var(--dsw-alias-label-secondary)}
.wsg-menu-badge{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1}
.wsg-badge-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:4px 0;width:100%}
.wsg-badge-cell{display:inline-flex;align-items:center;justify-content:center;width:100%;height:36px;padding:0;border:1px solid transparent;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);font-size:20px;line-height:1;cursor:pointer}
.wsg-badge-cell-active{border-color:var(--dsw-alias-brand-primary)}
.wsg-modal-layer{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center}
.wsg-modal-scrim{position:absolute;inset:0;background:var(--dsw-alias-bg-mask-1);backdrop-filter:var(--dsw-mask-blur)}
.wsg-modal{position:relative;box-sizing:border-box;width:min(380px,calc(100vw - 32px));padding:20px;display:flex;flex-direction:column;gap:12px;border:0;border-radius:var(--dsw-radius-panel);background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-prominent)}
.wsg-modal-title{font-size:14px;font-weight:600}
.wsg-modal-desc{font-size:12px;line-height:17px;color:var(--dsw-alias-label-secondary)}
.wsg-modal-label{font-size:12px;line-height:17px;color:var(--dsw-alias-label-tertiary)}
.wsg-modal-error{font-size:12px;line-height:17px;color:var(--dsw-alias-state-error-primary)}
.wsg-input{box-sizing:border-box;height:36px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;outline:none}
.wsg-input:focus-visible{border-color:var(--dsw-alias-brand-primary)}
.wsg-input::placeholder{color:var(--dsw-alias-label-dimmed)}
.wsg-modal-actions{display:flex;justify-content:flex-end;gap:8px}
.wsg-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 14px;border:0;border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;cursor:pointer}
.wsg-btn-accent{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}
.wsg-btn-accent:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
.wsg-btn-danger{border:.5px solid var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.wsg-btn:disabled{opacity:.4;background:transparent;color:var(--dsw-alias-label-primary);cursor:not-allowed}
.wsg-error{display:flex;align-items:flex-start;gap:6px;margin:0 0 8px;padding:6px 8px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:var(--dsw-radius-md);font-size:12px;line-height:17px;color:var(--dsw-alias-state-error-primary)}
.wsg-error-text{flex:1;min-width:0;overflow-wrap:anywhere}
`

    // ---- icons (hand-drawn: this plugin never imports the UI primitives) -----

    /** Stroke icon from path strings or `{cx,cy,r}` circles. */
    function strokeIcon(size, shapes) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        shapes.map((shape, index) => (typeof shape === 'string'
          ? h('path', { key: index, d: shape })
          : h('circle', { key: index, ...shape }))),
      )
    }

    /**
     * Draw one of the host's own 16px glyphs from its path data, so icons of the
     * shipped workspace browser match pixel for pixel.
     * @param size - rendered square size in px.
     * @param paths - `{d, fill}` entries; `fill` paints the shape instead of stroking it.
     * @returns the svg element.
     */
    function glyphIcon(size, paths) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.1,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        paths.map((path, index) => (path.fill === true
          ? h('path', { key: index, d: path.d, fill: 'currentColor', stroke: 'none' })
          : h('path', { key: index, d: path.d, stroke: 'currentColor' }))),
      )
    }

    /** The shipped workspace browser's folder glyph (IconFolderCloseRegular). */
    const IconFolder = size => glyphIcon(size, [
      { d: 'M1.50439 3.11059C1.50439 2.55831 1.95211 2.1106 2.50439 2.1106H5.43389C5.67773 2.1106 5.91318 2.19969 6.09593 2.36113L7.71649 3.79265C7.89924 3.95409 8.1347 4.04319 8.3785 4.04319H13.4958C14.0481 4.04319 14.4958 4.4909 14.4958 5.04319V12.8894C14.4958 13.4417 14.0481 13.8894 13.4958 13.8894H2.50439C1.95211 13.8894 1.50439 13.4417 1.50439 12.8894V4.04319V3.11059Z' },
      { d: 'M3.63501 7.66614H12.3647' },
    ])

    /** The shell's new-session glyph (IconNewChatOutlineRegular): chat bubble plus sign. */
    const IconNewChat = size => glyphIcon(size, [
      { d: 'M2.37091 11.2501C1.58745 9.89288 1.32067 8.29835 1.61969 6.76006C1.91872 5.22177 2.76342 3.8433 3.99826 2.87846C5.2331 1.91362 6.77494 1.42737 8.33988 1.50925C9.90482 1.59113 11.3875 2.23562 12.5149 3.32406C13.6425 4.41269 14.3387 5.87206 14.4754 7.4334C14.612 8.99474 14.18 10.5529 13.2587 11.8209C12.3375 13.0888 10.9891 13.9813 9.46194 14.3337C8.18691 14.628 6.85895 14.5294 5.64989 14.0605C5.1712 13.8748 4.76962 13.4932 4.26534 13.3967C3.67413 13.2835 2.95257 13.5598 2.03794 14.3337' },
      { d: 'M8 5V11' },
      { d: 'M5 8H11' },
    ])

    /** The shipped workspace browser's add-project glyph (IconProjectAddOutlineRegular). */
    const IconProjectAdd = size => glyphIcon(size, [
      { d: 'M5.54492 2.06738C5.91034 2.06754 6.26318 2.20149 6.53711 2.44336L7.94043 3.68164V4.7998C7.71462 4.74105 7.50367 4.63139 7.32617 4.47461L5.87598 3.19238C5.78477 3.11185 5.66658 3.06754 5.54492 3.06738H2.94922C2.67322 3.06738 2.44946 3.29145 2.44922 3.56738V12.4326C2.44927 12.7087 2.67311 12.9326 2.94922 12.9326H12.9326C13.2086 12.9325 13.4326 12.7086 13.4326 12.4326V8.53613H14.4326V12.4326C14.4326 13.2609 13.7609 13.9325 12.9326 13.9326H2.94922C2.12083 13.9326 1.44927 13.261 1.44922 12.4326V3.56738C1.44946 2.73916 2.12094 2.06738 2.94922 2.06738H5.54492Z', fill: true },
      { d: 'M9.75977 4.50208H14.5509' },
      { d: 'M12.1492 6.89758L12.1492 2.10642' },
    ])

    const IconPlus = size => strokeIcon(size, ['M8 3v10', 'M3 8h10'])

    const IconChevron = () => strokeIcon(12, ['m6 3.5 4.5 4.5L6 12.5'])

    const IconSortArrows = () => strokeIcon(16, ['m5.4 5.6 2.6-2.6 2.6 2.6', 'm5.4 10.4 2.6 2.6 2.6-2.6'])

    const IconSearch = size => strokeIcon(size, [{ cx: 6.8, cy: 6.8, r: 4.4 }, 'm10.2 10.2 3.4 3.4'])

    const IconClock = () => strokeIcon(16, [{ cx: 8, cy: 8, r: 5.4 }, 'M8 5v3.3l2 1.2'])

    const IconCheck = () => strokeIcon(14, ['m3.5 8.4 2.9 2.9 6.1-6.1'])

    const IconClose = size => strokeIcon(size, ['m4 4 8 8', 'm12 4-8 8'])

    const IconPin = () => strokeIcon(13, ['M4.8 2.9h6.4v10.2L8 10.7l-3.2 2.4z'])

    /** The shipped workspace browser's archive glyph (IconArchiveOutlineRegular). */
    const IconArchive = size => glyphIcon(size, [
      { d: 'M13.5 2.5H2.5C1.94772 2.5 1.5 2.94772 1.5 3.5V4.5C1.5 5.05228 1.94772 5.5 2.5 5.5H13.5C14.0523 5.5 14.5 5.05228 14.5 4.5V3.5C14.5 2.94772 14.0523 2.5 13.5 2.5Z' },
      { d: 'M2.5 5.5V13.5C2.5 13.7652 2.60536 14.0196 2.79289 14.2071C2.98043 14.3946 3.23478 14.5 3.5 14.5H12.5C12.7652 14.5 13.0196 14.3946 13.2071 14.2071C13.3946 14.0196 13.5 13.7652 13.5 13.5V5.5' },
      { d: 'M6.5 9.5H9.5' },
    ])

    // ---- persisted viewing state (v3) -------------------------------------

    /** Empty persisted state. */
    function defaultState() {
      return { version: 3, tab: 'groups', orderBy: 'updated', groupExpansion: {}, sessionOrder: {}, groups: [], assignment: {} }
    }

    /** One of the allowed enum values, or its fallback. */
    function pick(value, allowed, fallback) {
      return typeof value === 'string' && allowed.includes(value) ? value : fallback
    }

    /** A usable badge string (emoji or the default glyph). */
    function normalizeBadge(value) {
      if (typeof value !== 'string') return DEFAULT_BADGE
      const trimmed = value.trim()
      if (trimmed === '' || trimmed.length > 8) return DEFAULT_BADGE
      return trimmed
    }

    /** Copy the entries of a raw record that `keep` accepts; `undefined` drops one. */
    function mapRecord(raw, keep) {
      const out = {}
      if (raw === null || typeof raw !== 'object') return out
      for (const [key, value] of Object.entries(raw)) {
        const mapped = keep(value, key)
        if (mapped !== undefined) out[key] = mapped
      }
      return out
    }

    /** A session-order array, dropping unknown members. */
    function orderArray(value) {
      if (!Array.isArray(value)) return undefined
      const ids = value.filter(id => typeof id === 'string')
      return ids.length > 0 ? ids : undefined
    }

    /** Normalize one complete state record; every malformed member falls back. */
    function normalizeState(raw) {
      if (raw === null || typeof raw !== 'object') return defaultState()
      const seen = new Set()
      const groups = (Array.isArray(raw.groups) ? raw.groups : []).flatMap((group) => {
        if (group === null || typeof group !== 'object') return []
        if (typeof group.id !== 'string' || typeof group.name !== 'string' || group.id === '' || group.name === '') return []
        if (seen.has(group.id)) return []
        seen.add(group.id)
        return [{ id: group.id, name: group.name, badge: normalizeBadge(group.badge) }]
      })
      return {
        version: 3,
        tab: pick(raw.tab, TABS, 'groups'),
        orderBy: pick(raw.orderBy, ORDERS, 'updated'),
        groups,
        assignment: mapRecord(raw.assignment, owner => (typeof owner === 'string' && seen.has(owner) ? owner : undefined)),
        groupExpansion: mapRecord(raw.groupExpansion, value => (typeof value === 'boolean' ? value : undefined)),
        sessionOrder: mapRecord(raw.sessionOrder, orderArray),
      }
    }

    /** The v2 record's account keys predate the projects tab. */
    function fromV2(raw) {
      if (raw === null || typeof raw !== 'object') return null
      return {
        ...raw,
        tab: raw.groupBy === 'custom' ? 'groups' : 'projects',
        sessionOrder: Object.fromEntries(Object.entries(raw.sessionOrder ?? {})
          .filter(([key]) => key !== '__flat__')
          .map(([key, order]) => [key === UNGROUPED_KEY || key.startsWith(GROUP_PREFIX) ? key : PROJECT_PREFIX + key, order])),
      }
    }

    /** The v1 record stored collapsed keys instead of expansion flags. */
    function fromV1(raw) {
      if (raw === null || typeof raw !== 'object') return null
      return {
        ...raw,
        tab: raw.view === 'groups' ? 'groups' : 'projects',
        orderBy: 'updated',
        sessionOrder: {},
        groupExpansion: Object.fromEntries(Object.entries(raw.collapsed ?? {})
          .filter(([key, value]) => key !== 'archived' && typeof value === 'boolean')
          .map(([key, value]) => [
            (key.startsWith('ws:') ? PROJECT_PREFIX + key.slice(3) : key) === '__ungrouped__'
              ? UNGROUPED_KEY
              : (key.startsWith('ws:') ? PROJECT_PREFIX + key.slice(3) : key),
            value,
          ])),
      }
    }

    /** Read the persisted page state, migrating older records, never failing hard. */
    function loadState() {
      try {
        const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
        if (raw !== null && raw !== undefined) return normalizeState(JSON.parse(raw))
        const v2 = globalThis.localStorage?.getItem(LEGACY_V2_KEY)
        if (v2 !== null && v2 !== undefined) return normalizeState(fromV2(JSON.parse(v2)))
        const v1 = globalThis.localStorage?.getItem(LEGACY_V1_KEY)
        if (v1 !== null && v1 !== undefined) return normalizeState(fromV1(JSON.parse(v1)))
        return defaultState()
      } catch (error) {
        console.warn('workspace-groups: reading saved state failed', error)
        return defaultState()
      }
    }

    /** Persist the page state; a storage failure only disables persistence. */
    function persistState(state) {
      try {
        globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        console.warn('workspace-groups: saving state failed', error)
      }
    }

    let groupSequence = 0

    /** Fresh group identity. */
    function newGroupId() {
      groupSequence += 1
      const cryptoApi = globalThis.crypto
      if (cryptoApi !== undefined && typeof cryptoApi.randomUUID === 'function') {
        return 'g-' + cryptoApi.randomUUID()
      }
      return 'g-' + Date.now().toString(36) + '-' + groupSequence
    }

    /** One readable message out of a rejection. */
    function errorText(reason) {
      if (reason instanceof Error && reason.message !== '') return reason.message
      if (typeof reason === 'string' && reason !== '') return reason
      if (reason !== null && typeof reason === 'object' && typeof reason.message === 'string') return reason.message
      return String(reason)
    }

    // ---- derivations -------------------------------------------------------

    /** Whether one catalog row may render as a row (archived rows never render). */
    function sessionVisible(summary, currentId, archived) {
      if (summary === undefined || summary === null) return false
      if (summary.origin === 'subagent') return false
      if (summary.blank === true && summary.id !== currentId) return false
      return !archived.has(summary.id)
    }

    /** Whether one catalog row may belong to an account at all. */
    function sessionEligible(summary, currentId) {
      if (summary === undefined || summary === null) return false
      if (summary.origin === 'subagent') return false
      if (summary.blank === true && summary.id !== currentId) return false
      return true
    }

    /** Rank map for the registry-global pin set, most recently pinned first. */
    function pinRanks(pinnedSessionIds) {
      const ranks = new Map()
      for (const id of pinnedSessionIds ?? []) {
        if (!ranks.has(id)) ranks.set(id, ranks.size)
      }
      return ranks
    }

    /** Newest first, with session identity as the deterministic tie-break. */
    function recencyOrder(members, byId) {
      return [...members].sort((left, right) => {
        const leftUpdated = byId[left]?.updatedAt ?? 0
        const rightUpdated = byId[right]?.updatedAt ?? 0
        if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated
        return left < right ? -1 : 1
      })
    }

    /** Pinned first (pin order), then the selected blank, then the base order. */
    function partitioned(base, byId, ranks, currentId) {
      const pinned = []
      const blanks = []
      const rest = []
      for (const id of base) {
        if (ranks.has(id)) pinned.push(id)
        else if (byId[id]?.blank === true && id === currentId) blanks.push(id)
        else rest.push(id)
      }
      pinned.sort((left, right) => (ranks.get(left) ?? 0) - (ranks.get(right) ?? 0))
      return [...pinned, ...blanks, ...rest]
    }

    /** One account's order: saved manual positions (new members by recency), else recency. */
    function accountOrder(members, saved, byId, ranks, currentId) {
      let base
      if (Array.isArray(saved)) {
        const known = new Set(members)
        const seen = new Set()
        base = []
        for (const id of saved) {
          if (!known.has(id) || seen.has(id)) continue
          base.push(id)
          seen.add(id)
        }
        for (const id of recencyOrder(members, byId)) {
          if (!seen.has(id)) base.push(id)
        }
      } else {
        base = recencyOrder(members, byId)
      }
      return partitioned(base, byId, ranks, currentId)
    }

    /**
     * Build the page model for one tab.
     * @param options - snapshots, viewing state, and the translate seat.
     * @returns accounts in render order, each with ordered and visible session ids.
     */
    function buildModel(options) {
      const {
        tab, workspaces, ids, byId, currentId, archived,
        groups, assignment, sessionOrder, ranks, groupExpansion, filter,
        forceExpanded, hideEmpty, showEmptyBucket, t,
      } = options
      const eligible = ids.filter(id => sessionEligible(byId[id], currentId))
      const makeAccount = (key, title, kind, extra) => {
        const ordered = accountOrder(extra.members, sessionOrder[key], byId, ranks, currentId)
        return {
          key,
          title,
          kind,
          groupId: extra.groupId,
          workspaceId: extra.workspaceId,
          badge: extra.badge,
          expanded: forceExpanded === true ? true : groupExpansion[key] !== false,
          ordered,
          sessions: ordered.filter(id => sessionVisible(byId[id], currentId, archived)
            && (filter === null || filter.has(id))),
        }
      }
      if (tab === 'projects') {
        // The projects tab lists Workspaces only; sessions outside every
        // Workspace stay in the built-in sidebar's Ungrouped bucket.
        return workspaces
          .map(workspace => makeAccount(
            PROJECT_PREFIX + workspace.workspaceId,
            workspace.title,
            'project',
            {
              workspaceId: workspace.workspaceId,
              members: (workspace.sessionIds ?? []).filter(id => byId[id] !== undefined),
            },
          ))
          .filter(account => hideEmpty !== true || account.sessions.length > 0)
      }
      const known = new Set(groups.map(group => group.id))
      const accounts = groups.map(group => makeAccount(
        GROUP_PREFIX + group.id,
        group.name,
        'group',
        {
          groupId: group.id,
          badge: group.badge,
          members: eligible.filter(id => assignment[id] === group.id),
        },
      ))
      const loose = eligible.filter(id => !known.has(assignment[id]))
      if (loose.length > 0) {
        const bucket = makeAccount(UNGROUPED_KEY, t('account.ungrouped'), 'group', { members: loose })
        // The bucket is a drop target while a session drag is live; otherwise an
        // empty one is just noise and stays hidden.
        if (bucket.sessions.length > 0 || showEmptyBucket === true) accounts.push(bucket)
      }
      if (hideEmpty === true) return accounts.filter(account => account.sessions.length > 0)
      return accounts
    }

    /**
     * One session's status mark, following the shipped workspace browser for the
     * three states the panel shows: a pending interaction outranks live activity,
     * which outranks an unread completion. Every other session shows no mark.
     * @returns the mark `{state, label}`, or null.
     */
    function sessionStatusMark(summary, status, t) {
      const kind = status?.pendingInteraction?.kind
      if (kind === 'approval') return { state: 'warning', label: t('status.waitingApproval') }
      if (kind === 'plan-review') return { state: 'warning', label: t('status.planReview') }
      if (kind === 'question') return { state: 'warning', label: t('status.waitingAnswer') }
      const running = status?.running ?? summary.running === true
      if (running === true) return { state: 'ongoing', label: t('status.running') }
      if (status?.completionUnread === true) return { state: 'done', label: t('status.completed') }
      return null
    }

    /**
     * One status mark: the host spinner while ongoing, otherwise the host state dot.
     * @param mark - `{state}`.
     * @param spinDelay - negative CSS delay that locks every spinner to the wall clock.
     */
    function statusMark(mark, spinDelay) {
      if (mark.state === 'ongoing') {
        return h(
          'svg',
          {
            className: 'wsg-spinner',
            width: 14,
            height: 14,
            viewBox: '0 0 24 24',
            'aria-hidden': true,
            focusable: false,
          },
          h(
            'g',
            { className: 'wsg-spinner-motion', style: spinDelay === undefined ? undefined : { animationDelay: spinDelay } },
            h('circle', { className: 'wsg-spinner-track', cx: 12, cy: 12, r: 9.5 }),
            h('circle', { className: 'wsg-spinner-arc', cx: 12, cy: 12, r: 9.5 }),
          ),
        )
      }
      return h('span', { className: 'wsg-state', 'data-state': mark.state, 'aria-hidden': true })
    }

    /** Compact relative timestamp: sub-day stays in minutes/hours, then days up to 99, then the date. */
    function formatRelative(t, timestamp, now) {
      if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return ''
      const minute = 60_000
      const day = 24 * 60 * minute
      const delta = Math.max(0, now - timestamp)
      if (delta < minute) return t('time.justNow')
      if (delta < 60 * minute) return t('time.minutes', { n: Math.floor(delta / minute) })
      if (delta < day) return t('time.hours', { n: Math.floor(delta / (60 * minute)) })
      const days = Math.floor(delta / day)
      if (days <= 99) return t('time.days', { n: days })
      const when = new Date(timestamp)
      return when.getFullYear() + '-' + String(when.getMonth() + 1).padStart(2, '0') + '-' + String(when.getDate()).padStart(2, '0')
    }

    /** Clamp a popover origin into the viewport. */
    function clampX(x, width) {
      return Math.max(8, Math.min(x, window.innerWidth - (width ?? MENU_WIDTH) - 12))
    }

    /** Clamp a popover origin into the viewport. */
    function clampY(y) {
      return Math.min(y, window.innerHeight - 48)
    }

    // ---- drag target helpers -------------------------------------------------

    /** Whether an in-flight drag carries a session. */
    function isSessionDrag(state) {
      return state !== null && state.kind === 'session'
    }

    /** Whether an in-flight drag carries a group. */
    function isGroupDrag(state) {
      return state !== null && state.kind === 'group'
    }

    /** Whether a session drag may land on this account. */
    function dragAllowed(dragState, tab, accountKey) {
      if (!isSessionDrag(dragState)) return false
      return dragState.accountKey === accountKey || tab === 'groups'
    }

    /** Whether the drag marker already points at this row half. */
    function sameRowTarget(over, accountKey, sessionId, half) {
      return over !== undefined && over !== null && over.head !== true
        && over.accountKey === accountKey && over.sessionId === sessionId && over.half === half
    }

    /** Whether the drag marker already points at this account head. */
    function sameHeadTarget(over, accountKey) {
      return over !== undefined && over !== null && over.head === true && over.accountKey === accountKey
    }

    /** Whether a group drag already points at this group half. */
    function sameHeadMarker(over, groupId, half) {
      return over !== undefined && over !== null && over.groupId === groupId && over.half === half
    }

    /** Whether this row is the current drag target. */
    function rowMarker(over, accountKey, sessionId) {
      if (over === undefined || over === null || over.head === true) return ''
      if (over.accountKey !== accountKey || over.sessionId !== sessionId) return ''
      return over.half === 'before' ? 'before' : 'after'
    }

    /** Whether this group head is the current group-drag target. */
    function headMarker(over, groupId) {
      if (over === undefined || over === null || over.groupId !== groupId) return ''
      return over.half === 'before' ? 'before' : 'after'
    }

    /** Where a drop lands inside `order`; `-1` when the anchor row is gone. */
    function insertIndex(order, target) {
      if (target.head === true || target.sessionId === undefined) return order.length
      const index = order.indexOf(target.sessionId)
      if (index < 0) return -1
      return target.half === 'before' ? index : index + 1
    }

    /** Move one group to `to`, correcting the target index after the removal. */
    function moveGroupInList(groups, from, to) {
      if (from < 0 || from >= groups.length) return groups
      const next = [...groups]
      const [moved] = next.splice(from, 1)
      const at = Math.max(0, Math.min(to > from ? to - 1 : to, next.length))
      next.splice(at, 0, moved)
      return next
    }

    // ---- title marquee -------------------------------------------------------

    /** Place the title's scroll offset and publish the fade-mask hooks. */
    function placeTitle(title, left, range) {
      if (typeof title.scrollTo === 'function') title.scrollTo({ left, behavior: 'instant' })
      else title.scrollLeft = left
      if (left > 0) title.dataset.scrolled = ''
      else delete title.dataset.scrolled
      if (left < range) title.dataset.clipped = ''
      else delete title.dataset.clipped
    }

    /** Return the title to its resting state: scroll at the start, masks off. */
    function restTitle(title) {
      if (typeof title.scrollTo === 'function') title.scrollTo({ left: 0, behavior: 'instant' })
      else title.scrollLeft = 0
      delete title.dataset.scrolled
      delete title.dataset.clipped
    }

    // ---- row component -------------------------------------------------------

    /** One dense session row; memoized because the sidebar can carry hundreds of them. */
    const SessionRow = React.memo(function SessionRow(props) {
      const {
        sessionId, accountKey, title, tooltip, timeLabel, statusState, statusLabel,
        pinned, current, marker, draggable, archiveLabel,
        onOpen, onContextMenu, onDragStart, onDragOver, onDrop, onDragEnd, onArchive,
      } = props
      const titleRef = React.useRef(null)
      const frameRef = React.useRef(0)
      // Absolute spinner phase: the delay is derived from the wall clock, so every
      // running row rotates in lockstep regardless of when it mounted.
      const spinDelay = React.useMemo(
        () => (statusState === 'ongoing' ? `-${Date.now() % SPIN_MS}ms` : undefined),
        [statusState],
      )
      React.useEffect(() => () => cancelAnimationFrame(frameRef.current), [])
      /** Crawl a clipped title while the row is hovered, at a length-aware speed. */
      const startTitleMarquee = () => {
        const element = titleRef.current
        if (element === null) return
        const range = element.scrollWidth - element.clientWidth
        if (range <= MIN_TITLE_REVEAL_PX) return
        // The resting ellipsis sits exactly on the text the crawl is revealing,
        // so hovering drops it: the fade masks mark the cut edges instead.
        element.dataset.marquee = ''
        if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          placeTitle(element, range, range)
          return
        }
        const speed = Math.min(
          TITLE_MARQUEE_FAST_PX_PER_MS,
          Math.max(TITLE_MARQUEE_PX_PER_MS, range / TITLE_MARQUEE_TARGET_MS),
        )
        cancelAnimationFrame(frameRef.current)
        let previous
        let position = 0
        const step = (now) => {
          position += previous === undefined ? 0 : (now - previous) * speed
          previous = now
          placeTitle(element, Math.min(position, range), range)
          if (position < range) frameRef.current = requestAnimationFrame(step)
        }
        frameRef.current = requestAnimationFrame(step)
      }
      /** Leaving returns the title to its start in one step. */
      const stopTitleMarquee = () => {
        cancelAnimationFrame(frameRef.current)
        const element = titleRef.current
        if (element === null) return
        delete element.dataset.marquee
        restTitle(element)
      }
      const className = 'wsg-session'
        + (current ? ' wsg-session-current' : '')
        + (marker === 'before' ? ' wsg-drop-before' : '')
        + (marker === 'after' ? ' wsg-drop-after' : '')
      return h(
        'div',
        {
          className,
          role: 'button',
          tabIndex: 0,
          draggable,
          title: tooltip,
          onClick: () => { onOpen(sessionId) },
          onKeyDown: (event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            onOpen(sessionId)
          },
          onContextMenu: (event) => { onContextMenu('session', sessionId, event) },
          onPointerEnter: startTitleMarquee,
          onPointerLeave: stopTitleMarquee,
          onDragStart: (event) => { onDragStart(accountKey, sessionId, event) },
          onDragOver: (event) => { onDragOver(accountKey, sessionId, event) },
          onDrop: (event) => { onDrop(accountKey, sessionId, event) },
          onDragEnd,
        },
        statusState === null
          ? null
          : h(
            'span',
            { key: 'status', className: 'wsg-status', title: statusLabel },
            statusMark({ state: statusState }, spinDelay),
            h('span', { key: 'label', className: 'wsg-visually-hidden' }, statusLabel),
          ),
        h('span', { key: 'title', className: 'wsg-session-title', ref: titleRef }, title),
        pinned ? h('span', { key: 'pin', className: 'wsg-pin' }, IconPin()) : null,
        h('span', { key: 'tail', className: 'wsg-row-tail' },
          h('span', { key: 'time', className: 'wsg-time' }, timeLabel),
          h('button', {
            key: 'archive',
            type: 'button',
            className: 'wsg-row-action',
            'aria-label': archiveLabel,
            title: archiveLabel,
            onClick: (event) => {
              event.stopPropagation()
              onArchive(sessionId)
            },
            onMouseDown: (event) => { event.stopPropagation() },
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
            },
          }, IconArchive(14)),
        ),
      )
    })

    // ---- the panel -----------------------------------------------------------

    /** Dialog affordances, keyed by kind: only the differences live here. */
    const DIALOG_SPEC = {
      createGroup: { title: 'group.create', confirm: 'dialog.create' },
      renameGroup: { title: 'group.rename', confirm: 'dialog.save' },
      renameWorkspace: { title: 'workspace.rename', confirm: 'dialog.save' },
      renameSession: { title: 'session.rename', confirm: 'dialog.save' },
      deleteGroup: { title: 'group.delete', desc: 'group.deleteDesc', confirm: 'dialog.delete', danger: true },
      deleteWorkspace: { title: 'workspace.delete', desc: 'workspace.deleteDesc', confirm: 'dialog.delete', danger: true },
    }

    /** The grouped view that replaces the sidebar's workspace browser. */
    function GroupedWorkspacePanel(props) {
      const { useSessions, useSessionStatus, useWorkspaces, t } = props
      const list = useSessions(state => state)
      const statuses = useSessionStatus(state => state)
      const snapshot = useWorkspaces(state => state)

      // ---- state -------------------------------------------------------------
      const [view, setView] = React.useState(loadState)
      const viewRef = React.useRef(view)
      viewRef.current = view
      const [popover, setPopover] = React.useState(null)
      const [dialog, setDialog] = React.useState(null)
      const [error, setError] = React.useState(null)
      const [search, setSearch] = React.useState('')
      const [searchOpen, setSearchOpen] = React.useState(false)
      const [drag, setDrag] = React.useState(null)
      const dragRef = React.useRef(drag)
      dragRef.current = drag
      const popoverRef = React.useRef(null)
      const dropCommittedRef = React.useRef(false)
      const orderedRef = React.useRef(new Map())

      /** Commit one persisted view change; the write happens before any navigation. */
      const updateView = React.useCallback((updater) => {
        const previous = viewRef.current
        const next = updater(previous)
        if (next === previous) return
        viewRef.current = next
        persistState(next)
        setView(next)
      }, [])

      const closePopover = React.useCallback(() => { setPopover(null) }, [])
      const closeDialog = React.useCallback(() => { setDialog(null) }, [])
      const patchDialog = React.useCallback((patch) => {
        setDialog(previous => (previous === null ? previous : { ...previous, ...patch }))
      }, [])
      const openDialog = React.useCallback((kind, fields) => {
        setPopover(null)
        setDialog({ kind, value: '', badge: DEFAULT_BADGE, error: null, busy: false, ...fields })
      }, [])

      // ---- effects -----------------------------------------------------------
      const popoverOpen = popover !== null
      React.useEffect(() => {
        if (!popoverOpen) return undefined
        const dismiss = () => { setPopover(null) }
        const onPress = (event) => {
          if (!(event.target instanceof Node)) return
          if (popoverRef.current !== null && popoverRef.current.contains(event.target)) return
          dismiss()
        }
        const onKey = (event) => { if (event.key === 'Escape') dismiss() }
        document.addEventListener('mousedown', onPress)
        document.addEventListener('keydown', onKey)
        return () => {
          document.removeEventListener('mousedown', onPress)
          document.removeEventListener('keydown', onKey)
        }
      }, [popoverOpen])

      // Make a migrated record durable on the first mount.
      React.useEffect(() => { persistState(viewRef.current) }, [])

      // One Escape handler serves both layers; a dialog replaces any popover.
      const dialogOpen = dialog !== null
      React.useEffect(() => {
        if (!dialogOpen) return undefined
        const onKey = (event) => {
          if (event.key !== 'Escape') return
          setDialog(null)
          setPopover(null)
        }
        document.addEventListener('keydown', onKey)
        return () => { document.removeEventListener('keydown', onKey) }
      }, [dialogOpen])

      const dragging = drag !== null
      React.useEffect(() => {
        if (!dragging) return undefined
        const acceptDrag = (event) => {
          event.preventDefault()
          if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move'
        }
        const acceptDrop = (event) => { event.preventDefault() }
        document.addEventListener('dragover', acceptDrag)
        document.addEventListener('drop', acceptDrop)
        return () => {
          document.removeEventListener('dragover', acceptDrag)
          document.removeEventListener('drop', acceptDrop)
        }
      }, [dragging])

      // ---- derived data -----------------------------------------------------
      const now = Date.now()
      const byId = list?.byId ?? {}
      const ids = list?.ids ?? []
      const workspaces = snapshot?.items ?? []
      const archived = React.useMemo(() => new Set(snapshot?.archivedSessionIds ?? []), [snapshot])
      const ranks = React.useMemo(() => pinRanks(snapshot?.pinnedSessionIds ?? []), [snapshot])
      const workspaceTitleBySession = React.useMemo(() => {
        const titles = new Map()
        for (const workspace of workspaces) {
          for (const sessionId of workspace.sessionIds ?? []) {
            if (!titles.has(sessionId)) titles.set(sessionId, workspace.title)
          }
        }
        return titles
      }, [workspaces])

      const currentId = React.useMemo(() => {
        for (const id of ids) {
          const summary = byId[id]
          if (summary !== undefined && (summary.retainedBy?.mainView ?? 0) > 0) return id
        }
        return undefined
      }, [ids, byId])

      const sessionDragging = isSessionDrag(drag)
      const trimmedSearch = search.trim()
      const searching = trimmedSearch !== ''
      const searchIndex = React.useMemo(() => {
        const index = new Map()
        for (const id of ids) {
          const summary = byId[id]
          if (summary === undefined) continue
          const title = summary.blank === true ? t('session.new') : (summary.displayTitle ?? '')
          index.set(id, (title + '\n' + (workspaceTitleBySession.get(id) ?? '')).toLocaleLowerCase())
        }
        return index
      }, [ids, byId, workspaceTitleBySession, t])

      const matchSet = React.useMemo(() => {
        if (!searching) return null
        const needle = trimmedSearch.toLocaleLowerCase()
        const matches = new Set()
        for (const [id, haystack] of searchIndex) {
          if (haystack.includes(needle)) matches.add(id)
        }
        return matches
      }, [searching, trimmedSearch, searchIndex])

      const model = React.useMemo(() => buildModel({
        tab: view.tab,
        workspaces,
        ids,
        byId,
        currentId,
        archived,
        groups: view.groups,
        assignment: view.assignment,
        sessionOrder: view.sessionOrder,
        ranks,
        groupExpansion: view.groupExpansion,
        filter: matchSet,
        forceExpanded: searching,
        hideEmpty: searching,
        showEmptyBucket: sessionDragging,
        t,
      }), [
        view.tab, view.groups, view.assignment, view.sessionOrder, view.groupExpansion,
        workspaces, ids, byId, currentId, archived, ranks, matchSet, searching, sessionDragging, t,
      ])

      const orderedByKey = React.useMemo(
        () => new Map(model.map(account => [account.key, account.ordered])),
        [model],
      )
      orderedRef.current = orderedByKey

      const workspaceChoices = React.useMemo(() => {
        const recent = new Map()
        for (const workspace of workspaces) {
          let latest = 0
          for (const id of workspace.sessionIds ?? []) {
            const updatedAt = byId[id]?.updatedAt ?? 0
            if (updatedAt > latest) latest = updatedAt
          }
          recent.set(workspace.workspaceId, latest)
        }
        return [...workspaces]
          .sort((left, right) => (recent.get(right.workspaceId) ?? 0) - (recent.get(left.workspaceId) ?? 0))
          .map(workspace => ({ workspaceId: workspace.workspaceId, title: workspace.title }))
      }, [workspaces, byId])

      // ---- view mutators ----------------------------------------------------
      const ACTIONS = {
        renameWorkspace: (id, name) => props.renameWorkspace(id, name),
        renameSession: (id, name) => props.renameSession(id, name),
        deleteWorkspace: (id) => props.deleteWorkspace(id),
      }

      const fail = React.useCallback((reason) => { setError(errorText(reason)) }, [])
      const run = React.useCallback((promise) => { Promise.resolve(promise).catch(fail) }, [fail])

      const openSessionById = React.useCallback((sessionId) => { props.openSession(sessionId) }, [props.openSession])

      const archiveSessionById = React.useCallback((sessionId) => { run(props.archiveSession(sessionId)) }, [props.archiveSession, run])

      const showContextMenu = React.useCallback((target, id, event) => {
        event.preventDefault()
        event.stopPropagation()
        setPopover({ kind: 'context', target, id, x: clampX(event.clientX), y: clampY(event.clientY) })
      }, [])

      const assign = React.useCallback((sessionId, groupId) => {
        updateView((previous) => {
          const assignment = { ...previous.assignment }
          if (groupId === null) delete assignment[sessionId]
          else assignment[sessionId] = groupId
          return { ...previous, assignment }
        })
      }, [updateView])

      const createGroup = React.useCallback((name, badge, moveSessionId) => {
        const id = newGroupId()
        updateView((previous) => ({
          ...previous,
          tab: 'groups',
          groups: [...previous.groups, { id, name, badge: normalizeBadge(badge) }],
          assignment: moveSessionId === undefined
            ? previous.assignment
            : { ...previous.assignment, [moveSessionId]: id },
        }))
      }, [updateView])

      const patchGroup = React.useCallback((groupId, patch) => {
        updateView(previous => ({
          ...previous,
          groups: previous.groups.map(group => (group.id === groupId ? { ...group, ...patch } : group)),
        }))
      }, [updateView])

      const moveGroup = React.useCallback((groupId, delta) => {
        updateView((previous) => {
          const index = previous.groups.findIndex(group => group.id === groupId)
          const target = index + delta
          if (index < 0 || target < 0 || target >= previous.groups.length) return previous
          const groups = [...previous.groups]
          const [moved] = groups.splice(index, 1)
          groups.splice(target, 0, moved)
          return { ...previous, groups }
        })
      }, [updateView])

      const deleteGroup = React.useCallback((groupId) => {
        updateView((previous) => {
          const assignment = {}
          for (const [sessionId, owner] of Object.entries(previous.assignment)) {
            if (owner !== groupId) assignment[sessionId] = owner
          }
          const sessionOrder = { ...previous.sessionOrder }
          delete sessionOrder[GROUP_PREFIX + groupId]
          const groupExpansion = { ...previous.groupExpansion }
          delete groupExpansion[GROUP_PREFIX + groupId]
          return {
            ...previous,
            groups: previous.groups.filter(group => group.id !== groupId),
            assignment,
            sessionOrder,
            groupExpansion,
          }
        })
      }, [updateView])

      const toggleAccount = React.useCallback((key) => {
        updateView(previous => ({
          ...previous,
          groupExpansion: { ...previous.groupExpansion, [key]: previous.groupExpansion[key] === false },
        }))
      }, [updateView])

      const switchTab = React.useCallback((tab) => {
        setPopover(null)
        updateView(previous => (previous.tab === tab ? previous : { ...previous, tab }))
      }, [updateView])

      const setOrder = React.useCallback((orderBy) => {
        setPopover(null)
        updateView((previous) => {
          if (previous.orderBy === orderBy) return previous
          if (orderBy === 'manual') {
            const sessionOrder = { ...previous.sessionOrder }
            for (const [key, order] of orderedRef.current.entries()) sessionOrder[key] = [...order]
            return { ...previous, orderBy: 'manual', sessionOrder }
          }
          return { ...previous, orderBy: 'updated', sessionOrder: {} }
        })
      }, [updateView])

      const createSessionIn = React.useCallback(async (workspaceId, groupId) => {
        try {
          const sessionId = await props.createSession(workspaceId === undefined ? {} : { workspaceId })
          if (groupId !== null && groupId !== undefined && sessionId !== undefined && sessionId !== null) {
            updateView(previous => ({ ...previous, assignment: { ...previous.assignment, [sessionId]: groupId } }))
          }
          props.openSession(sessionId)
        } catch (reason) {
          setError(errorText(reason))
        }
      }, [props.createSession, props.openSession, updateView])

      const requestNewSession = React.useCallback((account, position) => {
        if (account.kind === 'group') {
          setPopover({
            kind: 'groupPicker',
            groupId: account.groupId,
            x: clampX(position?.x ?? 320, PICKER_WIDTH),
            y: clampY(position?.y ?? 160),
          })
          return
        }
        void createSessionIn(account.workspaceId, null)
      }, [createSessionIn])

      const addWorkspace = React.useCallback(() => {
        setPopover(null)
        run(props.addWorkspace())
      }, [props.addWorkspace, run])

      const closeSearch = React.useCallback(() => {
        setSearch('')
        setSearchOpen(false)
      }, [])

      // ---- dialog submit ----------------------------------------------------
      const LOCAL_DIALOGS = {
        createGroup: (name) => { createGroup(name, dialog.badge, dialog.moveSessionId) },
        renameGroup: (name) => { patchGroup(dialog.id, { name }) },
        deleteGroup: () => { deleteGroup(dialog.id) },
      }

      const submitDialog = () => {
        if (dialog === null || dialog.busy) return
        const name = dialog.value.trim()
        const spec = DIALOG_SPEC[dialog.kind]
        if (spec.danger !== true && name === '') return
        const local = LOCAL_DIALOGS[dialog.kind]
        if (local !== undefined) {
          local(name)
          closeDialog()
          return
        }
        patchDialog({ busy: true, error: null })
        Promise.resolve(ACTIONS[dialog.kind](dialog.id, name)).then(closeDialog, (reason) => {
          patchDialog({ busy: false, error: errorText(reason) })
        })
      }

      // ---- drag -------------------------------------------------------------
      const finishDrag = React.useCallback((activeDrag, target) => {
        setDrag(null)
        const sourceKey = activeDrag.accountKey
        const targetKey = target.accountKey
        const sessionId = activeDrag.sessionId
        if (sourceKey === targetKey) {
          const order = orderedRef.current.get(sourceKey) ?? [sessionId]
          if (target.head !== true && target.sessionId === sessionId) return
          const next = order.filter(id => id !== sessionId)
          const at = insertIndex(next, target)
          if (at < 0) return
          next.splice(at, 0, sessionId)
          updateView(previous => ({
            ...previous,
            orderBy: 'manual',
            sessionOrder: { ...previous.sessionOrder, [sourceKey]: next },
          }))
          return
        }
        if (viewRef.current.tab !== 'groups') return
        const targetGroupId = targetKey.startsWith(GROUP_PREFIX) ? targetKey.slice(GROUP_PREFIX.length) : null
        updateView((previous) => {
          const assignment = { ...previous.assignment }
          if (targetGroupId === null) delete assignment[sessionId]
          else assignment[sessionId] = targetGroupId
          if (previous.orderBy !== 'manual') return { ...previous, assignment }
          const sessionOrder = { ...previous.sessionOrder }
          sessionOrder[sourceKey] = (sessionOrder[sourceKey] ?? orderedRef.current.get(sourceKey) ?? []).filter(id => id !== sessionId)
          const targetOrder = [...(sessionOrder[targetKey] ?? orderedRef.current.get(targetKey) ?? [])]
          const at = insertIndex(targetOrder, target)
          targetOrder.splice(at < 0 ? targetOrder.length : at, 0, sessionId)
          sessionOrder[targetKey] = targetOrder
          return { ...previous, assignment, sessionOrder }
        })
      }, [updateView])

      /** Commit a group reorder; a drop on the dragged group itself is a no-op. */
      const finishGroupDrag = React.useCallback((draggedId, target) => {
        setDrag(null)
        if (target === null || target === undefined || target.groupId === draggedId) return
        updateView((previous) => {
          const from = previous.groups.findIndex(group => group.id === draggedId)
          const overIndex = previous.groups.findIndex(group => group.id === target.groupId)
          if (from < 0 || overIndex < 0) return previous
          const groups = moveGroupInList(previous.groups, from, target.half === 'before' ? overIndex : overIndex + 1)
          if (groups.every((group, index) => group.id === previous.groups[index].id)) return previous
          return { ...previous, groups }
        })
      }, [updateView])

      const beginDrag = React.useCallback((accountKey, sessionId, event) => {
        dropCommittedRef.current = false
        setDrag({ kind: 'session', accountKey, sessionId, over: null })
        const transfer = event.dataTransfer
        if (transfer === null) return
        transfer.effectAllowed = 'move'
        transfer.setData('text/plain', sessionId)
      }, [])

      /** Start reordering the group whose head is being dragged. */
      const beginGroupDrag = React.useCallback((groupId, event) => {
        dropCommittedRef.current = false
        setDrag({ kind: 'group', groupId, over: null })
        const transfer = event.dataTransfer
        if (transfer === null) return
        transfer.effectAllowed = 'move'
        transfer.setData('text/plain', groupId)
      }, [])

      const hoverRow = React.useCallback((accountKey, sessionId, event) => {
        if (!dragAllowed(dragRef.current, viewRef.current.tab, accountKey)) return
        event.preventDefault()
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move'
        const box = event.currentTarget.getBoundingClientRect()
        const half = event.clientY < box.top + box.height / 2 ? 'before' : 'after'
        setDrag(previous => (sameRowTarget(previous.over, accountKey, sessionId, half)
          ? previous
          : { ...previous, over: { accountKey, sessionId, half } }))
      }, [])

      const hoverHead = React.useCallback((accountKey, event) => {
        const current = dragRef.current
        if (current === null) return
        if (isGroupDrag(current)) {
          if (!accountKey.startsWith(GROUP_PREFIX)) return
          const groupId = accountKey.slice(GROUP_PREFIX.length)
          if (groupId === current.groupId) {
            setDrag(previous => (previous.over === null ? previous : { ...previous, over: null }))
            return
          }
          event.preventDefault()
          if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move'
          const box = event.currentTarget.getBoundingClientRect()
          const half = event.clientY < box.top + box.height / 2 ? 'before' : 'after'
          setDrag(previous => (sameHeadMarker(previous.over, groupId, half)
            ? previous
            : { ...previous, over: { groupId, half } }))
          return
        }
        if (!dragAllowed(current, viewRef.current.tab, accountKey)) return
        event.preventDefault()
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move'
        setDrag(previous => (sameHeadTarget(previous.over, accountKey)
          ? previous
          : { ...previous, over: { accountKey, head: true } }))
      }, [])

      const dropRow = React.useCallback((accountKey, sessionId, event) => {
        const current = dragRef.current
        if (!dragAllowed(current, viewRef.current.tab, accountKey)) return
        event.preventDefault()
        if (dropCommittedRef.current) return
        dropCommittedRef.current = true
        const over = current.over
        const target = sameRowTarget(over, accountKey, sessionId, 'before') || sameRowTarget(over, accountKey, sessionId, 'after')
          ? over
          : { accountKey, sessionId, half: 'after' }
        finishDrag(current, target)
      }, [finishDrag])

      const dropHead = React.useCallback((accountKey, event) => {
        const current = dragRef.current
        if (current === null) return
        if (isGroupDrag(current)) {
          if (!accountKey.startsWith(GROUP_PREFIX)) return
          event.preventDefault()
          if (dropCommittedRef.current) return
          dropCommittedRef.current = true
          const groupId = accountKey.slice(GROUP_PREFIX.length)
          const over = current.over
          finishGroupDrag(current.groupId, over !== undefined && over !== null && over.groupId === groupId
            ? over
            : { groupId, half: 'after' })
          return
        }
        if (!dragAllowed(current, viewRef.current.tab, accountKey)) return
        event.preventDefault()
        if (dropCommittedRef.current) return
        dropCommittedRef.current = true
        finishDrag(current, sameHeadTarget(current.over, accountKey) ? current.over : { accountKey, head: true })
      }, [finishDrag, finishGroupDrag])

      const endDrag = React.useCallback(() => {
        const current = dragRef.current
        setDrag(null)
        if (dropCommittedRef.current || current === null) return
        const over = current.over
        if (over === undefined || over === null) return
        dropCommittedRef.current = true
        if (isGroupDrag(current)) finishGroupDrag(current.groupId, over)
        else finishDrag(current, over)
      }, [finishDrag, finishGroupDrag])

      // ---- menus ------------------------------------------------------------
      const entry = (key, label, run, extra) => ({ key, label, run, ...extra })
      const heading = (key, label) => ({ key, heading: label })
      const separator = key => ({ key, separator: true })

      const sortEntries = () => [
        heading('heading', t('sort.label')),
        entry('updated', t('sort.updated'), () => { setOrder('updated') }, { icon: IconClock, selected: view.orderBy === 'updated' }),
        entry('manual', t('sort.manual'), () => { setOrder('manual') }, { icon: IconSortArrows, selected: view.orderBy === 'manual' }),
      ]

      const sessionEntries = (sessionId) => {
        const summary = byId[sessionId]
        const owner = view.assignment[sessionId]
        const entries = []
        if (view.groups.length > 0) {
          entries.push(heading('heading-move', t('session.moveTo')))
          for (const group of view.groups) {
            entries.push(entry('move:' + group.id, group.name, () => { assign(sessionId, group.id) }, {
              icon: () => h('span', { key: 'badge', className: 'wsg-menu-badge' }, group.badge),
              selected: owner === group.id,
            }))
          }
        }
        entries.push(entry('move-new', t('session.moveToNew'), () => { openDialog('createGroup', { moveSessionId: sessionId }) }))
        if (typeof owner === 'string' && owner !== '') {
          entries.push(entry('move-out', t('session.removeFromGroup'), () => { assign(sessionId, null) }))
        }
        const title = summary === undefined ? '' : (summary.blank === true ? t('session.new') : summary.displayTitle)
        entries.push(
          separator('sep-1'),
          entry('rename', t('session.rename'), () => { openDialog('renameSession', { id: sessionId, value: title }) }),
          entry('fork', t('session.fork'), () => { run(props.forkSession(sessionId)) }),
          separator('sep-2'),
          entry('archive', t('session.archive'), () => { run(props.archiveSession(sessionId)) }, { danger: true }),
        )
        return entries
      }

      const groupEntries = (groupId) => {
        const index = view.groups.findIndex(group => group.id === groupId)
        const group = index < 0 ? undefined : view.groups[index]
        return [
          entry('rename', t('group.rename'), () => { openDialog('renameGroup', { id: groupId, value: group?.name ?? '' }) }),
          entry('badge', t('group.badge'), () => { setPopover({ kind: 'badge', groupId, x: clampX(popover.x), y: clampY(popover.y) }) }),
          entry('up', t('group.moveUp'), () => { moveGroup(groupId, -1) }, { disabled: index <= 0 }),
          entry('down', t('group.moveDown'), () => { moveGroup(groupId, 1) }, { disabled: index < 0 || index >= view.groups.length - 1 }),
          separator('sep'),
          entry('delete', t('group.delete'), () => { openDialog('deleteGroup', { id: groupId, name: group?.name ?? '' }) }, { danger: true }),
        ]
      }

      const projectEntries = (workspaceId) => {
        const title = workspaces.find(candidate => candidate.workspaceId === workspaceId)?.title ?? ''
        return [
          entry('new', t('project.newSession'), () => { void createSessionIn(workspaceId, null) }),
          entry('rename', t('workspace.rename'), () => { openDialog('renameWorkspace', { id: workspaceId, value: title }) }),
          separator('sep'),
          entry('delete', t('workspace.delete'), () => { openDialog('deleteWorkspace', { id: workspaceId, name: title }) }, { danger: true }),
        ]
      }

      const contextEntries = () => {
        if (popover === null || popover.kind !== 'context') return []
        if (popover.target === 'session') return sessionEntries(popover.id)
        if (popover.target === 'group') return groupEntries(popover.id)
        return projectEntries(popover.id)
      }

      // ---- rendering --------------------------------------------------------
      const renderMenuEntry = (entry) => {
        if (entry.separator === true) return h('div', { key: entry.key, className: 'wsg-menu-sep' })
        if (entry.heading !== undefined) return h('div', { key: entry.key, className: 'wsg-menu-heading' }, entry.heading)
        return h('button', {
          key: entry.key,
          type: 'button',
          role: 'menuitem',
          className: 'wsg-menu-item' + (entry.danger === true ? ' wsg-menu-item-danger' : ''),
          disabled: entry.disabled === true,
          onClick: () => { if (entry.disabled === true) return; closePopover(); entry.run() },
        },
        h('span', { key: 'icon', className: 'wsg-menu-icon' }, entry.icon === undefined ? null : entry.icon()),
        h('span', { key: 'label', className: 'wsg-menu-item-label' }, entry.label),
        h('span', { key: 'check', className: 'wsg-menu-item-check' }, entry.selected === true ? IconCheck() : null))
      }

      const popoverShell = (children, width) => h('div', {
        key: 'popover',
        ref: popoverRef,
        className: 'wsg-popover',
        role: 'menu',
        style: { left: popover.x, top: popover.y, width, maxHeight: Math.max(120, window.innerHeight - popover.y - 16) },
      }, children)

      const renderBadgeGrid = (current, onPick) => h('div', { key: 'grid', className: 'wsg-badge-grid' },
        BADGE_CHOICES.map(badge => h('button', {
          key: badge,
          type: 'button',
          className: 'wsg-badge-cell' + (badge === current ? ' wsg-badge-cell-active' : ''),
          onClick: () => { onPick(badge) },
        }, badge)))

      const renderPopover = () => {
        if (popover === null) return null
        if (popover.kind === 'sort') return popoverShell(sortEntries().map(renderMenuEntry), MENU_WIDTH)
        if (popover.kind === 'context') return popoverShell(contextEntries().map(renderMenuEntry), MENU_WIDTH)
        if (popover.kind === 'badge') {
          const group = view.groups.find(candidate => candidate.id === popover.groupId)
          return popoverShell([
            h('div', { key: 'heading', className: 'wsg-menu-heading' }, t('group.badgeTitle')),
            renderBadgeGrid(group?.badge ?? DEFAULT_BADGE, (badge) => {
              patchGroup(popover.groupId, { badge: normalizeBadge(badge) })
              closePopover()
            }),
          ], PICKER_WIDTH)
        }
        const choices = workspaceChoices.length > 0
          ? workspaceChoices
          : [{ workspaceId: undefined, title: t('workspace.default') }]
        return popoverShell([
          h('div', { key: 'heading', className: 'wsg-menu-heading' }, t('workspace.pickTitle')),
          ...choices.map(choice => renderMenuEntry({
            key: choice.workspaceId ?? 'default',
            label: choice.title,
            icon: () => IconFolder(14),
            run: () => { void createSessionIn(choice.workspaceId, popover.groupId) },
          })),
        ], PICKER_WIDTH)
      }

      const renderDialog = () => {
        if (dialog === null) return null
        const spec = DIALOG_SPEC[dialog.kind]
        const isDelete = spec.danger === true
        const isCreate = dialog.kind === 'createGroup'
        return h('div', { key: 'modal', className: 'wsg-modal-layer' },
          h('div', { className: 'wsg-modal-scrim', onClick: () => { if (!dialog.busy) closeDialog() } }),
          h('div', { className: 'wsg-modal', role: 'dialog', 'aria-modal': true, 'aria-label': t(spec.title) },
            h('div', { className: 'wsg-modal-title' }, t(spec.title)),
            spec.desc === undefined ? null : h('div', { className: 'wsg-modal-desc' }, t(spec.desc, { name: dialog.name ?? '' })),
            isDelete ? null : h('input', {
              className: 'wsg-input',
              autoFocus: true,
              value: dialog.value,
              placeholder: isCreate ? t('group.defaultName') : '',
              onChange: (event) => { patchDialog({ value: event.target.value }) },
              onKeyDown: (event) => { if (event.key !== 'Enter') return; event.preventDefault(); submitDialog() },
            }),
            isCreate ? h('div', { key: 'badge-block' },
              h('div', { key: 'label', className: 'wsg-modal-label' }, t('group.badgeTitle')),
              renderBadgeGrid(dialog.badge, (badge) => { patchDialog({ badge }) })) : null,
            dialog.error === null ? null : h('div', { className: 'wsg-modal-error' }, dialog.error),
            h('div', { className: 'wsg-modal-actions' },
              h('button', { type: 'button', className: 'wsg-btn', onClick: () => { if (!dialog.busy) closeDialog() }, disabled: dialog.busy }, t('dialog.cancel')),
              h('button', {
                type: 'button',
                className: 'wsg-btn ' + (isDelete ? 'wsg-btn-danger' : 'wsg-btn-accent'),
                disabled: dialog.busy || (!isDelete && dialog.value.trim() === ''),
                onClick: submitDialog,
              }, t(spec.confirm)))))
      }

      const renderRow = (account, sessionId) => {
        const summary = byId[sessionId]
        if (summary === undefined) return null
        const mark = sessionStatusMark(summary, statuses.get(sessionId), t)
        const title = summary.blank === true
          ? t('session.new')
          : (typeof summary.displayTitle === 'string' && summary.displayTitle !== '' ? summary.displayTitle : summary.id)
        return h(SessionRow, {
          key: sessionId,
          sessionId,
          accountKey: account.key,
          title,
          tooltip: typeof summary.cwd === 'string' ? summary.cwd : title,
          timeLabel: formatRelative(t, summary.updatedAt, now),
          statusState: mark === null ? null : mark.state,
          statusLabel: mark === null ? null : mark.label,
          pinned: ranks.has(sessionId),
          current: sessionId === currentId,
          marker: sessionDragging ? rowMarker(drag.over, account.key, sessionId) : '',
          draggable: !searching,
          archiveLabel: t('session.archive'),
          onOpen: openSessionById,
          onContextMenu: showContextMenu,
          onDragStart: beginDrag,
          onDragOver: hoverRow,
          onDrop: dropRow,
          onDragEnd: endDrag,
          onArchive: archiveSessionById,
        })
      }

      const renderDropzone = (account) => {
        const droppable = account.kind === 'group' || view.tab === 'groups'
        return h('button', {
          key: 'dropzone',
          type: 'button',
          className: 'wsg-dropzone' + (sameHeadTarget(drag?.over, account.key) ? ' wsg-dropzone-active' : ''),
          onClick: (event) => {
            const box = event.currentTarget.getBoundingClientRect()
            requestNewSession(account, { x: clampX(box.left + 8, PICKER_WIDTH), y: clampY(box.bottom + 4) })
          },
          onDragOver: (event) => { if (droppable && !isGroupDrag(dragRef.current)) hoverHead(account.key, event) },
          onDrop: (event) => { if (droppable && !isGroupDrag(dragRef.current)) dropHead(account.key, event) },
        },
        IconNewChat(14),
        h('span', { key: 'text' }, account.kind === 'group' ? t('dropzone.newOrDrop') : t('dropzone.newOnly')))
      }

      const renderAccount = (account) => {
        const editableGroup = account.kind === 'group' && account.groupId !== undefined
        const editableProject = account.kind === 'project' && account.workspaceId !== undefined
        const canReorder = editableGroup && view.tab === 'groups' && !searching
        const reorderMarker = editableGroup ? headMarker(drag?.over, account.groupId) : ''
        const draggingThis = editableGroup && isGroupDrag(drag) && drag.groupId === account.groupId
        // An empty bucket only appears while a session drag is live, as a drop
        // target: render its head, not the empty rail.
        const headOnly = account.kind === 'group' && account.groupId === undefined && account.sessions.length === 0
        const head = h('div', {
          key: 'head',
          className: 'wsg-account-head'
            + (sameHeadTarget(drag?.over, account.key) ? ' wsg-drop-head' : '')
            + (reorderMarker === '' ? '' : ' wsg-head-drop-' + reorderMarker)
            + (draggingThis ? ' wsg-dragging' : ''),
          role: 'button',
          tabIndex: 0,
          draggable: canReorder,
          onClick: () => { toggleAccount(account.key) },
          onKeyDown: (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            toggleAccount(account.key)
          },
          onContextMenu: (event) => {
            if (!editableGroup && !editableProject) return
            showContextMenu(editableGroup ? 'group' : 'project', editableGroup ? account.groupId : account.workspaceId, event)
          },
          onDragStart: (event) => { if (canReorder) beginGroupDrag(account.groupId, event) },
          onDragOver: (event) => { hoverHead(account.key, event) },
          onDrop: (event) => { dropHead(account.key, event) },
          onDragEnd: endDrag,
        },
        h('span', { key: 'badge', className: 'wsg-badge' + (account.kind === 'project' ? ' wsg-badge-project' : '') },
          account.kind === 'project' ? IconFolder(14) : (account.badge ?? DEFAULT_BADGE)),
        h('span', { key: 'title', className: 'wsg-account-title' }, account.title),
        h('span', { key: 'chevron', className: 'wsg-chevron' + (account.expanded ? ' wsg-chevron-open' : '') }, IconChevron()),
        h('span', { key: 'spacer', className: 'wsg-head-spacer' }),
        h('span', { key: 'count', className: 'wsg-count' }, String(account.sessions.length)),
        h('button', {
          key: 'add',
          type: 'button',
          className: 'wsg-add',
          'aria-label': t('session.create'),
          title: t('session.create'),
          onClick: (event) => {
            event.stopPropagation()
            const box = event.currentTarget.getBoundingClientRect()
            requestNewSession(account, { x: clampX(box.left - 8, PICKER_WIDTH), y: clampY(box.bottom + 4) })
          },
        }, IconNewChat(14)))
        if (!account.expanded || headOnly) return h(React.Fragment, { key: account.key }, head)
        const rows = account.sessions.length === 0
          ? [renderDropzone(account)]
          : account.sessions.map(sessionId => renderRow(account, sessionId))
        return h(React.Fragment, { key: account.key }, head, h('div', { key: 'rail', className: 'wsg-rail' }, ...rows))
      }

      const renderEmptyState = (key, titleKey, hintKey, actionLabelKey, onAction) => h('div', { key, className: 'wsg-empty-state' },
        h('div', { key: 'title', className: 'wsg-empty-title' }, t(titleKey)),
        h('div', { key: 'hint', className: 'wsg-empty-hint' }, t(hintKey)),
        h('button', { key: 'action', type: 'button', className: 'wsg-inline-btn', onClick: onAction }, IconPlus(14), t(actionLabelKey)))

      const renderBody = () => {
        const rows = []
        if (view.tab === 'groups') {
          if (view.groups.length === 0) {
            rows.push(renderEmptyState('empty-groups', 'group.emptyTitle', 'group.emptyHint', 'group.create', () => { openDialog('createGroup') }))
          }
        } else if (workspaces.length === 0) {
          rows.push(renderEmptyState('empty-workspaces', 'workspace.none', 'workspace.noneHint', 'workspace.add', addWorkspace))
        }
        for (const account of model) rows.push(renderAccount(account))
        if (rows.length === 0) {
          rows.push(h('div', { key: 'empty', className: 'wsg-empty-state' }, searching ? t('search.empty') : t('empty.sessions')))
        }
        return rows
      }

      const tabButton = (tab, icon, label) => h('button', {
        key: tab,
        type: 'button',
        role: 'tab',
        'aria-selected': view.tab === tab,
        className: 'wsg-tab' + (view.tab === tab ? ' wsg-tab-active' : ''),
        onClick: () => { switchTab(tab) },
      }, icon, h('span', { key: 'label' }, label))

      const toolbarButton = (key, label, onClick, icon, extra) => h('button', {
        key,
        type: 'button',
        className: 'wsg-icon-btn',
        'aria-label': label,
        title: label,
        onMouseDown: (event) => { event.stopPropagation() },
        onClick,
        ...extra,
      }, icon)

      const renderSearchBar = () => h('div', { key: 'searchbar', className: 'wsg-searchbar' },
        h('span', { key: 'icon', className: 'wsg-search-icon' }, IconSearch(12)),
        h('input', {
          key: 'input',
          className: 'wsg-search-input',
          type: 'text',
          autoFocus: true,
          value: search,
          placeholder: t('search.placeholder'),
          'aria-label': t('search.placeholder'),
          onChange: (event) => { setSearch(event.target.value) },
          onKeyDown: (event) => { if (event.key !== 'Escape') return; event.stopPropagation(); closeSearch() },
          // An empty search has nothing to preserve: collapse on blur.
          onBlur: () => { if (search.trim() === '') setSearchOpen(false) },
        }),
        h('button', {
          key: 'close',
          type: 'button',
          className: 'wsg-search-clear',
          'aria-label': t('search.close'),
          title: t('search.close'),
          onMouseDown: (event) => { event.stopPropagation() },
          onClick: closeSearch,
        }, IconClose(12)))

      const renderToolbar = () => h('div', { key: 'toolbar', className: 'wsg-toolbar' },
        searchOpen
          ? renderSearchBar()
          : [
            h('div', { key: 'tabs', className: 'wsg-tabs', role: 'tablist' },
              tabButton('groups', h('span', { key: 'icon', className: 'wsg-tab-hash' }, '#'), t('tab.groups')),
              tabButton('projects', IconFolder(12), t('tab.projects'))),
            h('span', { key: 'spacer', className: 'wsg-head-spacer' }),
            toolbarButton('search', t('search.open'), () => { setSearchOpen(true) }, IconSearch(16)),
            toolbarButton('sort', t('sort.label'), (event) => {
              const box = event.currentTarget.getBoundingClientRect()
              if (popover?.kind === 'sort') return closePopover()
              setPopover({ kind: 'sort', x: Math.max(8, box.right - MENU_WIDTH), y: clampY(box.bottom + 4) })
            }, IconSortArrows(), { 'aria-expanded': popover?.kind === 'sort' }),
            toolbarButton('create', view.tab === 'groups' ? t('group.create') : t('workspace.add'), () => {
              if (view.tab === 'groups') openDialog('createGroup')
              else addWorkspace()
            }, view.tab === 'groups' ? IconPlus(16) : IconProjectAdd(16)),
          ])

      const renderError = () => (error === null ? null : h('div', { key: 'error', className: 'wsg-error', role: 'status' },
        h('span', { key: 'text', className: 'wsg-error-text' }, error),
        h('button', {
          key: 'dismiss',
          type: 'button',
          className: 'wsg-icon-btn',
          'aria-label': t('error.dismiss'),
          onClick: () => { setError(null) },
        }, IconClose(12))))

      return h('div', { className: 'wsg-panel' },
        h('style', { key: 'css' }, CSS),
        renderToolbar(),
        renderError(),
        h('div', {
          key: 'body',
          className: 'wsg-body',
          onScroll: () => { if (popoverOpen) closePopover() },
        },
        list?.phase === 'ready' ? null : h('div', { key: 'loading', className: 'wsg-empty-state' }, t('loading')),
        renderBody()),
        renderPopover(),
        renderDialog())
    }

    /** Install the dictionaries and the sidebar workspace cell. */
    function activate(ctx) {
      ctx.effect(() => {
        const disposeEn = ctx.locale.register(NS, 'en', EN)
        const disposeZh = ctx.locale.register(NS, 'zh', ZH)
        return () => {
          disposeEn()
          disposeZh()
        }
      }, 'workspace-groups: dictionaries')

      const sessions = ctx.get('sessions')
      const workspaces = ctx.get('workspaces')
      const uiWorkspace = ctx.get('uiWorkspace')
      /** Unwrap a generated Remote result or throw its message. */
      const unwrap = (result) => {
        if (result !== null && typeof result === 'object' && result.ok === true) return result.value
        const message = result !== null && typeof result === 'object' && result.error !== null && result.error !== undefined
          ? result.error.message
          : undefined
        throw new Error(typeof message === 'string' && message !== '' ? message : 'request failed')
      }

      const injected = () => ({
        openSession: sessionId => { uiWorkspace.openSession(sessionId) },
        createSession: opts => sessions.create(opts ?? {}),
        forkSession: sessionId => uiWorkspace.forkSession(sessionId),
        renameSession: async (sessionId, title) => {
          const result = await sessions.using(
            sessionId,
            { source: 'controllerOperation' },
            reference => reference.binding.session.rename(title),
          )
          unwrap(result)
        },
        archiveSession: sessionId => uiWorkspace.archiveSession(sessionId),
        renameWorkspace: async (workspaceId, title) => {
          await workspaces.rename(workspaceId, title)
        },
        deleteWorkspace: async workspaceId => {
          await workspaces.delete(workspaceId)
        },
        addWorkspace: async () => {
          const path = await uiWorkspace.pickDirectory()
          if (path === null || path === undefined || path === '') return null
          return workspaces.create({ path })
        },
      })

      // Take the sidebar's workspace region over: a negative priority shadows
      // the shipped browser instead of colliding with it at priority 0.
      ctx.slots.inject('sidebar.workspaces', () => ctx.slots.register({
        name: 'sidebar.workspaces',
        priority: -1,
        locale: NS,
        inject: injected,
      }, GroupedWorkspacePanel))
    }

    /** Default ignored so the plugin object carries only `inject` and `apply`. */
    return {
      inject: ['slots', 'sessions', 'workspaces', 'uiWorkspace', 'locale'],
      /**
       * Install the panel. A failure here must not take the whole client boot
       * down: the console names this plugin and the rest of the app stays usable.
       * @param ctx - client root context.
       */
      apply(ctx) {
        try {
          activate(ctx)
        } catch (error) {
          console.error('workspace-groups: activation failed; the sidebar keeps the shipped browser.', error)
        }
      },
    }
  },
})
