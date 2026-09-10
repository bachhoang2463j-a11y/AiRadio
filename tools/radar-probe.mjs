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

// 实例化一个雷达：返回事件发射器与调用记录
function makeRadar({ djResult = true, messages = {}, events = EVENTS } = {}) {
  const state = {
    djCalls: 0, playDirectCalls: [], listeners: {},
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

// 场景 B：失败清锁重试——决策失败后同一楼允许后续事件重试
{
  console.log('\n[场景 B] 决策失败清锁，同楼可重试');
  const r = makeRadar({ djResult: false, messages: { 5: '正文' } });
  r.emit('GENERATION_ENDED', 5);
  await sleep(2000);
  assert(r.state.djCalls === 1, `首次触发（实际 ${r.state.djCalls} 次）`);
  r.emit('MESSAGE_RECEIVED', 5);
  await sleep(2000);
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

console.log(`\n==== 雷达回归结果：通过 ${pass} / ${pass + fail} ====`);
process.exitCode = fail ? 1 : 0;
