# 《音乐电台》项目规范与目标文档 (SPEC.md)

> **版本**：v6.0.1  
> **定位**：SillyTavern（酒馆）专属的高性能、无感解耦、全源检索的赛博朋克深空沉浸电台。

---

## 一、项目愿景与核心目标 (Target)

构建一个与主 RP 聊天 AI **彻底解耦**的智能背景音乐（BGM）播放系统：
1. **零心流打扰**：主正文 AI 专注于剧情写作与沉浸演绎，无需分心输出选歌指令；
2. **专职 Sidecar AI DJ**：正文生成完毕后由轻量级独立模型在后台分析最新氛围，专心决策选曲；
3. **极致容错与秒级响应**：本地直链库 → 连字符双态解析 → 1~9分钟时长熔断 → 多源代理池兜底；
4. **全自由管理体系**：所有预置与自定义频段/歌曲支持无限制删除、拖拽排序、增量合并与备份导出。

---

## 二、设计原则 (Design Principles)

1. **简单优先与解耦原则**：
   - 绝不入侵或修改主提示词（除非用户主动配置）；
   - 默认采用 `0 层上下文深度`（仅当前 AI 最新回复），以最低 Token 开销实现秒级氛围提炼。
2. **双层防护原则（时长与音质保障）**：
   - **Layer 1 前置过滤**：计算码率与体积预估时长，排除 < 55s 与 > 550s 的候选源；
   - **Layer 2 硬件级熔断**：音频元数据加载时，若时长 < 60s 或 > 540s，立即静音并秒切下一首，100% 屏蔽有声书与试听片段。
3. **连字符双态自适应原则**：
   - 自动兼容形如 `Monoco's Station - Grandis Refuge` 这类标题自带横杠的歌曲，杜绝被误切断为歌手的错误。
4. **用户数据资产安全原则**：
   - 提供【增量合并导入】模式，导入歌单绝不覆盖或删除现有数据，同频段同名歌曲自动去重。
   - 提供【覆盖导入】模式供全量恢复。

---

## 三、系统架构与模块边界 (Architecture & Boundaries)

```text
┌─────────────────────────────────────────────────────────────┐
│                    《天式号·太空电台》系统架构                   │
├──────────────────────────────┬──────────────────────────────┤
│ 1. 独立 Sidecar AI DJ 引擎   │ - 支持任意 OpenAI 兼容 API 接口 │
│                              │ - 0~5 层上下文深度动态截取    │
│                              │ - F12 控制台提示词 Debug 输出 │
├──────────────────────────────┼──────────────────────────────┤
│ 2. 智能音频流解析与检索矩阵   │ - 本地高精直链映射库 (0ms 播放)│
│                              │ - 连字符双态打分检索算法     │
│                              │ - 1~9 分钟双层硬核时长过滤网  │
├──────────────────────────────┼──────────────────────────────┤
│ 3. 歌单与资产管理系统        │ - ★ 我的收藏 (高优先独立频段) │
│                              │ - 跨频段移动 (模态选择 + 拖拽)│
│                              │ - 覆盖导入 / 增量合并导入双模式 │
│                              │ - 原声 MP3 音频一键下载导出   │
├──────────────────────────────┼──────────────────────────────┤
│ 4. 视觉交互与贴边收纳系统    │ - 暗金矢量 SVG (#C4A77D) 主题  │
│                              │ - 智能贴边微型收纳把手        │
│                              │ - 独立同色系音量滑块与控制条  │
└──────────────────────────────┴──────────────────────────────┘
```

### 核心文件

| 文件 | 作用 | 可否删除 |
|---|---|---|
| `酒馆助手脚本-电台直链版.json` | 唯一发布脚本（IIFE，自包含 HTML+CSS+JS，2489 行） | 否，核心交付物 |
| `SPEC.md` | 本文档，目标与契约 | 否 |
| `README.md` | 现状与使用说明 | 否 |
| `LOG.md` / `LOG-INDEX.md` | 施工历史与索引 | 否 |
| `Coding rule.md` | Agent 工作约定 | 否 |

---

## 四、验收标准 (Acceptance Criteria)

