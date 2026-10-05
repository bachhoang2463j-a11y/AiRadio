// UI 重构：320px 贴边面板 → 全页仿网易云布局（左侧栏+中央表格+底部播放条+黑胶页）+ 封面解析链
const fs = require('fs');
const src = fs.readFileSync('D:/Project/AiRadio/tools/standalone_script.js', 'utf8').split('\n');
const css = fs.readFileSync('D:/Project/AiRadio/tools/ui-css.txt', 'utf8').replace(/\n$/, '').split('\n');
const htmltpl = fs.readFileSync('D:/Project/AiRadio/tools/ui-html.txt', 'utf8').replace(/\n$/, '').split('\n');

function idx(marker, from = 0) {
    const i = src.findIndex((l, n) => n >= from && l.includes(marker));
    if (i === -1) throw new Error('marker not found: ' + marker);
    return i;
}

// ============ 新代码块（行数组拼接，避免嵌套反引号） ============

const NEW_RENDER = [
    "    let selectedPlaylistIndex = 0;",
    "",
    "    function renderPlaylists() {",
    "        if (selectedPlaylistIndex >= bgmPlaylists.length) selectedPlaylistIndex = Math.max(0, bgmPlaylists.length - 1);",
    "        renderSidebarNav();",
    "        renderTrackTable();",
    "        updatePlayerFavBtn();",
    "    }",
    "",
    "    function renderSidebarNav() {",
    "        let html = '';",
    "        bgmPlaylists.forEach((cat, cIdx) => {",
    "            let isPlayingPl = (currentPlaylistIndex === cIdx);",
    "            let isSel = (selectedPlaylistIndex === cIdx);",
    "            html += `<div class=\"playlist-cat pl-nav-item ${isPlayingPl ? 'active-playlist' : ''} ${isSel ? 'selected' : ''}\" id=\"nav-${cIdx}\" data-cidx=\"${cIdx}\" draggable=\"true\">",
    "                <span class=\"nav-play-mark\">▶</span>",
    "                <span class=\"nav-name\">${cat.category}</span>",
    "                <span class=\"nav-count\">${cat.songs.length}</span>",
    "                <span class=\"nav-ops\">",
    "                    <span class=\"cr-cat-order-btn cr-cat-import-163\" data-idx=\"${cIdx}\" title=\"导入网易云歌单曲目\">${ICONS.cloudImport}</span>",
    "                    <span class=\"cr-cat-order-btn cr-cat-up\" data-idx=\"${cIdx}\" title=\"上移歌单\">▲</span>",
    "                    <span class=\"cr-cat-order-btn cr-cat-down\" data-idx=\"${cIdx}\" title=\"下移歌单\">▼</span>",
    "                </span>",
    "            </div>`;",
    "        });",
    "        $('#pl-nav').html(html);",
    "    }",
    "",
    "    function renderTrackTable() {",
    "        let q = (globalSearchQuery || '').trim().toLowerCase();",
    "        let localUrlCache = null; // 惰性解析一次，避免每首歌同步 JSON.parse",
    "        const resolveArtist = (name, art) => {",
    "            let sArt = art || '';",
    "            if (sArt === '[本地直链解析]' || !sArt) {",
    "                if (localUrlCache === null) localUrlCache = JSON.parse(localStorage.getItem('celestial_custom_urls') || '{}');",
    "                if (localUrlCache[name]) sArt = localUrlCache[name];",
    "                else if (customUrlDb[name]) sArt = customUrlDb[name];",
    "            }",
    "            return sArt || 'Unknown';",
    "        };",
    "        const rowHtml = (cat, cIdx, sIdx, showFrom, rowNum) => {",
    "            let song = cat.songs[sIdx];",
    "            let sName = song.title;",
    "            let sArt = resolveArtist(sName, song.artist);",
    "            let isPlayingCls = (currentPlaylistIndex === cIdx && currentSongIndex === sIdx) ? 'playing' : '';",
    "            let isFav = isSongFavorited(sName, sArt);",
    "            let isBatchMode = (batchPlaylistIndex === cIdx);",
    "            let isChecked = isBatchMode && selectedSongsSet.has(sIdx);",
    "            let batchSelectedCls = isChecked ? 'batch-selected' : '';",
    "            return `<div class=\"song-item ${isPlayingCls} ${batchSelectedCls} cr-song-row\" data-pidx=\"${cIdx}\" data-sidx=\"${sIdx}\" draggable=\"${isBatchMode ? 'false' : 'true'}\">",
    "                ${isBatchMode ? `<input type=\"checkbox\" class=\"cr-song-check\" data-pidx=\"${cIdx}\" data-sidx=\"${sIdx}\" ${isChecked ? 'checked' : ''}>` : `<div class=\"row-index\">${rowNum}</div>`}",
    "                <div class=\"song-info\">",
    "                    <span class=\"song-name\">${sName}</span>",
    "                    <span class=\"song-artist\">${sArt}</span>",
    "                </div>",
    "                ${showFrom ? `<span class=\"row-from\">${cat.category}</span>` : ''}",
    "                <div class=\"song-actions\">",
    "                    <span class=\"song-action-btn cr-song-fav ${isFav ? 'is-fav' : ''}\" data-pidx=\"${cIdx}\" data-sidx=\"${sIdx}\" title=\"${isFav ? '已收藏 (点击取消)' : '收藏至我的收藏'}\">${isFav ? ICONS.favSolid : ICONS.favOutline}</span>",
    "                    <span class=\"song-action-btn cr-song-edit\" data-pidx=\"${cIdx}\" data-sidx=\"${sIdx}\" title=\"编辑歌曲名与歌手\">${ICONS.edit}</span>",
    "                    <span class=\"song-action-btn cr-song-move\" data-pidx=\"${cIdx}\" data-sidx=\"${sIdx}\" title=\"移动到其他歌单\">${ICONS.move}</span>",
    "                    <span class=\"song-action-btn cr-del-song\" data-pidx=\"${cIdx}\" data-sidx=\"${sIdx}\" title=\"移除曲目\" style=\"color:#C4A77D; font-size:14px; font-weight:bold; opacity:0.8;\">×</span>",
    "                </div>",
    "            </div>`;",
    "        };",
    "",
    "        let headHtml = '';",
    "        let bodyHtml = '';",
    "",
    "        if (q) {",
    "            let total = 0;",
    "            bgmPlaylists.forEach((cat, cIdx) => {",
    "                cat.songs.forEach((s, sIdx) => {",
    "                    let t = (s.title || '').toLowerCase();",
    "                    let a = (s.artist || '').toLowerCase();",
    "                    let c = (cat.category || '').toLowerCase();",
    "                    if (t.includes(q) || a.includes(q) || c.includes(q)) {",
    "                        bodyHtml += rowHtml(cat, cIdx, sIdx, true, ++total);",
    "                    }",
    "                });",
    "            });",
    "            headHtml = `<div class=\"pl-head-info\"><div class=\"pl-head-title\">搜索结果</div><div class=\"pl-head-sub\">全库即时过滤 · 共 <b>${total}</b> 首匹配（回车转全网检索）</div></div><div class=\"pl-head-tools\"></div>`;",
    "            if (total === 0) {",
    "                bodyHtml = `<div class=\"track-empty\"><div class=\"big\">🔍</div><div>全库未找到包含 “<span style=\"color:#C4A77D;\">${globalSearchQuery}</span>” 的曲目</div><button class=\"cp-btn cr-online-search-btn\" style=\"margin-top:14px; padding:6px 14px; border-color:#C4A77D; color:#C4A77D;\" data-query=\"${globalSearchQuery}\">🌐 全网检索并试听</button></div>`;",
    "            }",
    "        } else {",
    "            if (selectedPlaylistIndex < 0 || selectedPlaylistIndex >= bgmPlaylists.length) { $('#pl-header').html(''); $('#track-table').html(''); return; }",
    "            let cat = bgmPlaylists[selectedPlaylistIndex];",
    "            let isPlayingPl = (currentPlaylistIndex === selectedPlaylistIndex);",
    "            let isSysPl = (cat.category === '★ 我的收藏' || cat.category === '🕒 最近播放');",
    "            headHtml = `<div class=\"pl-head-info\">",
    "                    <div class=\"pl-head-title\">${cat.category}</div>",
    "                    <div class=\"pl-head-sub\">共 <b>${cat.songs.length}</b> 首曲目${isPlayingPl ? ' · <b>正在播放该歌单</b>' : ''}</div>",
    "                </div>",
    "                <div class=\"pl-head-tools\">",
    "                    <span class=\"cr-cat-action-btn cr-rename-pl\" data-idx=\"${selectedPlaylistIndex}\" title=\"重命名该歌单\">${ICONS.edit}</span>",
    "                    <span class=\"cr-cat-action-btn cr-cat-import-163\" data-idx=\"${selectedPlaylistIndex}\" title=\"导入网易云歌单曲目\">${ICONS.cloudImport}</span>",
    "                    <span class=\"cr-cat-action-btn cr-batch-toggle ${batchPlaylistIndex === selectedPlaylistIndex ? 'active' : ''}\" data-idx=\"${selectedPlaylistIndex}\" title=\"${batchPlaylistIndex === selectedPlaylistIndex ? '退出多选管理' : '批量多选管理'}\">${ICONS.batch}</span>",
    "                    <span class=\"cr-cat-action-btn cr-del-pl\" data-idx=\"${selectedPlaylistIndex}\" title=\"${isSysPl ? '清空歌单曲目' : '删除该歌单'}\">${ICONS.trash}</span>",
    "                    <div class=\"cr-addrow\">",
    "                        <input type=\"text\" class=\"cp-input cr-new-song-input\" id=\"new-song-input-${selectedPlaylistIndex}\" placeholder=\"歌名 - 歌手(或填网址)\" autocomplete=\"off\">",
    "                        <button class=\"cp-btn cr-add-song\" data-idx=\"${selectedPlaylistIndex}\">刻录</button>",
    "                    </div>",
    "                </div>`;",
    "            bodyHtml = `<div class=\"track-head-row\">",
    "                <span style=\"width:34px; text-align:center; flex-shrink:0;\">#</span>",
    "                <span style=\"flex:1;\">标题 / 歌手</span>",
    "            </div>`;",
    "            if (batchPlaylistIndex === selectedPlaylistIndex) {",
    "                let isAllSel = cat.songs.length > 0 && selectedSongsSet.size === cat.songs.length;",
    "                bodyHtml += `<div class=\"cr-batch-bar\">",
    "                    <div style=\"display:flex; align-items:center; gap:8px;\">",
    "                        <input type=\"checkbox\" class=\"cr-batch-select-all\" data-pidx=\"${selectedPlaylistIndex}\" ${isAllSel ? 'checked' : ''} style=\"cursor:pointer; accent-color:#C4A77D;\" title=\"全选 / 取消全选\">",
    "                        <span style=\"color:#C4A77D; font-weight:600;\">已选 ${selectedSongsSet.size}/${cat.songs.length}</span>",
    "                    </div>",
    "                    <div style=\"display:flex; align-items:center;\">",
    "                        <button class=\"cp-btn cr-batch-fav-btn\" data-pidx=\"${selectedPlaylistIndex}\" title=\"批量收藏到【★ 我的收藏】\">★ 收藏</button>",
    "                        <button class=\"cp-btn cr-batch-move-btn\" data-pidx=\"${selectedPlaylistIndex}\" title=\"批量迁移到其他歌单\">⇄ 迁移</button>",
    "                        <button class=\"cp-btn cr-batch-del-btn\" data-pidx=\"${selectedPlaylistIndex}\" title=\"批量删除选中曲目\">🗑️ 删除</button>",
    "                        <button class=\"cp-btn cr-batch-exit-btn\" data-pidx=\"${selectedPlaylistIndex}\" title=\"退出多选\">✕</button>",
    "                    </div>",
    "                </div>`;",
    "            }",
    "            if (cat.songs.length === 0) {",
    "                bodyHtml += `<div class=\"track-empty\"><div class=\"big\">📡</div><div>该歌单暂无曲目 — 从上方输入框刻录，或把歌曲拖进左侧歌单</div></div>`;",
    "            } else {",
    "                cat.songs.forEach((s, sIdx) => { bodyHtml += rowHtml(cat, selectedPlaylistIndex, sIdx, false, sIdx + 1); });",
    "            }",
    "        }",
    "        $('#pl-header').html(headHtml);",
    "        $('#track-table').html(bodyHtml);",
    "    }",
    "",
].join('\n');

