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
    const {
      Fragment, createElement: h, memo, useCallback, useEffect, useMemo, useRef, useState,
    } = React

    const NS = 'workspace-groups'
    const STORAGE_KEY = 'dsh.workspace-groups.v3'
    const LEGACY_V2_KEY = 'dsh.workspace-groups.v2'
    const LEGACY_V1_KEY = 'dsh.workspace-groups.v1'
    /** Sessions outside every Workspace use this account key. */
    const UNGROUPED_KEY = ''
    const GROUP_PREFIX = 'group:'
    const PROJECT_PREFIX = 'project:'
    const DEFAULT_BADGE = '#'
    /**
     * Badge palette: `ink` paints the swatch and the glyph, `wash` is the chip
     * behind the glyph. These literals are the one deliberate exception to the
     * token-only rule — a user-picked palette cannot come from theme tokens.
     */
    const BADGE_COLORS = [
      { key: 'slate', zh: '灰', en: 'Slate', ink: '#A9ADB5', wash: 'rgba(169,173,181,.20)' },
      { key: 'red', zh: '红', en: 'Red', ink: '#E5484D', wash: 'rgba(229,72,77,.18)' },
      { key: 'orange', zh: '橙', en: 'Orange', ink: '#F76B15', wash: 'rgba(247,107,21,.18)' },
      { key: 'yellow', zh: '黄', en: 'Yellow', ink: '#DEA32E', wash: 'rgba(222,163,46,.20)' },
      { key: 'green', zh: '绿', en: 'Green', ink: '#30A46C', wash: 'rgba(48,164,108,.18)' },
      { key: 'blue', zh: '蓝', en: 'Blue', ink: '#4C6EF5', wash: 'rgba(76,110,245,.18)' },
      { key: 'purple', zh: '紫', en: 'Purple', ink: '#8E4EC6', wash: 'rgba(142,78,198,.18)' },
      { key: 'pink', zh: '粉', en: 'Pink', ink: '#E93D82', wash: 'rgba(233,61,130,.18)' },
    ]
    /** Badge glyphs, hand-drawn on the same 16px grid as the panel icons. */
    const BADGE_ICONS = [
      { key: 'folder', zh: '文件夹', en: 'Folder', shapes: ['M2.8 5.6c0-.7.5-1.2 1.2-1.2h2.4l1.4 1.6h4.2c.7 0 1.2.5 1.2 1.2v5c0 .7-.5 1.2-1.2 1.2H4c-.7 0-1.2-.5-1.2-1.2z'] },
      { key: 'doc', zh: '文档', en: 'Document', shapes: ['M4.6 2.9h4.9l2.9 2.9v7.3H4.6z', 'M9.5 2.9v2.9h2.9', 'M6.3 8.5h3.4', 'M6.3 10.6h3.4'] },
      { key: 'book', zh: '书', en: 'Book', shapes: ['M2.9 4.5c1.7-.9 3.4-.9 5.1 0 1.7-.9 3.4-.9 5.1 0v7.1c-1.7-.9-3.4-.9-5.1 0-1.7-.9-3.4-.9-5.1 0z', 'M8 4.7v6.9'] },
      { key: 'cap', zh: '学士帽', en: 'Cap', shapes: ['M8 2.9 13.7 5.7 8 8.5 2.3 5.7z', 'M4.7 7.4v3c0 1 1.5 1.8 3.3 1.8s3.3-.8 3.3-1.8v-3', 'M13.7 5.8v3.3'] },
      { key: 'pencil', zh: '铅笔', en: 'Pencil', shapes: ['M3.2 12.8l.7-2.8 6.3-6.3 2.1 2.1-6.3 6.3z', 'M9.4 4.7l2.1 2.1'] },
      { key: 'tag', zh: '标签', en: 'Tag', shapes: ['M3.1 8.5V4.3c0-.7.5-1.2 1.2-1.2h4.2l6.1 6.1-5.4 5.4z', { cx: 5.7, cy: 5.7, r: 0.9 }] },
      { key: 'code', zh: '代码', en: 'Code', shapes: ['M5.6 4.8 2.8 8l2.8 3.2', 'M10.4 4.8 13.2 8l-2.8 3.2'] },
      { key: 'terminal', zh: '终端', en: 'Terminal', shapes: ['M3.2 5.6 5.9 8l-2.7 2.4', 'M8 10.4h4.6'] },
      { key: 'bolt', zh: '闪电', en: 'Bolt', shapes: ['M8.9 2.6 4.5 9h3l-1 4.4L11.5 7H8.6z'] },
      { key: 'settings', zh: '设置', en: 'Settings', shapes: ['M2.9 5.4h10.2', 'M2.9 10.6h10.2', { cx: 5.6, cy: 5.4, r: 1.1 }, { cx: 10.4, cy: 10.6, r: 1.1 }] },
      { key: 'target', zh: '目标', en: 'Target', shapes: [{ cx: 8, cy: 8, r: 5.2 }, { cx: 8, cy: 8, r: 1.7 }] },
      { key: 'chart', zh: '图表', en: 'Chart', shapes: ['M3.6 12.6V9.2', 'M8 12.6V4.5', 'M12.4 12.6V7'] },
      { key: 'briefcase', zh: '公文包', en: 'Briefcase', shapes: ['M2.9 6.3h10.2v6.2H2.9z', 'M6.1 6.3V5c0-.5.4-.9.9-.9h2c.5 0 .9.4.9.9v1.3', 'M2.9 9.5h10.2'] },
      { key: 'dollar', zh: '美元', en: 'Dollar', shapes: [{ cx: 8, cy: 8, r: 5.2 }, 'M8 4.8v6.4', 'M9.7 6.4c-.4-.6-1-.9-1.7-.9-.9 0-1.6.5-1.6 1.2s.7 1.1 1.6 1.3c.9.2 1.6.6 1.6 1.3s-.7 1.2-1.6 1.2c-.7 0-1.3-.3-1.7-.9'] },
      { key: 'music', zh: '音乐', en: 'Music', shapes: ['M6.4 11.4V4.9l6.1-1.2v6.5', { cx: 5.2, cy: 11.4, r: 1.2 }, { cx: 11.3, cy: 10.2, r: 1.2 }] },
      { key: 'cake', zh: '蛋糕', en: 'Cake', shapes: ['M4.7 8.5h6.6l-.8 4.2c-.1.5-.5.8-1 .8H6.5c-.5 0-.9-.3-1-.8z', 'M4.7 8.5c0-1.8 1.5-3.3 3.3-3.3s3.3 1.5 3.3 3.3', { cx: 8, cy: 3.9, r: 0.8 }] },
      { key: 'scissors', zh: '剪刀', en: 'Scissors', shapes: [{ cx: 4.7, cy: 11.3, r: 1.4 }, { cx: 11.3, cy: 11.3, r: 1.4 }, 'M5.8 10.3 11 3.7', 'M10.2 10.3 5 3.7'] },
      { key: 'stethoscope', zh: '听诊器', en: 'Stethoscope', shapes: ['M4.7 3.2v3.3a3.3 3.3 0 0 0 6.6 0V3.2', 'M8 9.9v1.2a2.3 2.3 0 0 0 4.6 0v-.9', { cx: 12.6, cy: 9.4, r: 0.9 }] },
      { key: 'flask', zh: '烧瓶', en: 'Flask', shapes: ['M6.7 2.8h2.6', 'M7.1 2.8v3.4l-2.7 4.9c-.5 1-.1 2 .9 2h5.4c1 0 1.4-1 .9-2L8.9 6.2V2.8', 'M5.5 9.3h5'] },
      { key: 'sun', zh: '太阳', en: 'Sun', shapes: [{ cx: 8, cy: 8, r: 3.1 }, 'M8 2.4v1.5', 'M8 12.1v1.5', 'M2.4 8h1.5', 'M12.1 8h1.5', 'M4.2 4.2l1.1 1.1', 'M10.7 10.7l1.1 1.1', 'M11.8 4.2l-1.1 1.1', 'M5.3 10.7l-1.1 1.1'] },
      { key: 'sprout', zh: '植物', en: 'Sprout', shapes: ['M8 13.3V8.4', 'M8 8.4C8 6.2 6.2 4.4 4 4.4c0 2.2 1.8 4 4 4z', 'M8 8.4c0-2.4 1.8-4.4 4.2-4.4 0 2.4-1.8 4.4-4.2 4.4z'] },
      { key: 'paw', zh: '爪印', en: 'Paw', shapes: [{ cx: 4.4, cy: 6.2, r: 1.2 }, { cx: 8, cy: 4.9, r: 1.2 }, { cx: 11.6, cy: 6.2, r: 1.2 }, 'M5 9.4c.8-.6 1.9-1 3-1s2.2.4 3 1c.6.5.6 1.4-.1 1.8-.8.5-1.8 1.2-2.9 1.2s-2.1-.7-2.9-1.2c-.7-.4-.7-1.3-.1-1.8z'] },
      { key: 'heart', zh: '心', en: 'Heart', shapes: ['M8 13.1S2.9 10 2.9 6.7c0-1.9 1.4-3.1 2.9-3.1 1 0 1.8.6 2.2 1.4.4-.8 1.2-1.4 2.2-1.4 1.5 0 2.9 1.2 2.9 3.1 0 3.3-5.1 6.4-5.1 6.4z'] },
      { key: 'star', zh: '星星', en: 'Star', shapes: ['M8 2.7l1.6 3.5 3.7.4-2.8 2.6.8 3.7L8 11.1l-3.3 1.8.8-3.7L2.7 6.6l3.7-.4z'] },
      { key: 'check', zh: '完成', en: 'Check', shapes: [{ cx: 8, cy: 8, r: 5.2 }, 'm5.4 8.2 1.8 1.9 3.5-3.9'] },
      { key: 'plane', zh: '飞机', en: 'Plane', shapes: ['M8 2.7 9 6l3.6 2.3v1.3L9 9.1l-.5 3.2 1.5.9v.7L8 13.3l-2 .6v-.7l1.5-.9L7 9.1 3.4 9.6V8.3L7 6z'] },
      { key: 'globe', zh: '地球', en: 'Globe', shapes: [{ cx: 8, cy: 8, r: 5.2 }, 'M2.8 8h10.4', 'M8 2.8c1.5 1.6 2.2 3.4 2.2 5.2s-.7 3.6-2.2 5.2c-1.5-1.6-2.2-3.4-2.2-5.2S6.5 4.4 8 2.8z'] },
      { key: 'compass', zh: '指南针', en: 'Compass', shapes: [{ cx: 8, cy: 8, r: 5.2 }, 'M10.2 5.8 6.6 7.4 5.8 10.2 9.4 8.6z'] },
      { key: 'flag', zh: '旗帜', en: 'Flag', shapes: ['M4.1 13.2V2.9', 'M4.1 3.3c2.6-1.2 5.6 1.2 8.2 0v4.7c-2.6 1.2-5.6-1.2-8.2 0'] },
      { key: 'dumbbell', zh: '哑铃', en: 'Dumbbell', shapes: ['M5.2 6.2v3.6', 'M10.8 6.2v3.6', 'M5.2 8h5.6', 'M3.3 7v2', 'M12.7 7v2'] },
      { key: 'layers', zh: '图层', en: 'Layers', shapes: ['M8 2.9 13 5.6 8 8.3 3 5.6z', 'M3 8.6 8 11.3l5-2.7'] },
    ]
    const DEFAULT_BADGE_COLOR = 'blue'
    const DEFAULT_BADGE_ICON = 'folder'
    const BADGE_COLOR_MAP = new Map(BADGE_COLORS.map(color => [color.key, color]))
    const BADGE_ICON_MAP = new Map(BADGE_ICONS.map(icon => [icon.key, icon]))
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
    /** Popover/flyout geometry: gap from its anchor, and the viewport it must stay inside. */
    const FLYOUT_GAP = 4
    const FLYOUT_MARGIN = 12
    const FLYOUT_TOP_MARGIN = 8
    const FLYOUT_MIN_HEIGHT = 120
    /** Stable empties: a fresh `{}`/`[]` per render would defeat every memo below. */
    const EMPTY_RECORD = Object.freeze({})
    const EMPTY_IDS = Object.freeze([])
    const EMPTY_ITEMS = Object.freeze([])

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
      'badge.search':             ['搜索图标', 'Search icons'],
      'badge.clear':              ['清除', 'Clear'],
      'badge.none':               ['没有匹配的图标', 'No matching icons'],
      'badge.default':            ['默认徽章', 'Default badge'],
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
      ...Object.fromEntries(BADGE_COLORS.map(color => ['badge.color.' + color.key, [color.zh, color.en]])),
      ...Object.fromEntries(BADGE_ICONS.map(icon => ['badge.icon.' + icon.key, [icon.zh, icon.en]])),
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
.wsg-session:hover,.wsg-session-current,.wsg-account-head:hover,.wsg-menu-item:hover,.wsg-btn:hover,.wsg-inline-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}
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
.wsg-badge-picker{display:flex;flex-direction:column;gap:8px;width:100%;max-width:232px;padding:2px 0}
.wsg-badge-fill{max-width:none}
.wsg-badge-fill .wsg-badge-colors{display:grid;grid-template-columns:repeat(8,1fr);justify-items:center;gap:4px}
.wsg-badge-fill .wsg-badge-swatch{width:22px;height:22px}
.wsg-badge-fill .wsg-badge-icons{gap:4px}
.wsg-badge-fill .wsg-badge-icon-cell{height:34px}
.wsg-badge-fill .wsg-badge-hash{font-size:15px}
.wsg-badge-search{display:flex;align-items:center;gap:6px;height:28px;padding:0 6px 0 8px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-3)}
.wsg-badge-search:focus-within{border-color:var(--dsw-alias-brand-primary)}
.wsg-badge-search-input{flex:1;min-width:0;height:100%;border:0;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px}
.wsg-badge-search-input::placeholder{color:var(--dsw-alias-label-dimmed)}
.wsg-badge-clear{flex:none;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:11px;line-height:16px;cursor:pointer}
.wsg-badge-clear:hover{color:var(--dsw-alias-label-primary)}
.wsg-badge-colors{display:flex;align-items:center;justify-content:space-between;gap:4px}
.wsg-badge-swatch{width:20px;height:20px;flex:none;padding:0;border:2px solid transparent;border-radius:50%;background-clip:padding-box;cursor:pointer}
.wsg-badge-swatch-active{border-color:var(--dsw-alias-label-primary)}
.wsg-badge-swatch:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:1px}
.wsg-badge-icons{display:grid;grid-template-columns:repeat(8,1fr);gap:2px}
.wsg-badge-icon-cell{display:inline-flex;align-items:center;justify-content:center;width:100%;height:26px;padding:0;border:1px solid transparent;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.wsg-badge-icon-cell:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.wsg-badge-icon-cell:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:-1px}
.wsg-badge-icon-cell-active{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}
.wsg-badge-hash{font-size:13px;font-weight:600;line-height:1}
.wsg-badge-empty{grid-column:1/-1;padding:8px 0;text-align:center;font-size:12px;color:var(--dsw-alias-label-tertiary)}
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

    // ---- shared DOM helpers ---------------------------------------------------

    /** Join class names, dropping everything falsy. */
    function classes(...names) {
      return names.filter(Boolean).join(' ')
    }

    /** Whether a parsed value is a plain record (arrays do not count). */
    function isRecord(value) {
      return value !== null && typeof value === 'object' && !Array.isArray(value)
    }

    // ---- icons (hand-drawn: this plugin never imports the UI primitives) -----

    /**
     * The 16px svg shell every icon shares.
     * @param size - rendered square size in px.
     * @param strokeWidth - `1.4` for the hand-drawn set, `1.1` for the host glyphs.
     * @param children - shape elements.
     */
    function svgIcon(size, strokeWidth, children) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        children,
      )
    }

    /** Stroke icon from path strings or `{cx,cy,r}` circles. */
    function strokeIcon(size, shapes) {
      return svgIcon(size, 1.4, shapes.map((shape, index) => (typeof shape === 'string'
        ? h('path', { key: index, d: shape })
        : h('circle', { key: index, ...shape }))))
    }

    /**
     * Draw one of the host's own 16px glyphs from its path data, so icons of the
     * shipped workspace browser match pixel for pixel.
     * @param size - rendered square size in px.
     * @param paths - `{d, fill}` entries; `fill` paints the shape instead of stroking it.
     * @returns the svg element.
     */
    function glyphIcon(size, paths) {
      return svgIcon(size, 1.1, paths.map((path, index) => (path.fill === true
        ? h('path', { key: index, d: path.d, fill: 'currentColor', stroke: 'none' })
        : h('path', { key: index, d: path.d, stroke: 'currentColor' }))))
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

    // ---- badges -------------------------------------------------------------

    /**
     * The color+icon pair a badge carries.
     * @returns `{color, icon}` when the value is a complete pair, else null —
     * `#` and the legacy emoji strings render as text.
     */
    function badgeShape(badge) {
      if (!isRecord(badge)) return null
      if (!BADGE_COLOR_MAP.has(badge.color) || !BADGE_ICON_MAP.has(badge.icon)) return null
      return { color: badge.color, icon: badge.icon }
    }

    /**
     * One badge element, shared by the group head, the context menu and the picker.
     * @param badge - `#`, a legacy emoji, or a `{color, icon}` pair.
     * @param className - the circle style of the seat it fills.
     * @param size - glyph size in px.
     */
    function badgeNode(badge, className, size) {
      const shape = badgeShape(badge)
      if (shape === null) {
        return h('span', { key: 'badge', className }, typeof badge === 'string' && badge !== '' ? badge : DEFAULT_BADGE)
      }
      const color = BADGE_COLOR_MAP.get(shape.color)
      const icon = BADGE_ICON_MAP.get(shape.icon)
      return h('span', {
        key: 'badge',
        className,
        style: { color: color.ink, background: color.wash },
      }, strokeIcon(size, icon.shapes))
    }

    // ---- persisted viewing state (v3) -------------------------------------

    /** Empty persisted state. */
    function defaultState() {
      return { version: 3, tab: 'groups', orderBy: 'updated', groupExpansion: {}, sessionOrder: {}, groups: [], assignment: {} }
    }

    /** One of the allowed enum values, or its fallback. */
    function pick(value, allowed, fallback) {
      return typeof value === 'string' && allowed.includes(value) ? value : fallback
    }

    /**
     * A usable badge: a `{color, icon}` pair, a legacy emoji string, or the
     * default hash when the value is missing or malformed.
     */
    function normalizeBadge(value) {
      const shape = badgeShape(value)
      if (shape !== null) return shape
      if (typeof value !== 'string') return DEFAULT_BADGE
      const trimmed = value.trim()
      if (trimmed === '' || trimmed.length > 8) return DEFAULT_BADGE
      return trimmed
    }

    /** Copy the entries of a raw record that `keep` accepts; `undefined` drops one. */
    function mapRecord(raw, keep) {
      const out = {}
      if (!isRecord(raw)) return out
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
      if (!isRecord(raw)) return defaultState()
      const seen = new Set()
      const groups = (Array.isArray(raw.groups) ? raw.groups : []).flatMap((group) => {
        if (!isRecord(group)) return []
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
      if (!isRecord(raw)) return null
      const order = isRecord(raw.sessionOrder) ? raw.sessionOrder : EMPTY_RECORD
      return {
        ...raw,
        tab: raw.groupBy === 'custom' ? 'groups' : 'projects',
        sessionOrder: Object.fromEntries(Object.entries(order)
          .filter(([key]) => key !== '__flat__')
          .map(([key, value]) => [key === UNGROUPED_KEY || key.startsWith(GROUP_PREFIX) ? key : PROJECT_PREFIX + key, value])),
      }
    }

    /** Map one v1 account key onto the v3 spelling. */
    function fromV1Key(key) {
      if (key === '__ungrouped__') return UNGROUPED_KEY
      return key.startsWith('ws:') ? PROJECT_PREFIX + key.slice(3) : key
    }

    /** The v1 record stored collapsed keys instead of expansion flags. */
    function fromV1(raw) {
      if (!isRecord(raw)) return null
      const collapsed = isRecord(raw.collapsed) ? raw.collapsed : EMPTY_RECORD
      return {
        ...raw,
        tab: raw.view === 'groups' ? 'groups' : 'projects',
        orderBy: 'updated',
        sessionOrder: {},
        groupExpansion: Object.fromEntries(Object.entries(collapsed)
          .filter(([key, value]) => key !== 'archived' && typeof value === 'boolean')
          .map(([key, value]) => [fromV1Key(key), value])),
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

    /** Whether one catalog row may belong to an account at all. */
    function sessionEligible(summary, currentId) {
      if (summary === undefined || summary === null) return false
      if (summary.origin === 'subagent') return false
      if (summary.blank === true && summary.id !== currentId) return false
      return true
    }

    /** Whether one catalog row may render as a row (archived rows never render). */
    function sessionVisible(summary, currentId, archived) {
      return sessionEligible(summary, currentId) && !archived.has(summary.id)
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
        forceExpanded, hideEmpty, showEmptyBucket, ungroupedTitle,
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
              members: (workspace.sessionIds ?? EMPTY_IDS).filter(id => byId[id] !== undefined),
            },
          ))
          .filter(account => hideEmpty !== true || account.sessions.length > 0)
      }
      // One pass over the catalog files every eligible session under its group,
      // instead of one filtering pass per group.
      const known = new Set(groups.map(group => group.id))
      const buckets = new Map()
      const loose = []
      for (const id of eligible) {
        const owner = assignment[id]
        if (!known.has(owner)) {
          loose.push(id)
          continue
        }
        const bucket = buckets.get(owner)
        if (bucket === undefined) buckets.set(owner, [id])
        else bucket.push(id)
      }
      const accounts = groups.map(group => makeAccount(
        GROUP_PREFIX + group.id,
        group.name,
        'group',
        {
          groupId: group.id,
          badge: group.badge,
          members: buckets.get(group.id) ?? EMPTY_IDS,
        },
      ))
      if (loose.length > 0) {
        const bucket = makeAccount(UNGROUPED_KEY, ungroupedTitle, 'group', { members: loose })
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

    /**
     * One row's relative timestamp, memoized per (timestamp, wall-clock minute,
     * locale). Rows re-render on every store notification; formatting the same
     * minute again for hundreds of rows was pure repetition.
     * @param t - translate seat, part of the cache identity.
     * @param timestamp - the session's `updatedAt`.
     * @param now - this render's wall clock.
     * @returns the row's compact label.
     */
    let labelCache = { t: null, minute: -1, labels: new Map() }
    function relativeLabel(t, timestamp, now) {
      const minute = Math.floor(now / 60_000)
      if (labelCache.t !== t || labelCache.minute !== minute) {
        labelCache = { t, minute, labels: new Map() }
      }
      const key = typeof timestamp === 'number' ? timestamp : 0
      const cached = labelCache.labels.get(key)
      if (cached !== undefined) return cached
      const label = formatRelative(t, timestamp, now)
      labelCache.labels.set(key, label)
      return label
    }

    /**
     * Clamp a flyout origin into the viewport.
     * @param x - desired left edge.
     * @param y - desired top edge.
     * @param width - flyout width, so its right edge stays reachable.
     * @returns `{x, y}` inside the viewport.
     */
    function originAt(x, y, width) {
      return {
        x: Math.max(FLYOUT_TOP_MARGIN, Math.min(x, window.innerWidth - width - FLYOUT_MARGIN)),
        y: Math.max(FLYOUT_TOP_MARGIN, Math.min(y, window.innerHeight - 48)),
      }
    }

    /**
     * Origin just under an element's top/bottom edge.
     * @param box - the anchor's rect.
     * @param width - flyout width.
     * @param offset - horizontal nudge from the anchor's left edge.
     * @returns `{x, y}` inside the viewport.
     */
    function originUnder(box, width, offset) {
      return originAt(box.left + offset, box.bottom + FLYOUT_GAP, width)
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

    /** Which half of a drop target the pointer sits over. */
    function dropHalf(box, clientY) {
      return clientY < box.top + box.height / 2 ? 'before' : 'after'
    }

    /** Whether `over` points at this row, and on which half; `''` when it does not. */
    function rowOver(over, accountKey, sessionId) {
      if (over === null || over === undefined || over.head === true) return ''
      if (over.accountKey !== accountKey || over.sessionId !== sessionId) return ''
      return over.half === 'before' ? 'before' : 'after'
    }

    /** Whether `over` points at this account head (a session drag). */
    function isHeadOver(over, accountKey) {
      return over !== null && over !== undefined && over.head === true && over.accountKey === accountKey
    }

    /** Whether a group drag points at this group, and on which half; `''` when it does not. */
    function groupOver(over, groupId) {
      if (over === null || over === undefined || over.groupId !== groupId) return ''
      return over.half === 'before' ? 'before' : 'after'
    }

    /** Whether a drag marker already equals the candidate marker. */
    function sameMarker(over, next) {
      if (over === null || over === undefined) return false
      return over.accountKey === next.accountKey
        && over.sessionId === next.sessionId
        && over.groupId === next.groupId
        && over.head === next.head
        && over.half === next.half
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

    /** Scroll the title without smooth behavior: the crawl owns every step. */
    function scrollTitleTo(title, left) {
      if (typeof title.scrollTo === 'function') title.scrollTo({ left, behavior: 'instant' })
      else title.scrollLeft = left
    }

    /** Place the title's scroll offset and publish the fade-mask hooks. */
    function placeTitle(title, left, range) {
      scrollTitleTo(title, left)
      if (left > 0) title.dataset.scrolled = ''
      else delete title.dataset.scrolled
      if (left < range) title.dataset.clipped = ''
      else delete title.dataset.clipped
    }

    /** Return the title to its resting state: scroll at the start, masks off. */
    function restTitle(title) {
      scrollTitleTo(title, 0)
      delete title.dataset.scrolled
      delete title.dataset.clipped
    }

    // ---- row component -------------------------------------------------------

    /** One dense session row; memoized because the sidebar can carry hundreds of them. */
    const SessionRow = memo(function SessionRow(props) {
      const {
        sessionId, accountKey, title, tooltip, timeLabel, statusState, statusLabel,
        pinned, current, marker, draggable, archiveLabel,
        onOpen, onContextMenu, onDragStart, onDragOver, onDrop, onDragEnd, onArchive,
      } = props
      const titleRef = useRef(null)
      const frameRef = useRef(0)
      // Absolute spinner phase: the delay is derived from the wall clock, so every
      // running row rotates in lockstep regardless of when it mounted.
      const spinDelay = useMemo(
        () => (statusState === 'ongoing' ? `-${Date.now() % SPIN_MS}ms` : undefined),
        [statusState],
      )
      useEffect(() => () => cancelAnimationFrame(frameRef.current), [])
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
      const className = classes(
        'wsg-session',
        current && 'wsg-session-current',
        marker === 'before' && 'wsg-drop-before',
        marker === 'after' && 'wsg-drop-after',
      )
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

    /**
     * Dialog affordances, keyed by kind: only the differences live here.
     * `local` submits against the viewing state, `remote` calls one injected method.
     */
    const DIALOG_SPEC = {
      createGroup: { title: 'group.create', confirm: 'dialog.create', local: 'createGroup' },
      renameGroup: { title: 'group.rename', confirm: 'dialog.save', local: 'renameGroup' },
      deleteGroup: { title: 'group.delete', desc: 'group.deleteDesc', confirm: 'dialog.delete', danger: true, local: 'deleteGroup' },
      renameWorkspace: { title: 'workspace.rename', confirm: 'dialog.save', remote: 'renameWorkspace' },
      renameSession: { title: 'session.rename', confirm: 'dialog.save', remote: 'renameSession' },
      deleteWorkspace: { title: 'workspace.delete', desc: 'workspace.deleteDesc', confirm: 'dialog.delete', danger: true, remote: 'deleteWorkspace' },
    }

    /** Menu entry vocabulary: one flat record per row, rendered by `renderMenuEntry`. */
    const menuItem = (key, label, action, extra) => ({ key, label, action, ...extra })
    const menuHeading = (key, label) => ({ key, heading: label })
    const menuSeparator = key => ({ key, separator: true })

    // ---- panel hooks ---------------------------------------------------------

    /**
     * The persisted viewing state and its single write funnel.
     * @returns the state, its ref (for callbacks), and the commit function.
     */
    function usePersistedView() {
      const [view, setView] = useState(loadState)
      const viewRef = useRef(view)
      viewRef.current = view
      /** Commit one persisted view change; the write happens before any navigation. */
      const updateView = useCallback((updater) => {
        const previous = viewRef.current
        const next = updater(previous)
        if (next === previous) return
        viewRef.current = next
        persistState(next)
        setView(next)
      }, [])
      // Make a migrated record durable on the first mount.
      useEffect(() => { persistState(viewRef.current) }, [])
      return { view, viewRef, updateView }
    }

    /**
     * One document listener serves both layers: a mousedown outside a popover
     * dismisses it, Escape closes the dialog and any popover under it.
     * @param options - open flags, the popover ref, and the two close handlers.
     */
    function useLayerDismissal(options) {
      const { popoverOpen, dialogOpen, popoverRef, onClosePopover, onCloseDialog } = options
      useEffect(() => {
        if (!popoverOpen && !dialogOpen) return undefined
        const onPress = (event) => {
          if (!popoverOpen || !(event.target instanceof Node)) return
          if (popoverRef.current !== null && popoverRef.current.contains(event.target)) return
          onClosePopover()
        }
        const onKey = (event) => {
          if (event.key !== 'Escape') return
          if (dialogOpen) onCloseDialog()
          onClosePopover()
        }
        document.addEventListener('mousedown', onPress)
        document.addEventListener('keydown', onKey)
        return () => {
          document.removeEventListener('mousedown', onPress)
          document.removeEventListener('keydown', onKey)
        }
      }, [popoverOpen, dialogOpen, popoverRef, onClosePopover, onCloseDialog])
    }

    /**
     * While a drag is live, a drag-over/drop the rows miss must still accept the
     * gesture, or the browser rejects the drop on the whole panel.
     * @param active - whether a drag is in flight.
     */
    function useDocumentDragAccept(active) {
      useEffect(() => {
        if (!active) return undefined
        const acceptDrag = (event) => {
          event.preventDefault()
          if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move'
        }
        const onDrop = (event) => { event.preventDefault() }
        document.addEventListener('dragover', acceptDrag)
        document.addEventListener('drop', onDrop)
        return () => {
          document.removeEventListener('dragover', acceptDrag)
          document.removeEventListener('drop', onDrop)
        }
      }, [active])
    }

    /** The grouped view that replaces the sidebar's workspace browser. */
    function GroupedWorkspacePanel(props) {
      const { useSessions, useSessionStatus, useWorkspaces, t } = props
      // Fine-grained slices: an unrelated store update keeps these references, so
      // every memo below stays valid instead of rebuilding on each notification.
      const ids = useSessions(state => state?.ids ?? EMPTY_IDS)
      const byId = useSessions(state => state?.byId ?? EMPTY_RECORD)
      const phase = useSessions(state => state?.phase)
      const statuses = useSessionStatus(state => state)
      const items = useWorkspaces(state => state?.items ?? EMPTY_ITEMS)
      const archivedIds = useWorkspaces(state => state?.archivedSessionIds ?? EMPTY_IDS)
      const pinnedIds = useWorkspaces(state => state?.pinnedSessionIds ?? EMPTY_IDS)

      // ---- state -------------------------------------------------------------
      const { view, viewRef, updateView } = usePersistedView()
      const [popover, setPopover] = useState(null)
      const [dialog, setDialog] = useState(null)
      const [error, setError] = useState(null)
      const [search, setSearch] = useState('')
      const [badgeQuery, setBadgeQuery] = useState('')
      const [searchOpen, setSearchOpen] = useState(false)
      const [drag, setDrag] = useState(null)
      const dragRef = useRef(drag)
      dragRef.current = drag
      const popoverRef = useRef(null)
      const dropCommittedRef = useRef(false)
      const orderedRef = useRef(new Map())
      // Row elements are pure functions of their primitive props: a store update
      // touches one row, so reusing the released element lets React bail out of
      // the other subtrees instead of comparing every prop again.
      const rowCacheRef = useRef(new Map())
      const visibleRowsRef = useRef(new Set())
      // A reused row element must never outlive the callbacks it captured.
      const handlerSetRef = useRef([])
      const handlerVersionRef = useRef(0)

      const closePopover = useCallback(() => { setPopover(null); setBadgeQuery('') }, [])
      const closeDialog = useCallback(() => { setDialog(null) }, [])
      const patchDialog = useCallback((patch) => {
        setDialog(previous => (previous === null ? previous : { ...previous, ...patch }))
      }, [])
      const openDialog = useCallback((kind, fields) => {
        setPopover(null)
        setBadgeQuery('')
        setDialog({ kind, value: '', badge: DEFAULT_BADGE, error: null, busy: false, ...fields })
      }, [])

      // ---- layers -------------------------------------------------------------
      useLayerDismissal({
        popoverOpen: popover !== null,
        dialogOpen: dialog !== null,
        popoverRef,
        onClosePopover: closePopover,
        onCloseDialog: closeDialog,
      })
      useDocumentDragAccept(drag !== null)

      // ---- derived data -----------------------------------------------------
      const now = Date.now()
      const workspaces = items
      const archived = useMemo(() => new Set(archivedIds), [archivedIds])
      const ranks = useMemo(() => pinRanks(pinnedIds), [pinnedIds])
      const workspaceTitleBySession = useMemo(() => {
        const titles = new Map()
        for (const workspace of workspaces) {
          for (const sessionId of workspace.sessionIds ?? []) {
            if (!titles.has(sessionId)) titles.set(sessionId, workspace.title)
          }
        }
        return titles
      }, [workspaces])

      const currentId = useMemo(() => {
        for (const id of ids) {
          const summary = byId[id]
          if (summary !== undefined && (summary.retainedBy?.mainView ?? 0) > 0) return id
        }
        return undefined
      }, [ids, byId])

      const sessionDragging = isSessionDrag(drag)
      const trimmedSearch = search.trim()
      const searching = trimmedSearch !== ''
      // The index only exists while a search is open: building it on every store
      // update when nobody searches was pure waste.
      const blankTitle = t('session.new')
      const searchIndex = useMemo(() => {
        if (!searching) return null
        const index = new Map()
        for (const id of ids) {
          const summary = byId[id]
          if (summary === undefined) continue
          const title = summary.blank === true ? blankTitle : (summary.displayTitle ?? '')
          index.set(id, (title + '\n' + (workspaceTitleBySession.get(id) ?? '')).toLocaleLowerCase())
        }
        return index
      }, [searching, ids, byId, workspaceTitleBySession, blankTitle])

      const matchSet = useMemo(() => {
        if (searchIndex === null) return null
        const needle = trimmedSearch.toLocaleLowerCase()
        const matches = new Set()
        for (const [id, haystack] of searchIndex) {
          if (haystack.includes(needle)) matches.add(id)
        }
        return matches
      }, [trimmedSearch, searchIndex])

      const model = useMemo(() => buildModel({
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
        ungroupedTitle: t('account.ungrouped'),
      }), [
        view.tab, view.groups, view.assignment, view.sessionOrder, view.groupExpansion,
        workspaces, ids, byId, currentId, archived, ranks, matchSet, searching, sessionDragging, t,
      ])

      const orderedByKey = useMemo(
        () => new Map(model.map(account => [account.key, account.ordered])),
        [model],
      )
      orderedRef.current = orderedByKey
      // Row-level constants: one translate seat lookup serves every row.
      const archiveLabel = t('session.archive')


      // ---- view mutators ----------------------------------------------------
      const fail = useCallback((reason) => { setError(errorText(reason)) }, [])
      /** Fire an injected async operation and surface its rejection inline. */
      const settle = useCallback((promise) => { Promise.resolve(promise).catch(fail) }, [fail])

      const openSessionById = useCallback((sessionId) => { props.openSession(sessionId) }, [props.openSession])

      const archiveSessionById = useCallback((sessionId) => { settle(props.archiveSession(sessionId)) }, [props.archiveSession, settle])

      const showContextMenu = useCallback((target, id, event) => {
        event.preventDefault()
        event.stopPropagation()
        setPopover({ kind: 'context', target, id, ...originAt(event.clientX, event.clientY, MENU_WIDTH) })
      }, [])

      const assign = useCallback((sessionId, groupId) => {
        updateView((previous) => {
          const assignment = { ...previous.assignment }
          if (groupId === null) delete assignment[sessionId]
          else assignment[sessionId] = groupId
          return { ...previous, assignment }
        })
      }, [updateView])

      const createGroup = useCallback((name, badge, moveSessionId) => {
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

      const patchGroup = useCallback((groupId, patch) => {
        updateView(previous => ({
          ...previous,
          groups: previous.groups.map(group => (group.id === groupId ? { ...group, ...patch } : group)),
        }))
      }, [updateView])

      const moveGroup = useCallback((groupId, delta) => {
        updateView((previous) => {
          const index = previous.groups.findIndex(group => group.id === groupId)
          const groups = moveGroupInList(previous.groups, index, index + delta)
          if (groups === previous.groups) return previous
          if (groups.every((group, at) => group.id === previous.groups[at].id)) return previous
          return { ...previous, groups }
        })
      }, [updateView])

      const deleteGroup = useCallback((groupId) => {
        updateView((previous) => {
          const sessionOrder = { ...previous.sessionOrder }
          delete sessionOrder[GROUP_PREFIX + groupId]
          const groupExpansion = { ...previous.groupExpansion }
          delete groupExpansion[GROUP_PREFIX + groupId]
          return {
            ...previous,
            groups: previous.groups.filter(group => group.id !== groupId),
            assignment: mapRecord(previous.assignment, owner => (owner === groupId ? undefined : owner)),
            sessionOrder,
            groupExpansion,
          }
        })
      }, [updateView])

      const toggleAccount = useCallback((key) => {
        updateView(previous => ({
          ...previous,
          groupExpansion: { ...previous.groupExpansion, [key]: previous.groupExpansion[key] === false },
        }))
      }, [updateView])

      const switchTab = useCallback((tab) => {
        setPopover(null)
        updateView(previous => (previous.tab === tab ? previous : { ...previous, tab }))
      }, [updateView])

      const setOrder = useCallback((orderBy) => {
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

      const createSessionIn = useCallback(async (workspaceId, groupId) => {
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

      /** New session in `account`: a picker for groups, direct in a project. */
      const requestNewSession = useCallback((account, origin) => {
        if (account.kind === 'group') {
          setPopover({ kind: 'groupPicker', groupId: account.groupId, ...origin })
          return
        }
        void createSessionIn(account.workspaceId, null)
      }, [createSessionIn])

      const addWorkspace = useCallback(() => {
        setPopover(null)
        settle(props.addWorkspace())
      }, [props.addWorkspace, settle])

      const closeSearch = useCallback(() => {
        setSearch('')
        setSearchOpen(false)
      }, [])

      // ---- dialog submit ----------------------------------------------------
      /** Local submits only touch the persisted viewing state. */
      const LOCAL_SUBMIT = useMemo(() => ({
        createGroup: (state, name) => { createGroup(name, state.badge, state.moveSessionId) },
        renameGroup: (state, name) => { patchGroup(state.id, { name }) },
        deleteGroup: (state) => { deleteGroup(state.id) },
      }), [createGroup, patchGroup, deleteGroup])

      const submitDialog = () => {
        if (dialog === null || dialog.busy) return
        const spec = DIALOG_SPEC[dialog.kind]
        const name = dialog.value.trim()
        if (spec.danger !== true && name === '') return
        if (spec.local !== undefined) {
          LOCAL_SUBMIT[spec.local](dialog, name)
          closeDialog()
          return
        }
        patchDialog({ busy: true, error: null })
        Promise.resolve(props[spec.remote](dialog.id, name)).then(closeDialog, (reason) => {
          patchDialog({ busy: false, error: errorText(reason) })
        })
      }

      // ---- drag -------------------------------------------------------------
      /** Reorder inside one account and switch the page to manual order. */
      const reorderWithin = useCallback((activeDrag, target) => {
        const { accountKey, sessionId } = activeDrag
        if (target.head !== true && target.sessionId === sessionId) return
        const order = orderedRef.current.get(accountKey) ?? [sessionId]
        const next = order.filter(id => id !== sessionId)
        const at = insertIndex(next, target)
        if (at < 0) return
        next.splice(at, 0, sessionId)
        updateView(previous => ({
          ...previous,
          orderBy: 'manual',
          sessionOrder: { ...previous.sessionOrder, [accountKey]: next },
        }))
      }, [updateView])

      /** Reassign a session to another account, keeping the manual order in step. */
      const moveAcross = useCallback((activeDrag, target) => {
        const { accountKey: sourceKey, sessionId } = activeDrag
        const targetKey = target.accountKey
        const targetGroupId = targetKey.startsWith(GROUP_PREFIX) ? targetKey.slice(GROUP_PREFIX.length) : null
        updateView((previous) => {
          const assignment = { ...previous.assignment }
          if (targetGroupId === null) delete assignment[sessionId]
          else assignment[sessionId] = targetGroupId
          if (previous.orderBy !== 'manual') return { ...previous, assignment }
          const sessionOrder = { ...previous.sessionOrder }
          const sourceOrder = sessionOrder[sourceKey] ?? orderedRef.current.get(sourceKey) ?? []
          sessionOrder[sourceKey] = sourceOrder.filter(id => id !== sessionId)
          const targetOrder = [...(sessionOrder[targetKey] ?? orderedRef.current.get(targetKey) ?? [])]
          const at = insertIndex(targetOrder, target)
          targetOrder.splice(at < 0 ? targetOrder.length : at, 0, sessionId)
          sessionOrder[targetKey] = targetOrder
          return { ...previous, assignment, sessionOrder }
        })
      }, [updateView])

      /** Commit a pending session drop. */
      const finishDrag = useCallback((activeDrag, target) => {
        setDrag(null)
        if (activeDrag.accountKey === target.accountKey) reorderWithin(activeDrag, target)
        else if (viewRef.current.tab === 'groups') moveAcross(activeDrag, target)
      }, [reorderWithin, moveAcross])

      /** Commit a group reorder; a drop on the dragged group itself is a no-op. */
      const finishGroupDrag = useCallback((draggedId, target) => {
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

      /** Shared opener: remember the dragged target and seed the transfer. */
      const openDrag = useCallback((state, token, event) => {
        dropCommittedRef.current = false
        setDrag({ ...state, over: null })
        const transfer = event.dataTransfer
        if (transfer === null) return
        transfer.effectAllowed = 'move'
        transfer.setData('text/plain', token)
      }, [])

      const beginDrag = useCallback((accountKey, sessionId, event) => {
        openDrag({ kind: 'session', accountKey, sessionId }, sessionId, event)
      }, [openDrag])

      /** Start reordering the group whose head is being dragged. */
      const beginGroupDrag = useCallback((groupId, event) => {
        openDrag({ kind: 'group', groupId }, groupId, event)
      }, [openDrag])

      /** Accept the drag over `event.currentTarget` and report the half it is over. */
      const acceptOver = useCallback((event) => {
        event.preventDefault()
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move'
        return dropHalf(event.currentTarget.getBoundingClientRect(), event.clientY)
      }, [])

      /** Remember the drop marker, skipping updates that would not change it. */
      const setOver = useCallback((next) => {
        setDrag(previous => (previous === null || sameMarker(previous.over, next) ? previous : { ...previous, over: next }))
      }, [])

      const clearOver = useCallback(() => {
        setDrag(previous => (previous === null || previous.over === null ? previous : { ...previous, over: null }))
      }, [])

      /** Claim the one drop a drag may commit; `false` for a repeated event. */
      const takeDrop = useCallback(() => {
        if (dropCommittedRef.current) return false
        dropCommittedRef.current = true
        return true
      }, [])

      const hoverRow = useCallback((accountKey, sessionId, event) => {
        if (!dragAllowed(dragRef.current, viewRef.current.tab, accountKey)) return
        setOver({ accountKey, sessionId, half: acceptOver(event) })
      }, [acceptOver, setOver])

      const hoverHead = useCallback((accountKey, event) => {
        const current = dragRef.current
        if (current === null) return
        if (isGroupDrag(current)) {
          if (!accountKey.startsWith(GROUP_PREFIX)) return
          const groupId = accountKey.slice(GROUP_PREFIX.length)
          if (groupId === current.groupId) {
            clearOver()
            return
          }
          setOver({ groupId, half: acceptOver(event) })
          return
        }
        if (!dragAllowed(current, viewRef.current.tab, accountKey)) return
        acceptOver(event)
        setOver({ accountKey, head: true })
      }, [acceptOver, clearOver, setOver])

      const dropRow = useCallback((accountKey, sessionId, event) => {
        const current = dragRef.current
        if (!dragAllowed(current, viewRef.current.tab, accountKey)) return
        event.preventDefault()
        if (!takeDrop()) return
        finishDrag(current, rowOver(current.over, accountKey, sessionId) === ''
          ? { accountKey, sessionId, half: 'after' }
          : current.over)
      }, [finishDrag, takeDrop])

      const dropHead = useCallback((accountKey, event) => {
        const current = dragRef.current
        if (current === null) return
        if (isGroupDrag(current)) {
          if (!accountKey.startsWith(GROUP_PREFIX)) return
          event.preventDefault()
          if (!takeDrop()) return
          const groupId = accountKey.slice(GROUP_PREFIX.length)
          finishGroupDrag(current.groupId, groupOver(current.over, groupId) === ''
            ? { groupId, half: 'after' }
            : current.over)
          return
        }
        if (!dragAllowed(current, viewRef.current.tab, accountKey)) return
        event.preventDefault()
        if (!takeDrop()) return
        finishDrag(current, isHeadOver(current.over, accountKey) ? current.over : { accountKey, head: true })
      }, [finishDrag, finishGroupDrag, takeDrop])

      const endDrag = useCallback(() => {
        const current = dragRef.current
        setDrag(null)
        if (dropCommittedRef.current || current === null) return
        const over = current.over
        if (over === undefined || over === null) return
        dropCommittedRef.current = true
        if (isGroupDrag(current)) finishGroupDrag(current.groupId, over)
        else finishDrag(current, over)
      }, [finishDrag, finishGroupDrag])

      // Bump a version whenever a row callback changes identity, so cached row
      // elements are rebuilt instead of keeping a stale closure.
      const rowHandlers = [openSessionById, showContextMenu, beginDrag, hoverRow, dropRow, endDrag, archiveSessionById]
      if (rowHandlers.some((handler, at) => handler !== handlerSetRef.current[at])) {
        handlerSetRef.current = rowHandlers
        handlerVersionRef.current += 1
      }
      const handlerVersion = handlerVersionRef.current

      // ---- menus ------------------------------------------------------------
      const sortEntries = () => [
        menuHeading('heading', t('sort.label')),
        menuItem('updated', t('sort.updated'), () => { setOrder('updated') }, { icon: IconClock, selected: view.orderBy === 'updated' }),
        menuItem('manual', t('sort.manual'), () => { setOrder('manual') }, { icon: IconSortArrows, selected: view.orderBy === 'manual' }),
      ]

      const sessionEntries = (sessionId) => {
        const summary = byId[sessionId]
        const owner = view.assignment[sessionId]
        const entries = []
        if (view.groups.length > 0) {
          entries.push(menuHeading('heading-move', t('session.moveTo')))
          for (const group of view.groups) {
            entries.push(menuItem('move:' + group.id, group.name, () => { assign(sessionId, group.id) }, {
              icon: () => badgeNode(group.badge, 'wsg-menu-badge', 12),
              selected: owner === group.id,
            }))
          }
        }
        entries.push(menuItem('move-new', t('session.moveToNew'), () => { openDialog('createGroup', { moveSessionId: sessionId }) }))
        if (typeof owner === 'string' && owner !== '') {
          entries.push(menuItem('move-out', t('session.removeFromGroup'), () => { assign(sessionId, null) }))
        }
        const title = summary === undefined ? '' : (summary.blank === true ? blankTitle : summary.displayTitle)
        entries.push(
          menuSeparator('sep-1'),
          menuItem('rename', t('session.rename'), () => { openDialog('renameSession', { id: sessionId, value: title }) }),
          menuItem('fork', t('session.fork'), () => { settle(props.forkSession(sessionId)) }),
          menuSeparator('sep-2'),
          menuItem('archive', t('session.archive'), () => { settle(props.archiveSession(sessionId)) }, { danger: true }),
        )
        return entries
      }

      const groupEntries = (groupId) => {
        const index = view.groups.findIndex(group => group.id === groupId)
        const group = index < 0 ? undefined : view.groups[index]
        return [
          menuItem('rename', t('group.rename'), () => { openDialog('renameGroup', { id: groupId, value: group?.name ?? '' }) }),
          menuItem('badge', t('group.badge'), () => {
            setBadgeQuery('')
            setPopover({ kind: 'badge', groupId, ...originAt(popover.x, popover.y, PICKER_WIDTH) })
          }),
          menuItem('up', t('group.moveUp'), () => { moveGroup(groupId, -1) }, { disabled: index <= 0 }),
          menuItem('down', t('group.moveDown'), () => { moveGroup(groupId, 1) }, { disabled: index < 0 || index >= view.groups.length - 1 }),
          menuSeparator('sep'),
          menuItem('delete', t('group.delete'), () => { openDialog('deleteGroup', { id: groupId, name: group?.name ?? '' }) }, { danger: true }),
        ]
      }

      const projectEntries = (workspaceId) => {
        const title = workspaces.find(candidate => candidate.workspaceId === workspaceId)?.title ?? ''
        return [
          menuItem('new', t('project.newSession'), () => { void createSessionIn(workspaceId, null) }),
          menuItem('rename', t('workspace.rename'), () => { openDialog('renameWorkspace', { id: workspaceId, value: title }) }),
          menuSeparator('sep'),
          menuItem('delete', t('workspace.delete'), () => { openDialog('deleteWorkspace', { id: workspaceId, name: title }) }, { danger: true }),
        ]
      }

      const contextEntries = () => {
        if (popover === null || popover.kind !== 'context') return []
        if (popover.target === 'session') return sessionEntries(popover.id)
        if (popover.target === 'group') return groupEntries(popover.id)
        return projectEntries(popover.id)
      }

      // ---- rendering --------------------------------------------------------
      const renderMenuEntry = (item) => {
        if (item.separator === true) return h('div', { key: item.key, className: 'wsg-menu-sep' })
        if (item.heading !== undefined) return h('div', { key: item.key, className: 'wsg-menu-heading' }, item.heading)
        return h('button', {
          key: item.key,
          type: 'button',
          role: 'menuitem',
          className: classes('wsg-menu-item', item.danger === true && 'wsg-menu-item-danger'),
          disabled: item.disabled === true,
          onClick: () => { if (item.disabled === true) return; closePopover(); item.action() },
        },
        h('span', { key: 'icon', className: 'wsg-menu-icon' }, item.icon === undefined ? null : item.icon()),
        h('span', { key: 'label', className: 'wsg-menu-item-label' }, item.label),
        h('span', { key: 'check', className: 'wsg-menu-item-check' }, item.selected === true ? IconCheck() : null))
      }

      const popoverShell = (children, width) => h('div', {
        key: 'popover',
        ref: popoverRef,
        className: 'wsg-popover',
        role: 'menu',
        style: { left: popover.x, top: popover.y, width, maxHeight: Math.max(FLYOUT_MIN_HEIGHT, window.innerHeight - popover.y - 16) },
      }, children)

      /**
       * Color + glyph picker shared by the badge popover and the create dialog.
       * @param value - the badge being edited.
       * @param onChange - receives the next badge, plus whether the pick settles it.
       * @param options - `fill` stretches the picker across a dialog's width.
       */
      const renderBadgePicker = (value, onChange, options) => {
        const fill = options !== undefined && options.fill === true
        const shape = badgeShape(value)
        const query = badgeQuery.trim().toLowerCase()
        const icons = BADGE_ICONS.filter(icon => query === ''
          || icon.key.includes(query)
          || icon.en.toLowerCase().includes(query)
          || icon.zh.includes(query))
        const hashVisible = query === '' || '#'.includes(query) || 'hash'.includes(query)
          || '井号'.includes(query) || '默认'.includes(query)
        return h('div', { key: 'picker', className: classes('wsg-badge-picker', fill && 'wsg-badge-fill') },
          h('div', { key: 'search', className: 'wsg-badge-search' },
            h('span', { key: 'icon', className: 'wsg-search-icon' }, IconSearch(13)),
            h('input', {
              key: 'input',
              className: 'wsg-badge-search-input',
              value: badgeQuery,
              placeholder: t('badge.search'),
              'aria-label': t('badge.search'),
              onChange: (event) => { setBadgeQuery(event.target.value) },
              onKeyDown: (event) => { event.stopPropagation() },
            }),
            badgeQuery === '' ? null : h('button', {
              key: 'clear',
              type: 'button',
              className: 'wsg-badge-clear',
              onClick: () => { setBadgeQuery('') },
            }, t('badge.clear'))),
          h('div', { key: 'colors', className: 'wsg-badge-colors' },
            BADGE_COLORS.map(color => h('button', {
              key: color.key,
              type: 'button',
              className: classes('wsg-badge-swatch', shape !== null && shape.color === color.key && 'wsg-badge-swatch-active'),
              style: { background: color.ink },
              title: t('badge.color.' + color.key),
              'aria-label': t('badge.color.' + color.key),
              'aria-pressed': shape !== null && shape.color === color.key,
              onClick: () => {
                onChange({ color: color.key, icon: shape === null ? DEFAULT_BADGE_ICON : shape.icon }, false)
              },
            }))),
          h('div', { key: 'icons', className: 'wsg-badge-icons' },
            hashVisible ? h('button', {
              key: 'hash',
              type: 'button',
              className: classes('wsg-badge-icon-cell', shape === null && 'wsg-badge-icon-cell-active'),
              title: t('badge.default'),
              'aria-label': t('badge.default'),
              'aria-pressed': shape === null,
              onClick: () => { onChange(DEFAULT_BADGE, true) },
            }, h('span', { key: 'glyph', className: 'wsg-badge-hash' }, '#')) : null,
            icons.map(icon => h('button', {
              key: icon.key,
              type: 'button',
              className: classes('wsg-badge-icon-cell', shape !== null && shape.icon === icon.key && 'wsg-badge-icon-cell-active'),
              title: t('badge.icon.' + icon.key),
              'aria-label': t('badge.icon.' + icon.key),
              'aria-pressed': shape !== null && shape.icon === icon.key,
              onClick: () => {
                onChange({ color: shape === null ? DEFAULT_BADGE_COLOR : shape.color, icon: icon.key }, true)
              },
            }, strokeIcon(fill ? 15 : 13, icon.shapes))),
            icons.length === 0 && !hashVisible
              ? h('div', { key: 'none', className: 'wsg-badge-empty' }, t('badge.none'))
              : null),
        )
      }

      /** Workspace choices for the new-session picker, most recently used first. */
      const groupPickerChoices = () => {
        const recent = new Map()
        for (const workspace of workspaces) {
          let latest = 0
          for (const id of workspace.sessionIds ?? EMPTY_IDS) {
            const updatedAt = byId[id]?.updatedAt ?? 0
            if (updatedAt > latest) latest = updatedAt
          }
          recent.set(workspace.workspaceId, latest)
        }
        if (workspaces.length === 0) return [{ workspaceId: undefined, title: t('workspace.default') }]
        return [...workspaces]
          .sort((left, right) => (recent.get(right.workspaceId) ?? 0) - (recent.get(left.workspaceId) ?? 0))
          .map(workspace => ({ workspaceId: workspace.workspaceId, title: workspace.title }))
      }

      const renderPopover = () => {
        if (popover === null) return null
        if (popover.kind === 'sort') return popoverShell(sortEntries().map(renderMenuEntry), MENU_WIDTH)
        if (popover.kind === 'context') return popoverShell(contextEntries().map(renderMenuEntry), MENU_WIDTH)
        if (popover.kind === 'badge') {
          const group = view.groups.find(candidate => candidate.id === popover.groupId)
          return popoverShell([
            h('div', { key: 'heading', className: 'wsg-menu-heading' }, t('group.badgeTitle')),
            renderBadgePicker(group?.badge ?? DEFAULT_BADGE, (badge, settled) => {
              patchGroup(popover.groupId, { badge: normalizeBadge(badge) })
              if (settled) closePopover()
            }),
          ], PICKER_WIDTH)
        }
        const choices = groupPickerChoices()
        return popoverShell([
          h('div', { key: 'heading', className: 'wsg-menu-heading' }, t('workspace.pickTitle')),
          ...choices.map(choice => renderMenuEntry(menuItem(
            choice.workspaceId ?? 'default',
            choice.title,
            () => { void createSessionIn(choice.workspaceId, popover.groupId) },
            { icon: () => IconFolder(14) },
          ))),
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
              renderBadgePicker(dialog.badge, (badge) => { patchDialog({ badge: normalizeBadge(badge) }) }, { fill: true })) : null,
            dialog.error === null ? null : h('div', { className: 'wsg-modal-error' }, dialog.error),
            h('div', { className: 'wsg-modal-actions' },
              h('button', { type: 'button', className: 'wsg-btn', onClick: () => { if (!dialog.busy) closeDialog() }, disabled: dialog.busy }, t('dialog.cancel')),
              h('button', {
                type: 'button',
                className: classes('wsg-btn', isDelete ? 'wsg-btn-danger' : 'wsg-btn-accent'),
                disabled: dialog.busy || (!isDelete && dialog.value.trim() === ''),
                onClick: submitDialog,
              }, t(spec.confirm)))))
      }

      const renderRow = (account, sessionId) => {
        const summary = byId[sessionId]
        if (summary === undefined) return null
        const mark = sessionStatusMark(summary, statuses.get(sessionId), t)
        const title = summary.blank === true
          ? blankTitle
          : (typeof summary.displayTitle === 'string' && summary.displayTitle !== '' ? summary.displayTitle : summary.id)
        const tooltip = typeof summary.cwd === 'string' ? summary.cwd : title
        const timeLabel = relativeLabel(t, summary.updatedAt, now)
        const statusState = mark === null ? null : mark.state
        const statusLabel = mark === null ? null : mark.label
        const pinned = ranks.has(sessionId)
        const current = sessionId === currentId
        const marker = sessionDragging ? rowOver(drag.over, account.key, sessionId) : ''
        const draggable = !searching
        visibleRowsRef.current.add(sessionId)
        const signature = [account.key, title, tooltip, timeLabel, statusState, statusLabel, pinned, current, marker, draggable, archiveLabel, handlerVersion].join('\u0000')
        const cached = rowCacheRef.current.get(sessionId)
        if (cached !== undefined && cached.signature === signature) return cached.element
        const element = h(SessionRow, {
          key: sessionId,
          sessionId,
          accountKey: account.key,
          title,
          tooltip,
          timeLabel,
          statusState,
          statusLabel,
          pinned,
          current,
          marker,
          draggable,
          archiveLabel,
          onOpen: openSessionById,
          onContextMenu: showContextMenu,
          onDragStart: beginDrag,
          onDragOver: hoverRow,
          onDrop: dropRow,
          onDragEnd: endDrag,
          onArchive: archiveSessionById,
        })
        rowCacheRef.current.set(sessionId, { signature, element })
        return element
      }

      const renderDropzone = (account) => {
        // Sessions never cross projects, so only the groups tab accepts a drop here.
        const droppable = view.tab === 'groups'
        return h('button', {
          key: 'dropzone',
          type: 'button',
          className: classes('wsg-dropzone', isHeadOver(drag?.over, account.key) && 'wsg-dropzone-active'),
          onClick: (event) => { requestNewSession(account, originUnder(event.currentTarget.getBoundingClientRect(), PICKER_WIDTH, 8)) },
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
        const reorderMarker = editableGroup ? groupOver(drag?.over, account.groupId) : ''
        const draggingThis = editableGroup && isGroupDrag(drag) && drag.groupId === account.groupId
        // An empty bucket only appears while a session drag is live, as a drop
        // target: render its head, not the empty rail.
        const headOnly = account.kind === 'group' && account.groupId === undefined && account.sessions.length === 0
        const head = h('div', {
          key: 'head',
          className: classes(
            'wsg-account-head',
            isHeadOver(drag?.over, account.key) && 'wsg-drop-head',
            reorderMarker !== '' && 'wsg-head-drop-' + reorderMarker,
            draggingThis && 'wsg-dragging',
          ),
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
        account.kind === 'project'
          ? h('span', { key: 'badge', className: classes('wsg-badge', 'wsg-badge-project') }, IconFolder(14))
          : badgeNode(account.badge, 'wsg-badge', 13),
        h('span', { key: 'title', className: 'wsg-account-title' }, account.title),
        h('span', { key: 'chevron', className: classes('wsg-chevron', account.expanded && 'wsg-chevron-open') }, IconChevron()),
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
            requestNewSession(account, originUnder(event.currentTarget.getBoundingClientRect(), PICKER_WIDTH, -8))
          },
        }, IconNewChat(14)))
        if (!account.expanded || headOnly) return h(Fragment, { key: account.key }, head)
        const rows = account.sessions.length === 0
          ? [renderDropzone(account)]
          : account.sessions.map(sessionId => renderRow(account, sessionId))
        return h(Fragment, { key: account.key }, head, h('div', { key: 'rail', className: 'wsg-rail' }, ...rows))
      }

      const renderEmptyState = (key, titleKey, hintKey, actionLabelKey, onAction) => h('div', { key, className: 'wsg-empty-state' },
        h('div', { key: 'title', className: 'wsg-empty-title' }, t(titleKey)),
        h('div', { key: 'hint', className: 'wsg-empty-hint' }, t(hintKey)),
        h('button', { key: 'action', type: 'button', className: 'wsg-inline-btn', onClick: onAction }, IconPlus(14), t(actionLabelKey)))

      const renderBody = () => {
        visibleRowsRef.current = new Set()
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
        // Drop cached elements of rows nobody renders any more.
        for (const sessionId of rowCacheRef.current.keys()) {
          if (!visibleRowsRef.current.has(sessionId)) rowCacheRef.current.delete(sessionId)
        }
        return rows
      }

      const tabButton = (tab, icon, label) => h('button', {
        key: tab,
        type: 'button',
        role: 'tab',
        'aria-selected': view.tab === tab,
        className: classes('wsg-tab', view.tab === tab && 'wsg-tab-active'),
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
          ? [renderSearchBar()]
          : [
            h('div', { key: 'tabs', className: 'wsg-tabs', role: 'tablist' },
              tabButton('groups', h('span', { className: 'wsg-tab-hash' }, '#'), t('tab.groups')),
              tabButton('projects', IconFolder(12), t('tab.projects'))),
            h('span', { key: 'spacer', className: 'wsg-head-spacer' }),
            toolbarButton('search', t('search.open'), () => { setSearchOpen(true) }, IconSearch(16)),
            toolbarButton('sort', t('sort.label'), (event) => {
              if (popover?.kind === 'sort') return closePopover()
              const box = event.currentTarget.getBoundingClientRect()
              setPopover({ kind: 'sort', ...originAt(box.right - MENU_WIDTH, box.bottom + FLYOUT_GAP, MENU_WIDTH) })
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
        phase === 'ready' ? null : h('div', { key: 'loading', className: 'wsg-empty-state' }, t('loading')),
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
        if (result?.ok === true) return result.value
        const message = result?.error?.message
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
        renameWorkspace: (workspaceId, title) => workspaces.rename(workspaceId, title),
        deleteWorkspace: workspaceId => workspaces.delete(workspaceId),
        addWorkspace: async () => {
          const path = await uiWorkspace.pickDirectory()
          return path === null || path === undefined || path === '' ? null : workspaces.create({ path })
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