- [x] **连字符标题匹配**：带横杠的复杂歌名能被全词匹配，并赋予豁免作者惩罚的高分。
- [x] **时长过滤拦截**：小于 1 分钟、大于 9 分钟的音频流（有声书、短翻唱、试听）100% 自动跳过。
- [x] **数据合并去重**：合并导入同名歌单时，同名歌曲不产生重复条目，新歌与新歌单正确追加。
- [x] **UI 防挤压自适应**：移动歌曲模态框在大量歌单存在时保持每行 32px 规整排版与顺畅滚动。
- [x] **Sidecar AI DJ 联动**：配置 API 后，点击 `✨ AI选歌` 或角色消息渲染完毕后，能自动异步向大模型请求推荐并切歌。
- [x] **Debug 输出可观测**：开启 Debug 模式时，控制台能完整输出 System Prompt、User Payload 与原始模型输出。
- [x] **0层正文必达**：`historyDepth=0` 时手动/自动触发均能稳定携带当前 0 层（AI 最新回复）全文进入 Sidecar Payload，空正文时阻断而非随机（v6.0.1 修复，见第五章）。

---

## 五、脚本函数职责清单 (Function Reference) — v6.0.1 现状

> 约定：`0 层 = AI 最新回复`，`1 层 = 上一条用户输入 + 当前 AI`，`N 层 = 最近 N*2 条`。
> 注释密度：正文 IIFE 内约 2.1% 行注释（52/2489），以 `// === ... ===` 分区为主，函数体几乎无行内注释，命名即文档。
> 文件统一位置：`酒馆助手脚本-电台直链版.json` 的 `content` 字段内 IIFE `(function(){...})()`。

### 5.1 常量与状态

| 符号 | 位置 | 职责 |
|---|---|---|
| `customUrlDb: {}` | `L25` | 运行时空表，占位供未来注入自定义直链，未序列化。 |
| `directLinkDb: {title→网易云ID}` | `L27-70` | 本地高精直链库（泽野弘之/进击的巨人神曲、Evan Call、星际穿越等），`getTrackUrl` 最高优先级命中，0ms 秒播。含多别名键（如 `YouSeeBIGGIRL/T:T`/`youseebiggirl`）。 |
| `initialDefaultPlaylists: Array<{category,songs}>` | `L77` | 出厂预置频段与曲目，`loadPlaylists` 失败/首次与 `[重置]` 恢复时深拷贝使用。 |
| `bgmPlaylists: Array` | `L170` | 运行时歌单总表，`loadPlaylists/savePlaylists` 与 `celestial_all_playlists` 互转。 |
| `openedPlaylistCategories: Set<string>` | `L23` | 记录展开态的频段名，驱动 `renderPlaylists` 的 `slideDown/Up`。 |
| `state: {collapsed}` `dockSide/dockTop` | `L16-21` | 面板收纳与贴边位置，`localStorage cr_dock_side/top` 持久化，`applyDockPosition` 读写。 |
| `T_CHARS / S_CHARS` | `L228-229` | 繁简对照表，`normalizeStr` 逐字繁转简。 |
| `DEFAULT_DJ_PROMPT` | `L196` | Sidecar AI DJ 系统提示词默认值，`openSettingsModal/saveDjSettings` 可覆盖，持久于 `cr_dj_system_prompt`。 |
| `audioObj: HTMLAudioElement` `currentPlaylistIndex/currentSongIndex/isPlaying/playMode/currentPlayingTrackInfo` | `L298-300` | 播放内核与指针，`playSpecificSong/playDirect/prevSong/nextSong/updateBgmUI` 统一维护，`cr_last_song_*` 记忆断点续播。 |
| `currentVolume/lastNonZeroVolume` | `L303-308` | 独立音量状态，`cr_player_volume` 持久化，`updateVolumeUI` 与滑块/静音按钮互锁。 |
| `ICONS: {favOutline/favSolid/download/move/gear}` | `L860-864` | `#C4A77D` 暗金矢量图标集，`renderPlaylists/updatePlayerFavBtn` 注入。 |
| `OST_COMPOSERS: string[]` | `L2013` | 原声大师名单，`scoreTrackCandidate` 命中加分。 |

### 5.2 持久化与配置

| 函数 | 签名与位置 | 职责 | 关键细节 |
|---|---|---|---|
| `loadPlaylists()` | `L172` `function loadPlaylists()` | 从 `localStorage.celestial_all_playlists` 恢复 `bgmPlaylists`，失败则深拷贝 `initialDefaultPlaylists`。 | 首屏在 CSS/HTML 注入后同步调用，决定首屏曲库。 |
| `savePlaylists()` | `L190` `function savePlaylists()` | `JSON.stringify(bgmPlaylists)` 写回 `celestial_all_playlists`。 | 所有增删改拖拽导入路径的唯一写口。 |
| `getDjSettings()` | `L206` `function getDjSettings(): {apiUrl,apiKey,model,historyDepth,autoTrigger,debugMode,systemPrompt}` | 汇总 6 项 DJ 配置，`historyDepth` 含 `Number.isFinite` 的 `NaN` 容错（v6.0.1 补）。 | `triggerAiDjDecision/onMessageChange/openSettingsModal` 的唯一读口。 |
| `saveDjSettings(cfg)` | `L218` `function saveDjSettings(cfg)` | 逐项 `trim()` 后写 `localStorage cr_dj_*`。 | 由设置面板保存按钮触发，写后立即影响下一次 `triggerAiDjDecision`。 |