const NEW_NAV_CLICK = [
    "    $ctn.on('click', '.pl-nav-item', function(e) {",
    "        if ($(e.target).closest('.cr-cat-order-btn, .cr-cat-import-163').length > 0) return;",
    "        let idx = parseInt($(this).data('cidx'), 10);",
    "        if (isNaN(idx) || !bgmPlaylists[idx]) return;",
    "        selectedPlaylistIndex = idx;",
    "        if (batchPlaylistIndex !== null && batchPlaylistIndex !== idx) {",
    "            batchPlaylistIndex = null;",
    "            selectedSongsSet.clear();",
    "        }",
    "        renderSidebarNav();",
    "        renderTrackTable();",
    "    });",
    "",
].join('\n');

const NEW_UPDATEBGM_COVER = [
    "    function updateBgmUI() {",
    "        if (isLoading) {",
    "            $('#bgm-play-pause').html('<div class=\"cr-play-spinner\"></div>');",
    "        } else if (isPlaying) {",
    "            $('#bgm-play-pause').html('<div class=\"pause-icon\"></div>');",
    "        } else {",
    "            $('#bgm-play-pause').html('<div class=\"play-icon\"></div>');",
    "            if(currentPlaylistIndex === -1 && !audioObj.src) { $('#bgm-now-playing').text('频段静默'); $('#bgm-now-artist').text('---'); }",
    "        }",
    "        $('#cr-vinyl-disc').toggleClass('spinning', isPlaying && !isLoading && !audioObj.paused);",
    "        $('#cr-vinyl-tonearm').toggleClass('on', isPlaying && !isLoading);",
    "        updateVolAnimState();",
    "        updatePlayerFavBtn();",
    "    }",
    "",
    "    // === 封面解析链：网易云 pic_id → types=pic 换 CDN 直链（带缓存与切歌过期丢弃） ===",
    "    const coverCache = new Map();",
    "    let currentCoverUrl = '';",
    "    const COVER_PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\"><rect width=\"120\" height=\"120\" fill=\"#14161c\"/><circle cx=\"60\" cy=\"60\" r=\"34\" fill=\"none\" stroke=\"#C4A77D\" stroke-width=\"2\" opacity=\"0.5\"/><circle cx=\"60\" cy=\"60\" r=\"5\" fill=\"#C4A77D\" opacity=\"0.7\"/><path d=\"M52 74 L52 46 L74 42 L74 70\" stroke=\"#C4A77D\" stroke-width=\"2.5\" fill=\"none\" opacity=\"0.85\" stroke-linejoin=\"round\"/><circle cx=\"47\" cy=\"74\" r=\"5.5\" fill=\"#C4A77D\" opacity=\"0.85\"/><circle cx=\"69\" cy=\"70\" r=\"5.5\" fill=\"#C4A77D\" opacity=\"0.85\"/></svg>');",
    "",
    "    async function fetchPicIdBySearch(title, artist) {",
    "        const kw = artist ? `${title} - ${artist}` : title;",
    "        const url = `https://music-api.gdstudio.xyz/api.php?types=search&source=netease&name=${encodeURIComponent(kw)}&count=3&pages=1`;",
    "        try {",
    "            const res = await fetch(url);",
    "            const arr = await res.json();",
    "            if (Array.isArray(arr) && arr.length > 0 && arr[0] && arr[0].pic_id) {",
    "                return { picId: String(arr[0].pic_id), album: Array.isArray(arr[0].album) ? arr[0].album.join(' / ') : (arr[0].album || '') };",
    "            }",
    "        } catch (e) {}",
    "        return null;",
    "    }",
    "",
    "    async function resolveCoverUrl(title, artist, knownPic) {",
    "        const key = normalizeStr(title) + '|' + normalizeStr(artist || '');",
    "        if (coverCache.has(key)) return coverCache.get(key);",
    "        if (!knownPic || !knownPic.picId) { coverCache.set(key, null); return null; }",
    "        try {",
    "            const res = await fetch(`https://music-api.gdstudio.xyz/api.php?types=pic&source=netease&id=${encodeURIComponent(knownPic.picId)}&size=500y500`);",
    "            const data = await res.json();",
    "            const url = (data && data.url) ? data.url : null;",
    "            coverCache.set(key, url);",
    "            return url;",
    "        } catch (e) { coverCache.set(key, null); return null; }",
    "    }",
    "",
    "    async function applyCurrentCover(title, artist, knownPic) {",
    "        currentCoverUrl = '';",
    "        updateCoverUI();",
    "        const info = knownPic || await fetchPicIdBySearch(title, artist);",
    "        if (info && info.album) $('#cr-vinyl-album').text(info.album).show(); else $('#cr-vinyl-album').hide();",
    "        const url = info ? await resolveCoverUrl(title, artist, info) : null;",
    "        if (currentPlayingTrackInfo.title !== title) return; // 播放已切歌：丢弃过期结果",
    "        if (url) { currentCoverUrl = url; updateCoverUI(); }",
    "    }",
    "",
    "    function updateCoverUI() {",
    "        const url = currentCoverUrl || COVER_PLACEHOLDER;",
    "        $('#pb-cover').html(`<img src=\"${url}\" alt=\"\">`);",
    "        $('#cr-vinyl-cover').attr('src', url);",
    "        if (currentCoverUrl) $('#cr-vinyl-bg').css('background-image', `url(\"${currentCoverUrl}\")`);",
    "        else $('#cr-vinyl-bg').css('background-image', 'none');",
    "    }",
    "",
    "    function openVinylPage() {",
    "        $('#cr-vinyl-title').text(currentPlayingTrackInfo.title || $('#bgm-now-playing').text());",
    "        $('#cr-vinyl-artist').text(currentPlayingTrackInfo.artist || $('#bgm-now-artist').text());",
    "        $('#cr-vinyl-overlay').addClass('open');",
    "        updateCoverUI();",
    "        updateBgmUI();",
    "    }",
    "    $('#pb-cover').on('click', openVinylPage);",
    "    $('#cr-vinyl-close').on('click', () => $('#cr-vinyl-overlay').removeClass('open'));",
    "",
].join('\n');

