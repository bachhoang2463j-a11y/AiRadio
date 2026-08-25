# 《天式号·太空电台》施工历史日志 (LOG.md)

---

## [HASH: f92b874] 本地直链最高优先级与进击的巨人 / 泽野弘之神曲 ID 库固化
- **日期**：2026-08-24
- **涉及文件**：`酒馆助手脚本-电台直链版.json`
- **变更行为**：
  1. 固化本地直链映射数据库 `directLinkDb`，优先拦截泽野弘之《进击的巨人》全套战曲神曲（包含 `YouSeeBIGGIRL/T:T`、`ət'aek 0N tάɪtn`、`立body!机st`、`Vogel im Käfig` 等）与 Evan Call、星际穿越等经典配乐；
  2. 实现 `customUrlDb` 与 `localStorage` 本地直链的 0ms 最高优先级直连机制。
- **决策原因**：进击的巨人等神曲带有复杂希腊字母、音标和日式符号（如 `ət'aek 0N tάɪtn`、`立body!机st`），全网模糊搜索极易命中非原版的劣质翻唱或纯伴奏，固化官方高质量 320kbps 网易云网标 ID 可彻底杜绝匹配失误。

---

## [HASH: f92b874] 连字符双态解析引擎（修复歌名自带横杠被错误截断问题）
- **日期**：2026-08-24
- **涉及文件**：`酒馆助手脚本-电台直链版.json`
- **变更行为**：
  1. 重构曲目清洗算法 `cleanTrackQuery`，引入 `fullTitle` 与 `title` 双态模型；
  2. 重构打分函数 `scoreTrackCandidate`，在 `fullTitle` 精确匹配时直接奖励 `+100` 分，并自动豁免 `targetArtist` 不匹配带来的惩罚扣分。
- **决策原因**：在《光与影：33号远征队》等现代游戏配乐中，大量曲目名称本身带有 `-` 符号（如 `Monoco's Station - Grandis Refuge`），原逻辑将其强制以横杠切分为“歌名”与“歌手”，导致搜索关键词被截断丢失。双态解析既支持“歌名 - 歌手”，又支持“自带横杠的长歌名”。

---

## [HASH: f92b874] 1~9分钟双层硬核时长过滤器（彻底过滤有声书与短翻唱）
- **日期**：2026-08-24
- **涉及文件**：`酒馆助手脚本-电台直链版.json`
- **变更行为**：
  1. **Layer 1 前置过滤**：在 `fetchDirectUrl` 阶段根据 `size` 和 `br` 预估时长 `T = size * 8 / (br * 1000)`，预先剔除 $<55\text{s}$ 与 $>550\text{s}$ 的候选音源；
  2. **Layer 2 硬件级熔断**：在 `audioObj` 的 `loadedmetadata` 事件中监听真实时长，若 $<60\text{s}$ 或 $>540\text{s}$，立即静音熔断并在 1.2 秒后自动切至下一首。
- **决策原因**：搜索克苏鲁或古典题材时，第三方接口经常返回数十小时的有声书章节或十几秒的短试听片段，双层物理时长过滤网从根本上封杀了非正常歌曲。

---

## [HASH: f92b874] 歌曲收藏系统、跨频段移动、音频MP3导出与预置频道全自由删除
- **日期**：2026-08-24
- **涉及文件**：`酒馆助手脚本-电台直链版.json`
- **变更行为**：
  1. 新增常驻首位的【★ 我的收藏】专属频段，并在播放栏与列表每行加入收藏状态同步切换；
  2. 实现跨频段歌曲移动功能：支持点击每行 `⇄` 打开目标选择模态框，同时支持 HTML5 拖拽歌曲条目到任意频段；
  3. 新增 MP3 音频一键下载导出功能（`downloadCurrentAudio`），通过 Blob 将当前 320kbps 音频流保存为本地文件；
  4. 解除所有预置频道的删除限制，允许玩家自由删除任何频道与曲目，并提供 `[重置]` 按钮一键恢复出厂预置。
- **决策原因**：满足玩家在长线跑团过程中沉淀个人喜好曲库、整理场景分类及离线备份音乐的需求。

---