### 5.3 文本清洗与查询构建

| 函数 | 位置 | 职责 | 关键细节 |
|---|---|---|---|
| `normalizeStr(str)` | `L231` | 归一化比对串：繁→简（`T_CHARS→S_CHARS` 逐字）→ 变音/日式字符映射（`ä/ö/é/ə/機→机` 等）→ `toLowerCase` → 剥空白/标点/装饰符。 | 歌单去重、曲库查找、打分全链路共享，是去重与匹配的基准。 |
| `cleanEditionTags(title)` | `L257` | 剔除版本后缀 `(Remaster/Deluxe/Original Recording/1998 Recording...)` 括号标签。 | 提升 `normalizeStr` 后等值率，避免版本词污染打分。 |
| `cleanTrackQuery(rawTitle, rawArtist)` | `L262` `→ {title,artist,fullTitle,aliasTitle,aliasFullTitle,subTitle,isOstIntent}` | 构建双态查询：剥外层引号/书名号→ 探测 OST 意图正则 → 剔 OST 标签 → 拆 `title(副标题)` → 生成大小写/音标别名与 `fullTitle`。 | 支撑 `连字符双态`：`fullTitle = "Monoco's Station - Grandis Refuge"` 时既保留长标题整体，又保留切分后的 `title/artist`。`searchAndResolveBestTrack` 据此做多轮回退检索。 |

### 5.4 布局与交互

| 函数 | 位置 | 职责 |
|---|---|---|
| `applyDockPosition(isDraggingNow, dragX, dragY)` | `L871` | 计算并应用贴边/展开两种布局：收纳态 18×54 胶囊（`dock-left/right` + 方向箭头），展开态 10px 边距面板；拖拽时跟手，落盘时 `clamp` 并持久化 `cr_dock_side/top`。 |
| `openSettingsModal()` | `L994` | 以 `getDjSettings()` 回填 `cr-cfg-*` 表单并 `display:flex` 弹层；与保存/取消/显隐/重置提示词四组按钮闭环。 |

### 5.5 核心上下文获取（v6.0.1 已修复）

| 函数 | 签名与位置 | 职责 | 修复要点（对比 `D:\Project\RpgCombat\index.html:11441` 三段式） |
|---|---|---|---|
| `extractStoryContext(depth=0)` | `L1053` `async function extractStoryContext(depth): Promise<string>` | 按 `depth` 语义抽取剧情正文：`0=最后一条非空 AI`，`N>0=最近 N*2 条`。返回 `[AI 当前最新剧情]:\n...` 或 `[User/AI]:\n...` 拼接串，或占位符 `(未捕获到剧情正文…)`。 | 三段式：① 原生破窗 `while(window!==parent)` 探测 `tavernWin.SillyTavern.getContext().chat` 深拷贝；② `getChatMessages('0-'+curId,{hide_state:'all'})` + `await _awaitIfPromise` + `window.parent` 降级；③ `getCurrentMessage()+getCurrentMessageId()` 去重补生成楼。字段优先级 `raw_content??content??message??mes`，`trim()` 判空+`swipes[swipe_id]` 回退，`depth` `NaN` 容错。DOM 兜底 `document`→`window.parent.document`→`tavernWin.document` 并按 `.mes.user_mes` 过滤。 |
| `getLibrarySummaryForPrompt()` | `L1213` `function getLibrarySummaryForPrompt(): string` | 聚合 `bgmPlaylists` 每频段前 8 首为 `- 【频段】: 歌1, 歌2…` 摘要，供 Sidecar 参考“已有曲库”。 | 纯同步，无外部依赖。 |

### 5.6 Sidecar AI DJ 引擎

| 函数 | 位置 | 职责 | 关键细节 |
|---|---|---|---|
| `triggerAiDjDecision(isManual)` | `L1225` `async function triggerAiDjDecision(isManual=false)` | 唯一 Sidecar 入口：`getDjSettings`→ 校验 `apiKey`（手动时弹设置）→ `await extractStoryContext(cfg.historyDepth)` → `getLibrarySummaryForPrompt` → 空正文阻断（`toastr.warning`+恢复按钮，v6.0.1 新增）→ 组 `userPayload`（曲库+正文）→ 拼 `endpoint+/chat/completions` → `fetch`→ 解析 `choices[0].message.content` 的 `[点一首歌: 歌名 - 歌手]` → `lastIndexOf('-')` 切分 → `playDirect` → `debugMode` 下 `console.groupCollapsed` 分色打印 Endpoint/Model/Depth/SystemPayload/Raw/FinalCommand。 | `isManual=true` 走 `$('#cr-manual-dj-btn').on('click') L1345`；`isManual=false` 走 `onMessageChange` 自动雷达。`historyDepth` 直通 Payload 显式标注。 |