const NEW_FORMATTIME = [
    "    function formatTime(sec) {",
    "        if (!Number.isFinite(sec) || sec < 0) return '0:00';",
    "        sec = Math.floor(sec);",
    "        return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');",
    "    }",
    "",
].join('\n');

// ============ 区间切割 ============

const cuts = [];

// R1. state/dockSide/dockTop/openedPlaylistCategories 声明删除
{
    const a = idx('    let state = {');
    const b = idx('    const customUrlDb = {};');
    cuts.push([a, b - 2, null]);
}

// R5. styles + html 模板整体替换
{
    const a = idx('    const styles = `');
    const b = idx("    $('head').append(styles);");
    const rep = ['    const styles = `', ...css, '    `;', '', '    const html = `', ...htmltpl, '    `;'];
    cuts.push([a, b - 1, rep.join('\n')]);
}

// R6. $ctn/overlay 声明 → $ctn 指向 #cr-app
{
    const a = idx("    const $ctn = $('#celestial-radio-container');");
    const b = idx("    applyGlassEffect(localStorage.getItem('cr_glass_effect') !== 'false');");
    cuts.push([a, b, "    const $ctn = $('#cr-app');\n\n    applyGlassEffect(localStorage.getItem('cr_glass_effect') !== 'false');"]);
}

