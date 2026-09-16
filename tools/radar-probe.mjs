// 雷达触发回归探针：从主 JSON content 零漂移抽取雷达模块源码，
// 在 stub 环境中模拟酒馆事件序列，验证自动播放触发的关键场景。
// 用法：node tools/radar-probe.mjs
import fs from 'node:fs';

const CONTENT = JSON.parse(fs.readFileSync(new URL('../酒馆助手脚本-电台直链版.json', import.meta.url), 'utf8')).content;

// === 抽取雷达模块（从 lastHandledMessageId 声明到事件注册 try-catch 收尾） ===
const START = '    let lastHandledMessageId = null;';
const END = "    } catch(e) { console.error('[太空电台·雷达] 事件注册失败:', e); }";
const s = CONTENT.indexOf(START);
const e = CONTENT.indexOf(END);
if (s === -1 || e === -1 || e < s) { console.error('❌ 雷达模块标记未找到'); process.exit(1); }
const RADAR_SRC = CONTENT.slice(s, e + END.length);

const EVENTS = {
  MESSAGE_SWIPED: 'message_swiped', MESSAGE_UPDATED: 'message_updated',
  CHARACTER_MESSAGE_RENDERED: 'character_message_rendered', MESSAGE_RECEIVED: 'message_received',
  CHAT_CHANGED: 'chat_id_changed', GENERATION_STARTED: 'generation_started',
  GENERATION_STOPPED: 'generation_stopped', GENERATION_ENDED: 'generation_ended',
};
const EVENTS_LEGACY = { ...EVENTS }; delete EVENTS_LEGACY.GENERATION_STARTED; delete EVENTS_LEGACY.GENERATION_ENDED; delete EVENTS_LEGACY.GENERATION_STOPPED;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const ALL_TIMERS = new Set();   // 探针收尾统一清场，避免悬挂的自愈定时器拖住进程

// 实例化一个雷达：返回事件发射器与调用记录
function makeRadar({ djResult = true, messages = {}, events = EVENTS, now429 = false } = {}) {
  const state = {
    djCalls: 0, playDirectCalls: [], listeners: {}, delays: [],
    db: { ...messages }, // { id: '正文' }，-1/最新楼由最后一条动态推断
  };
  const latestId = () => Math.max(...Object.keys(state.db).map(Number));
  const env = {
    getDjSettings: () => ({ autoTrigger: true, apiKey: 'test-key', debugMode: false }),
    playDirect: (t, a) => { state.playDirectCalls.push([t, a]); },
    triggerAiDjDecision: async () => { state.djCalls++; return djResult; },
    getChatMessages: (id) => {
      const n = Number(id);
      const key = state.db[n] !== undefined ? n : (state.db[-1] !== undefined ? -1 : latestId());
      if (state.db[key] === undefined) return [];
      return [{ message_id: key, id: key, role: 'assistant', is_user: false, message: state.db[key] }];
    },
    eventOn: (name, fn) => { (state.listeners[name] ??= []).push(fn); },
    tavern_events: events,
    window: { parent: {} },
    console,
    djLast429At: now429 ? Date.now() : 0,
    // 自愈重试时基注入：真实 8s/20s/429 避让延迟截短为 1.6s（1500ms 防抖保持原速），
    // 同时记录请求延迟原值，供 429 避让与 8s→20s 升级断言
    setTimeout: (fn, ms) => { state.delays.push(ms); const h = setTimeout(fn, Math.min(ms, 1600)); ALL_TIMERS.add(h); return h; },
    clearTimeout: (h) => { clearTimeout(h); ALL_TIMERS.delete(h); },
  };
  const factory = new Function(...Object.keys(env), RADAR_SRC);
  factory(...Object.values(env));
  return {
    state,
    setMsg: (id, text) => { state.db[id] = text; },
    emit: (evName, ...args) => { (state.listeners[EVENTS[evName]] || []).forEach(fn => fn(...args)); },
  };
}

let pass = 0, fail = 0;
function assert(cond, label) {
  if (cond) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.log(`  ✗ ${label}`); }
}