### 5.7 收藏与播放器

| 函数 | 位置 | 职责 |
|---|---|---|
| `isSongFavorited(title, artist)` | `L1351` | 以 `normalizeStr(title)` 在 `★ 我的收藏` 中查重，忽略作者差异，仅判标题。 |
| `toggleFavorite(title, artist)` | `L1358` | 不存在则建 `★ 我的收藏` 并 `unshift`；存在则 `splice` 移除；`savePlaylists+renderPlaylists+updatePlayerFavBtn` 三联同步，`#bgm-status-msg` 提示。 |
| `updatePlayerFavBtn()` | `L1381` | 依 `currentPlayingTrackInfo` 与 `isSongFavorited` 切换底栏收藏按钮 `is-fav/favSolid/favOutline`。 |
| `downloadCurrentAudio()` | `L1395` `async function downloadCurrentAudio()` | 捕获 `audioObj.src` 的 `fetch→blob→ObjectURL→a.click` 下载为 `歌名 - 歌手.mp3`（非法字符转 `_`），失败降级为新标签直链。`#cr-player-dl-btn` 绑定。 |
| `updateVolumeUI(vol)` | `L1437` `function updateVolumeUI(vol)` | 同步滑块值/`--vol-pct`/百分比文本与三态 SVG（`High/Low/Mute #D34B4B`），初始化与 `input/click` 回调均调用。 |

### 5.8 歌单管理与渲染

| 函数 | 位置 | 职责 |
|---|---|---|
| `movePlaylist(fromIdx, toIdx)` | `L1484` | `splice` 重排 `bgmPlaylists` 并修正 `currentPlaylistIndex` 指针，`savePlaylists+renderPlaylists`。 |
| `openMoveSongModal(pIdx, sIdx)` | `L1504` | 弹跨频段移动模态：记录 `moveTargetSong`，列出除源频段外的目标频段 `cr-modal-item`。 |
| `renderPlaylists()` | `L1547` `function renderPlaylists()` | 全量重绘 `#bgm-playlists`：频段头（拖拽手柄/计数/上下移）+ 可折叠 `cat-list` + 歌曲行（收藏/移动/删除）+ 行内刻录框 + 删除频段；`collapsed` 时短路；末尾同步 `updatePlayerFavBtn`。 |

### 5.9 检索与播放内核