## [HASH: f92b874] 移动面板防挤压自适应布局修复与暗金（#C4A77D）矢量 SVG 重构
- **日期**：2026-08-24
- **涉及文件**：`酒馆助手脚本-电台直链版.json`
- **变更行为**：
  1. 为 `.cr-modal-item` 增加 `flex-shrink: 0; min-height: 32px; height: 32px;` 防挤压布局，并规范滚动条排版；
  2. 将播放器底栏的收藏心形、下载托盘图标以及列表操作图标全面重构为 `#C4A77D` 暗金矢量 SVG 规范设计。
- **决策原因**：修复频段较多时移动选择列表中子项被 flexbox 强行压缩至变形重叠的视觉缺陷，并统一整体深空暗金赛博朋克质感。

---

## [HASH: f92b874] 导入功能重构为【覆盖导入】与【增量合并导入去重】双模式
- **日期**：2026-08-24
- **涉及文件**：`酒馆助手脚本-电台直链版.json`
- **变更行为**：
  1. 拆分为 `[覆盖导入]` 与 `[合并导入]` 两个显式按钮；
  2. 实现增量合并算法：同名频段自动合流，频段内歌曲按标准化比对去重（同名同作者不重复添加），新频段末尾追加，完成后汇报新增统计。
- **决策原因**：防止用户在导入好友分享的新频段或扩展包时，意外冲掉本地已有的收藏和整理成果。

---

## [HASH: f92b874] 独立 Sidecar AI DJ 选歌引擎、设置面板、0层极速上下文与提示词 Debug 模式
- **日期**：2026-08-24
- **涉及文件**：`酒馆助手脚本-电台直链版.json`
- **变更行为**：
  1. 增加右上角 `⚙` 暗金设置面板（支持配置 Base URL、API Key、Model Name、上下文楼层深度、自动选歌开关、Debug 模式与自定义系统提示词）；
  2. 实现独立 Sidecar 异步调用管线 `triggerAiDjDecision`，将选歌任务从主正文 AI 中彻底解耦；
  3. 默认采用 `0 层上下文深度`（仅当前 AI 最新回复），极度节省 Token 并实现秒级响应；
  4. 新增 `✨ AI选歌` 手动触发按钮与 F12 控制台结构化提示词 Debug 输出；
  5. 接入 SillyTavern 原生事件雷达 `CHARACTER_MESSAGE_RENDERED` 与 `MESSAGE_RECEIVED`。
- **决策原因**：主正文 AI 一边写剧情一边兼顾选歌极易分散注意力导致输出质量劣化，解耦给独立专职 DJ 模型能够在不影响正文心流的前提下输出最契合的动态配乐。

---

## [HASH: f92b874] 0层正文必达修复 + SPEC 函数职责补全（v6.0.1）
- **日期**：2026-08-24
- **涉及文件**：`酒馆助手脚本-电台直链版.json`、`SPEC.md`
- **变更行为**：
  1. 修复 `extractStoryContext` 丢 0 层正文：移植 RpgCombat 三段式（原生破窗 `SillyTavern.getContext` → `await getChatMessages(hide_state:all)` → 补 `getCurrentMessage`），字段 `raw_content` 优先、`trim` 判空、`swipes` 回退、`window.parent.document` 兜底，`depth NaN` 容错；
  2. `triggerAiDjDecision` 异步化：`await extractStoryContext` + 空正文阻断（`toastr.warning`，不再随机选歌）+ `debug 0层调试日志`；
  3. `SPEC.md` 升级至 v6.0.1：新增第五章函数职责清单（28 函数 + 内联辅助全量备注）、补第四章“0层正文必达”验收项与第七章变更索引。
- **决策原因**：原同步 `getChatMessages('all')` 在新版 TavernHelper 返回 Promise 时失手，且 DOM 兜底错查 `document` 而非 `window.parent.document`，导致 `historyDepth=0` 时 Sidecar 收空正文而随机选歌。
- **提交**：`f92b8749f1cff0019ab295a94c13ac37d2dad823`
---