// R7. dock 区删除（贴边计算 + 拖拽 + click 收起 + close 按钮）
{
    const a = idx('    // === 智能贴边位置计算与应用 ===');
    const b = idx("    $('#bgm-mode-btn').on('click'");
    cuts.push([a, b - 2, null]);
}

// R8. renderPlaylists → 新三函数
{
    const a = idx('    function renderPlaylists() {');
    const b = idx('    // === HTML5 拖拽事件 ===');
    cuts.push([a, b - 2, NEW_RENDER]);
}

// R10. cat-title click → nav 项 click 选中
{
    const a = idx("    $ctn.on('click', '.cat-title', function(e) {");
    const b = idx("    $('#cr-new-pl-btn').click(function() {");
    cuts.push([a, b - 2, NEW_NAV_CLICK]);
}

// R16. updateBgmUI → 新版 + 封面链 + 黑胶事件
{
    const a = idx('    function updateBgmUI() {');
    const b = idx('    function getAllLibrarySongs() {');
    cuts.push([a, b - 2, NEW_UPDATEBGM_COVER]);
}

cuts.sort((x, y) => x[0] - y[0]);
const out = [];
let cursor = 0;
for (const [a, b, rep] of cuts) {
    if (a < cursor) throw new Error('区间重叠: ' + a + ' < ' + cursor);
    for (let i = cursor; i < a; i++) out.push(src[i]);
    if (rep !== null && rep !== undefined) out.push(rep);
    cursor = b + 1;
}
for (let i = cursor; i < src.length; i++) out.push(src[i]);

