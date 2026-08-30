#!/usr/bin/env node
/**
 * hitrate-probe.mjs — AiRadio 五源轮询命中率诊断探针
 *
 * 忠实复刻 酒馆助手脚本-电台直链版.json 中 getTrackUrl 的解析链：
 *   ① directLinkDb 直连（gdstudio netease id，生产环境走 corsproxy.io）
 *   ② 五源检索 netease→kuwo→migu→kugou→tencent（关键词多级回退 + 打分阈值30 + 时长熔断55~550s）
 * 纯函数（normalizeStr/cleanTrackQuery/scoreTrackCandidate 等）从项目 JSON 中
 * 程序化抽取后 eval，保证与线上逻辑零漂移。
 *
 * 用法：node tools/hitrate-probe.mjs [--quick]
 * 输出：tools/hitrate-report.json + tools/hitrate-report.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SCRIPT_JSON = path.join(ROOT, '酒馆助手脚本-电台直链版.json');
const SOURCES = ['netease', 'kuwo', 'migu', 'kugou', 'tencent'];
const REQ_DELAY = 300;          // 请求间隔(ms)，防限流
const REQ_TIMEOUT = 12000;      // 单请求超时(ms)
const MAX_URL_CANDIDATES = 6;   // 复刻线上：候选池按分排序取前6逐一试URL

// ---------------------------------------------------------------- 工具
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchJson(url, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), REQ_TIMEOUT);
        try {
            const res = await fetch(url, { signal: ac.signal });
            clearTimeout(timer);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } catch (e) {
            clearTimeout(timer);
            if (i === retries) return { __error: String(e.message || e) };
            await sleep(600);
        } finally { clearTimeout(timer); }
    }
}

// ---------------------------------------------------------------- 从项目源码抽取纯函数（零漂移）
function extractBlock(content, startPos, open, close) {
    let depth = 0, started = false;
    for (let i = startPos; i < content.length; i++) {
        const ch = content[i];
        if (ch === open) { depth++; started = true; }
        else if (ch === close) { depth--; }
        if (started && depth === 0) return content.slice(startPos, i + 1);
    }
    throw new Error('extractBlock 未闭合: ' + content.slice(startPos, startPos + 60));
}

function extractFunction(content, name) {
    const idx = content.indexOf('function ' + name + '(');
    if (idx === -1) throw new Error('找不到函数 ' + name);
    const braceIdx = content.indexOf('{', idx);
    return content.slice(idx, braceIdx) + extractBlock(content, braceIdx, '{', '}');
}

function extractConst(content, name) {
    const idx = content.indexOf('const ' + name + ' =');
    if (idx === -1) throw new Error('找不到常量 ' + name);
    const rest = content.slice(idx);
    const m = rest.match(new RegExp('const ' + name + ' = (\\[|\\{|")'));
    if (!m) throw new Error('常量 ' + name + ' 类型无法识别');
    if (m[1] === '"') {
        const end = rest.indexOf('";', m[0].length);
        return 'const ' + name + ' = ' + rest.slice(m[0].length - 1, end + 1) + ';';
    }
    const open = m[1], close = open === '[' ? ']' : '}';
    const openIdx = idx + m.index + m[0].length - 1;
    return 'const ' + name + ' = ' + extractBlock(content, openIdx, open, close) + ';';
}

const scriptJson = JSON.parse(fs.readFileSync(SCRIPT_JSON, 'utf8'));
const content = scriptJson.content;

const libFactory = new Function(
    [
        extractConst(content, 'T_CHARS'),
        extractConst(content, 'S_CHARS'),
        extractConst(content, 'OST_COMPOSERS'),
        extractFunction(content, 'normalizeStr'),
        extractFunction(content, 'cleanEditionTags'),
        extractFunction(content, 'cleanTrackQuery'),
        extractFunction(content, 'scoreTrackCandidate'),
        'return { normalizeStr, cleanEditionTags, cleanTrackQuery, scoreTrackCandidate, OST_COMPOSERS };',
    ].join('\n')
);
const LIB = libFactory();

// directLinkDb / customUrlDb / initialDefaultPlaylists
const directLinkDb = new Function(extractConst(content, 'directLinkDb') + 'return directLinkDb;')();
const initialDefaultPlaylists = new Function(extractConst(content, 'initialDefaultPlaylists') + 'return initialDefaultPlaylists;')();

// ---------------------------------------------------------------- 测试曲目清单
const testSongs = [];
const seen = new Set();
function addSong(title, artist, tag) {
    const key = (title + '||' + (artist || '')).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    testSongs.push({ title, artist: artist || '', tag });
}

// ① 出厂歌单（用户偏好主集）
for (const pl of initialDefaultPlaylists) {
    if (pl.category.startsWith('★') || pl.category.startsWith('🕒')) continue;
    for (const s of pl.songs) addSong(s.title, s.artist, 'playlist:' + pl.category);
}
// ② directLinkDb 键（历史精选，含 "- " 复合键拆分）
for (const key of Object.keys(directLinkDb)) {
    if (key.includes(' - ')) {
        const [t, a] = key.split(' - ');
        addSong(t.trim(), a.trim(), 'directdb');
    } else {
        addSong(key, '', 'directdb');
    }
}
// ③ 压力清单：偏好曲风经典 + 网易云 VIP 重度曲目
const STRESS = [
    // 久石让
    ['One Summer\'s Day', '久石让'], ['Merry-Go-Round', '久石让'], ['Summer', '久石让'],
    ['The Wind Forest', '久石让'], ['A Town with an Ocean View', '久石让'],
    // Hans Zimmer
    ['Time', 'Hans Zimmer'], ['Stay', 'Hans Zimmer'], ['No Time for Caution', 'Hans Zimmer'],
    ['Paul\'s Dream', 'Hans Zimmer'],
    // 泽野弘之 / 山本康太
    ['XL-TT', '泽野弘之'], ['Perfect Time', '泽野弘之'], ['Ashes on the Fire', 'Kohta Yamamoto'],
    // 梶浦由记
    ['Credens justitiam', '梶浦由记'], ['Sis puella magica!', '梶浦由记'], ['nowhere', '梶浦由记'],
    // 菅野洋子
    ['Dance of Curse', '菅野洋子'], ['Aoi Hitomi', '菅野洋子'],
    // 植松伸夫 / 游戏OST
    ['Aerith\'s Theme', '植松伸夫'], ['To Zanarkand', '植松伸夫'],
    ['Gwyn, Lord of Cinder', 'Motoi Sakuraba'], ['Theme of Laura', '山冈晃'],
    ['Gerudo Valley', '近藤浩治'],
    // 高梨康治
    ['Sadness and Sorrow', '高梨康治'], ['Girei', '高梨康治'],
    // Evan Call
    ['The Auto-Memory Doll', 'Evan Call'],
    // Outer Wilds / Disco Elysium
    ['Outer Wilds', 'Andrew Prahlow'], ['The Sun Station', 'Andrew Prahlow'],
    ['The Smallest Church in Saint-Saëns', 'British Sea Power'], ['The Sacred and The Profane', 'British Sea Power'],
    // 三亩地
    ['雾里', '三亩地'],
    // 古典/1920s爵士（克苏鲁歌单延伸）
    ['Nocturne op. 9 No. 2', 'Chopin'], ['La Campanella', 'Liszt'], ['Maple Leaf Rag', 'Scott Joplin'],
];
for (const [t, a] of STRESS) addSong(t, a, 'stress');

// ---------------------------------------------------------------- 复刻线上解析链
const gds = 'https://music-api.gdstudio.xyz/api.php';

async function apiSearch(kw, source) {
    const url = `${gds}?types=search&source=${source}&name=${encodeURIComponent(kw)}&count=5&pages=1`;
    await sleep(REQ_DELAY);
    const data = await fetchJson(url);
    return Array.isArray(data) ? data : [];
}

async function apiUrl(source, id) {
    const url = `${gds}?types=url&source=${source}&id=${id}&br=320`;
    await sleep(REQ_DELAY);
    return fetchJson(url);
}

// 复刻 fetchDirectUrl：返回 {url} 或 {fail: '无url'|'时长不合格:<est>s'|'api错误'}
async function probeDirectUrl(source, id) {
    const data = await apiUrl(source, id);
    if (data.__error) return { fail: 'api错误:' + data.__error };
    if (data && data.url) {
        if (data.size && data.br) {
            const estDur = data.size / ((data.br * 1000) / 8);
            if (estDur < 55 || estDur > 1200) return { fail: `时长不合格:${Math.round(estDur)}s`, size: data.size, br: data.br };
        }
        return { url: data.url, size: data.size, br: data.br };
    }
    return { fail: '无url' };
}

// ---------------------------------------------------------------- 单曲探测
async function probeSong(song) {
    const result = {
        title: song.title, artist: song.artist, tag: song.tag,
        directDb: null,           // {hit:bool, viaCorsproxy, urlOk, detail}
        sources: {},              // 每源：{searchCount, maxScore, urlOk, detail}
        resolved: false, resolvedVia: null,
        failStage: null,          // NO_RESULTS / SCORE_FILTER / URL_FAIL / null
    };

    const fullKey = song.artist ? `${song.title} - ${song.artist}` : song.title;
    const trackId = directLinkDb[song.title] || directLinkDb[fullKey]
        || directLinkDb[LIB.normalizeStr(song.title)] || directLinkDb[LIB.normalizeStr(fullKey)];

    // ① directLinkDb 分支（生产环境恒走 corsproxy.io，此处两种都测）
    if (trackId) {
        const direct = await probeDirectUrl('netease', trackId);
        result.directDb = { hit: true, id: trackId, direct: direct.url ? 'ok' : direct.fail };
        if (direct.url) {
            result.resolved = true;
            result.resolvedVia = 'directLinkDb';
            return result;
        }
    } else {
        result.directDb = { hit: false };
    }

    // ② 五源检索（复刻 searchAndResolveBestTrack）
    const cq = LIB.cleanTrackQuery(song.title, song.artist);
    const searchQuery = cq.fullTitle;
    const candidatePool = [];

    for (const src of SOURCES) {
        let results = [];
        let usedKw = null;
        try {
            results = await apiSearch(searchQuery, src);
            usedKw = searchQuery;
            if (results.length === 0 && cq.aliasFullTitle && cq.aliasFullTitle !== searchQuery) {
                results = await apiSearch(cq.aliasFullTitle, src); usedKw = cq.aliasFullTitle;
            }
            if (results.length === 0 && cq.title !== searchQuery) {
                results = await apiSearch(cq.title, src); usedKw = cq.title;
            }
            if (results.length === 0 && cq.subTitle) {
                results = await apiSearch(cq.subTitle, src); usedKw = cq.subTitle;
            }
        } catch (e) { /* 记为空 */ }

        let maxScore = null;
        for (const track of results) {
            const score = LIB.scoreTrackCandidate(track, cq);
            if (maxScore === null || score > maxScore) maxScore = score;
            if (score > 30) candidatePool.push({ ...track, _score: score, source: src });
        }
        result.sources[src] = {
            searchCount: results.length,
            usedKw: results.length > 0 ? usedKw : null,
            maxScore,
            poolCount: candidatePool.filter(c => c.source === src).length,
        };
    }

    candidatePool.sort((a, b) => b._score - a._score);
    result.poolSize = candidatePool.length;

    for (let i = 0; i < Math.min(candidatePool.length, MAX_URL_CANDIDATES); i++) {
        const cand = candidatePool[i];
        const r = await probeDirectUrl(cand.source, cand.id);
        result.sources[cand.source].triedUrl = true;
        if (r.url) {
            result.resolved = true;
            result.resolvedVia = `search:${cand.source}`;
            result.resolvedTrack = { name: cand.name, artist: cand.artist, score: cand._score };
            return result;
        } else {
            result.sources[cand.source].urlFail = (result.sources[cand.source].urlFail || []).concat(r.fail);
        }
    }

    // 失败归因
    const allCounts = Object.values(result.sources).map(s => s.searchCount);
    if (allCounts.every(c => c === 0)) result.failStage = 'NO_RESULTS';
    else if (candidatePool.length === 0) result.failStage = 'SCORE_FILTER';
    else result.failStage = 'URL_FAIL';
    return result;
}