## [HASH: 96645d0] 可选歌单提示词（全选/全不选，默认全不选/空，v6.1.0）
- **日期**：2026-08-24
- **涉及文件**：`酒馆助手脚本-电台直链版.json`、`SPEC.md`
- **变更行为**：
  1. 数据模型：`bgmPlaylists` 新增 `prompt:string('')` + `promptEnabled:boolean(false)` 字段，`loadPlaylists` 自动迁移旧存档与出厂列表，默认全不选/空；
  2. 设置面板：新增“歌单提示词”选区（每频段复选框 + 自定义 `textarea` + 前8首曲库预览），提供“全选”/“全不选”一键切换，`openSettingsModal` 渲染、保存时统一 `savePlaylists`；
  3. 提示词拼装：`getLibrarySummaryForPrompt({filterEnabled:true})` 仅聚合勾选频段；新增 `getPlaylistPromptBlocks()` / `renderSettingsPlaylistPrompts()`；`triggerAiDjDecision` 改为三段式 `userPayload`（曲库摘要 + 歌单提示词 + 正文），`debug` 新增“📚 歌单提示词”日志；
  4. 导入/新建：覆盖导入透传 `prompt` 字段并补缺省，增量合并时同名频段不覆盖既有提示词，新建频段补默认值。
- **决策原因**：满足玩家自选发送范围的需求：既可仅发送已勾选频段的歌单摘要，又可为每频段附加自定义描述，避免全量歌单污染 Sidecar 上下文。
- **提交**：`96645d0aab6957f932c0571907b9de58ac07e90c`
---

## [HASH: 07cfcb3] DJ 角色预设切换（prompt-only）+ 新鲜感预设（v6.2.0）
- **日期**：2026-08-24
- **涉及文件**：`酒馆助手脚本-电台直链版.json`、`SPEC.md`
- **变更行为**：
  1. 新增 `DEFAULT_FRESH_PROMPT`“✨ 新鲜感·参考风格选新曲”：严禁复用列表与歌单提示词中的任何曲目，须以其为风格锚点从知识库挑同风格新曲，保证新鲜感；
  2. 新增 `DEFAULT_DJ_PRESETS` 两条出厂预设（🎬 经典优先在库 / ✨ 新鲜感），可重命名/删除，删光重建；持久化 `cr_dj_presets` + `cr_dj_active_preset_id`，辅助 `loadDjPresets/saveDjPresets/getActivePreset/ensurePresetsMigrated/getEffectiveSystemPrompt/renderPresetSelect`；
  3. 设置面板 System Prompt 上方新增 DJ 角色预设下拉（`#cr-preset-select`）+ 新建/重命名/删除三按钮 + 样式，`openSettingsModal` 接入预设渲染与回填，下拉切换即时改 `activeId` 与文本域；
  4. 预设交互：新建以当前文本为底、重命名改名、删除带确认（≤1 条阻断）；保存时同步写回当前预设并同步全局 `cr_dj_system_prompt`；
  5. Sidecar 接入 `getEffectiveSystemPrompt()`：`triggerAiDjDecision` 侧 `system` 字段与 `debug` 日志均随选中预设实时变化；重置按钮按预设类型分别回退到经典/新鲜感原文。
- **决策原因**：满足“储存切换多个预设”与“参考风格选新歌保新鲜感”的双需求，预设仅存提示词文本（prompt-only），不携带历史深度/勾选/API，避免切预设误改全局。
- **提交**：`07cfcb3b9bd7e35003f6f32f6588b63a5a635734`
---

## [HASH: 4041392] AI DJ 设置面板 3-Tab 现代化 UI 重构与移动端窄屏适配（v6.3.0）
- **日期**：2026-08-26
- **涉及文件**：`酒馆助手脚本-电台直链版.json`、`demo_settings_redesign.html`、`SPEC.md`
- **变更行为**：
  1. 320px 窄屏移动端几何与 Tab 路由重构：彻底解决设置面板堆叠在单个长列表导致多层滑动繁琐、卡顿的痛点，划分为“🔌 接口与参数”、“🎭 角色预设”与“📚 歌单提示词”三 Tab 模块化路由；
  2. 接口与参数（Tab 1）：API 端点、API Key（带明文显隐与 ⚡ 连通性探测测试按钮）、模型代号（集成 DeepSeek / Gemini / Haiku 等快捷胶囊 Chips）、上下文楼层深度（0层极速/1层/2轮/3轮/5轮）、自动选歌与提示词 Debug 模式（升级为 iOS/Linear 质感暗金 Switch 触控开关）；
  3. 角色预设与 Prompt（Tab 2）：紧凑工具栏（下拉选择、新建、重命名、删除、恢复默认），代码块风格 System Prompt 编辑器并集成实时字符统计；
  4. 歌单提示词联动（Tab 3）：新增 `🔍 快速过滤频段名称` 实时搜索框，支持一键全选/全不选与角标计数，曲库前8首摘要重构为微型流式 Chips 标签；
  5. 底部置底固定常驻栏：`[取消]` 与 `[保存配置]` 按钮永远置底可见，在滚动任意长歌单或长 Prompt 时随时可直接保存。