| 函数 | 位置 | 职责 | 关键细节 |
|---|---|---|---|
| `scoreTrackCandidate(track, cleanQuery)` | `L2025` | 连字符双态打分：`fullTitle` 全等 +100 / `singleTitle/subTitle` +90 / 包含 +30×长度比 / else -200；作者匹配 +50/30/else -100（`fullTitle` 已中时豁免）；无作者时品质词/album 命中 +25；OST 标记/意图 +40；`OST_COMPOSERS` 名家 +30；劣质词（翻唱/伴奏/DJ…）-150；有声书词 -300。 | 是 `searchAndResolveBestTrack` 的排序依据，>30 分入池。 |
| `searchAndResolveBestTrack(cleanQuery)` | `L2129` `async function searchAndResolveBestTrack(cleanQuery)` | 多源检索闭环：内联 `fetchSearch(kw, source)`（主 `music-api` + `corsproxy.io` 兜底）与 `fetchDirectUrl(source,id)`（`size*8/(br*1000)` 预估时长，<55s 或 >550s 前置过滤）；`sources=[netease,kuwo,migu,kugou,tencent]` 轮询，关键词回退 `fullTitle→aliasFullTitle→title→subTitle`，候选按 `_score` 降序取前 6 逐一试 `fetchDirectUrl` 首个可播即返。 | 双层时长防护的 Layer 1 在此。 |
| `getTrackUrl(rawTitle, rawArtist)` | `L2219` `async function getTrackUrl(rawTitle,rawArtist): Promise<{url,track}|null>` | 四级解析优先级：① 直链（`isHttpUrl`）→ ② `customUrlDb/localCustomUrls` 本地映射 → ③ `directLinkDb` 网易云 ID 直取（`corsproxy` 代理）→ ④ `cleanTrackQuery`+`searchAndResolveBestTrack` 全网检索。 | 0ms 命中在前，全网检索兜底在后。 |
| `findSongInPlaylists(title, artist)` | `L2252` | 在 `bgmPlaylists` 中按 `normalizeStr` 模糊定位歌曲，标题/全称包含即中，作者为可选收紧。 | 供 `playDirect` 的“已在库则锚定”分支。 |
| `playSpecificSong(pIdx, sIdx)` | `L2275` `async function playSpecificSong(pIdx,sIdx)` | 歌单内定向播放：置指针→高亮→`getTrackUrl`→`audioObj.src=→play()`→`cr_last_song_*` 记忆→`updatePlayerFavBtn`；失败 2s 后 `nextSong`。 | 单曲循环/顺序/随机由 `playMode` 与 `audio ended` 协作。 |
| `playDirect(title, artist)` | `L2316` `async function playDirect(title, artist)` | 任意标题直播：先 `findSongInPlaylists` 锚定库内，否则 `getTrackUrl` 全网；重置高亮→`getTrackUrl→play()` 并记忆。 | 手动搜索、`[点一首歌]` 指令、Sidecar 决策的统一出口。 |
| `updateBgmUI()` | `L2362` `function updateBgmUI()` | 切换 `#bgm-play-pause play/pause` 与边缘点 `playing` 脉动，`currentPlaylistIndex===-1` 时空态文案，末尾 `updatePlayerFavBtn`。 | `playSpecificSong/playDirect/prevSong/nextSong/loadedmetadata/ended` 均回调。 |
| `prevSong() / nextSong()` | `L2374 / L2388` | 上/下一首：未锚定频段时跨频段随机选，非随机时按 `playMode` 顺序或随机索引，`playSpecificSong` 驱动。 | 供按钮与时长熔断/播完自动切歌。 |
| `onMessageChange(messageId)` | `L2406` `const onMessageChange = (messageId)=>void` | 双擎雷达回调：1500ms 防抖→`getChatMessages(messageId)` 取单楼文本→正则 `/\[\s*点一首歌\s*[:：]\s*([^\]]+?)\s*\]/g` 直播指令优先 `playDirect`；否则 `autoTrigger&&apiKey&&去重` 时 `triggerAiDjDecision(false)` 自动选歌。 | 由 `tavern_events.MESSAGE_SWIPED/MESSAGE_UPDATED/CHARACTER_MESSAGE_RENDERED/MESSAGE_RECEIVED` 四事件（`L2456-2469`，含 `window.parent` 降级）驱动。 |

### 5.10 内联辅助（非顶层函数，职责同列）

| 符号 | 位置 | 职责 |
|---|---|---|
| `fetchSearch(kw, source)` | `L2130` 内联于 `searchAndResolveBestTrack` | `music-api.gdstudio.xyz/types=search` + `corsproxy.io` 兜底，`count=5`。 |
| `fetchDirectUrl(source, id)` | `L2142` 同上 | `types=url&br=320` 取直链并 `size/br` 前置时长过滤。 |
| `openedPlaylistCategories` `draggedCatIndex/draggedSongData` 及 10 余 ` $ctn.on('drag…/click')` | `L1605-1804` | HTML5 拖拽：歌曲跨频段 `splice`、频段 `drag-over-top/bottom` 重排、`▲/▼` 按钮、分类折叠 `slideUp/Down`、刻录框 `+/ -` 解析与 `isHttpUrl` 分流至 `celestial_custom_urls`。 |

---

## 六、非功能与约束

- **运行环境**：TavernHelper/油猴 IIFE，依赖 `jQuery`、`localStorage`、`fetch`、`HTMLAudioElement`，无需构建。
- **数据契约**：`bgmPlaylists` 结构 `{category:string, songs:{title,artist}[]}`，导入时 `category+songs` 强校验（`L1844`）。
- **备份契约**：导出含 `{version:"6.0", playlists, urls}`（`L1808`），导入时 `urls` 以 `{...existing, ...imported}` 合并（`L1857`）。
- **时长契约**：Layer 1 `<55s/>550s` 丢弃（`L2151`），Layer 2 `<60s/>540s` 熔断切歌（`L1998`）。

---

## 七、变更记录索引

| 版本 | 日期 | 行为 | 备注 |
|---|---|---|---|
| v6.0 | 2026-08-24 | 基线发布 | 见 `LOG.md` HASH A1B2C3-S9T0U1 |
| v6.0.1 | 2026-08-24 | 0层正文必达修复 | `extractStoryContext` 三段式 + `triggerAiDjDecision` 空阻断 + `getDjSettings` NaN 容错 |