// ---------------------------------------------------------------- 主流程
const quick = process.argv.includes('--quick');
const filterIdx = process.argv.indexOf('--filter');
const filterRe = filterIdx !== -1 ? new RegExp(process.argv[filterIdx + 1], 'i') : null;
let songs = testSongs;
if (quick) songs = songs.filter(s => s.tag !== 'stress');
if (filterRe) songs = songs.filter(s => filterRe.test(s.title) || filterRe.test(s.artist || ''));

console.log(`共 ${songs.length} 首待测${quick ? '（quick模式，跳过压力清单）' : ''}${filterRe ? '（filter: ' + filterRe.source + '）' : ''}`);
const results = [];
let lastLog = Date.now();

for (let i = 0; i < songs.length; i++) {
    const r = await probeSong(songs[i]);
    results.push(r);
    if (Date.now() - lastLog > 3000 || i === songs.length - 1) {
        lastLog = Date.now();
        const ok = results.filter(x => x.resolved).length;
        console.log(`[${i + 1}/${songs.length}] 命中 ${ok}/${results.length} | ${r.resolved ? '✓' : '✗ ' + r.failStage} ${r.title}`);
    }
}

// ---------------------------------------------------------------- 报告
const resolved = results.filter(r => r.resolved);
const failed = results.filter(r => !r.resolved);
const byTag = {};
for (const r of results) {
    const t = r.tag.split(':')[0];
    byTag[t] = byTag[t] || { total: 0, ok: 0 };
    byTag[t].total++; if (r.resolved) byTag[t].ok++;
}
const bySource = {};
for (const r of resolved) {
    const s = r.resolvedVia.startsWith('search:') ? r.resolvedVia.slice(7) : r.resolvedVia;
    bySource[s] = (bySource[s] || 0) + 1;
}