- **决策原因**：解决 320px 狭长空间下的信息过载与滚动灾难，以现代工业级 UI 规范实现触控友好、高层级信息划分与极致流畅的操作体验。
- **提交**：`40413922f3e8f85f1cb04797092921a97d8b5840`
---

## [HASH: 14a43c3] 播放模式持久化记忆修复（v6.3.1）
- **日期**：2026-08-26
- **涉及文件**：`酒馆助手脚本-电台直链版.json`、`SPEC.md`
- **变更行为**：
  1. 读持久化：定义 `PLAY_MODES = ['sequence', 'loop', 'random']` 与 `PLAY_MODE_LABELS`，初始化时通过 `localStorage.getItem('cr_play_mode')` 恢复当前模式（若空或无效则回退为默认 `'random'`）；
  2. 写持久化：点击 `#bgm-mode-btn` 切换播放模式时，即时写入 `localStorage.setItem('cr_play_mode', playMode)`；
  3. UI 同步：DOM 注入初始化时将 `#bgm-mode-btn` 文本同步为 `PLAY_MODE_LABELS[playMode]`，确保刷新后文案与模式完全对应。
- **决策原因**：修复刷新页面或重新注入脚本后播放模式重置回默认随机播放的问题，保障用户偏好设置跨会话持久留存。
- **提交**：`14a43c36c1e550974868018bf147321e06d9a9f5`
---

## [HASH: a390b84] 静默转圈加载与非阻塞浮动 Toast 升级（v6.4.0）
- **日期**：2026-08-26
- **涉及文件**：`酒馆助手脚本-电台直链版.json`、`SPEC.md`
- **变更行为**：
  1. 彻底移除红色挤压提示框：剔除 `.bgm-status-msg` 侵入式文档流节点，新增绝对定位 `.cr-player-toast` 悬浮提示胶囊，实现零高度占用与零布局抖动（0 Layout Shift），杜绝切歌与操作时按钮上下跳位；
  2. 现代流式静默加载态：新增 `isLoading` 状态生命周期管理，加载过程中中央播放按钮呈现暗金旋转 Spinner（`.cr-play-spinner`），贴边圆点与列表项呈现微呼吸加载态；
  3. 切歌局部 DOM 性能优化：`playSpecificSong` 改用精准 class 切换替代全量 `renderPlaylists` 重绘，消除异步请求前列表整体闪烁与卡顿感。
- **决策原因**：解决底部状态框挤压 UI 导致按钮抖动与加载过程无动态反馈呈现死锁卡顿感的痛点，达到现代主流音乐 App（Spotify/Apple Music）丝滑顺畅的加载交互水准。
- **提交**：`a390b84fc4ecabf1da2ba015694a10df48e898ae`
---

## [HASH: 4de1e77] 四态播放模式体系与全库随机上线（v6.5.0）
- **日期**：2026-08-26
- **涉及文件**：`酒馆助手脚本-电台直链版.json`、`SPEC.md`
- **变更行为**：
  1. 新增“全库随机”模式：新增 `getAllLibrarySongs()` 扁平化曲库索引生成器，在 `shuffle_all` 模式下切歌时跨越全库所有频段全局抽取候选歌曲（带防即刻重抽过滤机制）；
  2. 模式四态闭环确立：明确划分“顺序播放 / 单曲循环 / 列表随机 / 全库随机”四态，消除此前单歌单随机与全库随机的文案与行为歧义；
  3. 持久化与模板渲染强化：HTML 模板插值直接绑定 `${PLAY_MODE_LABELS[playMode]}`，首帧即呈现正确持久化模式；点击切换即时触发 Toast 明确提示（如 `📻 播放模式: 全库随机`）；兼容自动迁移历史 `'random'` 存档至 `'list_random'`。
- **决策原因**：解决播放模式局限于单歌单无法跨频段全库漫游的诉求，彻底消除模式文案与实际播放行为之间的认知偏差及持久化漏洞。
- **提交**：`4de1e779a1f592659e66114eb1d5f2f5347ee934`