// 场景 A：流式竞态——生成中渲染事件不触发 AI DJ、不锁楼；生成结束才决策一次
{
  console.log('\n[场景 A] 流式竞态：生成中不决策，GENERATION_ENDED 后正文定稿才触发');
  const r = makeRadar({ messages: { 5: '（半截正文，指令还没流出来' } });
  r.emit('GENERATION_STARTED', 'normal', {}, false);
  r.emit('CHARACTER_MESSAGE_RENDERED', 5);
  await sleep(2000);
  assert(r.state.djCalls === 0, `生成中渲染事件不触发 AI DJ（实际 ${r.state.djCalls} 次）`);
  r.setMsg(5, '这是完整的剧情正文，没有嵌入选歌指令。');
  r.emit('GENERATION_ENDED', 5);
  await sleep(2000);
  assert(r.state.djCalls === 1, `生成结束后触发一次 AI DJ（实际 ${r.state.djCalls} 次）`);
  r.emit('MESSAGE_RECEIVED', 5);
  await sleep(2000);
  assert(r.state.djCalls === 1, `后续重复事件被楼层锁拦住（实际 ${r.state.djCalls} 次）`);
}

// 场景 B：失败清锁重试——决策失败后同一楼允许后续事件重试（事件重试与自愈定时器并入同一防抖）
{
  console.log('\n[场景 B] 决策失败清锁，同楼可重试');
  const r = makeRadar({ djResult: false, messages: { 5: '正文' } });
  r.emit('GENERATION_ENDED', 5);
  await sleep(2000);
  assert(r.state.djCalls === 1, `首次触发（实际 ${r.state.djCalls} 次）`);
  r.emit('MESSAGE_RECEIVED', 5);
  await sleep(4400);   // 截短后的自愈定时器（1.6s）会重置事件防抖，多等一个防抖周期
  assert(r.state.djCalls === 2, `失败清锁后同楼重试成功（实际 ${r.state.djCalls} 次）`);
}

// 场景 C：quiet/dryRun 后台生成过滤——其他插件后台请求不触发 AI DJ
{
  console.log('\n[场景 C] quiet/dryRun 后台生成不触发');
  const r = makeRadar({ messages: { 5: '正文' } });
  r.emit('GENERATION_STARTED', 'quiet', { quiet_prompt: '其他插件的规划请求' }, false);
  r.emit('GENERATION_ENDED', 5);
  r.emit('MESSAGE_RECEIVED', 5);
  await sleep(2000);
  assert(r.state.djCalls === 0, `quiet 窗口内零触发（实际 ${r.state.djCalls} 次）`);
}

// 场景 D：直播指令幂等——同楼同指令只播一次；流式中途指令也可即时播放
{
  console.log('\n[场景 D] [点一首歌] 指令：生成中可即时播放且幂等去重');
  const r = makeRadar({ messages: { 5: '剧情…… [点一首歌: Echoes - Artist] ……收尾' } });
  r.emit('GENERATION_STARTED', 'normal', {}, false);
  r.emit('CHARACTER_MESSAGE_RENDERED', 5);
  await sleep(2000);
  assert(r.state.playDirectCalls.length === 1 && r.state.playDirectCalls[0][0] === 'Echoes',
    `生成中扫到完整指令立即播放（实际 ${JSON.stringify(r.state.playDirectCalls)}）`);
  assert(r.state.djCalls === 0, `有指令时不走 AI DJ（实际 ${r.state.djCalls} 次）`);
  r.emit('GENERATION_ENDED', 5);
  r.emit('MESSAGE_RECEIVED', 5);
  await sleep(2000);
  assert(r.state.playDirectCalls.length === 1, `重复事件不重播同一指令（实际 ${r.state.playDirectCalls.length} 次）`);
}

// 场景 E：CHAT_CHANGED 重置锁——换聊天后同号楼层不误拦
{
  console.log('\n[场景 E] CHAT_CHANGED 重置楼层锁');
  const r = makeRadar({ messages: { 5: '正文' } });
  r.emit('GENERATION_ENDED', 5);
  await sleep(2000);
  assert(r.state.djCalls === 1, `首个聊天触发一次（实际 ${r.state.djCalls} 次）`);
  r.emit('CHAT_CHANGED', 'chatB.json');
  r.setMsg(5, '新聊天的第 5 楼正文');
  r.emit('MESSAGE_RECEIVED', 5);
  await sleep(2000);
  assert(r.state.djCalls === 2, `换聊天后同号楼层重新触发（实际 ${r.state.djCalls} 次）`);
}

