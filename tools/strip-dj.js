// 一次性手术脚本：从 _extracted_script.js 剥离 AI DJ/酒馆专属代码，生成 standalone_script.js
const fs = require('fs');
const src = fs.readFileSync('D:/Project/AiRadio/tools/_extracted_script.js', 'utf8').split('\n');

function idx(marker, from = 0) {
    const i = src.findIndex((l, n) => n >= from && l.includes(marker));
    if (i === -1) throw new Error('marker not found: ' + marker);
    return i;
}

// 收集 [start, end] 闭区间（0-based）
const cuts = [];

// 1. DJ 常量 + getDjSettings/saveDjSettings（保留 applyGlassEffect）
{
    const a = idx('// === AI DJ 配置默认项与读取 ===');
    const b = idx('function applyGlassEffect');
    cuts.push([a, b - 2]);
}

// 2. DJ 预设存取函数（保留其后的 T_CHARS）
{
    const a = idx('// === DJ 角色预设（prompt-only） ===');
    const b = idx('$sel.val(aid);');
    cuts.push([a, b + 1]);
}

// 3. 设置面板 HTML → 精简版（保留 close-x 与 footer，4 项通用设置）
{
    const a = idx('<div id="cr-settings-modal" class="cr-modal-overlay">');
    const b = idx('<!-- 贴边收纳把手 -->');
    const replacement = `        <div id="cr-settings-modal" class="cr-modal-overlay">
            <div class="cr-settings-container">
                <div class="cr-settings-header">
                    <div class="cr-settings-title">
                        <span>⚡ 电台设置</span>
                    </div>
                    <span id="cr-settings-close-x" class="cr-settings-close" title="关闭设置">×</span>
                </div>

                <div class="cr-settings-body">
                    <div class="cr-card">
                        <div class="cr-card-title"><span>🎧 播放与视觉</span></div>
                        <div class="cr-cfg-row">
                            <label class="cr-cfg-label">
                                <span>最近播放历史容量:</span>
                                <span style="font-size:9px; color:#C4A77D;">自动记录最新足迹</span>
                            </label>
                            <select class="cr-cfg-input" id="cr-cfg-history-limit" style="padding:3px;">
                                <option value="5">5 首 (精简极速)</option>
                                <option value="10">10 首 (默认推荐)</option>
                                <option value="20">20 首 (丰富回溯)</option>
                                <option value="30">30 首 (深度历史)</option>
                                <option value="50">50 首 (海量记忆)</option>
                            </select>
                        </div>
                        <div class="cr-switch-row">
                            <div class="cr-switch-label-box">
                                <div class="cr-switch-title">启动时自动播放</div>
                                <div class="cr-switch-desc">开启后打开页面自动恢复上次曲目播放，关闭则保持静默待机</div>
                            </div>
                            <label class="cr-switch-control">
                                <input type="checkbox" id="cr-cfg-init-autoplay">
                                <span class="cr-switch-track"></span>
                            </label>
                        </div>
                        <div class="cr-switch-row">
                            <div class="cr-switch-label-box">
                                <div class="cr-switch-title">毛玻璃视觉效果</div>
                                <div class="cr-switch-desc">关闭后停用背景模糊改用纯色面板，可显著降低手机端 GPU 负担</div>
                            </div>
                            <label class="cr-switch-control">
                                <input type="checkbox" id="cr-cfg-glass">
                                <span class="cr-switch-track"></span>
                            </label>
                        </div>
                        <div class="cr-switch-row">
                            <div class="cr-switch-label-box">
                                <div class="cr-switch-title">真实音频频谱</div>
                                <div class="cr-switch-desc">开启后波形柱按真实音频实时律动（需音源支持跨域，PC 端推荐；下一曲起生效），不支持时自动回退模拟律动</div>
                            </div>
                            <label class="cr-switch-control">
                                <input type="checkbox" id="cr-cfg-spectrum">
                                <span class="cr-switch-track"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="cr-settings-footer">
                    <button class="cr-footer-btn" id="cr-settings-cancel-btn">取消</button>
                    <button class="cr-footer-btn cr-footer-btn-primary" id="cr-settings-save-btn">保存配置</button>
                </div>
            </div>
        </div>`;
    cuts.push([a, b - 2, replacement]);
}