let text = out.join('\n');

// ============ 字符串级精确替换 ============

const replacements = [
    // R3. 清理选择器（首行 + pagehide 两处）
    ["$('#celestial-radio-container, #celestial-radio-css, #celestial-radio-font, #celestial-drag-overlay, #cr-move-modal, #cr-settings-modal').remove();",
     "$('#cr-app, #celestial-radio-css, #celestial-radio-font').remove();"],
    // R2. recordPlayHistory 无条件重绘
    ["        savePlaylists();\n        if (!state.collapsed) {\n            renderPlaylists();\n        }",
     "        savePlaylists();\n        renderPlaylists();"],
    // R4. toast 挂载点
    [".appendTo('#celestial-radio-container')", ".appendTo('#cr-app')"],
    // R9/R11. openedPlaylistCategories 引用清理
    ["        savePlaylists();\n        openedPlaylistCategories.add(targetPl.category);\n        renderPlaylists();",
     "        savePlaylists();\n        renderPlaylists();"],
    ["        bgmPlaylists.splice(1, 0, newPl);\n        openedPlaylistCategories.add(name);\n",
     "        bgmPlaylists.splice(1, 0, newPl);\n"],
    // R12. playSpecificSong 播放中高亮 → 左侧导航
    ["        $('.cat-title').removeClass('active-playlist');\n        $(`#cat-${pIdx} .cat-title`).addClass('active-playlist');",
     "        $('.pl-nav-item').removeClass('active-playlist');\n        $('#nav-' + pIdx).addClass('active-playlist');"],
    // R13. 曲库播放成功挂封面
    ["                recordPlayHistory(song.title, song.artist);\n            }).catch(e => {",
     "                recordPlayHistory(song.title, song.artist);\n                applyCurrentCover(song.title, song.artist);\n            }).catch(e => {"],
    // R14. playDirect 高亮 → 左侧导航
    ["        $('.cat-title').removeClass('active-playlist');\n        $('.song-item').removeClass('playing loading');",
     "        $('.pl-nav-item').removeClass('active-playlist');\n        renderSidebarNav();\n        $('.song-item').removeClass('playing loading');"],
    // R15. 全网播放成功挂封面（netease 候选带 pic_id）
    ["                recordPlayHistory(finalTitle, finalArtist);\n            } catch (e) {",
     "                recordPlayHistory(finalTitle, finalArtist);\n                const neteasePic = (result.track && result.track.source === 'netease' && result.track.pic_id) ? { picId: String(result.track.pic_id), album: Array.isArray(result.track.album) ? result.track.album.join(' / ') : (result.track.album || '') } : null;\n                applyCurrentCover(finalTitle, finalArtist, neteasePic);\n            } catch (e) {"],
    // R17. 播放进度时间显示
    ["                $('#bgm-progress-fill').css('width', pct + '%');",
     "                $('#bgm-progress-fill').css('width', pct + '%');\n                $('#pb-cur-time').text(formatTime(audioObj.currentTime));"],
    ["            if (audioObj.duration) {\n                let dur = audioObj.duration;\n                if (dur < 60 || dur > 1200) {",
     "            if (audioObj.duration) {\n                let dur = audioObj.duration;\n                $('#pb-total-time').text(formatTime(dur));\n                if (dur < 60 || dur > 1200) {"],
    // formatTime helper 插入
    ["    // === 音频元素事件挂载（真实频谱模式重建元素后需重挂，处理器动态读 audioObj 变量） ===",
     NEW_FORMATTIME + "    // === 音频元素事件挂载（真实频谱模式重建元素后需重挂，处理器动态读 audioObj 变量） ==="],
    // R18. 启动初始化待机/记忆回填引用
    ["                $('#bgm-current-title').text(lastTitle);\n                $('#bgm-current-artist').text(lastArtist ? `- ${lastArtist}` : '');\n                $('#bgm-current-cat').text(currentPlaylistIndex >= 0 ? `[${bgmPlaylists[currentPlaylistIndex].category}]` : '[记忆曲目]');\n                updatePlayerFavBtn();",
     "                $('#bgm-now-playing').text(lastTitle);\n                $('#bgm-now-artist').text(lastArtist ? `- ${lastArtist}` : '');\n                applyCurrentCover(lastTitle, lastArtist || '');\n                updatePlayerFavBtn();"],
    ["                $('#bgm-current-title').text('天式号·太空电台');\n                $('#bgm-current-artist').text('就绪 (待机中)');\n                $('#bgm-current-cat').text('[待机]');",
     "                $('#bgm-now-playing').text('音乐电台');\n                $('#bgm-now-artist').text('就绪 (待机中)');"],
    // 律动条播放条件去除面板折叠态
    ["isPlaying && !isLoading && !audioObj.paused && !state.collapsed && audioObj.volume > 0",
     "isPlaying && !isLoading && !audioObj.paused && audioObj.volume > 0"],
    // openedPlaylistCategories（手风琴展开态）在全页布局中已无意义，清理全部写引用
    ["                targetCat.songs.push(...movedSongs);\n                openedPlaylistCategories.add(targetCat.category);",
     "                targetCat.songs.push(...movedSongs);"],
    ["                targetCat.songs.push(moved);\n                openedPlaylistCategories.add(targetCat.category);",
     "                targetCat.songs.push(moved);"],
    ["                toCat.songs.push(moved);\n                openedPlaylistCategories.add(toCat.category);",
     "                toCat.songs.push(moved);"],
    ["        if (openedPlaylistCategories.has(oldName)) {\n            openedPlaylistCategories.delete(oldName);\n            openedPlaylistCategories.add(newName);\n        }\n\n        cat.category = newName;",
     "        cat.category = newName;"],
    ["            openedPlaylistCategories.delete(cat.category);\n            bgmPlaylists.splice(idx, 1);",
     "            bgmPlaylists.splice(idx, 1);"],
    // pic 接口 size 参数多后端行为不一致：不带 size 取默认 300，客户端改写 CDN param 为 500 高清
    ["            const res = await fetch(`https://music-api.gdstudio.xyz/api.php?types=pic&source=netease&id=${encodeURIComponent(knownPic.picId)}&size=500y500`);\n            const data = await res.json();\n            const url = (data && data.url) ? data.url : null;",
     "            const res = await fetch(`https://music-api.gdstudio.xyz/api.php?types=pic&source=netease&id=${encodeURIComponent(knownPic.picId)}`);\n            const data = await res.json();\n            const url = (data && data.url) ? data.url.replace('param=300y300', 'param=500y500') : null;"],
    // 首次渲染必须位于所有 let/const 声明之后（renderPlaylists 引用 selectedPlaylistIndex 等，存在 TDZ）
    ["    // === 启动初始化记忆恢复与播放控制 ===",
     "    // === 全页布局：加载即渲染左侧歌单与中央曲目表 ===\n    renderPlaylists();\n    applyCurrentCover(localStorage.getItem('cr_last_song_title') || '', localStorage.getItem('cr_last_song_artist') || '');\n    $('#cr-vinyl-album').hide();\n\n    // === 启动初始化记忆恢复与播放控制 ==="],
];

for (const [oldStr, newStr] of replacements) {
    if (!text.includes(oldStr)) throw new Error('替换目标未找到: ' + oldStr.slice(0, 70));
    text = text.split(oldStr).join(newStr);
}

fs.writeFileSync('D:/Project/AiRadio/tools/standalone_script_v2.js', text);
console.log('done. lines:', text.split('\n').length);