// 场景 F：旧环境降级——无 GENERATION 事件时维持旧版行为（渲染事件直接触发）
{
  console.log('\n[场景 F] 旧环境（无 GENERATION 事件）降级为直接触发');
  const r = makeRadar({ messages: { 5: '正文' }, events: EVENTS_LEGACY });
  r.emit('CHARACTER_MESSAGE_RENDERED', 5);
  await sleep(2000);
  assert(r.state.djCalls === 1, `无门控环境下渲染事件直接触发（实际 ${r.state.djCalls} 次）`);
}

// 场景 G：GENERATION_ENDED 的酒馆真实载荷是 chat.length（比真实楼层号大 1）——
// 锁键必须以实际取到的楼层为准，否则填表/翻译等写楼插件带真实 id 的二次事件
// （MESSAGE_UPDATED/CHARACTER_MESSAGE_RENDERED）会算出不同锁键，同楼重复决策把正在播的歌顶掉
{
  console.log('\n[场景 G] chat.length 越界载荷：锁键与真实楼层事件一致');
  const r = makeRadar({ messages: { 5: '正文' } });
  r.emit('GENERATION_ENDED', 6);   // 酒馆载荷：chat.length，最新楼实际是 5
  await sleep(2000);
  assert(r.state.djCalls === 1, `越界载荷回退最新楼并决策一次（实际 ${r.state.djCalls} 次）`);
  r.emit('MESSAGE_UPDATED', 5);    // 写楼插件的二次事件：真实楼层 id
  await sleep(2000);
  assert(r.state.djCalls === 1, `锁键一致，写楼事件不再同楼重复决策（实际 ${r.state.djCalls} 次）`);
}

// 场景 H：决策失败且无后续事件——自愈定时器主动补试，8s→20s 升级，同楼最多两次后停
// （探针时基：8s/20s 截短为 1.6s，1500ms 防抖保持原速；delays 记录的是截短前的原值）
{
  console.log('\n[场景 H] 失败自愈：无后续事件也主动补试，最多两次');
  const r = makeRadar({ djResult: false, messages: { 5: '正文' } });
  r.emit('GENERATION_ENDED', 5);
  await sleep(2000);
  assert(r.state.djCalls === 1, `首次决策失败（实际 ${r.state.djCalls} 次）`);
  await sleep(3400);   // 1.6s 自愈定时 + 1.5s 防抖
  assert(r.state.djCalls === 2, `自愈第一次补试（实际 ${r.state.djCalls} 次）`);
  assert(r.state.delays.includes(8000), `首次补试延迟 8s（实际 ${JSON.stringify(r.state.delays)}）`);
  await sleep(3400);
  assert(r.state.djCalls === 3, `自愈第二次补试（实际 ${r.state.djCalls} 次）`);
  assert(r.state.delays.includes(20000), `第二次补试延迟升级 20s（实际 ${JSON.stringify(r.state.delays)}）`);
  await sleep(3400);
  assert(r.state.djCalls === 3, `两次补试后停止，不无限轮询（实际 ${r.state.djCalls} 次）`);
}

// 场景 I：429 限流避让——重试延迟推到限流点 15s 之后，避开其他插件填表的并发窗口
{
  console.log('\n[场景 I] 429 限流：自愈重试避让 15s');
  const r = makeRadar({ djResult: false, messages: { 5: '正文' }, now429: true });
  r.emit('GENERATION_ENDED', 5);
  await sleep(2000);
  assert(r.state.djCalls === 1, `首次决策失败（实际 ${r.state.djCalls} 次）`);
  const d = r.state.delays[r.state.delays.length - 1];
  assert(d >= 12000, `重试延迟避让到限流点+15s（实际请求延迟 ${d}ms）`);
}

for (const h of ALL_TIMERS) clearTimeout(h);
ALL_TIMERS.clear();
console.log(`\n==== 雷达回归结果：通过 ${pass} / ${pass + fail} ====`);
process.exitCode = fail ? 1 : 0;