let md = `# AiRadio 五源命中率诊断报告\n\n`;
md += `生成时间：${new Date().toLocaleString('zh-CN')}  \n`;
md += `测试总数：**${results.length}**，命中 **${resolved.length}**（${(resolved.length / results.length * 100).toFixed(1)}%），失败 **${failed.length}**\n\n`;
md += `## 分组命中\n\n| 分组 | 命中/总数 |\n|---|---|\n`;
for (const [t, v] of Object.entries(byTag)) md += `| ${t} | ${v.ok}/${v.total} |\n`;
md += `\n## 命中来源分布\n\n| 来源 | 数量 |\n|---|---|\n`;
for (const [s, n] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) md += `| ${s} | ${n} |\n`;
md += `\n## 失败明细（${failed.length} 首）\n\n`;
md += `| 歌曲 | 歌手 | 分组 | 失败环节 | 各源搜索命中(最高分) |\n|---|---|---|---|---|\n`;
for (const r of failed) {
    const srcInfo = SOURCES.map(s => {
        const v = r.sources[s];
        return `${s.slice(0, 2)}:${v.searchCount}${v.maxScore !== null ? '(' + v.maxScore + ')' : ''}`;
    }).join(' ');
    md += `| ${r.title} | ${r.artist || '—'} | ${r.tag} | ${r.failStage} | ${srcInfo} |\n`;
}
md += `\n## 全部结果\n\n| 歌曲 | 歌手 | 分组 | 结果 | 途经 |\n|---|---|---|---|---|\n`;
for (const r of results) {
    md += `| ${r.title} | ${r.artist || '—'} | ${r.tag} | ${r.resolved ? '✓' : '✗ ' + r.failStage} | ${r.resolvedVia || ''} |\n`;
}

fs.writeFileSync(path.join(ROOT, 'tools', 'hitrate-report.json'), JSON.stringify(results, null, 1));
fs.writeFileSync(path.join(ROOT, 'tools', 'hitrate-report.md'), md);
console.log(`\n完成：命中 ${resolved.length}/${results.length}`);
console.log('报告: tools/hitrate-report.md / hitrate-report.json');