// 4. AI选歌按钮行删除
{
    const a = idx('id="cr-manual-dj-btn"');
    cuts.push([a, a]);
}

// 5. 设置面板交互头注释 + updateSettingsPromptCharCount/updateSettingsTabBadges
{
    const a = idx('// === 设置面板交互与现代化 Tab 路由 ===');
    const b = idx('function openSettingsModal');
    cuts.push([a, b - 2]);
}

// 6. openSettingsModal → 精简版（4 项回填）
{
    const a = idx('function openSettingsModal');
    const b = idx("$('#cr-settings-modal').css('display', 'flex');");
    const replacement = `    function openSettingsModal() {
        $('#cr-cfg-history-limit').val(getHistoryLimit().toString());
        $('#cr-cfg-init-autoplay').prop('checked', localStorage.getItem('cr_init_autoplay') === 'true');
        $('#cr-cfg-glass').prop('checked', localStorage.getItem('cr_glass_effect') !== 'false');
        $('#cr-cfg-spectrum').prop('checked', localStorage.getItem('cr_spectrum') === 'true');
        $('#cr-settings-modal').css('display', 'flex');
    }`;
    cuts.push([a, b + 1, replacement]);
}

// 7. 选项卡切换 ~ 恢复默认提示词按钮（tab 路由/模型chips/连通测试/key显隐/prompt统计/reset）
{
    const a = idx('// 选项卡切换');
    const b = idx("$('#cr-settings-save-btn')");
    cuts.push([a, b - 2]);
}

// 8. save-btn → 精简版（4 项通用设置保存）
{
    const a = idx("$('#cr-settings-save-btn')");
    const b = idx('// === DJ 预设交互');
    const replacement = `    $('#cr-settings-save-btn').on('click', function(e) {
        e.stopPropagation();
        localStorage.setItem('cr_init_autoplay', $('#cr-cfg-init-autoplay').is(':checked') ? 'true' : 'false');
        const glassOn = $('#cr-cfg-glass').is(':checked');
        localStorage.setItem('cr_glass_effect', glassOn ? 'true' : 'false');
        applyGlassEffect(glassOn);
        localStorage.setItem('cr_spectrum', $('#cr-cfg-spectrum').is(':checked') ? 'true' : 'false');
        let newHistLimit = parseInt($('#cr-cfg-history-limit').val() || '10', 10);
        localStorage.setItem('cr_history_limit', newHistLimit.toString());
        let histPl = bgmPlaylists.find(p => p.category === '🕒 最近播放');
        if (histPl && histPl.songs.length > newHistLimit) {
            histPl.songs = histPl.songs.slice(0, newHistLimit);
            savePlaylists();
            renderPlaylists();
        }
        $('#cr-settings-modal').hide();
        showPlayerToast('✅ 电台设置已保存！');
    });`;
    cuts.push([a, b - 2, replacement]);
}

// 9. DJ 预设交互 ~ #cr-manual-dj-btn click（歌单提示词交互/extractStoryContext/曲库摘要/triggerAiDjDecision）
{
    const a = idx('// === DJ 预设交互');
    const b = idx('// === 收藏状态检查与同步 ===');
    cuts.push([a, b - 2]);
}

// 10. 雷达区（lastHandledMessageId ~ 事件注册 catch）
{
    const a = idx('let lastHandledMessageId = null;');
    const b = idx("[太空电台·雷达] 事件注册失败");
    cuts.push([a - 1, b]);
}

// ⚙ 按钮 title 改文案（整体替换，最后做字符串级处理）

// 应用区间：先按起点排序，把区间标记为替换或删除
cuts.sort((x, y) => x[0] - y[0]);
const out = [];
let cursor = 0;
for (const [a, b, rep] of cuts) {
    if (a < cursor) throw new Error('区间重叠: ' + a + ' < ' + cursor);
    for (let i = cursor; i < a; i++) out.push(src[i]);
    if (rep !== undefined) out.push(rep);
    cursor = b + 1;
}
for (let i = cursor; i < src.length; i++) out.push(src[i]);

let text = out.join('\n');
text = text.replace('title="配置独立 AI DJ 选歌接口"', 'title="电台设置"');

fs.writeFileSync('D:/Project/AiRadio/tools/standalone_script.js', text);
console.log('done. lines:', text.split('\n').length);
