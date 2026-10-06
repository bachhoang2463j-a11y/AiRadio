// ==UserScript==
// @name         天式号·太空电台 (酒馆原生API拦截+自定义直链极致容错版)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  全功能太空电台：独立Sidecar AI DJ选歌引擎、右上角API设置面板、楼层深度自定义(默认0层极速)、提示词Debug模式、覆盖与合并导入双模式、暗金矢量主题、歌曲收藏与跨频段移动、原声MP3导出、1-20分钟硬核时长过滤与连字符双态解析
// @author       秋青子
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    // 移除旧的实例防重复
    $('#cr-app, #celestial-radio-css, #celestial-radio-font').remove();

    // === 核心数据与状态 ===

    const customUrlDb = {};

    const directLinkDb = {
        "(x2+y2−1)3 = x2y3": "3314261339",
        "Sleeping Stardust": "1888748780",
        "4.5 Billion Years Old": "29305226",
        "Travelers' encore": "1879098277",
        "Aurora XV 54": "1934156360",
        "Eyes of Wonder": "1324205028",
        "Beyond the Stars": "1876703587",
        "Cornfield Chase": "29734857",
        "Cornfield Chase（Piano Concerto Ver)": "29734857",
        "Moon（Sleeping at Last）": "470601660",
        "Dance For Me Wallis": "1998284878",
        "Echoes of the Eye": "1879098276",
        "城南花已开": "468176711",
        "green to blue": "2067668284",
        "Fibonacci - Grand Plan Wireless": "3314261322",
        "A Light Above Descending": "26181020",
        "Fire Escape In The Sea": "1876755251",
        "Whirling-In-Rags, 8 PM": "2006472579",
        "Let's Go Out Tonight": "21878826",
        "Kingdom Of Heaven": "549383832",
        "Her Eyes": "2613352711",
        "Bed For Two": "1417347985",
        "Room 907": "2060175765",
        "Forbidden Fruit": "1959799334",
        "Fear Brought Me This Far": "2116382387",
        "YouSeeBIGGIRL/T:T": "482633119",
        "youseebiggirl": "482633119",
        "ət'aek 0N tάɪtn": "26562717",
        "at'aek ON taitn": "26562717",
        "attack on titan": "26562717",
        "立body!机st": "26562719",
        "立body机st": "26562719",
        "立body機motion": "26562719",
        "立体机动": "26562719",
        "Vogel im Käfig": "26562723",
        "Vogel im Kafig": "26562723",
        "笼中鸟": "26562723",
        "Call of silence": "482636090",
        "Call of Silence": "482636090",
        "EMA": "26562721",
        "E・M・A": "26562721",
        "凸】♀】♂】←巨人": "26562725",
        "Barricades": "482636088",
        "attack音D": "482633120",
        "The Reluctant Heroes": "26562718",
        "eye-water": "26562716",
        "bauklötze": "26562724",
        "Aoi Hitomi": "592893",
        "青い瞳": "592893"
    };

    const initialDefaultPlaylists = [
        {
            category: "★ 我的收藏",
            songs: []
        },
        {
            category: "🕒 最近播放",
            songs: []
        },
        {
            category: "远征33·幽光秘境",
            songs: [
                { title: "World Map - Taking Down the Paintress", artist: "Lorien Testard" },
                { title: "Monoco's Station - Grandis Refuge", artist: "Lorien Testard" },
                { title: "Monoco's Station - Tics Tacs", artist: "Lorien Testard" }
            ]
        },
        {
            category: "克苏鲁·复古秘境(1920s)",
            songs: [
                { title: "Rhapsody in Blue", artist: "George Gershwin" },
                { title: "Dark Was the Night, Cold Was the Ground", artist: "Blind Willie Johnson" },
                { title: "Danse Macabre", artist: "Saint-Saëns" },
                { title: "Gymnopédie No. 1", artist: "Erik Satie" },
                { title: "St. Louis Blues", artist: "Bessie Smith" },
                { title: "Clair de Lune", artist: "Claude Debussy" }
            ]
        },
        {
            category: "进击的巨人·燃爆战曲",
            songs: [
                { title: "YouSeeBIGGIRL/T:T", artist: "泽野弘之" },
                { title: "ət'aek 0N tάɪtn", artist: "泽野弘之" },
                { title: "立body!机st", artist: "泽野弘之" },
                { title: "Vogel im Käfig", artist: "泽野弘之" },
                { title: "Call of silence", artist: "泽野弘之" },
                { title: "EMA", artist: "泽野弘之" },
                { title: "凸】♀】♂】←巨人", artist: "泽野弘之" },
                { title: "The Reluctant Heroes", artist: "泽野弘之" },
                { title: "bauklötze", artist: "泽野弘之" }
            ]
        },
        {
            category: "日常氛围",
            songs: [
                { title: "Fear Brought Me This Far", artist: "Evan Call" },
                { title: "陨落 伴奏", artist: "鲁四月" },
                { title: "Time to go home", artist: "jacoo" },
                { title: "Nocturne in Paris", artist: "" },
                { title: "Sleeping Stardust", artist: "" },
                { title: "4.5 Billion Years Old", artist: "Alan Silvestri" },
                { title: "The Bear and the Mountain", artist: "" },
                { title: "Cornfield Chase", artist: "" },
                { title: "Travelers' encore", artist: "" }
            ]
        },
        {
            category: "遭遇危机",
            songs: [
                { title: "Into Orbit", artist: "Audiofire Studios" },
                { title: "Aurora XV 54", artist: "" },
                { title: "Eyes of Wonder", artist: "" },
                { title: "Beyond the Stars", artist: "Cristian Onofreiciuc" },
                { title: "Cornfield Chase（Piano Concerto Ver)", artist: "" },
                { title: "Moon（Sleeping at Last）", artist: "" },
                { title: "Dance For Me Wallis", artist: "" },
                { title: "Echoes of the Eye", artist: "" }
            ]
        },
        {
            category: "深刻倾诉",
            songs: [
                { title: "Merry Christmas Mr. Lawrence", artist: "" },
                { title: "III (Find Yourself)", artist: "" },
                { title: "城南花已开", artist: "" },
                { title: "Call of silence（钢琴版）", artist: "" },
                { title: "破旧世界", artist: "" },
                { title: "green to blue", artist: "" },
                { title: "η（α·Pav）", artist: "" },
                { title: "A Light Above Descending", artist: "Sea Power" },
                { title: "Fire Escape In The Sea", artist: "Sea Power" },
                { title: "Whirling-In-Rags, 8 PM", artist: "Sea Power" }
            ]
        },
        {
            category: "私密频段",
            songs: [
                { title: "Let's Go Out Tonight", artist: "The Blue Nile" },
                { title: "Kingdom Of Heaven", artist: "13th Floor Elevators" },
                { title: "Her Eyes", artist: "Charlie Jeer" },
                { title: "Bed For Two", artist: "1LKay" },
                { title: "Room 907", artist: "BUBBLE TEA AND CIGARETTES" },
                { title: "Forbidden Fruit", artist: "Monodrone" }
            ]
        }
    ];

    let bgmPlaylists = [];

    function loadPlaylists() {
        let saved = localStorage.getItem('celestial_all_playlists');
        if (saved) {
            try {
                let parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    if (!parsed.some(p => p.category === '★ 我的收藏')) {
                        parsed.unshift({ category: '★ 我的收藏', songs: [], prompt: '', promptEnabled: false });
                    }
                    if (!parsed.some(p => p.category === '🕒 最近播放')) {
                        parsed.splice(1, 0, { category: '🕒 最近播放', songs: [], prompt: '', promptEnabled: false });
                    }
                    // 歌单提示词字段迁移 & 本地直链真实 URL 迁移
                    let localUrls = JSON.parse(localStorage.getItem('celestial_custom_urls') || '{}');
                    parsed.forEach(p => {
                        if (typeof p.prompt !== 'string') p.prompt = '';
                        if (typeof p.promptEnabled !== 'boolean') p.promptEnabled = false;
                        if (Array.isArray(p.songs)) {
                            p.songs.forEach(s => {
                                if (s.artist === '[本地直链解析]' || !s.artist) {
                                    if (localUrls[s.title]) s.artist = localUrls[s.title];
                                    else if (customUrlDb[s.title]) s.artist = customUrlDb[s.title];
                                }
                            });
                        }
                    });
                    bgmPlaylists = parsed;
            return;
        }
            } catch (e) {}
        }
        bgmPlaylists = JSON.parse(JSON.stringify(initialDefaultPlaylists));
        // 为出厂列表补提示词字段
        bgmPlaylists.forEach(p => {
            if (typeof p.prompt !== 'string') p.prompt = '';
            if (typeof p.promptEnabled !== 'boolean') p.promptEnabled = false;
        });
        savePlaylists();
    }

    function getHistoryLimit() {
        let v = parseInt(localStorage.getItem('cr_history_limit') || '10', 10);
        return (isNaN(v) || v < 1) ? 10 : v;
    }

    function recordPlayHistory(title, artist) {
        if (!title || title === '频段静默' || title === '直连锁定中...') return;
        let histPl = bgmPlaylists.find(p => p.category === '🕒 最近播放');
        if (!histPl) {
            histPl = { category: '🕒 最近播放', songs: [], prompt: '', promptEnabled: false };
            bgmPlaylists.splice(1, 0, histPl);
        }
        let normT = normalizeStr(title);
        let normA = normalizeStr(artist || '');
        let existIdx = histPl.songs.findIndex(s => normalizeStr(s.title) === normT && normalizeStr(s.artist || '') === normA);
        if (existIdx !== -1) {
            histPl.songs.splice(existIdx, 1);
        }
        histPl.songs.unshift({ title: title.trim(), artist: (artist || '').trim() });
        let limit = getHistoryLimit();
        if (histPl.songs.length > limit) {
            histPl.songs = histPl.songs.slice(0, limit);
        }
        savePlaylists();
        renderPlaylists();
    }

    function savePlaylists() {
        localStorage.setItem('celestial_all_playlists', JSON.stringify(bgmPlaylists));
    }
    loadPlaylists();


    function applyGlassEffect(on) {
        $ctn.toggleClass('no-glass', !on);
    }


    const T_CHARS = "愛礙奧壩罷擺敗頒辦絆幫綁鎊謗剝飽寶報鮑輩貝鋇狽備憊繃筆畢斃幣閉邊編貶變辯辮標飈賓濱繽瀕餅撥鉢鉑駁卜補財參慘蠶燦倉蒼艙測策層詫攙摻蟬饞讒纏產闡顫倀長腸嘗償廠暢鈔車徹塵陳襯撐稱懲誠騁癡遲齒恥沖蟲寵疇躊醜籌齣芻處礎觸辭詞賜聰蔥從叢湊竄錯達帶貸擔單鄲撣膽導燈鄧敵滌遞締點墊電澱釣調諜疊頂訂釘東動棟凍鬥犢獨讀賭鍍鍛斷緞兌隊對噸頓鈍奪鵝額惡餓兒爾餌貳發罰閥煩繁飯範販飛廢費紛墳奮憤糞豐風楓瘋鋒鳳膚膚輻撫輔賦複負婦蓋幹趕岡鋼剛崗綱閣個給鞏貢溝構購夠轂顧掛關觀館慣貫廣廣獷規歸龜櫃貴國過漢號賀橫轟紅宏轟後護壺滬華畫劃話懷壞歡環還緩換喚瘓煥渙黃謊揮輝彙會匯繪毀機雞跡積績擊激及級濟計記際繼紀夾莢頰賈鉀價駕監堅箋間艱揀檢鹼減薦鑒鍵將獎槳講醬驕膠澆矯腳攪繳絞較階節傑結潔緊錦僅進燼盡驚莖睛經頸靜鏡徑痙競凈糾舊駒舉劇據巨懼捲絕覺決鈞軍駿開凱鄶鄺擴闊臘蠟蘭攔欄藍籃覽懶纜爛濫撈勞樂類淚釐離裡鯉禮麗厲勵壢歷曆煉練戀殮鏈涼糧兩輛諒療遼繚獵臨鄰鱗凜賃齡貫";
    const S_CHARS = "爱碍奥坝败颁办绊帮帮绑镑谤剥饱宝报鲍辈贝钡狈备惫绷笔毕毙币闭边编贬变辩辫标飙宾滨缤濒饼拨钵铂驳卜补财参惨蚕灿仓苍舱测策层诧搀掺蝉馋谗缠产阐颤伥长肠尝偿厂畅钞车彻尘陈衬撑称惩诚骋痴迟齿耻冲虫宠畴踌丑筹出刍处础触辞词赐聪葱从丛凑窜错达带贷担单郸掸胆导灯邓敌涤缔缔点垫电淀钓调谍叠顶订钉东动栋冻斗犊独读赌镀锻断缎兑队对吨顿钝夺鹅额恶饿儿尔饵贰发罚阀烦繁饭范贩飞废费纷坟奋愤粪丰风枫疯锋凤肤肤辐抚辅复负妇盖干赶岗钢刚岗纲阁个给巩贡沟构购够毂顾挂关观馆惯贯广广犷规归龟柜贵国过汉号贺横轰红宏轰后护壶沪华画划话怀坏欢环还缓换唤痪焕涣黄谎挥辉汇会汇绘毁机鸡迹积绩击激及级济计记际继纪夹荚颊贾钾价驾监坚笺间艰拣检碱减荐鉴键将奖桨讲酱骄胶浇矫脚搅缴绞较阶节杰结洁紧锦仅进烬尽惊茎睛经颈静径痉竞净纠旧驹举剧据巨惧卷绝觉决钧军骏开凯侩邝扩阔腊蜡兰拦栏蓝篮览懒缆烂滥捞劳乐类泪厘离里鲤礼丽厉励沥历历炼练恋殓链凉粮两辆谅辽缭猎临邻鳞凛赁龄贯";

    function normalizeStr(str) {
        if (!str) return '';
        let res = '';
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            const idx = T_CHARS.indexOf(char);
            res += (idx !== -1) ? S_CHARS[idx] : char;
        }

        const diacritics = {
            'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss',
            'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
            'á': 'a', 'à': 'a', 'â': 'a', 'å': 'a', 'ά': 'a',
            'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ɪ': 'i',
            'ó': 'o', 'ò': 'o', 'ô': 'o', 'ø': 'o',
            'ú': 'u', 'ù': 'u', 'û': 'u',
            'ə': 'a', 'æ': 'ae', '0': 'o', '1': 'i',
            '機': '机', '動': '动'
        };
        res = res.toLowerCase();
        for (let k in diacritics) {
            res = res.replaceAll(k, diacritics[k]);
        }
        return res.replace(/[\s\-_,.'’"“”（\(\)\[\]【】《》/:\!！？\?~★·]/g, '');
    }

    function cleanEditionTags(title) {
        if (!title) return '';
        return title.replace(/[\(\[\{（【](?:remaster(?:ed)?|mono|stereo|deluxe|version|edition|original\s*recording|19\d\d\s*recording|\d{4}\s*remaster).*?[\)\]\}）】]/gi, '').trim();
    }

    function cleanTrackQuery(rawTitle, rawArtist) {
        let title = (rawTitle || '').trim();
        let artist = (rawArtist || '').trim();

        title = title.replace(/^[\s《"“'‘【\[（(]+|[\s》"”'’】\]）)]+$/g, '').trim();
        artist = artist.replace(/^[\s《"“'‘【\[（(]+|[\s》"”'’】\]）)]+$/g, '').trim();

        let fullRawTitle = artist ? `${title} - ${artist}` : title;

        let isOstIntent = false;
        const ostRegex = /[\(\（\[【](?:tv|anime|ost|bgm|soundtrack|theme|插曲|主题曲|片头曲|片尾曲|原声|动画|角色歌).*?[\)\）\]】]/gi;
        if (ostRegex.test(title) || ostRegex.test(artist) || ostRegex.test(fullRawTitle)) {
            isOstIntent = true;
        }
        title = title.replace(ostRegex, '').trim();
        artist = artist.replace(ostRegex, '').trim();
        let fullTitle = fullRawTitle.replace(ostRegex, '').trim();

        let subTitle = '';
        let matchSub = title.match(/^(.+?)\s*[\(（](.+?)[\)）]$/);
        if (matchSub) {
            title = matchSub[1].trim();
            subTitle = matchSub[2].trim();
        }

        let aliasTitle = title.toLowerCase()
            .replaceAll('ə', 'a').replaceAll('ά', 'a').replaceAll('ɪ', 'i').replaceAll('0', 'o').replaceAll('ä', 'a')
            .replaceAll('立body!机st', '立body機motion').replaceAll('立body机st', '立body機motion');

        let aliasFullTitle = fullTitle.toLowerCase()
            .replaceAll('ə', 'a').replaceAll('ά', 'a').replaceAll('ɪ', 'i').replaceAll('0', 'o').replaceAll('ä', 'a')
            .replaceAll('立body!机st', '立body機motion').replaceAll('立body机st', '立body機motion');

        return { title, artist, fullTitle, aliasTitle, aliasFullTitle, subTitle, isOstIntent };
    }

    const PLAY_MODES = ['sequence', 'loop', 'list_random', 'shuffle_all'];
    const PLAY_MODE_LABELS = {
        'sequence': '顺序播放',
        'loop': '单曲循环',
        'list_random': '列表随机',
        'shuffle_all': '全库随机'
    };
    let savedPlayMode = localStorage.getItem('cr_play_mode');
    if (savedPlayMode === 'random') savedPlayMode = 'list_random';
    let playMode = (savedPlayMode && PLAY_MODES.includes(savedPlayMode)) ? savedPlayMode : 'sequence';
    let currentPlaylistIndex = -1; let currentSongIndex = -1; let isPlaying = false; let isLoading = false;

    function showPlayerToast(msg, duration = 2500) {
        let $toast = $('#cr-player-toast');
        if (!$toast.length) {
            $toast = $('<div id="cr-player-toast" class="cr-player-toast"></div>').appendTo('#cr-app');
        }
        $toast.html(msg).addClass('show');
        if ($toast.data('timer')) clearTimeout($toast.data('timer'));
        let t = setTimeout(() => {
            $toast.removeClass('show');
        }, duration);
        $toast.data('timer', t);
    }
    let currentPlayingTrackInfo = { title: '', artist: '' };
    let audioObj = document.createElement('audio');

    // === 独立音量初始化 ===
    let savedVol = localStorage.getItem('cr_player_volume');
    let currentVolume = (savedVol !== null && !isNaN(parseFloat(savedVol))) ? parseFloat(savedVol) : 0.8;
    if (currentVolume < 0) currentVolume = 0;
    if (currentVolume > 1) currentVolume = 1;
    audioObj.volume = currentVolume;
    let lastNonZeroVolume = currentVolume > 0 ? currentVolume : 0.8;

    // === CSS 样式 ===
    const styles = `
        <style id="celestial-radio-css">
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

        /* ===== 精工鎏金毛玻璃设计系统 ===== */
        #cr-app {
            --gold-primary: #C4A77D;
            --gold-light: #F5E6C8;
            --gold-bright: #FFF5DF;
            --gold-dim: #7D684A;
            --gold-glow: rgba(196, 167, 125, 0.45);
            --gold-border: rgba(196, 167, 125, 0.28);
            --gold-border-subtle: rgba(196, 167, 125, 0.14);
            --gold-border-bright: rgba(196, 167, 125, 0.65);
            --bg-dark: #07090E;
            --bg-card: linear-gradient(90deg, rgba(16, 20, 28, 0.72) 0%, rgba(11, 14, 20, 0.55) 100%);
            --bg-card-hover: linear-gradient(90deg, rgba(26, 33, 48, 0.8) 0%, rgba(18, 23, 33, 0.7) 100%);
            --bg-card-active: linear-gradient(90deg, rgba(196, 167, 125, 0.24) 0%, rgba(196, 167, 125, 0.06) 100%);
            --panel-glass: linear-gradient(180deg, rgba(13, 16, 24, 0.88) 0%, rgba(8, 10, 16, 0.94) 100%);
            --panel-blur: blur(28px) saturate(180%);
            --text-main: #E3DDD2;
            --text-sub: #8C867C;
            --text-muted: #57524A;
            --font-ui: 'Jura', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            --font-serif: 'Noto Serif SC', serif;
        }

        /* ===== 全页布局骨架（氛围光并入 #cr-app 多重背景） ===== */
        #cr-app {
            position: fixed; inset: 0; display: flex; flex-direction: column; overflow: hidden;
            font-family: var(--font-serif);
            background:
                radial-gradient(circle at 50% 0%, rgba(196, 167, 125, 0.12) 0%, transparent 60%),
                radial-gradient(circle at 10% 90%, rgba(30, 42, 65, 0.45) 0%, transparent 50%),
                radial-gradient(circle at 90% 80%, rgba(40, 28, 45, 0.35) 0%, transparent 45%),
                linear-gradient(165deg, rgba(14, 17, 26, 0.82) 0%, rgba(7, 9, 14, 0.94) 100%);
            background-color: var(--bg-dark);
            color: var(--text-main); user-select: none;
            -webkit-font-smoothing: antialiased;
        }
        #cr-app.no-glass { --panel-blur: none; }
        #cr-app.no-glass #cr-sidebar, #cr-app.no-glass #cr-player-bar, #cr-app.no-glass #cr-mobile-topbar,
        #cr-app.no-glass .cr-modal-overlay, #cr-app.no-glass #cr-sidebar-backdrop,
        #cr-app.no-glass .vinyl-close, #cr-app.no-glass .v-circle-btn, #cr-app.no-glass .track-head-row {
            backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
        }
        #cr-app.no-glass #cr-sidebar { background: #0d0f16; }
        #cr-app.no-glass #cr-player-bar { background: #0b0d13; }
        #cr-app.no-glass #cr-mobile-topbar { background: #0d0f16; }
        #cr-app.no-glass #cr-vinyl-overlay .vinyl-bg { filter: none !important; }

        #cr-app-body { flex: 1; display: flex; overflow: hidden; min-height: 0; position: relative; }

        /* ===== 左侧栏 ===== */
        #cr-sidebar {
            width: 256px; flex-shrink: 0; display: flex; flex-direction: column;
            background: var(--panel-glass);
            backdrop-filter: var(--panel-blur); -webkit-backdrop-filter: var(--panel-blur);
            border-right: 1px solid var(--gold-border);
            box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5);
            z-index: 150;
            transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
        }
        .cr-brand {
            display: flex; align-items: center; justify-content: space-between;
            padding: 18px 16px 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .cr-brand-left { display: flex; align-items: center; gap: 8px; }
        .cr-brand-dot {
            width: 8px; height: 8px; background: var(--gold-primary);
            box-shadow: 0 0 10px var(--gold-primary); border-radius: 1px;
        }
        .cr-brand-title {
            font-size: 14.5px; font-weight: 700; color: var(--gold-light);
            letter-spacing: 2px; font-family: var(--font-ui);
            text-shadow: 0 0 12px rgba(196, 167, 125, 0.4);
        }
        .cr-sidebar-close-btn {
            display: none; cursor: pointer; color: var(--text-sub);
            font-size: 16px; width: 28px; height: 28px;
            align-items: center; justify-content: center; border-radius: 50%;
        }
        .cr-header-btn {
            cursor: pointer; color: var(--text-sub); transition: 0.2s;
            width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
            border-radius: 4px; border: 1px solid transparent;
        }
        .cr-header-btn:hover {
            color: var(--gold-light); background: rgba(196, 167, 125, 0.12);
            border-color: var(--gold-border);
        }
        .cr-side-search { padding: 12px 14px 8px; }
        .cr-search-wrapper { position: relative; display: flex; align-items: center; width: 100%; }
        .cr-search-icon {
            position: absolute; left: 10px; width: 13px; height: 13px;
            stroke: var(--gold-primary); opacity: 0.75; pointer-events: none;
        }
        .cp-input {
            background: rgba(0, 0, 0, 0.45);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 4px; color: var(--text-main);
            font-family: inherit; outline: none;
            transition: all 0.25s; width: 100%;
        }
        .cp-input:focus {
            border-color: var(--gold-primary) !important;
            box-shadow: 0 0 12px rgba(196, 167, 125, 0.35), inset 0 0 6px rgba(196, 167, 125, 0.2);
        }
        .cp-input::placeholder { color: var(--text-muted); }
        .bgm-search-input { font-size: 11px; padding: 7px 10px 7px 30px; }
        .cr-side-section {
            padding: 10px 16px 6px; font-size: 9.5px; color: var(--gold-primary);
            letter-spacing: 2px; font-family: var(--font-ui); opacity: 0.9;
            text-transform: uppercase; font-weight: 600;
        }
        #pl-nav { flex: 1; overflow-y: auto; padding: 0 8px 10px; }
        #pl-nav::-webkit-scrollbar, #track-table::-webkit-scrollbar { width: 4px; }
        #pl-nav::-webkit-scrollbar-thumb, #track-table::-webkit-scrollbar-thumb { background: rgba(196, 167, 125, 0.25); border-radius: 4px; }
        .playlist-cat {
            display: flex; align-items: center; padding: 8px 10px;
            border-radius: 4px; cursor: pointer;
            transition: all 0.18s cubic-bezier(0.2, 0, 0, 1);
            margin-bottom: 2px; position: relative;
            border-left: 2px solid transparent;
        }
        .playlist-cat:hover { background: rgba(196, 167, 125, 0.06); color: var(--gold-light); }
        .playlist-cat.selected {
            background: linear-gradient(90deg, rgba(196, 167, 125, 0.18) 0%, rgba(196, 167, 125, 0.04) 100%);
            border-left: 2px solid var(--gold-primary);
            box-shadow: inset 1px 0 10px rgba(196, 167, 125, 0.15);
        }
        .playlist-cat.selected .nav-name { color: var(--gold-bright); font-weight: 600; }
        .playlist-cat.active-playlist .nav-name { color: var(--gold-primary); }
        .playlist-cat.dragging { opacity: 0.4; }
        .playlist-cat.drag-over-top { box-shadow: 0 -2px 0 var(--gold-primary); }
        .playlist-cat.drag-over-bottom { box-shadow: 0 2px 0 var(--gold-primary); }
        .playlist-cat.song-drag-target { background: rgba(196, 167, 125, 0.18); }
        .nav-play-mark {
            width: 14px; flex-shrink: 0; font-size: 9px; color: var(--gold-primary);
            visibility: hidden; text-align: center;
        }
        .playlist-cat.active-playlist .nav-play-mark { visibility: visible; }
        .nav-name {
            flex: 1; font-size: 12px; color: var(--text-sub);
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            transition: color 0.15s;
        }
        .nav-count {
            font-size: 9.5px; color: var(--text-muted); margin-left: 6px;
            font-family: var(--font-ui); flex-shrink: 0;
        }
        .nav-ops { display: none; align-items: center; gap: 2px; margin-left: 4px; flex-shrink: 0; }
        .playlist-cat:hover .nav-ops { display: flex; }
        .playlist-cat:hover .nav-count { display: none; }
        .cr-cat-order-btn {
            cursor: pointer; color: var(--text-sub); transition: 0.15s; display: flex;
            align-items: center; justify-content: center; width: 16px; height: 16px;
        }
        .cr-cat-order-btn:hover { color: var(--gold-primary); }
        .cr-side-footer {
            padding: 12px 14px;
            border-top: 1px solid var(--gold-border-subtle);
            background: rgba(0, 0, 0, 0.35);
        }
        .cr-side-newrow { display: flex; gap: 6px; margin-bottom: 8px; }
        .cr-side-newrow .cp-input { font-size: 10.5px; padding: 5px 8px; }
        .cp-btn {
            background: linear-gradient(135deg, rgba(196, 167, 125, 0.18) 0%, rgba(196, 167, 125, 0.05) 100%);
            border: 1px solid rgba(196, 167, 125, 0.35);
            border-radius: 4px; color: var(--gold-light);
            font-family: inherit; cursor: pointer;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 2px 6px rgba(0, 0, 0, 0.4);
            transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
            white-space: nowrap;
        }
        .cp-btn:hover {
            background: linear-gradient(135deg, rgba(196, 167, 125, 0.35) 0%, rgba(196, 167, 125, 0.14) 100%);
            border-color: var(--gold-primary);
            color: var(--gold-bright);
            box-shadow: 0 0 12px rgba(196, 167, 125, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
        }
        .cp-btn:active { transform: translateY(0); box-shadow: 0 0 6px rgba(196, 167, 125, 0.3); }
        .cr-io-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
        .cr-io-grid .cp-btn { padding: 4px 0; font-size: 9.5px; text-align: center; color: var(--text-sub); }
        .cr-io-grid .cp-btn:hover { color: var(--gold-bright); }

        /* 移动抽屉遮罩 */
        #cr-sidebar-backdrop {
            display: none; position: fixed; inset: 0; z-index: 140;
            background: rgba(0, 0, 0, 0.72); backdrop-filter: blur(6px);
            opacity: 0; transition: opacity 0.3s ease;
        }

        /* ===== 主内容区 ===== */
        #cr-main {
            flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0;
            background: transparent; position: relative;
        }

        /* 移动端汉堡顶栏 */
        #cr-mobile-topbar {
            display: none; align-items: center; justify-content: space-between;
            height: 50px; padding: 0 16px;
            background: var(--panel-glass);
            border-bottom: 1px solid var(--gold-border-subtle);
            backdrop-filter: var(--panel-blur); -webkit-backdrop-filter: var(--panel-blur);
            z-index: 60;
        }
        .cr-mob-menu-btn, .cr-mob-gear-btn {
            width: 36px; height: 36px; border-radius: 4px;
            display: flex; align-items: center; justify-content: center;
            background: linear-gradient(135deg, rgba(196, 167, 125, 0.12), rgba(196, 167, 125, 0.04));
            border: 1px solid var(--gold-border);
            color: var(--gold-light); cursor: pointer;
        }
        .cr-mob-title {
            font-size: 14px; font-weight: 700; color: var(--gold-light);
            font-family: var(--font-ui); letter-spacing: 1.5px;
            text-shadow: 0 0 10px rgba(196, 167, 125, 0.3);
        }

        #pl-header {
            padding: 18px 24px 14px; display: flex; align-items: flex-end;
            justify-content: space-between; gap: 16px; flex-shrink: 0;
            border-bottom: 1px solid var(--gold-border-subtle);
            background: linear-gradient(180deg, rgba(196, 167, 125, 0.07) 0%, transparent 100%);
        }
        .pl-head-info { min-width: 0; }
        .pl-head-title {
            font-size: 21px; font-weight: 700; color: var(--gold-bright);
            letter-spacing: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            text-shadow: 0 0 15px rgba(196, 167, 125, 0.35);
        }
        .pl-head-sub {
            font-size: 11px; color: var(--text-sub); margin-top: 4px;
            font-family: var(--font-ui);
        }
        .pl-head-sub b { color: var(--gold-primary); font-weight: 600; }
        .pl-head-tools { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .cr-cat-action-btn {
            cursor: pointer; color: var(--text-sub); transition: all 0.2s;
            display: flex; align-items: center; justify-content: center;
            width: 28px; height: 28px; border-radius: 4px;
            border: 1px solid var(--gold-border-subtle);
            background: linear-gradient(135deg, rgba(196, 167, 125, 0.1), rgba(196, 167, 125, 0.02));
        }
        .cr-cat-action-btn:hover {
            color: var(--gold-light); border-color: var(--gold-border);
            background: rgba(196, 167, 125, 0.18);
            box-shadow: 0 0 8px rgba(196, 167, 125, 0.25);
        }
        .cr-cat-action-btn.active { color: var(--gold-primary); border-color: var(--gold-border-bright); background: rgba(196, 167, 125, 0.16); }
        .cr-addrow { display: flex; gap: 6px; align-items: center; }
        .cr-addrow .cp-input { font-size: 11px; padding: 5px 9px; width: 200px; }
        .cr-addrow .cp-btn { padding: 5px 12px; font-size: 10.5px; }

        /* ===== 曲目表格：右侧按钮常显 + 精工微凸暗金质感 ===== */
        #track-table { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 4px 16px 90px; }
        .track-head-row {
            display: flex; align-items: center; padding: 8px 12px;
            font-size: 9.5px; color: var(--text-muted); letter-spacing: 1.5px;
            border-bottom: 1px solid var(--gold-border-subtle); position: sticky; top: -4px;
            background: rgba(10, 12, 18, 0.94);
            backdrop-filter: var(--panel-blur); -webkit-backdrop-filter: var(--panel-blur);
            z-index: 5; text-transform: uppercase; font-family: var(--font-ui);
        }
        .song-item {
            position: relative;
            display: flex; align-items: center; padding: 9px 12px;
            border-radius: 4px; cursor: pointer;
            background: var(--bg-card);
            border: 1px solid rgba(196, 167, 125, 0.08);
            border-bottom: 1px solid rgba(0, 0, 0, 0.5);
            margin: 3px 0;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            transition: all 0.18s cubic-bezier(0.2, 0, 0, 1);
        }
        .song-item:hover {
            background: var(--bg-card-hover);
            border-color: rgba(196, 167, 125, 0.3);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
            transform: translateY(-1px);
        }
        .song-item.playing {
            background: var(--bg-card-active);
            border-color: rgba(196, 167, 125, 0.5);
            box-shadow: inset 2px 0 0 var(--gold-primary), 0 0 16px rgba(196, 167, 125, 0.15);
        }
        .song-item.playing .song-name { color: var(--gold-bright); font-weight: 600; }
        .song-item.loading { opacity: 0.55; }
        .song-item.batch-selected {
            background: var(--bg-card-active);
            border-color: rgba(196, 167, 125, 0.45);
            box-shadow: inset 2px 0 0 var(--gold-primary);
        }
        .song-item.song-dragging { opacity: 0.35; }
        .row-index {
            width: 32px; flex-shrink: 0; text-align: center; font-size: 11px;
            color: var(--text-muted); font-family: var(--font-ui);
        }
        .song-item.playing .row-index, .song-item:hover .row-index { color: var(--gold-primary); text-shadow: 0 0 6px var(--gold-glow); }
        .song-info {
            flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;
            padding-right: 12px;
        }
        .song-name {
            font-size: 13px; color: var(--text-main);
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            transition: color 0.15s;
        }
        .song-artist {
            font-size: 10.5px; color: var(--text-sub);
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .row-from {
            flex-shrink: 0; font-size: 9.5px; color: var(--gold-primary);
            opacity: 0.9; margin-right: 14px; max-width: 140px;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            background: linear-gradient(135deg, rgba(196, 167, 125, 0.12), rgba(196, 167, 125, 0.04));
            padding: 2px 8px; border-radius: 3px;
            border: 1px solid rgba(196, 167, 125, 0.22);
        }

        /* ===== 行尾操作按钮组：常显暗金质感（沿用单机版类名） ===== */
        .song-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .song-action-btn {
            cursor: pointer; color: var(--text-sub);
            display: flex; align-items: center; justify-content: center;
            width: 26px; height: 26px; border-radius: 4px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(196, 167, 125, 0.16);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
            transition: all 0.18s cubic-bezier(0.2, 0, 0, 1);
        }
        .song-action-btn svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; transition: all 0.18s; }
        .song-action-btn:hover {
            color: var(--gold-light);
            background: rgba(196, 167, 125, 0.2);
            border-color: var(--gold-primary);
            box-shadow: 0 0 10px rgba(196, 167, 125, 0.4);
            transform: scale(1.08);
        }
        .song-action-btn.is-fav {
            color: var(--gold-primary);
            border-color: rgba(196, 167, 125, 0.45);
            background: rgba(196, 167, 125, 0.12);
        }
        .song-action-btn.is-fav svg { fill: var(--gold-primary); stroke: var(--gold-primary); }
        .cr-song-check { cursor: pointer; accent-color: var(--gold-primary); margin-right: 8px; flex-shrink: 0; }
        .track-empty { padding: 46px 12px; text-align: center; color: var(--text-sub); font-size: 11.5px; }
        .track-empty .big { font-size: 26px; margin-bottom: 10px; opacity: 0.6; }

        /* ===== 批量管理条 ===== */
        .cr-batch-bar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 6px 12px; margin: 6px 0;
            background: linear-gradient(135deg, rgba(196, 167, 125, 0.12), rgba(196, 167, 125, 0.04));
            border: 1px solid var(--gold-border); border-radius: 4px; font-size: 10.5px;
        }
        .cr-batch-bar .cp-btn { padding: 3px 9px; font-size: 9.5px; margin-left: 4px; color: var(--text-sub); }
        .cr-batch-bar .cp-btn:hover { color: var(--gold-bright); }

        /* ===== 底部播放条 ===== */
        #cr-player-bar {
            height: 78px; flex-shrink: 0; display: flex; align-items: center;
            padding: 0 24px; gap: 16px; position: relative; z-index: 120;
            background: var(--panel-glass);
            backdrop-filter: var(--panel-blur); -webkit-backdrop-filter: var(--panel-blur);
            border-top: 1px solid var(--gold-border);
            box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.6);
            transition: all 0.35s cubic-bezier(0.2, 0, 0, 1);
        }
        .pb-left { display: flex; align-items: center; gap: 12px; width: 28%; min-width: 210px; }
        #pb-cover {
            width: 50px; height: 50px; border-radius: 4px; flex-shrink: 0;
            cursor: pointer; background: rgba(196, 167, 125, 0.08);
            border: 1px solid var(--gold-primary);
            overflow: hidden; display: flex; align-items: center; justify-content: center;
            transition: all 0.25s; position: relative;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5), 0 0 10px rgba(196, 167, 125, 0.2);
        }
        #pb-cover:hover {
            transform: scale(1.06);
            box-shadow: 0 0 16px rgba(196, 167, 125, 0.5);
        }
        #pb-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pb-info { min-width: 0; flex: 1; }
        #bgm-now-playing {
            font-size: 13px; color: var(--gold-bright); font-weight: 600;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            letter-spacing: 0.5px;
            text-shadow: 0 0 10px rgba(196, 167, 125, 0.25);
        }
        #bgm-now-artist {
            font-size: 10.5px; color: var(--text-sub); margin-top: 3px;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .cr-player-tool-btn {
            cursor: pointer; color: var(--text-sub); transition: 0.15s;
            display: flex; align-items: center; justify-content: center;
            width: 28px; height: 28px; border-radius: 4px;
        }
        .cr-player-tool-btn:hover { color: var(--gold-light); background: rgba(196, 167, 125, 0.15); }
        .cr-player-tool-btn.is-fav { color: var(--gold-primary); }

        .pb-center { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
        .pb-ctrl-row { display: flex; align-items: center; gap: 16px; }
        .bgm-ctrl-btn {
            background: none; border: none; cursor: pointer; padding: 6px;
            display: flex; align-items: center; justify-content: center; transition: 0.15s;
            color: var(--text-sub);
        }
        .bgm-ctrl-btn:hover { color: var(--gold-light); transform: scale(1.08); }
        .bgm-ctrl-btn svg { fill: currentColor; stroke: currentColor; }
        .bgm-play-btn {
            width: 42px; height: 42px; border-radius: 50%;
            background: radial-gradient(circle at 35% 35%, #2B251E 0%, #14120F 100%);
            border: 1.5px solid var(--gold-primary);
            color: var(--gold-bright);
            box-shadow: 0 0 16px rgba(196, 167, 125, 0.4), inset 0 0 8px rgba(196, 167, 125, 0.3);
        }
        .bgm-play-btn:hover {
            box-shadow: 0 0 24px rgba(196, 167, 125, 0.7), inset 0 0 12px rgba(196, 167, 125, 0.5);
            transform: scale(1.08);
        }
        .pb-progress-row {
            display: flex; align-items: center; gap: 10px; width: 100%; max-width: 580px;
        }
        .pb-time {
            font-size: 10px; color: var(--text-muted); font-family: var(--font-ui);
            flex-shrink: 0; width: 34px;
        }
        .pb-time:last-child { text-align: right; }
        .bgm-progress {
            flex: 1; height: 3.5px; background: rgba(255, 255, 255, 0.08);
            border-radius: 2px; cursor: pointer; position: relative;
        }
        .bgm-progress:hover { height: 5px; }
        .bgm-progress-fill {
            height: 100%; border-radius: 2px;
            background: linear-gradient(90deg, rgba(196, 167, 125, 0.5), #C4A77D 70%, #FFF5DF 100%);
            width: 0%; box-shadow: 0 0 10px rgba(196, 167, 125, 0.8);
            pointer-events: none; transition: width 0.1s linear;
        }

        .pb-right {
            display: flex; align-items: center; gap: 12px; width: 28%; min-width: 210px;
            justify-content: flex-end;
        }
        .bgm-mode-btn {
            background: rgba(196, 167, 125, 0.08); border: 1px solid var(--gold-border);
            border-radius: 4px; color: var(--gold-light);
            font-family: inherit; cursor: pointer; font-size: 10px; padding: 4px 10px;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
            transition: 0.2s; white-space: nowrap;
        }
        .bgm-mode-btn:hover { border-color: var(--gold-border-bright); background: rgba(196, 167, 125, 0.2); }
        .cr-vol-container { display: flex; align-items: center; gap: 8px; }
        .cr-vol-icon { cursor: pointer; color: var(--text-sub); display: flex; align-items: center; }
        .cr-vol-icon:hover { color: var(--gold-light); }
        .cr-vol-visualizer-container {
            position: relative; width: 120px; height: 26px; cursor: pointer;
        }
        .cr-vol-visualizer {
            position: absolute; inset: 0; display: flex; align-items: flex-end;
            justify-content: space-between; padding: 0 1px;
        }
        .cr-vol-bar {
            flex: 1; margin: 0 1px; background: rgba(255, 255, 255, 0.08);
            border-radius: 1px; height: calc(var(--cr-vol, 0.8) * 100%);
            min-height: 3px; opacity: 0.25; transition: opacity 0.2s;
        }
        .cr-vol-bar.active {
            opacity: 0.95;
            background: linear-gradient(0deg, #C4A77D 0%, #FFF2CE 100%);
            box-shadow: 0 0 6px rgba(196, 167, 125, 0.6);
        }
        .cr-vol-visualizer.playing .cr-vol-bar.active {
            animation: crVolDance 0.62s ease-in-out infinite alternate;
        }
        .cr-vol-visualizer.playing .cr-vol-bar.active:nth-child(even) {
            animation-name: crVolDanceAlt;
        }
        @keyframes crVolDance { from { transform: scaleY(0.45); } to { transform: scaleY(1.3); } }
        @keyframes crVolDanceAlt { from { transform: scaleY(1.25); } to { transform: scaleY(0.4); } }
        .cr-vol-visualizer.playing.real-spectrum .cr-vol-bar.active {
            animation: none; transition: height 0.09s linear;
        }
        .cr-vol-native-slider {
            position: absolute; inset: 0; width: 100%; height: 100%;
            opacity: 0; cursor: pointer; margin: 0;
        }
        .cr-vol-text {
            font-size: 10px; color: var(--gold-primary); width: 32px;
            text-align: right; font-family: var(--font-ui); font-weight: 600;
        }

        .cr-play-spinner {
            width: 14px; height: 14px; border: 2px solid rgba(196, 167, 125, 0.25);
            border-top-color: var(--gold-primary); border-radius: 50%; animation: crSpin 0.8s linear infinite;
        }
        @keyframes crSpin { to { transform: rotate(360deg); } }

        .cr-player-toast {
            position: fixed; bottom: 96px; left: 50%; transform: translateX(-50%);
            background: rgba(14, 18, 28, 0.95); border: 1px solid var(--gold-primary);
            color: var(--gold-bright); padding: 8px 20px; border-radius: 20px;
            font-size: 11.5px; pointer-events: none; opacity: 0;
            transition: opacity 0.25s, transform 0.25s; z-index: 800;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(196, 167, 125, 0.3); white-space: nowrap;
        }
        .cr-player-toast.show { opacity: 1; transform: translateX(-50%) translateY(-5px); }

        /* ===== 黑胶播放页 ===== */
        #cr-vinyl-overlay {
            position: fixed; left: 0; right: 0; top: 0; bottom: 78px; z-index: 200;
            opacity: 0; pointer-events: none; transition: opacity 0.35s ease;
            overflow: hidden; background: #090b11;
        }
        #cr-vinyl-overlay.open { opacity: 1; pointer-events: auto; }
        .vinyl-bg {
            position: absolute; inset: -40px; background-size: cover; background-position: center;
            filter: blur(60px) brightness(0.22) saturate(1.3); transform: scale(1.1);
            transition: background-image 0.4s;
        }
        .vinyl-close {
            position: absolute; top: 22px; left: 24px; z-index: 20; cursor: pointer;
            color: var(--gold-light); font-size: 16px;
            width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(28, 24, 20, 0.85) 0%, rgba(12, 14, 18, 0.85) 100%);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(196, 167, 125, 0.45);
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.6), 0 0 12px rgba(196, 167, 125, 0.25);
            transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
        }
        .vinyl-close svg { stroke: currentColor; fill: none; }
        .vinyl-close:hover {
            border-color: var(--gold-primary);
            background: rgba(196, 167, 125, 0.25);
            box-shadow: 0 0 18px rgba(196, 167, 125, 0.5);
            transform: translateY(2px) scale(1.08);
        }
        #cr-vinyl-netease-btn { left: auto; right: 24px; }
        .vinyl-stage {
            position: relative; z-index: 2; height: 100%;
            display: flex; align-items: center; justify-content: center; gap: 8%;
            padding: 0 6%;
        }
        .vinyl-turntable { position: relative; flex-shrink: 0; }
        .vinyl-disc {
            width: min(46vh, 380px); height: min(46vh, 380px); border-radius: 50%;
            position: relative; display: flex; align-items: center; justify-content: center;
            background: repeating-radial-gradient(circle at 50% 50%,
                #12141a 0px, #1a1c24 2px, #0c0e14 4px);
            box-shadow: 0 16px 50px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 30px rgba(196, 167, 125, 0.2);
            animation: crVinylSpin 22s linear infinite; animation-play-state: paused;
        }
        .vinyl-disc.spinning { animation-play-state: running; }
        @keyframes crVinylSpin { to { transform: rotate(360deg); } }
        #cr-vinyl-cover {
            width: 62%; height: 62%; border-radius: 50%; object-fit: cover;
            box-shadow: 0 0 0 5px rgba(0, 0, 0, 0.6), 0 4px 20px rgba(0, 0, 0, 0.6);
            background: #101218;
        }
        .vinyl-center {
            position: absolute; width: 14px; height: 14px; border-radius: 50%;
            background: #08090d; border: 2px solid var(--gold-primary); z-index: 3;
        }
        .vinyl-tonearm {
            position: absolute; top: -4%; right: -2%; width: 12px; height: 58%;
            transform-origin: 50% 9%; transform: rotate(-24deg);
            transition: transform 0.5s ease; z-index: 4; pointer-events: none;
        }
        .vinyl-tonearm.on { transform: rotate(4deg); }
        .tonearm-arm {
            position: absolute; left: 50%; top: 0; transform: translateX(-50%);
            width: 4px; height: 100%; border-radius: 3px;
            background: linear-gradient(180deg, #e0e0e5, #888892);
        }
        .tonearm-head {
            position: absolute; left: 50%; bottom: -8px; transform: translateX(-50%);
            width: 18px; height: 24px; border-radius: 4px;
            background: linear-gradient(180deg, #f0e6d3, #998363);
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.6);
        }
        .vinyl-meta {
            max-width: 42%; min-width: 300px; height: 100%;
            display: flex; flex-direction: column; padding: 44px 0 30px;
        }
        .v-info-block { flex-shrink: 0; }
        .vinyl-title {
            font-size: clamp(20px, 3vw, 34px); font-weight: 700; color: var(--gold-bright);
            line-height: 1.35; letter-spacing: 0.5px;
            text-shadow: 0 2px 14px rgba(0, 0, 0, 0.7), 0 0 20px rgba(196, 167, 125, 0.35);
        }
        .v-info-row {
            display: flex; flex-wrap: wrap; gap: 4px 20px; margin-top: 16px;
            font-size: 12px; color: var(--text-sub); font-family: var(--font-ui);
        }
        .v-info-item { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .v-info-item b { color: var(--gold-light); font-weight: 600; }
        .v-tab-row { margin-top: 16px; }
        .v-tab {
            display: inline-block; padding: 5px 16px; border-radius: 14px;
            font-size: 12px; letter-spacing: 1px;
            color: var(--gold-bright); background: rgba(196, 167, 125, 0.18);
            border: 1px solid var(--gold-border);
        }

        /* ===== 全屏封面模式（复刻 demo_preview：左封面出血羽化 + 右信息歌词） ===== */
        /* 默认隐藏；仅 mode-fullscreen-cover 下展示，经典黑胶模式不受影响 */
        .fs-cover-art { display: none; }
        #cr-vinyl-overlay.mode-fullscreen-cover .vinyl-turntable { display: none; }
        #cr-vinyl-overlay.mode-fullscreen-cover .vinyl-stage { display: block; padding: 0; gap: 0; }
        #cr-vinyl-overlay.mode-fullscreen-cover .vinyl-bg {
            filter: blur(65px) brightness(0.72) saturate(1.15); transform: scale(1.15);
        }
        #cr-vinyl-overlay.mode-fullscreen-cover .fs-cover-art {
            display: block; position: absolute; left: 0; top: 0; bottom: 0; width: 58%;
            overflow: hidden; z-index: 4; pointer-events: none;
            -webkit-mask-image: linear-gradient(to right, #000 0%, #000 48%, rgba(0,0,0,0.85) 65%, transparent 100%);
            mask-image: linear-gradient(to right, #000 0%, #000 48%, rgba(0,0,0,0.85) 65%, transparent 100%);
        }
        #cr-vinyl-overlay.mode-fullscreen-cover .fs-cover-art img {
            width: 100%; height: 100%; object-fit: cover; object-position: left center; display: block;
        }
        #cr-vinyl-overlay.mode-fullscreen-cover .vinyl-meta {
            position: absolute; right: 0; top: 0; bottom: 0;
            width: 48%; max-width: none; min-width: 0; height: auto;
            padding: 70px 7% 56px 2%; z-index: 10;
        }
        /* 全屏封面模式白色文字体系（经典黑胶模式仍为鎏金） */
        #cr-vinyl-overlay.mode-fullscreen-cover .vinyl-title {
            color: #ffffff; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.65);
        }
        #cr-vinyl-overlay.mode-fullscreen-cover .v-info-row { color: rgba(255, 255, 255, 0.65); }
        #cr-vinyl-overlay.mode-fullscreen-cover .v-info-item b { color: rgba(255, 255, 255, 0.9); }
        #cr-vinyl-overlay.mode-fullscreen-cover .v-tab {
            color: #11141d; background: rgba(255, 255, 255, 0.94);
            border-color: transparent; font-weight: 600;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        #cr-vinyl-overlay.mode-fullscreen-cover .cr-lyric-main { color: rgba(255, 255, 255, 0.46); }
        #cr-vinyl-overlay.mode-fullscreen-cover .cr-lyric-trans { color: rgba(255, 255, 255, 0.42); }
        #cr-vinyl-overlay.mode-fullscreen-cover .cr-lyric-line.active .cr-lyric-main {
            color: #ffffff; text-shadow: 0 2px 14px rgba(0, 0, 0, 0.7);
        }
        #cr-vinyl-overlay.mode-fullscreen-cover .cr-lyric-line.active .cr-lyric-trans {
            color: rgba(255, 255, 255, 0.96);
        }
        /* 右侧暗角：压暗模糊底图，保证白字可读 */
        .vinyl-vignette {
            display: none; position: absolute; inset: 0; pointer-events: none; z-index: 2;
            background: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.05) 40%, rgba(0, 0, 0, 0.22) 100%);
        }
        #cr-vinyl-overlay.mode-fullscreen-cover .vinyl-vignette { display: block; }

        /* ===== 播放器模式切换弹窗（复刻 demo_preview） ===== */
        #cr-vinyl-mode-btn { left: auto; right: 76px; }
        .player-mode-modal {
            position: absolute; top: 74px; right: 24px; width: 320px;
            background: var(--panel-glass);
            backdrop-filter: var(--panel-blur); -webkit-backdrop-filter: var(--panel-blur);
            border: 1px solid var(--gold-border-bright); border-radius: 12px;
            box-shadow: 0 16px 45px rgba(0, 0, 0, 0.8);
            z-index: 100; padding: 14px; box-sizing: border-box;
            opacity: 0; pointer-events: none; transform: translateY(-8px) scale(0.97);
            transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .player-mode-modal.open { opacity: 1; pointer-events: auto; transform: translateY(0) scale(1); }
        .pm-cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pm-mode-card {
            position: relative; border-radius: 8px; overflow: hidden;
            background: rgba(255, 255, 255, 0.05);
            border: 1.5px solid rgba(196, 167, 125, 0.2);
            cursor: pointer; transition: all 0.2s ease;
            display: flex; flex-direction: column; align-items: center;
        }
        .pm-mode-card:hover { border-color: var(--gold-primary); transform: translateY(-2px); }
        .pm-mode-card.selected { border-color: var(--gold-primary); box-shadow: 0 0 14px rgba(196, 167, 125, 0.45); }
        .pm-card-thumb { width: 100%; height: 86px; object-fit: cover; display: block; }
        .pm-card-title { padding: 7px 0; font-size: 13px; color: var(--text-sub); text-align: center; }
        .pm-mode-card.selected .pm-card-title { color: var(--gold-bright); font-weight: 600; }
        .pm-check-badge {
            position: absolute; right: 6px; bottom: 31px;
            width: 18px; height: 18px; border-radius: 50%;
            background: var(--gold-primary); color: #14161c;
            display: none; align-items: center; justify-content: center;
            font-size: 11px; font-weight: bold;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
        }
        .pm-mode-card.selected .pm-check-badge { display: flex; }

        /* ===== 歌词滚动区（PC 右侧 / 移动端唱片下方共用） ===== */
        .cr-lyric-scroll {
            flex: 1; min-height: 0; overflow-y: auto;
            -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%);
            mask-image: linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%);
            scrollbar-width: none;
        }
        .cr-lyric-scroll::-webkit-scrollbar { width: 0; height: 0; }
        .cr-lyric-inner { padding: 42% 0 60%; }
        .cr-lyric-line { margin: 0 0 18px; transition: opacity 0.3s; }
        .cr-lyric-main {
            display: block; font-size: 15px; line-height: 1.55; color: var(--text-sub);
            transition: color 0.3s, font-size 0.3s, text-shadow 0.3s;
        }
        .cr-lyric-trans { display: block; font-size: 12.5px; line-height: 1.5; color: var(--text-muted); margin-top: 4px; }
        .cr-lyric-line.active .cr-lyric-main {
            color: var(--gold-bright); font-size: 17px; font-weight: 600;
            text-shadow: 0 0 14px rgba(196, 167, 125, 0.45);
        }
        .cr-lyric-line.active .cr-lyric-trans { color: var(--gold-primary); }
        .cr-lyric-empty { color: var(--text-muted); font-size: 13px; text-align: center; padding: 40px 0; letter-spacing: 1px; }

        /* 移动端歌词区：默认藏起，窄屏/强制移动布局显示 */
        .cr-lyric-mobile { display: none; }
        .cr-lyric-head { display: none; }

        /* ===== 手机黑胶底栏（4 行控件） ===== */
        .vinyl-mobile-panel {
            display: none; position: relative; z-index: 10; width: 100%;
            padding: 6px 22px 24px 22px; flex-direction: column;
        }
        .v-row-meta {
            display: flex; align-items: center; justify-content: space-between;
            gap: 12px; margin-bottom: 16px;
        }
        .v-circle-btn {
            width: 44px; height: 44px; border-radius: 50%;
            border: 1px solid rgba(196, 167, 125, 0.35);
            background: rgba(16, 20, 30, 0.45);
            backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: var(--gold-light);
            transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
            flex-shrink: 0; padding: 0;
        }
        .v-circle-btn svg {
            width: 20px; height: 20px;
            stroke: currentColor; stroke-width: 2.2; fill: none;
            transition: all 0.2s;
        }
        .v-circle-btn:hover {
            border-color: var(--gold-primary);
            transform: scale(1.06);
            box-shadow: 0 0 12px rgba(196, 167, 125, 0.35);
        }
        .v-circle-btn.is-fav { border-color: var(--gold-primary); color: var(--gold-bright); }
        .v-circle-btn.is-fav svg {
            fill: var(--gold-bright); stroke: var(--gold-bright);
            filter: drop-shadow(0 0 6px rgba(196, 167, 125, 0.6));
        }
        .v-meta-center { flex: 1; min-width: 0; text-align: center; padding: 0 8px; }
        .v-meta-title {
            font-size: 19px; font-weight: 700; color: var(--gold-bright);
            letter-spacing: 0.6px; font-family: var(--font-serif);
            text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8), 0 0 14px rgba(196, 167, 125, 0.3);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3;
        }
        .v-meta-artist {
            font-size: 12.5px; color: var(--gold-primary); opacity: 0.85; margin-top: 4px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;
        }
        .v-row-progress {
            width: 100%; height: 18px; display: flex; align-items: center;
            cursor: pointer; position: relative; margin-bottom: 16px; padding: 0 2px;
        }
        .v-progress-track {
            width: 100%; height: 3px; border-radius: 2px;
            background: rgba(255, 255, 255, 0.12); position: relative; overflow: visible;
        }
        .v-progress-fill {
            height: 100%; width: 0%; border-radius: 2px;
            background: linear-gradient(90deg, #C4A77D 0%, #FFF2CE 100%);
            position: relative; box-shadow: 0 0 8px rgba(196, 167, 125, 0.5);
        }
        .v-progress-bead {
            position: absolute; right: -3px; top: -2px;
            width: 7px; height: 7px; border-radius: 50%;
            background: #FFF2CE;
            box-shadow: 0 0 8px rgba(255, 242, 206, 0.95);
        }
        .v-row-ctrls {
            display: flex; align-items: center; justify-content: center;
            gap: 48px; margin-bottom: 22px;
        }
        .v-ctrl-btn {
            background: none; border: none; color: var(--gold-primary);
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            padding: 6px; transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
        }
        .v-ctrl-btn svg {
            width: 22px; height: 22px; fill: currentColor; stroke: currentColor;
            filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
        }
        .v-ctrl-btn:hover { color: var(--gold-light); transform: scale(1.15); }
        .v-play-btn {
            width: 52px; height: 52px; border-radius: 50%;
            border: 1.5px solid rgba(196, 167, 125, 0.5);
            background: radial-gradient(circle, rgba(34, 28, 22, 0.9) 0%, rgba(13, 15, 22, 0.9) 100%);
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.7), 0 0 16px rgba(196, 167, 125, 0.28);
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            color: #FFF2CE; transition: all 0.2s cubic-bezier(0.2, 0, 0, 1); padding: 0;
        }
        .v-play-btn svg { width: 20px; height: 20px; fill: currentColor; }
        .v-play-btn:hover {
            border-color: var(--gold-primary);
            transform: scale(1.08);
            box-shadow: 0 0 22px rgba(196, 167, 125, 0.5);
        }
        .v-row-volume { display: flex; align-items: center; gap: 12px; width: 100%; }
        .v-vol-icon {
            color: var(--gold-primary); cursor: pointer;
            display: flex; align-items: center; flex-shrink: 0;
        }
        .v-vol-icon svg { width: 18px; height: 18px; stroke: currentColor; stroke-width: 2; fill: none; }
        .v-vol-icon:hover { color: var(--gold-light); }
        .v-vol-visualizer-container {
            position: relative; flex: 1; height: 24px;
            display: flex; align-items: center; cursor: pointer;
        }
        .v-vol-visualizer {
            position: absolute; inset: 0; display: flex; align-items: center;
            gap: 3px; width: 100%;
        }
        .v-vol-bar {
            flex: 1; border-radius: 2px;
            background: rgba(255, 255, 255, 0.1);
            height: 3px; min-height: 2px; min-width: 2.5px;
            transition: background 0.2s, height 0.25s, opacity 0.2s;
            opacity: 0.3;
        }
        .v-vol-bar.active {
            opacity: 0.95;
            height: 18px;
            background: #C4A77D;
            box-shadow: 0 0 4px rgba(196, 167, 125, 0.4);
        }
        .v-vol-bar:nth-child(-n+7) { border-radius: 3px; }
        .v-vol-bar:nth-child(-n+7).active {
            background: linear-gradient(180deg, #FFF3D1 0%, #D4B277 100%);
            box-shadow: 0 0 7px rgba(255, 243, 209, 0.6);
        }
        .v-vol-visualizer.playing .v-vol-bar.active {
            animation: vVolDance 0.6s ease-in-out infinite alternate;
        }
        .v-vol-visualizer.playing .v-vol-bar.active:nth-child(even) {
            animation-name: vVolDanceAlt; animation-duration: 0.75s;
        }
        /* 对齐原版 json 波形幅度：谷值贴底 0.1875，峰值随音量冲到 1.3 倍 */
        @keyframes vVolDance {
            0%, 100% { transform: scaleY(0.1875); }
            50% { transform: scaleY(max(0.1875, calc(1.3 * var(--cr-vol, 1)))); }
        }
        @keyframes vVolDanceAlt {
            0%, 100% { transform: scaleY(max(0.1875, calc(1.15 * var(--cr-vol, 1)))); }
            50% { transform: scaleY(0.1875); }
        }
        .v-vol-visualizer.playing.real-spectrum .v-vol-bar.active { animation: none; }
        .v-vol-native-slider {
            position: absolute; inset: 0; width: 100%; height: 100%;
            opacity: 0; cursor: pointer; margin: 0;
        }
        .v-vol-text {
            font-size: 13px; color: var(--gold-primary); width: 36px;
            text-align: right; font-family: var(--font-ui); font-weight: 600; flex-shrink: 0;
        }

        /* ===== 模态框（迁移/设置） ===== */
        .cr-modal-overlay {
            position: fixed; inset: 0; z-index: 500; display: none;
            align-items: center; justify-content: center;
            background: rgba(3, 4, 8, 0.78);
            backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        }
        .cr-modal-box {
            width: 320px; max-width: 90vw; max-height: 75vh;
            background: var(--panel-glass); border: 1px solid var(--gold-border-bright);
            border-radius: 6px; box-shadow: 0 16px 45px rgba(0, 0, 0, 0.7);
            display: flex; flex-direction: column; overflow: hidden;
        }
        .cr-modal-title {
            padding: 14px 18px; font-size: 13px; font-weight: 700;
            color: var(--gold-bright); border-bottom: 1px solid var(--gold-border-subtle);
        }
        .cr-modal-list { flex: 1; overflow-y: auto; padding: 8px; }
        .cr-modal-item {
            padding: 10px 14px; border-radius: 4px; cursor: pointer;
            font-size: 12px; color: var(--text-main); transition: 0.15s;
        }
        .cr-modal-item:hover { background: rgba(196, 167, 125, 0.12); color: var(--gold-light); }
        .cr-modal-btn {
            margin: 8px 14px 14px; padding: 8px;
            background: rgba(255, 255, 255, 0.04); border: 1px solid var(--gold-border-subtle);
            border-radius: 4px; color: var(--text-sub); cursor: pointer;
            font-family: inherit; transition: 0.2s;
        }
        .cr-modal-btn:hover { color: var(--gold-light); border-color: var(--gold-border); }

        /* ===== 设置面板 ===== */
        #cr-settings-modal { padding: 0; overflow: hidden; background: rgba(8, 10, 14, 0.97); }
        .cr-settings-container {
            display: flex; flex-direction: column; width: 340px; max-width: 92vw;
            max-height: 82vh; overflow: hidden;
            background: var(--panel-glass); border: 1px solid var(--gold-border-bright);
            border-radius: 10px; box-shadow: 0 16px 45px rgba(0, 0, 0, 0.7);
        }
        .cr-settings-header {
            padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid var(--gold-border-subtle);
            background: linear-gradient(90deg, rgba(196, 167, 125, 0.12) 0%, transparent 100%);
            flex-shrink: 0;
        }
        .cr-settings-title { font-size: 12px; font-weight: bold; color: var(--gold-primary); letter-spacing: 1px; }
        .cr-settings-close { cursor: pointer; font-size: 16px; color: var(--text-sub); transition: 0.2s; line-height: 1; padding: 2px 4px; }
        .cr-settings-close:hover { color: var(--gold-bright); transform: scale(1.15); }
        .cr-settings-body { padding: 14px; overflow-y: auto; flex: 1; }
        .cr-card { margin-bottom: 14px; }
        .cr-card-title { font-size: 11px; font-weight: bold; color: var(--gold-primary); margin-bottom: 10px; }
        .cr-cfg-row { margin-bottom: 12px; }
        .cr-cfg-label { display: flex; flex-direction: column; gap: 3px; font-size: 10.5px; color: var(--text-main); margin-bottom: 6px; }
        .cr-cfg-input {
            width: 100%; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px; color: var(--text-main); font-family: inherit; font-size: 11px;
            padding: 6px 9px; outline: none; transition: border-color 0.3s;
        }
        .cr-cfg-input:focus { border-color: var(--gold-primary); }
        .cr-switch-row {
            display: flex; align-items: center; justify-content: space-between;
            padding: 8px 0; gap: 12px;
        }
        .cr-switch-label-box { min-width: 0; }
        .cr-switch-title { font-size: 11px; color: var(--text-main); font-weight: 600; }
        .cr-switch-desc { font-size: 9px; color: var(--text-sub); margin-top: 3px; line-height: 1.4; }
        .cr-switch-control { position: relative; flex-shrink: 0; cursor: pointer; }
        .cr-switch-control input { display: none; }
        .cr-switch-track {
            display: block; width: 34px; height: 18px; border-radius: 9px;
            background: rgba(255, 255, 255, 0.12); transition: 0.25s; position: relative;
        }
        .cr-switch-track::before {
            content: ''; position: absolute; left: 2px; top: 2px; width: 14px; height: 14px;
            border-radius: 50%; background: var(--text-sub); transition: 0.25s;
        }
        .cr-switch-control input:checked + .cr-switch-track { background: rgba(196, 167, 125, 0.45); }
        .cr-switch-control input:checked + .cr-switch-track::before {
            transform: translateX(16px); background: var(--gold-primary);
        }
        .cr-settings-footer {
            padding: 10px 14px; display: flex; justify-content: flex-end; gap: 8px;
            border-top: 1px solid var(--gold-border-subtle); flex-shrink: 0;
        }
        .cr-footer-btn {
            padding: 6px 16px; background: rgba(255, 255, 255, 0.04);
            border: 1px solid var(--gold-border-subtle); border-radius: 4px;
            color: var(--text-sub); font-family: inherit; font-size: 11px; cursor: pointer; transition: 0.2s;
        }
        .cr-footer-btn:hover { color: var(--gold-light); border-color: var(--gold-border); }
        .cr-footer-btn-primary { background: rgba(196, 167, 125, 0.2); border-color: rgba(196, 167, 125, 0.45); color: var(--gold-bright); }
        .cr-footer-btn-primary:hover { background: rgba(196, 167, 125, 0.32); }

        /* ==========================================================================
           移动端响应式 (@media <= 768px)
           ========================================================================== */
        @media (max-width: 768px) {
            #cr-sidebar {
                position: fixed; left: 0; top: 0; bottom: 0;
                width: 82%; max-width: 310px;
                transform: translateX(-100%);
                box-shadow: 12px 0 45px rgba(0, 0, 0, 0.85);
                border-right: 1px solid var(--gold-border-bright);
            }
            #cr-sidebar.open { transform: translateX(0); }
            .cr-sidebar-close-btn { display: flex; }
            #cr-sidebar-backdrop.show { display: block; opacity: 1; }
            #cr-mobile-topbar { display: flex; }

            #pl-header { padding: 12px 16px 10px; }
            .pl-head-title { font-size: 18px; }
            .cr-addrow { display: none; }
            .track-head-row .col-from, .row-from { display: none; }
            #track-table { padding: 4px 12px 96px; }

            /* 悬浮 Mini 胶囊播放器 */
            #cr-player-bar {
                position: absolute; left: 14px; right: 14px; bottom: 14px;
                height: 64px; border-radius: 32px;
                padding: 0 12px 0 8px; gap: 10px;
                background: linear-gradient(135deg, rgba(16, 19, 28, 0.94) 0%, rgba(9, 11, 17, 0.96) 100%);
                border: 1px solid var(--gold-border-bright);
                box-shadow: 0 12px 35px rgba(0, 0, 0, 0.85), 0 0 20px rgba(196, 167, 125, 0.25);
            }
            .pb-left { width: auto; min-width: 0; flex: 1; gap: 10px; }
            #pb-cover { width: 46px; height: 46px; border-radius: 50%; border-color: var(--gold-primary); }
            #cr-player-fav-btn { display: none; }
            .pb-center { position: static; flex: none; width: auto; }
            .pb-progress-row { position: absolute; left: 24px; right: 24px; bottom: 0; max-width: none; gap: 0; }
            .pb-time { display: none; }
            .bgm-progress { height: 2.5px; border-radius: 0; background: transparent; }
            .pb-ctrl-row { gap: 8px; }
            #cr-prev-btn { display: none; }
            .bgm-play-btn { width: 38px; height: 38px; }
            .pb-right { display: none; }

            /* 黑胶页竖排 + 手机底栏 */
            #cr-vinyl-overlay {
                position: fixed; inset: 0; bottom: 0;
                background: #090c14;
                display: flex; flex-direction: column; justify-content: space-between;
            }
            .vinyl-close { top: 18px; left: 18px; width: 36px; height: 36px; }
            #cr-vinyl-netease-btn { left: auto; right: 18px; }
            .vinyl-stage {
                flex: 1; display: flex; flex-direction: column; align-items: center;
                justify-content: flex-end; padding: 0 12px 26px 12px; gap: 0; min-height: 0;
            }
            .vinyl-turntable { margin: auto 0 0 0; }
            .vinyl-disc { width: min(74vw, 290px, 36vh); height: min(74vw, 290px, 36vh); }
            /* 外圈缩小、中心封面保持原尺寸（占比 62%→73% 补偿） */
            #cr-vinyl-cover { width: 73%; height: 73%; }
            /* 唱臂缩短内移，避免旋转后摆出屏幕外，并让唱针贴近唱片边缘 */
            .vinyl-tonearm { top: -3%; right: 8%; height: 46%; }
            .vinyl-meta { display: none !important; }
            .vinyl-mobile-panel { display: flex; }

            /* 全屏封面模式：封面撑满上部向下羽化，歌词区与手机底栏保持不变 */
            #cr-vinyl-overlay.mode-fullscreen-cover .vinyl-stage { justify-content: flex-start; padding: 0; }
            #cr-vinyl-overlay.mode-fullscreen-cover .fs-cover-art {
                display: block; position: relative; left: auto; top: auto; bottom: auto;
                width: 100%; flex: 1 1 0%; min-height: 0; overflow: hidden; pointer-events: none;
                -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 52%, rgba(0,0,0,0.72) 74%, transparent 100%);
                mask-image: linear-gradient(to bottom, #000 0%, #000 52%, rgba(0,0,0,0.72) 74%, transparent 100%);
            }
            #cr-vinyl-overlay.mode-fullscreen-cover .fs-cover-art img { object-position: center 25%; }
            #cr-vinyl-overlay.mode-fullscreen-cover .vinyl-bg { filter: blur(65px) brightness(0.6) saturate(1.15); }
            #cr-vinyl-overlay.mode-fullscreen-cover .vinyl-mobile-panel {
                background: linear-gradient(180deg, transparent 0%, rgba(12, 14, 20, 0.55) 30%, rgba(12, 14, 20, 0.88) 100%);
            }
            #cr-vinyl-mode-btn { left: auto; right: 64px; }
            .player-mode-modal { top: 62px; right: 14px; left: 14px; width: auto; max-width: none; }

            /* 唱片下方歌词滚动区（固定高度，不参与剩余空间分配，避免挤压唱片） */
            .cr-lyric-mobile {
                display: block; flex: 0 0 168px; height: 168px;
                padding: 0 26px; cursor: pointer;
            }
            .cr-lyric-mobile .cr-lyric-line { text-align: center; }
            .cr-lyric-mobile .cr-lyric-main { font-size: 15.5px; }
            .cr-lyric-mobile .cr-lyric-line.active .cr-lyric-main { font-size: 17.5px; }
            .cr-lyric-mobile .cr-lyric-trans { font-size: 12.5px; }
            .cr-lyric-inner { padding: 60px 0; }
        }

        /* 全屏歌词（点击移动端歌词区展开，PC 不触发） */
        .cr-lyric-scroll.expanded {
            position: fixed; inset: 0; z-index: 40; height: auto; max-height: none;
            padding: 0 30px 40px; cursor: default;
            background: linear-gradient(180deg, rgba(9, 12, 20, 0.98) 0%, rgba(6, 8, 13, 0.99) 100%);
            -webkit-backdrop-filter: blur(30px); backdrop-filter: blur(30px);
            -webkit-mask-image: none; mask-image: none;
        }
        .cr-lyric-scroll.expanded .cr-lyric-head {
            display: block; position: fixed; top: 0; left: 0; right: 0; z-index: 42;
            text-align: center; padding: 34px 70px 16px;
            background: linear-gradient(180deg, rgba(9, 12, 20, 0.98) 0%, rgba(9, 12, 20, 0.92) 70%, rgba(9, 12, 20, 0) 100%);
        }
        .cr-lyric-head-close {
            position: absolute; top: 26px; left: 18px; width: 36px; height: 36px;
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%; cursor: pointer; color: var(--gold-light);
            background: linear-gradient(135deg, rgba(28, 24, 20, 0.85), rgba(12, 14, 18, 0.85));
            border: 1px solid rgba(196, 167, 125, 0.45);
        }
        .cr-lyric-head-close svg { stroke: currentColor; fill: none; }
        .cr-lyric-head-title {
            font-size: 19px; font-weight: 700; color: var(--gold-bright);
            letter-spacing: 0.6px; font-family: var(--font-serif);
            text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8), 0 0 14px rgba(196, 167, 125, 0.3);
        }
        .cr-lyric-head-sub { font-size: 12.5px; color: var(--gold-primary); opacity: 0.85; margin-top: 5px; }
        .cr-lyric-scroll.expanded .cr-lyric-inner { padding: 55% 0 70%; }

        /* 桌面端移动布局预览钩子（URL 带 ?mobile 时生效，规则与 @media 块一致） */
        #cr-app.force-mobile #cr-sidebar {
            position: fixed; left: 0; top: 0; bottom: 0;
            width: 82%; max-width: 310px;
            transform: translateX(-100%);
            box-shadow: 12px 0 45px rgba(0, 0, 0, 0.85);
            border-right: 1px solid var(--gold-border-bright);
        }
        #cr-app.force-mobile #cr-sidebar.open { transform: translateX(0); }
        #cr-app.force-mobile .cr-sidebar-close-btn { display: flex; }
        #cr-app.force-mobile #cr-sidebar-backdrop.show { display: block; opacity: 1; }
        #cr-app.force-mobile #cr-mobile-topbar { display: flex; }
        #cr-app.force-mobile #pl-header { padding: 12px 16px 10px; }
        #cr-app.force-mobile .pl-head-title { font-size: 18px; }
        #cr-app.force-mobile .cr-addrow { display: none; }
        #cr-app.force-mobile .track-head-row .col-from, #cr-app.force-mobile .row-from { display: none; }
        #cr-app.force-mobile #track-table { padding: 4px 12px 96px; }
        #cr-app.force-mobile #cr-player-bar {
            position: absolute; left: 14px; right: 14px; bottom: 14px;
            height: 64px; border-radius: 32px;
            padding: 0 12px 0 8px; gap: 10px;
            background: linear-gradient(135deg, rgba(16, 19, 28, 0.94) 0%, rgba(9, 11, 17, 0.96) 100%);
            border: 1px solid var(--gold-border-bright);
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.85), 0 0 20px rgba(196, 167, 125, 0.25);
        }
        #cr-app.force-mobile .pb-left { width: auto; min-width: 0; flex: 1; gap: 10px; }
        #cr-app.force-mobile #pb-cover { width: 46px; height: 46px; border-radius: 50%; border-color: var(--gold-primary); }
        #cr-app.force-mobile #cr-player-fav-btn { display: none; }
        #cr-app.force-mobile .pb-center { position: static; flex: none; width: auto; }
        #cr-app.force-mobile .pb-progress-row { position: absolute; left: 24px; right: 24px; bottom: 0; max-width: none; gap: 0; }
        #cr-app.force-mobile .pb-time { display: none; }
        #cr-app.force-mobile .bgm-progress { height: 2.5px; border-radius: 0; background: transparent; }
        #cr-app.force-mobile .pb-ctrl-row { gap: 8px; }
        #cr-app.force-mobile #cr-prev-btn { display: none; }
        #cr-app.force-mobile .bgm-play-btn { width: 38px; height: 38px; }
        #cr-app.force-mobile .pb-right { display: none; }
        #cr-app.force-mobile #cr-vinyl-overlay {
            position: fixed; inset: 0; bottom: 0;
            background: #090c14;
            display: flex; flex-direction: column; justify-content: space-between;
        }
        #cr-app.force-mobile .vinyl-close { top: 18px; left: 18px; width: 36px; height: 36px; }
        #cr-app.force-mobile #cr-vinyl-netease-btn { left: auto; right: 18px; }
        #cr-app.force-mobile .vinyl-stage {
            flex: 1; display: flex; flex-direction: column; align-items: center;
            justify-content: flex-end; padding: 0 12px 26px 12px; gap: 0; min-height: 0;
        }
        #cr-app.force-mobile .vinyl-turntable { margin: auto 0 0 0; }
        #cr-app.force-mobile .vinyl-disc { width: min(74vw, 290px, 36vh); height: min(74vw, 290px, 36vh); }
        #cr-app.force-mobile #cr-vinyl-cover { width: 73%; height: 73%; }
        #cr-app.force-mobile .vinyl-tonearm { top: -3%; right: 8%; height: 46%; }
        #cr-app.force-mobile .vinyl-meta { display: none !important; }
        #cr-app.force-mobile .vinyl-mobile-panel { display: flex; }
        #cr-app.force-mobile #cr-vinyl-overlay.mode-fullscreen-cover .vinyl-stage { justify-content: flex-start; padding: 0; }
        #cr-app.force-mobile #cr-vinyl-overlay.mode-fullscreen-cover .fs-cover-art {
            display: block; position: relative; left: auto; top: auto; bottom: auto;
            width: 100%; flex: 1 1 0%; min-height: 0; overflow: hidden; pointer-events: none;
            -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 52%, rgba(0,0,0,0.72) 74%, transparent 100%);
            mask-image: linear-gradient(to bottom, #000 0%, #000 52%, rgba(0,0,0,0.72) 74%, transparent 100%);
        }
        #cr-app.force-mobile #cr-vinyl-overlay.mode-fullscreen-cover .fs-cover-art img { object-position: center 25%; }
        #cr-app.force-mobile #cr-vinyl-overlay.mode-fullscreen-cover .vinyl-bg { filter: blur(65px) brightness(0.6) saturate(1.15); }
        #cr-app.force-mobile #cr-vinyl-overlay.mode-fullscreen-cover .vinyl-mobile-panel {
            background: linear-gradient(180deg, transparent 0%, rgba(12, 14, 20, 0.55) 30%, rgba(12, 14, 20, 0.88) 100%);
        }
        #cr-app.force-mobile #cr-vinyl-mode-btn { left: auto; right: 64px; }
        #cr-app.force-mobile .player-mode-modal { top: 62px; right: 14px; left: 14px; width: auto; max-width: none; }
        #cr-app.force-mobile .cr-lyric-mobile {
            display: block; flex: 0 0 168px; height: 168px;
            padding: 0 26px; cursor: pointer;
        }
        #cr-app.force-mobile .cr-lyric-mobile .cr-lyric-line { text-align: center; }
        #cr-app.force-mobile .cr-lyric-mobile .cr-lyric-main { font-size: 15.5px; }
        #cr-app.force-mobile .cr-lyric-mobile .cr-lyric-line.active .cr-lyric-main { font-size: 17.5px; }
        #cr-app.force-mobile .cr-lyric-mobile .cr-lyric-trans { font-size: 12.5px; }
        #cr-app.force-mobile .cr-lyric-inner { padding: 60px 0; }
        </style>
    `;

    const html = `
        <div id="cr-app">
            <!-- 移动端汉堡顶栏 -->
            <header id="cr-mobile-topbar">
                <button class="cr-mob-menu-btn" id="cr-mob-menu-btn" title="展开频段歌单">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <div class="cr-mob-title">■ 音乐电台</div>
                <button class="cr-mob-gear-btn" id="cr-mob-settings-btn" title="电台设置">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
            </header>

            <!-- 移动抽屉遮罩 -->
            <div id="cr-sidebar-backdrop"></div>

            <div id="cr-app-body">
            <aside id="cr-sidebar">
                <div class="cr-brand">
                    <div class="cr-brand-left">
                        <div class="cr-brand-dot"></div>
                        <span class="cr-brand-title">音乐电台</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:4px;">
                        <span class="cr-header-btn" id="cr-open-settings-btn" title="电台设置">⚙</span>
                        <span class="cr-sidebar-close-btn" id="cr-sidebar-close-btn" title="收起抽屉">✕</span>
                    </div>
                </div>
                <div class="cr-side-search">
                    <div class="cr-search-wrapper">
                        <svg class="cr-search-icon" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" class="cp-input bgm-search-input" id="bgm-search-input" placeholder="搜索全库曲目 / 歌手 / 频段..." autocomplete="off">
                    </div>
                </div>
                <div class="cr-side-section">频 段 歌 单</div>
                <nav id="pl-nav"></nav>
                <div class="cr-side-footer">
                    <div class="cr-side-newrow">
                        <input type="text" class="cp-input" id="new-playlist-name" placeholder="新歌单名称..." autocomplete="off">
                        <button class="cp-btn" id="cr-new-pl-btn" style="padding:5px 12px; font-size:10.5px;">建立</button>
                    </div>
                    <div class="cr-io-grid">
                        <button class="cp-btn" id="cr-import-overwrite-btn" title="覆盖导入：用文件内容完全替换当前所有歌单">覆盖</button>
                        <button class="cp-btn" id="cr-import-merge-btn" title="合并导入：保留现有数据，合并同名歌单并自动过滤重复歌曲">合并</button>
                        <button class="cp-btn" id="cr-export-btn" title="导出歌单备份JSON">导出</button>
                        <button class="cp-btn" id="cr-reset-btn" title="恢复预置默认歌单">重置</button>
                        <input type="file" id="cr-import-file" accept=".json" style="display:none;">
                    </div>
                </div>
            </aside>

            <main id="cr-main">
                <header id="pl-header"></header>
                <div id="track-table"></div>
            </main>
            </div>

            <footer id="cr-player-bar">
                <div class="pb-left">
                    <div id="pb-cover" title="展开黑胶播放页"></div>
                    <div class="pb-info" style="cursor:pointer;" title="展开黑胶播放页">
                        <div id="bgm-now-playing">未接入深空频段</div>
                        <div id="bgm-now-artist">Waiting for signal...</div>
                    </div>
                    <span class="cr-player-tool-btn" id="cr-player-fav-btn" title="收藏当前播放曲目 (至'我的收藏')"></span>
                </div>
                <div class="pb-center">
                    <div class="pb-ctrl-row">
                        <button class="bgm-ctrl-btn" id="cr-prev-btn" title="上一曲"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg></button>
                        <button class="bgm-ctrl-btn bgm-play-btn" id="bgm-play-pause" title="播放/暂停"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button>
                        <button class="bgm-ctrl-btn" id="cr-next-btn" title="下一曲"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg></button>
                    </div>
                    <div class="pb-progress-row">
                        <span class="pb-time" id="pb-cur-time">0:00</span>
                        <div class="bgm-progress" id="bgm-progress-bar">
                            <div class="bgm-progress-fill" id="bgm-progress-fill"></div>
                        </div>
                        <span class="pb-time" id="pb-total-time">0:00</span>
                    </div>
                </div>
                <div class="pb-right">
                    <button class="bgm-mode-btn" id="bgm-mode-btn">${PLAY_MODE_LABELS[playMode] || "顺序播放"}</button>
                    <span class="cr-player-tool-btn" id="cr-player-dl-btn" title="下载当前曲目MP3音频"></span>
                    <div class="cr-vol-container">
                        <div class="cr-vol-icon" id="cr-vol-icon" title="点击静音/恢复"></div>
                        <div class="cr-vol-visualizer-container" title="滑动调节音量">
                            <div class="cr-vol-visualizer" id="cr-vol-visualizer"></div>
                            <input type="range" class="cr-vol-native-slider" id="cr-vol-slider" min="0" max="100" value="80" title="滑动调节音量">
                        </div>
                        <span class="cr-vol-text" id="cr-vol-text">80%</span>
                    </div>
                </div>
                <div class="cr-player-toast" id="cr-player-toast"></div>
            </footer>

            <div id="cr-vinyl-overlay" class="mode-fullscreen-cover">
                <div class="vinyl-bg" id="cr-vinyl-bg"></div>
                <div class="vinyl-vignette"></div>
                <div class="vinyl-close" id="cr-vinyl-close" title="收起播放页">
                    <svg width="18" height="18" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <button type="button" class="vinyl-close cr-vinyl-netease" id="cr-vinyl-netease-btn" title="打开网易云歌曲原页面（登录后可收藏）">
                    <svg width="15" height="15" viewBox="0 0 24 24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </button>
                <button type="button" class="vinyl-close cr-vinyl-mode" id="cr-vinyl-mode-btn" title="切换播放器模式">
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="3" x2="12" y2="6"></line></svg>
                </button>
                <div class="player-mode-modal" id="cr-player-mode-modal">
                    <div class="pm-cards-grid">
                        <div class="pm-mode-card selected" id="pm-card-cover" data-mode="fullscreen-cover">
                            <img class="pm-card-thumb" src="data:image/png;base64,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" alt="全屏封面">
                            <div class="pm-card-title">全屏封面</div>
                            <div class="pm-check-badge">✓</div>
                        </div>
                        <div class="pm-mode-card" id="pm-card-vinyl" data-mode="vinyl">
                            <img class="pm-card-thumb" src="data:image/png;base64,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" alt="经典黑胶">
                            <div class="pm-card-title">经典黑胶</div>
                            <div class="pm-check-badge">✓</div>
                        </div>
                    </div>
                </div>
                <div class="vinyl-stage">
                    <div class="vinyl-turntable">
                        <div class="vinyl-disc" id="cr-vinyl-disc">
                            <img id="cr-vinyl-cover" alt="">
                            <div class="vinyl-center"></div>
                        </div>
                        <div class="vinyl-tonearm" id="cr-vinyl-tonearm"><div class="tonearm-arm"></div><div class="tonearm-head"></div></div>
                    </div>
                    <div class="fs-cover-art"><img id="fs-cover-img" alt=""></div>
                    <div class="vinyl-meta">
                        <div class="v-info-block">
                            <div class="vinyl-title" id="cr-vinyl-title"></div>
                            <div class="v-info-row">
                                <span class="v-info-item">专辑：<b id="cr-vinyl-album"></b></span>
                                <span class="v-info-item">歌手：<b id="cr-vinyl-artist"></b></span>
                                <span class="v-info-item" id="cr-vinyl-source-wrap" style="display:none;">来源：<b id="cr-vinyl-source"></b></span>
                            </div>
                            <div class="v-tab-row"><span class="v-tab active">歌词</span></div>
                        </div>
                        <div class="cr-lyric-scroll" id="cr-lyric-scroll-pc">
                            <div class="cr-lyric-inner" id="cr-lyric-inner-pc"></div>
                        </div>
                    </div>
                </div>

                <!-- 手机歌词滚动区（点击展开全屏歌词） -->
                <div class="cr-lyric-scroll cr-lyric-mobile" id="cr-lyric-scroll-mob" title="点击查看完整歌词">
                    <div class="cr-lyric-head">
                        <span class="cr-lyric-head-close" id="cr-lyric-close-mob" title="收起歌词">
                            <svg width="18" height="18" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </span>
                        <div class="cr-lyric-head-title" id="cr-lyric-head-title"></div>
                        <div class="cr-lyric-head-sub" id="cr-lyric-head-sub"></div>
                    </div>
                    <div class="cr-lyric-inner" id="cr-lyric-inner-mob"></div>
                </div>

                <!-- 手机播放页底栏（4 行控件） -->
                <div class="vinyl-mobile-panel" id="cr-vinyl-mobile-panel">
                    <div class="v-row-meta">
                        <button type="button" class="v-circle-btn" id="v-mob-fav-btn" title="收藏当前曲目"></button>
                        <div class="v-meta-center">
                            <div class="v-meta-title" id="v-mob-title">未接入深空频段</div>
                            <div class="v-meta-artist" id="v-mob-artist">Waiting for signal...</div>
                        </div>
                        <button type="button" class="v-circle-btn" id="v-mob-dl-btn" title="下载当前曲目MP3音频"></button>
                    </div>
                    <div class="v-row-progress" id="v-mob-prog-row" title="点击调整播放进度">
                        <div class="v-progress-track">
                            <div class="v-progress-fill" id="v-mob-prog-fill">
                                <div class="v-progress-bead"></div>
                            </div>
                        </div>
                    </div>
                    <div class="v-row-ctrls">
                        <button type="button" class="v-ctrl-btn" id="v-mob-prev-btn" title="上一曲"><svg viewBox="0 0 24 24"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg></button>
                        <button type="button" class="v-play-btn" id="v-mob-play-btn" title="播放/暂停"><svg id="v-mob-play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button>
                        <button type="button" class="v-ctrl-btn" id="v-mob-next-btn" title="下一曲"><svg viewBox="0 0 24 24"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg></button>
                    </div>
                    <div class="v-row-volume">
                        <span class="v-vol-icon" id="v-mob-vol-icon" title="点击静音/恢复"></span>
                        <div class="v-vol-visualizer-container" id="v-mob-vol-container" title="滑动调节音量">
                            <div class="v-vol-visualizer" id="v-mob-vol-visualizer"></div>
                            <input type="range" class="v-vol-native-slider" id="v-mob-vol-slider" min="0" max="100" value="80" title="滑动调节音量">
                        </div>
                        <span class="v-vol-text" id="v-mob-vol-text">80%</span>
                    </div>
                </div>
            </div>

            <div id="cr-move-modal" class="cr-modal-overlay">
                <div class="cr-modal-box">
                    <div class="cr-modal-title" id="cr-modal-target-song">移动歌曲</div>
                    <div class="cr-modal-list" id="cr-modal-playlist-list"></div>
                    <button class="cr-modal-btn" id="cr-modal-cancel-btn">取消</button>
                </div>
            </div>

            <div id="cr-settings-modal" class="cr-modal-overlay">
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
                                    <div class="cr-switch-desc">关闭后停用背景模糊改用纯色面板，可显著降低 GPU 负担</div>
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
            </div>
        </div>
    `;
    $('head').append(styles);
    $('body').append(html);
    // 字体非阻塞加载：主样式表先行生效，字体 CSS 异步到达后按 display=swap 换装
    $('head').append('<link id="celestial-radio-font" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jura:wght@400;600;700&family=Noto+Serif+SC:wght@300;400;600;700&display=swap">');

    const $ctn = $('#cr-app');

    // 桌面端移动布局预览钩子：URL 带 ?mobile 时强制套用移动样式（与 768px 断点规则一致）
    if (location.search.includes('mobile')) $ctn.addClass('force-mobile');

    applyGlassEffect(localStorage.getItem('cr_glass_effect') !== 'false');

    // === 暗金矢量 SVG 图标定义 ===
    const ICONS = {
        favOutline: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4A77D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
        favSolid: `<svg width="13" height="13" viewBox="0 0 24 24" fill="#C4A77D" stroke="#C4A77D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
        edit: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C4A77D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
        batch: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C4A77D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
        trash: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C4A77D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
        cloudImport: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C4A77D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 17 4 4 4-4"></path></svg>`,
        download: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4A77D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
        move: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C4A77D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
        gear: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C4A77D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
        playBig: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
        pauseBig: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
        songDel: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
    };

    $('#cr-player-dl-btn').html(ICONS.download);
    $('#v-mob-dl-btn').html(ICONS.download);
    $('#cr-open-settings-btn').html(ICONS.gear);
    $('#bgm-mode-btn').text(PLAY_MODE_LABELS[playMode]);

    // === 移动端汉堡抽屉与顶栏 ===
    function openMobileDrawer() { $('#cr-sidebar').addClass('open'); $('#cr-sidebar-backdrop').addClass('show'); }
    function closeMobileDrawer() { $('#cr-sidebar').removeClass('open'); $('#cr-sidebar-backdrop').removeClass('show'); }
    $('#cr-mob-menu-btn').on('click', function(e) { e.stopPropagation(); openMobileDrawer(); });
    $('#cr-sidebar-close-btn').on('click', closeMobileDrawer);
    $('#cr-sidebar-backdrop').on('click', closeMobileDrawer);
    $('#cr-mob-settings-btn').on('click', function(e) { e.stopPropagation(); openSettingsModal(); });


    $('#bgm-mode-btn').on('click', function(e) {
        e.stopPropagation();
        let idx = PLAY_MODES.indexOf(playMode);
        playMode = PLAY_MODES[(idx + 1) % PLAY_MODES.length];
        localStorage.setItem('cr_play_mode', playMode);
        $(this).text(PLAY_MODE_LABELS[playMode]);
        showPlayerToast('📻 播放模式: ' + PLAY_MODE_LABELS[playMode], 1800);
    });


    function openSettingsModal() {
        $('#cr-cfg-history-limit').val(getHistoryLimit().toString());
        $('#cr-cfg-init-autoplay').prop('checked', localStorage.getItem('cr_init_autoplay') === 'true');
        $('#cr-cfg-glass').prop('checked', localStorage.getItem('cr_glass_effect') !== 'false');
        $('#cr-cfg-spectrum').prop('checked', localStorage.getItem('cr_spectrum') === 'true');
        $('#cr-settings-modal').css('display', 'flex');
    }

    $('#cr-open-settings-btn').on('click', function(e) {
        e.stopPropagation();
        openSettingsModal();
    });

    $('#cr-settings-close-x, #cr-settings-cancel-btn').on('click', function(e) {
        e.stopPropagation();
        $('#cr-settings-modal').hide();
    });


    $('#cr-settings-save-btn').on('click', function(e) {
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
    });


    // === 收藏状态检查与同步 ===
    function isSongFavorited(title, artist) {
        let favPl = bgmPlaylists.find(p => p.category === '★ 我的收藏');
        if (!favPl) return false;
        let t = normalizeStr(title);
        return favPl.songs.some(s => normalizeStr(s.title) === t);
    }

    function toggleFavorite(title, artist) {
        let favPl = bgmPlaylists.find(p => p.category === '★ 我的收藏');
        if (!favPl) {
            favPl = { category: '★ 我的收藏', songs: [] };
            bgmPlaylists.unshift(favPl);
        }
        let t = normalizeStr(title);
        let sIdx = favPl.songs.findIndex(s => normalizeStr(s.title) === t);

        if (sIdx !== -1) {
            favPl.songs.splice(sIdx, 1);
            showPlayerToast(`已从我的收藏移除: ${title}`, 2000);
        } else {
            favPl.songs.unshift({ title, artist: artist || 'Unknown' });
            showPlayerToast(`★ 已收藏至我的收藏: ${title}`, 2000);
        }
        

        savePlaylists();
        renderPlaylists();
        updatePlayerFavBtn();
    }

    function updatePlayerFavBtn() {
        if (currentPlayingTrackInfo.title && isSongFavorited(currentPlayingTrackInfo.title, currentPlayingTrackInfo.artist)) {
            $('#cr-player-fav-btn').addClass('is-fav').html(ICONS.favSolid).attr('title', '已收藏 (点击取消收藏)');
            $('#v-mob-fav-btn').addClass('is-fav').html(ICONS.favSolid);
        } else {
            $('#cr-player-fav-btn').removeClass('is-fav').html(ICONS.favOutline).attr('title', '收藏当前曲目至“我的收藏”');
            $('#v-mob-fav-btn').removeClass('is-fav').html(ICONS.favOutline);
        }
    }

    $('#cr-player-fav-btn').on('click', function() {
        if (!currentPlayingTrackInfo.title) return;
        toggleFavorite(currentPlayingTrackInfo.title, currentPlayingTrackInfo.artist);
    });

    // === 音频导出/下载功能 ===
    async function downloadCurrentAudio() {
        if (!audioObj.src) {
            showPlayerToast('当前无正在播放的音频', 2000);
            
            return;
        }

        let title = currentPlayingTrackInfo.title || $('#bgm-now-playing').text() || 'space_radio_audio';
        let artist = currentPlayingTrackInfo.artist || $('#bgm-now-artist').text() || '';
        let filename = artist && artist !== '---' ? `${title} - ${artist}.mp3` : `${title}.mp3`;
        filename = filename.replace(/[/\\?%*:|"<>]/g, '_');

        showPlayerToast('正在捕获音频流并下载...', 2500);

        try {
            const res = await fetch(audioObj.src);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);
            showPlayerToast('✅ 音频下载成功！', 2500);
            
        } catch (e) {
            const a = document.createElement('a');
            a.href = audioObj.src;
            a.target = '_blank';
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            showPlayerToast('已在新标签页建立音频下载管道', 2500);
            
        }
    }
    $('#cr-player-dl-btn').on('click', downloadCurrentAudio);

    // === 等离子频谱波形音量控制与律动引擎 ===
    const VOL_BAR_COUNT = 24;
    const $volVis = $('#cr-vol-visualizer');
    $volVis.empty();
    // 各柱时长在互不成倍数的档位间轮换（奇偶柱波形亦不同），长短峰交错更贴近真实频谱
    const VOL_DURATIONS = [0.54, 0.71, 0.62, 0.83, 0.59, 0.76];
    for (let i = 0; i < VOL_BAR_COUNT; i++) {
        const dur = VOL_DURATIONS[i % VOL_DURATIONS.length];
        $volVis.append(`<div class="cr-vol-bar" style="animation-duration: ${dur}s; animation-delay: -${(i * 0.09 % dur).toFixed(2)}s"></div>`);
    }
    const volBars = $volVis.children('.cr-vol-bar');

    // === 手机黑胶底栏 26 柱律动条（与 PC 24 柱同步驱动） ===
    const V_MOB_VOL_COUNT = 26;
    const $vMobVolVis = $('#v-mob-vol-visualizer');
    $vMobVolVis.empty();
    for (let i = 0; i < V_MOB_VOL_COUNT; i++) {
        const dur = VOL_DURATIONS[i % VOL_DURATIONS.length];
        $vMobVolVis.append(`<div class="v-vol-bar" style="animation-duration: ${dur}s; animation-delay: -${(i * 0.08 % dur).toFixed(2)}s"></div>`);
    }
    const vMobVolBars = $vMobVolVis.children('.v-vol-bar');

    function updateVolAnimState() {
        const playing = isPlaying && !isLoading && !audioObj.paused && audioObj.volume > 0;
        const real = playing && spectrumRealActive && !document.hidden;
        $volVis.toggleClass('playing', playing);
        $volVis.toggleClass('real-spectrum', real);
        $vMobVolVis.toggleClass('playing', playing);
        $vMobVolVis.toggleClass('real-spectrum', real);
        if (real) startSpectrumLoop(); else stopSpectrumLoop();
    }

    // 页面不可见时暂停频谱 rAF 与波形动画，恢复可见时按状态重启
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            updateVolAnimState();
        } else if (spectrumRealActive) {
            spectrumZeroFrames = 0;
            updateVolAnimState();
        }
    });

    // === 真实音频频谱引擎状态（声明须先于初始化期的首次 updateVolumeUI 调用，函数体在后方原 rAF 循环位置） ===
    let spectrumCtx = null, spectrumAnalyser = null, spectrumSource = null;
    let spectrumRafId = 0, spectrumZeroFrames = 0, spectrumData = null;
    let spectrumRealActive = false, spectrumFallbackToasted = false;
    const spectrumCorsCache = {};
    const SPECTRUM_BIN_IDX = [];
    for (let i = 0; i < VOL_BAR_COUNT; i++) SPECTRUM_BIN_IDX.push(1 + Math.round(Math.pow(i / (VOL_BAR_COUNT - 1), 1.6) * 79));
    const spectrumRaw = new Array(VOL_BAR_COUNT).fill(0);
    let spectrumRef = 0.35;
    const spectrumSmooth = new Array(VOL_BAR_COUNT).fill(0.1875);
    const spectrumAvg = new Array(VOL_BAR_COUNT).fill(-1);
    // 频率均衡：压低低频柱权重、抬高高频柱权重，避免低频撑满不动、高频趴底
    const SPECTRUM_TILT = [];
    for (let i = 0; i < VOL_BAR_COUNT; i++) SPECTRUM_TILT.push(0.55 + 0.65 * (i / (VOL_BAR_COUNT - 1)));

    function updateVolumeUI(vol) {
        let pct = Math.round(vol * 100);
        $('#cr-vol-slider').val(pct);
        $('#cr-vol-text').text(pct + '%');
        $volVis[0].style.setProperty('--cr-vol', vol);
        updateVolAnimState();

        const activeCount = Math.round(vol * VOL_BAR_COUNT);
        volBars.each(function(idx) {
            if (idx < activeCount) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        });

        // 同步手机黑胶底栏音量（26 柱 / 滑块 / 百分比）
        const vMobActiveCount = Math.round(vol * V_MOB_VOL_COUNT);
        $vMobVolVis[0].style.setProperty('--cr-vol', vol);
        vMobVolBars.each(function(idx) {
            if (idx < vMobActiveCount) $(this).addClass('active');
            else $(this).removeClass('active');
        });
        $('#v-mob-vol-slider').val(pct);
        $('#v-mob-vol-text').text(pct + '%');

        const svgSpeakerHigh = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4A77D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(196,167,125,0.2)"></polygon><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M19 5a10 10 0 0 1 0 14"></path></svg>`;
        const svgSpeakerLow = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4A77D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(196,167,125,0.2)"></polygon><path d="M15.5 8.5a5 5 0 0 1 0 7"></path></svg>`;
        const svgSpeakerMute = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D34B4B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="rgba(211,75,75,0.2)"></polygon><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line></svg>`;

        if (vol === 0) {
            $('#cr-vol-icon').html(svgSpeakerMute).attr('title', '已静音 (点击恢复)');
            $('#v-mob-vol-icon').html(svgSpeakerMute);
        } else if (vol < 0.5) {
            $('#cr-vol-icon').html(svgSpeakerLow).attr('title', '音量较小 (点击静音)');
            $('#v-mob-vol-icon').html(svgSpeakerLow);
        } else {
            $('#cr-vol-icon').html(svgSpeakerHigh).attr('title', '正常音量 (点击静音)');
            $('#v-mob-vol-icon').html(svgSpeakerHigh);
        }
    }
    updateVolumeUI(audioObj.volume);

    // 原生无阻碍 input change 监听（100% 原生跟手拖动与点击）
    $('#cr-vol-slider').on('input change', function(e) {
        let val = parseFloat($(this).val()) / 100;
        if (isNaN(val) || val < 0) val = 0;
        if (val > 1) val = 1;
        audioObj.volume = val;
        currentVolume = val;
        if (val > 0) lastNonZeroVolume = val;
        // 仅在拖动结束时持久化，input 期间高频触发不写 localStorage
        if (e.type === 'change') localStorage.setItem('cr_player_volume', val.toString());
        updateVolumeUI(val);
    });

    $('#cr-vol-icon').on('click', function() {
        if (audioObj.volume > 0) {
            lastNonZeroVolume = audioObj.volume;
            audioObj.volume = 0;
            currentVolume = 0;
        } else {
            audioObj.volume = lastNonZeroVolume;
            currentVolume = lastNonZeroVolume;
        }
        localStorage.setItem('cr_player_volume', currentVolume.toString());
        updateVolumeUI(currentVolume);
    });

    // 手机黑胶底栏音量滑块与静音键
    $('#v-mob-vol-slider').on('input change', function(e) {
        let val = parseFloat($(this).val()) / 100;
        if (isNaN(val) || val < 0) val = 0;
        if (val > 1) val = 1;
        audioObj.volume = val;
        currentVolume = val;
        if (val > 0) lastNonZeroVolume = val;
        if (e.type === 'change') localStorage.setItem('cr_player_volume', val.toString());
        updateVolumeUI(val);
    });
    $('#v-mob-vol-icon').on('click', function() {
        if (audioObj.volume > 0) {
            lastNonZeroVolume = audioObj.volume;
            audioObj.volume = 0;
            currentVolume = 0;
        } else {
            audioObj.volume = lastNonZeroVolume;
            currentVolume = lastNonZeroVolume;
        }
        localStorage.setItem('cr_player_volume', currentVolume.toString());
        updateVolumeUI(currentVolume);
    });

    // 波形律动已迁移至纯 CSS 合成器动画（crVolDance 关键帧），移除 JS 每帧循环，消除移动端掉帧

    // === 真实音频频谱引擎（设置面板可选，默认关闭；跨域音源自动回退 CSS 律动，绝不影响播放） ===
    function spectrumEnabled() { return localStorage.getItem('cr_spectrum') === 'true'; }

    function ensureSpectrumGraph() {
        if (spectrumSource || !audioObj.crossOrigin) return;
        try {
            spectrumCtx = new (window.AudioContext || window.webkitAudioContext)();
            spectrumSource = spectrumCtx.createMediaElementSource(audioObj);
            spectrumAnalyser = spectrumCtx.createAnalyser();
            spectrumAnalyser.fftSize = 256;
            spectrumAnalyser.smoothingTimeConstant = 0.65;
            spectrumSource.connect(spectrumAnalyser);
            spectrumAnalyser.connect(spectrumCtx.destination);
        } catch (e) {
            console.warn('太空电台：频谱引擎初始化失败，回退模拟律动', e);
            spectrumSource = null; spectrumAnalyser = null;
        }
    }

    function rebuildAudioElement() {
        // 音频图一旦建立无法撤销：改载非跨域音源前重建 audio 元素，避免整条输出被跨域污染静音
        const old = audioObj;
        old.pause();
        try { if (spectrumCtx) spectrumCtx.close(); } catch (e) {}
        spectrumCtx = null; spectrumAnalyser = null; spectrumSource = null;
        audioObj = document.createElement('audio');
        audioObj.volume = old.volume;
        attachAudioListeners(audioObj);
    }

    async function prepareSpectrumForSrc(url) {
        spectrumRealActive = false;
        if (!spectrumEnabled()) {
            audioObj.removeAttribute('crossorigin');
            // 元素一旦接入音频图，后续所有加载都必须带 crossOrigin 否则输出静音：
            // 关闭频谱开关后遇到首首歌时重建元素，彻底脱离 Web Audio 路由
            if (spectrumSource) rebuildAudioElement();
            return;
        }
        let host = '';
        try { host = new URL(url).host; } catch (e) {}
        let corsOk;
        if (host && (host in spectrumCorsCache)) corsOk = spectrumCorsCache[host];
        else {
            // 2 字节 Range 预检（Range 为安全头不触发预检请求），2.5s 超时防拖慢起播
            try {
                await Promise.race([
                    fetch(url, { headers: { Range: 'bytes=0-1' }, mode: 'cors', cache: 'no-store' }),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2500))
                ]);
                corsOk = true;
            } catch (e) { corsOk = false; }
            if (host) spectrumCorsCache[host] = corsOk;
        }
        if (corsOk) {
            audioObj.crossOrigin = 'anonymous';
            ensureSpectrumGraph();
            spectrumRealActive = !!spectrumSource;
        } else {
            audioObj.removeAttribute('crossorigin');
            if (spectrumSource) rebuildAudioElement();
            if (!spectrumFallbackToasted) {
                spectrumFallbackToasted = true;
                showPlayerToast('该音源不支持频谱分析，已回退模拟律动', 2500);
            }
        }
    }

    function startSpectrumLoop() {
        if (spectrumRafId || !spectrumAnalyser) return;
        if (spectrumCtx.state === 'suspended') spectrumCtx.resume();
        if (!spectrumData) spectrumData = new Uint8Array(spectrumAnalyser.frequencyBinCount);
        spectrumZeroFrames = 0;
        const tick = () => {
            if (!spectrumRealActive || document.hidden) { spectrumRafId = 0; return; }
            spectrumAnalyser.getByteFrequencyData(spectrumData);
            // 频率均衡后求本帧峰值，用于形状项的动态增益
            let frameMax = 0;
            for (let i = 0; i < VOL_BAR_COUNT; i++) {
                const raw = Math.min(1, (spectrumData[SPECTRUM_BIN_IDX[i]] / 255) * SPECTRUM_TILT[i]);
                spectrumRaw[i] = raw;
                if (raw > frameMax) frameMax = raw;
            }
            spectrumRef = Math.max(frameMax, spectrumRef * 0.996);
            const gain = 1.0 / Math.max(0.25, spectrumRef);
            for (let i = 0; i < VOL_BAR_COUNT; i++) {
                const raw = spectrumRaw[i];
                // 每柱慢均值 AGC：相对偏离即节拍起伏，安静与响亮的歌曲均围绕中线跳动
                if (spectrumAvg[i] < 0) spectrumAvg[i] = raw;
                else spectrumAvg[i] += (raw - spectrumAvg[i]) * 0.006;
                const dev = (raw - spectrumAvg[i]) / Math.max(0.12, spectrumAvg[i]);
                // 形状项 30% 保留频谱轮廓，偏离项 45% 放大节奏起伏；element.volume 不影响分析器读数需手动联动
                const target = Math.max(0.1875, Math.min(1.3, (0.35 + 0.3 * Math.min(1, raw * gain) + 0.45 * dev) * audioObj.volume));
                // 指数趋近平滑：上升快（跟拍）、下降慢（回落平缓），消除高频闪烁
                spectrumSmooth[i] += (target - spectrumSmooth[i]) * (target > spectrumSmooth[i] ? 0.5 : 0.3);
                volBars[i].style.transform = 'scaleY(' + Math.max(0.1875, spectrumSmooth[i]).toFixed(3) + ')';
            }
            // 26 根手机柱按同一平滑频谱取近邻映射（26>24，末柱取末段数据）；柱体比 PC 小，加 1.15 增益保持同等舞动幅度
            for (let j = 0; j < V_MOB_VOL_COUNT; j++) {
                const src = Math.min(VOL_BAR_COUNT - 1, Math.round(j * (VOL_BAR_COUNT - 1) / (V_MOB_VOL_COUNT - 1)));
                const val = Math.min(1.3, Math.max(0.1875, spectrumSmooth[src] * 1.15));
                vMobVolBars[j].style.transform = 'scaleY(' + val.toFixed(3) + ')';
            }
            if (frameMax === 0) {
                // 播放中持续约 2 秒全零：链路被跨域污染，自动回退模拟律动
                if (++spectrumZeroFrames > 120) { spectrumRealActive = false; updateVolAnimState(); return; }
            } else spectrumZeroFrames = 0;
            spectrumRafId = requestAnimationFrame(tick);
        };
        spectrumRafId = requestAnimationFrame(tick);
    }

    function stopSpectrumLoop() {
        if (spectrumRafId) { cancelAnimationFrame(spectrumRafId); spectrumRafId = 0; }
        volBars.each(function() { if (this.style.transform) this.style.transform = ''; });
        vMobVolBars.each(function() { if (this.style.transform) this.style.transform = ''; });
    }

    // === 频段位置调整与排序 ===
    function movePlaylist(fromIdx, toIdx) {
        if (fromIdx === toIdx || fromIdx < 0 || fromIdx >= bgmPlaylists.length || toIdx < 0 || toIdx >= bgmPlaylists.length) return;
        let moved = bgmPlaylists.splice(fromIdx, 1)[0];
        bgmPlaylists.splice(toIdx, 0, moved);

        if (currentPlaylistIndex === fromIdx) {
            currentPlaylistIndex = toIdx;
        } else if (fromIdx < currentPlaylistIndex && toIdx >= currentPlaylistIndex) {
            currentPlaylistIndex--;
        } else if (fromIdx > currentPlaylistIndex && toIdx <= currentPlaylistIndex) {
            currentPlaylistIndex++;
        }

        savePlaylists();
        renderPlaylists();
    }

    // === 歌曲移动模态框逻辑（防挤压自适应） ===
    let moveTargetSong = null;
    let batchPlaylistIndex = null;
    let selectedSongsSet = new Set();
    let batchMovePlaylistIndex = null;

    function openBatchMoveModal(pIdx) {
        batchMovePlaylistIndex = pIdx;
        moveTargetSong = null;
        let listHtml = '';
        bgmPlaylists.forEach((p, idx) => {
            if (idx === pIdx) return;
            listHtml += `<div class="cr-modal-item" data-targetidx="${idx}">➔ ${p.category}</div>`;
        });
        if (!listHtml) listHtml = '<div style="color:#666; font-size:10px; text-align:center; padding:10px;">无可移动的目标频段</div>';
        $('#cr-modal-target-song').text(`批量迁移 (${selectedSongsSet.size} 首歌曲)`);
        $('#cr-modal-playlist-list').html(listHtml);
        $('#cr-move-modal').css('display', 'flex');
    }

    function openMoveSongModal(pIdx, sIdx) {
        let cat = bgmPlaylists[pIdx];
        if (!cat || !cat.songs[sIdx]) return;
        let song = cat.songs[sIdx];
        moveTargetSong = { pIdx, sIdx, song };

        $('#cr-modal-target-song').text(`移动: ${song.title}`);
        let listHtml = '';
        bgmPlaylists.forEach((p, idx) => {
            if (idx === pIdx) return;
            listHtml += `<div class="cr-modal-item" data-targetidx="${idx}">➔ ${p.category}</div>`;
        });
        if (!listHtml) listHtml = '<div style="color:#666; font-size:10px; text-align:center; padding:10px;">无可移动的目标频段</div>';

        $('#cr-modal-playlist-list').html(listHtml);
        $('#cr-move-modal').css('display', 'flex');
    }

    $ctn.on('click', '#cr-move-modal .cr-modal-item', function() {
        let targetIdx = parseInt($(this).data('targetidx'), 10);
        if (batchMovePlaylistIndex !== null && targetIdx >= 0 && targetIdx < bgmPlaylists.length) {
            let fromCat = bgmPlaylists[batchMovePlaylistIndex];
            let targetCat = bgmPlaylists[targetIdx];
            if (fromCat && targetCat && targetIdx !== batchMovePlaylistIndex) {
                let sortedIndices = Array.from(selectedSongsSet).sort((a, b) => b - a);
                let movedSongs = [];
                sortedIndices.forEach(sIdx => {
                    let s = fromCat.songs.splice(sIdx, 1)[0];
                    if (s) movedSongs.unshift(s);
                });
                targetCat.songs.push(...movedSongs);
                let count = movedSongs.length;
                selectedSongsSet.clear();
                batchPlaylistIndex = null;
                batchMovePlaylistIndex = null;
                savePlaylists();
                renderPlaylists();
                showPlayerToast(`已成功将 ${count} 首歌曲迁移至: ${targetCat.category}`, 2500);
            }
            $('#cr-move-modal').hide();
            batchMovePlaylistIndex = null;
            return;
        }

        if (moveTargetSong && targetIdx >= 0 && targetIdx < bgmPlaylists.length) {
            let fromCat = bgmPlaylists[moveTargetSong.pIdx];
            let targetCat = bgmPlaylists[targetIdx];
            if (fromCat && targetCat) {
                let moved = fromCat.songs.splice(moveTargetSong.sIdx, 1)[0];
                targetCat.songs.push(moved);
                savePlaylists();
                renderPlaylists();
                showPlayerToast(`已将歌曲移动至: ${targetCat.category}`, 2000);
            }
        }
        $('#cr-move-modal').hide();
        moveTargetSong = null;
        batchMovePlaylistIndex = null;
    });

    $('#cr-modal-cancel-btn').on('click', function() {
        $('#cr-move-modal').hide();
        moveTargetSong = null;
    });

    // === 全库搜索状态与歌单渲染 ===
    let globalSearchQuery = '';

    // 初始默认展示「最近播放」页（该歌单缺失时回退首个歌单）
    let selectedPlaylistIndex = Math.max(0, bgmPlaylists.findIndex(p => p.category === '🕒 最近播放'));

    function renderPlaylists() {
        if (selectedPlaylistIndex >= bgmPlaylists.length) selectedPlaylistIndex = Math.max(0, bgmPlaylists.length - 1);
        renderSidebarNav();
        renderTrackTable();
        updatePlayerFavBtn();
    }

    function renderSidebarNav() {
        let html = '';
        bgmPlaylists.forEach((cat, cIdx) => {
            let isPlayingPl = (currentPlaylistIndex === cIdx);
            let isSel = (selectedPlaylistIndex === cIdx);
            html += `<div class="playlist-cat pl-nav-item ${isPlayingPl ? 'active-playlist' : ''} ${isSel ? 'selected' : ''}" id="nav-${cIdx}" data-cidx="${cIdx}" draggable="true">
                <span class="nav-play-mark">▶</span>
                <span class="nav-name">${cat.category}</span>
                <span class="nav-count">${cat.songs.length}</span>
                <span class="nav-ops">
                    <span class="cr-cat-order-btn cr-cat-import-163" data-idx="${cIdx}" title="导入网易云歌单曲目">${ICONS.cloudImport}</span>
                    <span class="cr-cat-order-btn cr-cat-up" data-idx="${cIdx}" title="上移歌单">▲</span>
                    <span class="cr-cat-order-btn cr-cat-down" data-idx="${cIdx}" title="下移歌单">▼</span>
                </span>
            </div>`;
        });
        $('#pl-nav').html(html);
    }

    function renderTrackTable() {
        let q = (globalSearchQuery || '').trim().toLowerCase();
        let localUrlCache = null; // 惰性解析一次，避免每首歌同步 JSON.parse
        const resolveArtist = (name, art) => {
            let sArt = art || '';
            if (sArt === '[本地直链解析]' || !sArt) {
                if (localUrlCache === null) localUrlCache = JSON.parse(localStorage.getItem('celestial_custom_urls') || '{}');
                if (localUrlCache[name]) sArt = localUrlCache[name];
                else if (customUrlDb[name]) sArt = customUrlDb[name];
            }
            return sArt || 'Unknown';
        };
        const rowHtml = (cat, cIdx, sIdx, showFrom, rowNum) => {
            let song = cat.songs[sIdx];
            let sName = song.title;
            let sArt = resolveArtist(sName, song.artist);
            let isPlayingCls = (currentPlaylistIndex === cIdx && currentSongIndex === sIdx) ? 'playing' : '';
            let isFav = isSongFavorited(sName, sArt);
            let isBatchMode = (batchPlaylistIndex === cIdx);
            let isChecked = isBatchMode && selectedSongsSet.has(sIdx);
            let batchSelectedCls = isChecked ? 'batch-selected' : '';
            return `<div class="song-item ${isPlayingCls} ${batchSelectedCls} cr-song-row" data-pidx="${cIdx}" data-sidx="${sIdx}" draggable="${isBatchMode ? 'false' : 'true'}">
                ${isBatchMode ? `<input type="checkbox" class="cr-song-check" data-pidx="${cIdx}" data-sidx="${sIdx}" ${isChecked ? 'checked' : ''}>` : `<div class="row-index">${rowNum}</div>`}
                <div class="song-info">
                    <span class="song-name">${sName}</span>
                    <span class="song-artist">${sArt}</span>
                </div>
                ${showFrom ? `<span class="row-from">${cat.category}</span>` : ''}
                <div class="song-actions">
                    <span class="song-action-btn cr-song-fav ${isFav ? 'is-fav' : ''}" data-pidx="${cIdx}" data-sidx="${sIdx}" title="${isFav ? '已收藏 (点击取消)' : '收藏至我的收藏'}">${isFav ? ICONS.favSolid : ICONS.favOutline}</span>
                    <span class="song-action-btn cr-song-edit" data-pidx="${cIdx}" data-sidx="${sIdx}" title="编辑歌曲名与歌手">${ICONS.edit}</span>
                    <span class="song-action-btn cr-song-move" data-pidx="${cIdx}" data-sidx="${sIdx}" title="移动到其他歌单">${ICONS.move}</span>
                    <span class="song-action-btn cr-del-song" data-pidx="${cIdx}" data-sidx="${sIdx}" title="移除曲目">${ICONS.songDel}</span>
                </div>
            </div>`;
        };

        let headHtml = '';
        let bodyHtml = '';

        if (q) {
            let total = 0;
            bgmPlaylists.forEach((cat, cIdx) => {
                cat.songs.forEach((s, sIdx) => {
                    let t = (s.title || '').toLowerCase();
                    let a = (s.artist || '').toLowerCase();
                    let c = (cat.category || '').toLowerCase();
                    if (t.includes(q) || a.includes(q) || c.includes(q)) {
                        bodyHtml += rowHtml(cat, cIdx, sIdx, true, ++total);
                    }
                });
            });
            headHtml = `<div class="pl-head-info"><div class="pl-head-title">搜索结果</div><div class="pl-head-sub">全库即时过滤 · 共 <b>${total}</b> 首匹配（回车转全网检索）</div></div><div class="pl-head-tools"></div>`;
            if (total === 0) {
                bodyHtml = `<div class="track-empty"><div class="big">🔍</div><div>全库未找到包含 “<span style="color:#C4A77D;">${globalSearchQuery}</span>” 的曲目</div><button class="cp-btn cr-online-search-btn" style="margin-top:14px; padding:6px 14px; border-color:#C4A77D; color:#C4A77D;" data-query="${globalSearchQuery}">🌐 全网检索并试听</button></div>`;
            }
        } else {
            if (selectedPlaylistIndex < 0 || selectedPlaylistIndex >= bgmPlaylists.length) { $('#pl-header').html(''); $('#track-table').html(''); return; }
            let cat = bgmPlaylists[selectedPlaylistIndex];
            let isPlayingPl = (currentPlaylistIndex === selectedPlaylistIndex);
            let isSysPl = (cat.category === '★ 我的收藏' || cat.category === '🕒 最近播放');
            headHtml = `<div class="pl-head-info">
                    <div class="pl-head-title">${cat.category}</div>
                    <div class="pl-head-sub">共 <b>${cat.songs.length}</b> 首曲目${isPlayingPl ? ' · <b>正在播放该歌单</b>' : ''}</div>
                </div>
                <div class="pl-head-tools">
                    <span class="cr-cat-action-btn cr-rename-pl" data-idx="${selectedPlaylistIndex}" title="重命名该歌单">${ICONS.edit}</span>
                    <span class="cr-cat-action-btn cr-cat-import-163" data-idx="${selectedPlaylistIndex}" title="导入网易云歌单曲目">${ICONS.cloudImport}</span>
                    <span class="cr-cat-action-btn cr-batch-toggle ${batchPlaylistIndex === selectedPlaylistIndex ? 'active' : ''}" data-idx="${selectedPlaylistIndex}" title="${batchPlaylistIndex === selectedPlaylistIndex ? '退出多选管理' : '批量多选管理'}">${ICONS.batch}</span>
                    <span class="cr-cat-action-btn cr-del-pl" data-idx="${selectedPlaylistIndex}" title="${isSysPl ? '清空歌单曲目' : '删除该歌单'}">${ICONS.trash}</span>
                    <div class="cr-addrow">
                        <input type="text" class="cp-input cr-new-song-input" id="new-song-input-${selectedPlaylistIndex}" placeholder="歌名 - 歌手(或填网址)" autocomplete="off">
                        <button class="cp-btn cr-add-song" data-idx="${selectedPlaylistIndex}">刻录</button>
                    </div>
                </div>`;
            bodyHtml = `<div class="track-head-row">
                <span style="width:32px; text-align:center; flex-shrink:0;">#</span>
                <span style="flex:1;">标题 / 歌手</span>
                <span class="col-from" style="width:140px; margin-right:14px; flex-shrink:0;">频段</span>
                <span style="width:128px; text-align:right; padding-right:8px; flex-shrink:0;">操作</span>
            </div>`;
            if (batchPlaylistIndex === selectedPlaylistIndex) {
                let isAllSel = cat.songs.length > 0 && selectedSongsSet.size === cat.songs.length;
                bodyHtml += `<div class="cr-batch-bar">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" class="cr-batch-select-all" data-pidx="${selectedPlaylistIndex}" ${isAllSel ? 'checked' : ''} style="cursor:pointer; accent-color:#C4A77D;" title="全选 / 取消全选">
                        <span style="color:#C4A77D; font-weight:600;">已选 ${selectedSongsSet.size}/${cat.songs.length}</span>
                    </div>
                    <div style="display:flex; align-items:center;">
                        <button class="cp-btn cr-batch-fav-btn" data-pidx="${selectedPlaylistIndex}" title="批量收藏到【★ 我的收藏】">★ 收藏</button>
                        <button class="cp-btn cr-batch-move-btn" data-pidx="${selectedPlaylistIndex}" title="批量迁移到其他歌单">⇄ 迁移</button>
                        <button class="cp-btn cr-batch-del-btn" data-pidx="${selectedPlaylistIndex}" title="批量删除选中曲目">🗑️ 删除</button>
                        <button class="cp-btn cr-batch-exit-btn" data-pidx="${selectedPlaylistIndex}" title="退出多选">✕</button>
                    </div>
                </div>`;
            }
            if (cat.songs.length === 0) {
                bodyHtml += `<div class="track-empty"><div class="big">📡</div><div>该歌单暂无曲目 — 从上方输入框刻录，或把歌曲拖进左侧歌单</div></div>`;
            } else {
                cat.songs.forEach((s, sIdx) => { bodyHtml += rowHtml(cat, selectedPlaylistIndex, sIdx, false, sIdx + 1); });
            }
        }
        $('#pl-header').html(headHtml);
        $('#track-table').html(bodyHtml);
    }


    // === HTML5 拖拽事件 ===
    let draggedCatIndex = null;
    let draggedSongData = null;

    $ctn.on('dragstart', '.song-item', function(e) {
        e.stopPropagation();
        draggedSongData = {
            pIdx: parseInt($(this).data('pidx'), 10),
            sIdx: parseInt($(this).data('sidx'), 10)
        };
        $(this).addClass('song-dragging');
        if (e.originalEvent && e.originalEvent.dataTransfer) {
            e.originalEvent.dataTransfer.effectAllowed = 'move';
            e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(draggedSongData));
        }
    });

    $ctn.on('dragend', '.song-item', function(e) {
        $('.song-item').removeClass('song-dragging song-drag-over');
        $('.playlist-cat').removeClass('song-drag-target');
        draggedSongData = null;
    });

    $ctn.on('dragstart', '.playlist-cat', function(e) {
        if (draggedSongData) return;
        if ($(e.target).is('input, button, select, textarea, .cr-del-pl, .cr-del-song, .song-action-btn, .cr-cat-order-btn, .cr-header-btn')) {
            e.preventDefault();
            return;
        }
        draggedCatIndex = parseInt($(this).data('cidx'), 10);
        $(this).addClass('dragging');
        if (e.originalEvent && e.originalEvent.dataTransfer) {
            e.originalEvent.dataTransfer.effectAllowed = 'move';
            e.originalEvent.dataTransfer.setData('text/plain', draggedCatIndex.toString());
        }
    });

    $ctn.on('dragend', '.playlist-cat', function(e) {
        $('.playlist-cat').removeClass('dragging drag-over-top drag-over-bottom song-drag-target');
        draggedCatIndex = null;
    });

    $ctn.on('dragover', '.playlist-cat', function(e) {
        e.preventDefault();
        if (draggedSongData) {
            $(this).addClass('song-drag-target');
            return;
        }
        if (draggedCatIndex === null) return;
        if (e.originalEvent && e.originalEvent.dataTransfer) {
            e.originalEvent.dataTransfer.dropEffect = 'move';
        }
        let targetIndex = parseInt($(this).data('cidx'), 10);
        if (targetIndex === draggedCatIndex) {
            $(this).removeClass('drag-over-top drag-over-bottom');
            return;
        }

        let rect = this.getBoundingClientRect();
        let midY = rect.top + rect.height / 2;
        if (e.originalEvent.clientY < midY) {
            $(this).addClass('drag-over-top').removeClass('drag-over-bottom');
        } else {
            $(this).addClass('drag-over-bottom').removeClass('drag-over-top');
        }
    });

    $ctn.on('dragleave', '.playlist-cat', function(e) {
        $(this).removeClass('drag-over-top drag-over-bottom song-drag-target');
    });

    $ctn.on('drop', '.playlist-cat', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('.playlist-cat').removeClass('drag-over-top drag-over-bottom song-drag-target');

        if (draggedSongData) {
            let targetPIdx = parseInt($(this).data('cidx'), 10);
            if (targetPIdx !== draggedSongData.pIdx && targetPIdx >= 0 && targetPIdx < bgmPlaylists.length) {
                let fromCat = bgmPlaylists[draggedSongData.pIdx];
                let toCat = bgmPlaylists[targetPIdx];
                let moved = fromCat.songs.splice(draggedSongData.sIdx, 1)[0];
                toCat.songs.push(moved);
                savePlaylists();
                renderPlaylists();
                showPlayerToast(`已将歌曲拖拽移入: ${toCat.category}`, 2000);
                
            }
            draggedSongData = null;
            return;
        }

        if (draggedCatIndex === null) return;
        let targetIndex = parseInt($(this).data('cidx'), 10);
        let rect = this.getBoundingClientRect();
        let midY = rect.top + rect.height / 2;
        let insertAfter = e.originalEvent.clientY >= midY;

        let newIndex = insertAfter ? targetIndex + 1 : targetIndex;
        if (draggedCatIndex < newIndex) newIndex--;

        if (newIndex !== draggedCatIndex && newIndex >= 0 && newIndex < bgmPlaylists.length) {
            movePlaylist(draggedCatIndex, newIndex);
        }
        draggedCatIndex = null;
    });

    // === 从网易云歌单链接批量导入曲目 ===
    async function fetchNetEasePlaylistTracks(pid) {
        try {
            let res = await fetch(`https://music-api.gdstudio.xyz/api.php?types=playlist&id=${pid}`);
            if (res.ok) {
                let data = await res.json();
                let pl = data.playlist || {};
                let tracks = pl.tracks || [];
                if (tracks.length > 0) {
                    return {
                        name: pl.name || '',
                        tracks: tracks.map(t => ({
                            title: (t.name || '').trim(),
                            artist: (Array.isArray(t.ar || t.artists) ? (t.ar || t.artists).map(a => a.name).filter(Boolean).join(' / ') : '').trim()
                        }))
                    };
                }
            }
        } catch (e) {}

        try {
            let res = await fetch(`https://music.163.com/api/v6/playlist/detail?id=${pid}`);
            if (res.ok) {
                let data = await res.json();
                let pl = data.playlist || {};
                let trackIds = (pl.trackIds || []).map(t => t.id);
                if (trackIds.length > 0) {
                    let cParam = encodeURIComponent(JSON.stringify(trackIds.map(tid => ({ id: tid }))));
                    let sRes = await fetch(`https://music.163.com/api/v3/song/detail?c=${cParam}`);
                    if (sRes.ok) {
                        let sData = await sRes.json();
                        let songs = sData.songs || [];
                        return {
                            name: pl.name || '',
                            tracks: songs.map(s => ({
                                title: (s.name || '').trim(),
                                artist: (Array.isArray(s.ar || s.artists) ? (s.ar || s.artists).map(a => a.name).filter(Boolean).join(' / ') : '').trim()
                            }))
                        };
                    }
                }
            }
        } catch (e) {}

        return null;
    }

    $ctn.on('click', '.cr-cat-import-163', async function(e) {
        e.stopPropagation();
        let idx = parseInt($(this).data('idx'), 10);
        let targetPl = bgmPlaylists[idx];
        if (!targetPl) return;

        let input = prompt(`【导入网易云歌单至：${targetPl.category}】\n请输入网易云歌单分享链接（或歌单纯数字 ID）：`);
        if (input === null) return;
        input = input.trim();
        if (!input) return;

        let pid = null;
        if (/^\d+$/.test(input)) {
            pid = input;
        } else {
            let m = input.match(/playlist.*?id=(\d+)/i) || input.match(/playlist\/(\d+)/i) || input.match(/[?&]id=(\d+)/i);
            if (m) pid = m[1];
        }

        if (!pid) {
            alert('未能在输入中识别到有效的网易云歌单 ID，请检查链接格式。');
            return;
        }

        showPlayerToast(`⏳ 正在解析网易云歌单 [ID: ${pid}]...`, 8000);

        let result = await fetchNetEasePlaylistTracks(pid);
        if (!result || !result.tracks || result.tracks.length === 0) {
            showPlayerToast('❌ 解析网易云歌单失败，请检查链接或网络状态。', 3500);
            return;
        }

        let addedCount = 0;
        let skippedCount = 0;

        result.tracks.forEach(newSong => {
            if (!newSong.title) return;
            let normT = normalizeStr(newSong.title);
            let normA = normalizeStr(newSong.artist || '');
            let isDuplicate = targetPl.songs.some(s => {
                let sNormT = normalizeStr(s.title);
                let sNormA = normalizeStr(s.artist || '');
                if (normA && sNormA) {
                    return sNormT === normT && sNormA === normA;
                }
                return sNormT === normT;
            });

            if (!isDuplicate) {
                targetPl.songs.push({ title: newSong.title, artist: newSong.artist });
                addedCount++;
            } else {
                skippedCount++;
            }
        });

        savePlaylists();
        renderPlaylists();

        let tip = `✅ 成功导入 ${addedCount} 首曲目！` + (skippedCount > 0 ? ` (已过滤 ${skippedCount} 首重复)` : '');
        showPlayerToast(tip, 3500);
    });

    $ctn.on('click', '.cr-cat-up', function(e) {
        e.stopPropagation();
        let idx = parseInt($(this).data('idx'), 10);
        if (idx > 0) movePlaylist(idx, idx - 1);
    });

    $ctn.on('click', '.cr-cat-down', function(e) {
        e.stopPropagation();
        let idx = parseInt($(this).data('idx'), 10);
        if (idx < bgmPlaylists.length - 1) movePlaylist(idx, idx + 1);
    });

    $ctn.on('click', '.pl-nav-item', function(e) {
        if ($(e.target).closest('.cr-cat-order-btn, .cr-cat-import-163').length > 0) return;
        let idx = parseInt($(this).data('cidx'), 10);
        if (isNaN(idx) || !bgmPlaylists[idx]) return;
        selectedPlaylistIndex = idx;
        if (batchPlaylistIndex !== null && batchPlaylistIndex !== idx) {
            batchPlaylistIndex = null;
            selectedSongsSet.clear();
        }
        renderSidebarNav();
        renderTrackTable();
        // 移动端抽屉：选中歌单后自动收起
        $('#cr-sidebar').removeClass('open');
        $('#cr-sidebar-backdrop').removeClass('show');
    });


    $('#cr-new-pl-btn').click(function() {
        let name = $('#new-playlist-name').val().trim(); if (!name) return;
        let newPl = { category: name, songs: [], prompt: '', promptEnabled: false };
        bgmPlaylists.splice(1, 0, newPl);
        if (currentPlaylistIndex >= 1) currentPlaylistIndex++;
        savePlaylists();
        $('#new-playlist-name').val('');
        renderPlaylists();
    });

    // === 重命名频段 ===
    $ctn.on('click', '.cr-rename-pl', function(e) {
        e.stopPropagation();
        let idx = parseInt($(this).data('idx'), 10);
        let cat = bgmPlaylists[idx];
        if (!cat) return;
        if (cat.category === '★ 我的收藏' || cat.category === '🕒 最近播放') {
            alert('系统预置频段不支持重命名。');
            return;
        }
        let oldName = cat.category;
        let newName = prompt(`请输入频段【${oldName}】的新名称：`, oldName);
        if (newName === null) return;
        newName = newName.trim();
        if (!newName) {
            alert('频段名称不能为空');
            return;
        }
        if (newName === oldName) return;

        if (bgmPlaylists.some((p, pIdx) => pIdx !== idx && p.category.toLowerCase() === newName.toLowerCase())) {
            alert('已存在同名频段，请使用其他名称。');
            return;
        }

        cat.category = newName;
        savePlaylists();
        renderPlaylists();
        showPlayerToast(`已重命名频段为: ${newName}`, 2000);
    });

    // === 编辑歌曲 (歌名 / 歌手 / 直链地址) ===
    $ctn.on('click', '.cr-song-edit', function(e) {
        e.stopPropagation();
        let pIdx = parseInt($(this).data('pidx'), 10);
        let sIdx = parseInt($(this).data('sidx'), 10);
        let pl = bgmPlaylists[pIdx];
        if (!pl || !pl.songs[sIdx]) return;
        let curSong = pl.songs[sIdx];
        
        let localUrls = JSON.parse(localStorage.getItem('celestial_custom_urls') || '{}');
        let effectiveArtist = curSong.artist || '';
        if (effectiveArtist === '[本地直链解析]' || !effectiveArtist) {
            if (localUrls[curSong.title]) effectiveArtist = localUrls[curSong.title];
            else if (customUrlDb[curSong.title]) effectiveArtist = customUrlDb[curSong.title];
        }

        let defVal = effectiveArtist ? `${curSong.title} - ${effectiveArtist}` : curSong.title;
        let input = prompt('编辑歌曲（格式：歌名 - 歌手/直链网址）：', defVal);
        if (input === null) return;
        input = input.trim();
        if (!input) {
            alert('歌曲名称不能为空');
            return;
        }

        let t = input, a = '';
        let splitIdx = input.lastIndexOf('-');
        if (splitIdx !== -1) {
            t = input.substring(0, splitIdx).trim();
            a = input.substring(splitIdx + 1).trim();
        } else {
            let parts = input.split('+');
            if (parts.length > 1) {
                t = parts[0].trim();
                a = parts[1].trim();
            }
        }

        const isHttpUrl = (str) => /^https?:\/\/.+/i.test(str);
        if (isHttpUrl(a)) {
            let localUrls = JSON.parse(localStorage.getItem('celestial_custom_urls') || '{}');
            localUrls[t] = a;
            localStorage.setItem('celestial_custom_urls', JSON.stringify(localUrls));
        } else if (isHttpUrl(t)) {
            let localUrls = JSON.parse(localStorage.getItem('celestial_custom_urls') || '{}');
            let tempName = curSong.title && !isHttpUrl(curSong.title) ? curSong.title : ("直链音频_" + Math.floor(Math.random() * 1000));
            localUrls[tempName] = t;
            localStorage.setItem('celestial_custom_urls', JSON.stringify(localUrls));
            a = t;
            t = tempName;
        }

        curSong.title = t;
        curSong.artist = a;

        // 若当前正在播放这首歌，即时同步底栏信息
        if (currentPlaylistIndex === pIdx && currentSongIndex === sIdx) {
            currentPlayingTrackInfo = { title: t, artist: a };
            $('#bgm-now-playing').text(t);
            $('#bgm-now-artist').text(a || 'Unknown Node');
            localStorage.setItem('cr_last_song_title', t);
            localStorage.setItem('cr_last_song_artist', a || '');
            updatePlayerFavBtn();
        }

        savePlaylists();
        renderPlaylists();
        showPlayerToast(`已更新曲目: ${t}`, 2000);
    });

    $ctn.on('click', '.cr-del-pl', function(e) {
        e.stopPropagation();
        let idx = $(this).data('idx');
        let cat = bgmPlaylists[idx];
        if (!cat) return;
        if (cat.category === '★ 我的收藏' || cat.category === '🕒 最近播放') {
            if (confirm(`指挥官，确定要清空【${cat.category}】中的所有曲目吗？`)) {
                cat.songs = [];
                savePlaylists();
                renderPlaylists();
                showPlayerToast(`已清空【${cat.category}】`, 2000);
            }
            return;
        }
        if (confirm(`指挥官，确定要删除频段【${cat.category}】及其所有曲目吗？`)) {
            bgmPlaylists.splice(idx, 1);
            if (currentPlaylistIndex === idx) { audioObj.pause(); isPlaying = false; currentPlaylistIndex = -1; currentSongIndex = -1; updateBgmUI(); }
            else if (currentPlaylistIndex > idx) { currentPlaylistIndex--; }
            savePlaylists();
            renderPlaylists();
        }
    });

    $ctn.on('click', '.cr-del-song', function(e) {
        e.stopPropagation();
        let pIdx = $(this).data('pidx'); let sIdx = $(this).data('sidx');
        let cat = bgmPlaylists[pIdx];
        if (cat && cat.songs[sIdx]) {
            cat.songs.splice(sIdx, 1);
            if (currentPlaylistIndex === pIdx && currentSongIndex === sIdx) { audioObj.pause(); isPlaying = false; updateBgmUI(); }
            else if (currentPlaylistIndex === pIdx && currentSongIndex > sIdx) { currentSongIndex--; }
            savePlaylists();
            renderPlaylists();
        }
    });

    $ctn.on('click', '.cr-song-fav', function(e) {
        e.stopPropagation();
        let pIdx = $(this).data('pidx'); let sIdx = $(this).data('sidx');
        let cat = bgmPlaylists[pIdx];
        if (cat && cat.songs[sIdx]) {
            toggleFavorite(cat.songs[sIdx].title, cat.songs[sIdx].artist);
        }
    });

    $ctn.on('click', '.cr-song-move', function(e) {
        e.stopPropagation();
        let pIdx = $(this).data('pidx'); let sIdx = $(this).data('sidx');
        openMoveSongModal(pIdx, sIdx);
    });

    $('#cr-reset-btn').click(function() {
        if (confirm("确定要将所有频段和曲目重置恢复为预置初始状态吗？（自定义频段与收藏将被重设）")) {
            bgmPlaylists = JSON.parse(JSON.stringify(initialDefaultPlaylists));
            savePlaylists();
            renderPlaylists();
            alert("✅ 频段已恢复为初始默认状态！");
        }
    });

    $('#cr-export-btn').click(function() {
        let localUrls = JSON.parse(localStorage.getItem('celestial_custom_urls') || '{}');
        let exportData = {
            version: "6.0",
            playlists: bgmPlaylists,
            urls: localUrls
        };
        let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        let downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "celestial_radio_backup.json");
        document.body.appendChild(downloadAnchorNode); 
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    // === 覆盖导入与增量合并导入调度 ===
    let currentImportMode = 'overwrite';

    $('#cr-import-overwrite-btn').click(function() {
        currentImportMode = 'overwrite';
        $('#cr-import-file').click();
    });

    $('#cr-import-merge-btn').click(function() {
        currentImportMode = 'merge';
        $('#cr-import-file').click();
    });

    $('#cr-import-file').change(function(e) {
        let file = e.target.files[0];
        if (!file) return;
        let reader = new FileReader();
        reader.onload = function(e) {
            try {
                let data = JSON.parse(e.target.result);
                let importedPlaylists = [];
                if (data.playlists && Array.isArray(data.playlists)) {
                    importedPlaylists = data.playlists.filter(p => p && p.category && Array.isArray(p.songs));
        } else if (Array.isArray(data)) {
                    importedPlaylists = data.filter(p => p && p.category && Array.isArray(p.songs));
        }

                if (importedPlaylists.length === 0) {
                    alert("⚠️ 导入失败，未在文件中发现兼容的频段数据。");
                    $('#cr-import-file').val('');
            return;
        }

                if (data.urls && typeof data.urls === 'object') {
                    let existingUrls = JSON.parse(localStorage.getItem('celestial_custom_urls') || '{}');
                    let mergedUrls = { ...existingUrls, ...data.urls };
                    localStorage.setItem('celestial_custom_urls', JSON.stringify(mergedUrls));
        }

                if (currentImportMode === 'overwrite') {
                    if (confirm("指挥官，【覆盖导入】将完全替换当前所有频段和曲目，确定继续吗？")) {
                        if (!importedPlaylists.some(p => p.category === '★ 我的收藏')) {
                            importedPlaylists.unshift({ category: '★ 我的收藏', songs: [], prompt: '', promptEnabled: false });
                        }
                        importedPlaylists.forEach(p => {
                            if (typeof p.prompt !== 'string') p.prompt = '';
                            if (typeof p.promptEnabled !== 'boolean') p.promptEnabled = false;
                        });
                        bgmPlaylists = importedPlaylists;
                        savePlaylists();
                        renderPlaylists();
                        alert("✅ 覆盖导入成功！已完全加载文件中的频段。");
                    }
        } else {
                    let addedPlaylistsCount = 0;
                    let addedSongsCount = 0;

                    importedPlaylists.forEach(impCat => {
                        let normImpCatName = normalizeStr(impCat.category);
                        let existingCat = bgmPlaylists.find(p => normalizeStr(p.category) === normImpCatName);

                        if (existingCat) {
                            impCat.songs.forEach(impSong => {
                                let normImpTitle = normalizeStr(impSong.title);
                                let normImpArtist = normalizeStr(impSong.artist || '');
                                let isDuplicate = existingCat.songs.some(s => 
                                    normalizeStr(s.title) === normImpTitle && 
                                    (!normImpArtist || !s.artist || normalizeStr(s.artist) === normImpArtist)
                                );
                                if (!isDuplicate) {
                                    existingCat.songs.push(impSong);
                                    addedSongsCount++;
                                }
                            });
                        } else {
                            if (typeof impCat.prompt !== 'string') impCat.prompt = '';
                            if (typeof impCat.promptEnabled !== 'boolean') impCat.promptEnabled = false;
                            bgmPlaylists.push(impCat);
                            addedPlaylistsCount++;
                            addedSongsCount += impCat.songs.length;
                        }
                    });

                    if (!bgmPlaylists.some(p => p.category === '★ 我的收藏')) {
                        bgmPlaylists.unshift({ category: '★ 我的收藏', songs: [], prompt: '', promptEnabled: false });
                    }

                    savePlaylists();
                    renderPlaylists();
                    alert(`✅ 增量合并导入成功！\n- 新增频段: ${addedPlaylistsCount} 个\n- 合并新增曲目: ${addedSongsCount} 首\n已自动跳过所有同名重复歌曲。`);
        }
            } catch (err) {
                alert("❌ 导入失败，JSON 文件格式有误或已损坏。");
            }
            $('#cr-import-file').val('');
        };
        reader.readAsText(file);
    });

    $ctn.on('click', '.cr-add-song', function(e) {
        e.stopPropagation(); let idx = $(this).data('idx');
        let val = $(`#new-song-input-${idx}`).val().trim(); if (!val) return;
        
        let t = val, a = '';
        let splitIdx = val.lastIndexOf('-');
        if (splitIdx !== -1) {
            t = val.substring(0, splitIdx).trim();
            a = val.substring(splitIdx + 1).trim();
        } else {
            let parts = val.split('+');
            if(parts.length > 1) {
                t = parts[0].trim();
                a = parts[1].trim();
            }
        }

        const isHttpUrl = (str) => /^https?:\/\/.+/i.test(str);

        if (isHttpUrl(a)) {
            let localUrls = JSON.parse(localStorage.getItem('celestial_custom_urls') || '{}');
            localUrls[t] = a;
            localStorage.setItem('celestial_custom_urls', JSON.stringify(localUrls));
        } else if (isHttpUrl(t)) {
            let localUrls = JSON.parse(localStorage.getItem('celestial_custom_urls') || '{}');
            let tempName = "直链音频_" + Math.floor(Math.random() * 1000);
            localUrls[tempName] = t;
            localStorage.setItem('celestial_custom_urls', JSON.stringify(localUrls));
            a = t;
            t = tempName;
        }

        bgmPlaylists[idx].songs.push({ title: t, artist: a });
        savePlaylists(); renderPlaylists();
    });

    $ctn.on('click', '.cr-song-row', function(e) {
        if($(e.target).closest('.song-actions, .cr-song-check').length > 0) return;
        let pIdx = parseInt($(this).data('pidx'), 10);
        let sIdx = parseInt($(this).data('sidx'), 10);
        if (batchPlaylistIndex === pIdx) {
            e.stopPropagation();
            if (selectedSongsSet.has(sIdx)) selectedSongsSet.delete(sIdx);
            else selectedSongsSet.add(sIdx);
            renderPlaylists();
            return;
        }
        playSpecificSong(pIdx, sIdx);
    });

    // === 多选批量操作 (全选/收藏/迁移/删除) ===
    $ctn.on('click', '.cr-batch-toggle, .cr-batch-exit-btn', function(e) {
        e.stopPropagation();
        let idx = parseInt($(this).data('idx') !== undefined ? $(this).data('idx') : $(this).data('pidx'), 10);
        if (batchPlaylistIndex === idx) {
            batchPlaylistIndex = null;
            selectedSongsSet.clear();
        } else {
            batchPlaylistIndex = idx;
            selectedSongsSet.clear();
        }
        renderPlaylists();
    });

    $ctn.on('click', '.cr-song-check', function(e) {
        e.stopPropagation();
        let sIdx = parseInt($(this).data('sidx'), 10);
        if ($(this).is(':checked')) {
            selectedSongsSet.add(sIdx);
        } else {
            selectedSongsSet.delete(sIdx);
        }
        renderPlaylists();
    });

    $ctn.on('click', '.cr-batch-select-all', function(e) {
        e.stopPropagation();
        let pIdx = parseInt($(this).data('pidx'), 10);
        let pl = bgmPlaylists[pIdx];
        if (!pl) return;
        if (selectedSongsSet.size === pl.songs.length) {
            selectedSongsSet.clear();
        } else {
            selectedSongsSet.clear();
            pl.songs.forEach((_, i) => selectedSongsSet.add(i));
        }
        renderPlaylists();
    });

    $ctn.on('click', '.cr-batch-fav-btn', function(e) {
        e.stopPropagation();
        let pIdx = parseInt($(this).data('pidx'), 10);
        let pl = bgmPlaylists[pIdx];
        if (!pl || selectedSongsSet.size === 0) {
            showPlayerToast('请先勾选需要收藏的歌曲', 2000);
            return;
        }
        let favPl = bgmPlaylists.find(p => p.category === '★ 我的收藏');
        if (!favPl) {
            favPl = { category: '★ 我的收藏', songs: [], prompt: '', promptEnabled: false };
            bgmPlaylists.unshift(favPl);
        }
        let favCount = 0;
        selectedSongsSet.forEach(sIdx => {
            let song = pl.songs[sIdx];
            if (!song) return;
            let t = normalizeStr(song.title);
            let a = normalizeStr(song.artist || '');
            let exists = favPl.songs.some(s => normalizeStr(s.title) === t && (!a || normalizeStr(s.artist || '') === a));
            if (!exists) {
                favPl.songs.unshift({ title: song.title, artist: song.artist || '' });
                favCount++;
            }
        });
        savePlaylists();
        renderPlaylists();
        showPlayerToast(`★ 已将 ${favCount} 首歌曲批量收藏至【我的收藏】`, 2500);
    });

    $ctn.on('click', '.cr-batch-move-btn', function(e) {
        e.stopPropagation();
        let pIdx = parseInt($(this).data('pidx'), 10);
        let pl = bgmPlaylists[pIdx];
        if (!pl || selectedSongsSet.size === 0) {
            showPlayerToast('请先勾选需要迁移的歌曲', 2000);
            return;
        }
        openBatchMoveModal(pIdx);
    });

    $ctn.on('click', '.cr-batch-del-btn', function(e) {
        e.stopPropagation();
        let pIdx = parseInt($(this).data('pidx'), 10);
        let pl = bgmPlaylists[pIdx];
        if (!pl || selectedSongsSet.size === 0) {
            showPlayerToast('请先勾选需要删除的歌曲', 2000);
            return;
        }
        if (confirm(`确定要从【${pl.category}】中批量删除选中的 ${selectedSongsSet.size} 首歌曲吗？`)) {
            let sortedIndices = Array.from(selectedSongsSet).sort((a, b) => b - a);
            sortedIndices.forEach(sIdx => {
                pl.songs.splice(sIdx, 1);
            });
            let delCount = sortedIndices.length;
            selectedSongsSet.clear();
            batchPlaylistIndex = null;
            savePlaylists();
            renderPlaylists();
            showPlayerToast(`已批量删除 ${delCount} 首歌曲`, 2000);
        }
    });

    // === 全库曲目搜索 & 全网连线 ===
    // 防抖 250ms：renderPlaylists 是全库 innerHTML 重建，每键入一次代价 O(总歌数)
    let searchRenderTimer = null;
    $('#bgm-search-input').on('input', function() {
        globalSearchQuery = $(this).val().trim();
        if (searchRenderTimer) clearTimeout(searchRenderTimer);
        searchRenderTimer = setTimeout(() => {
            searchRenderTimer = null;
            renderPlaylists();
        }, 250);
    });

    $('#bgm-search-input').on('keydown', function(e) {
        if (e.key === 'Enter') {
            if (searchRenderTimer) { clearTimeout(searchRenderTimer); searchRenderTimer = null; }
            const val = $(this).val().trim();
            if (!val) {
                globalSearchQuery = '';
                renderPlaylists();
                return;
            }

            const isHttpUrl = (str) => /^https?:\/\/.+/i.test(str);
            if (isHttpUrl(val)) {
                playDirect(val, '');
                return;
            }

            globalSearchQuery = val;
            renderPlaylists();

            let q = val.toLowerCase();
            let total = 0;
            bgmPlaylists.forEach(p => {
                p.songs.forEach(s => {
                    if ((s.title && s.title.toLowerCase().includes(q)) || (s.artist && s.artist.toLowerCase().includes(q)) || p.category.toLowerCase().includes(q)) {
                        total++;
                    }
                });
            });

            if (total > 0) {
                showPlayerToast(`🔍 全库已为您匹配出 ${total} 首相关曲目`, 2500);
            } else {
                showPlayerToast(`🔍 曲库内暂无匹配，正在尝试全网搜索...`, 2000);
                playDirect(val, '');
            }
        }
    });

    $ctn.on('click', '.cr-online-search-btn', function() {
        let q = $(this).data('query');
        if (q) {
            playDirect(q, '');
        }
    });

    $('#bgm-play-pause').click(function() {
        if(!audioObj.src) {
            let lastTitle = localStorage.getItem('cr_last_song_title');
            let lastArtist = localStorage.getItem('cr_last_song_artist');
            if (lastTitle) {
                playDirect(lastTitle, lastArtist || '');
            } else {
                nextSong();
            }
            return;
        }
        if(audioObj.paused) {
            audioObj.play().then(() => {
                isPlaying = true;
                updateBgmUI();
            }).catch(e => {
                showPlayerToast('⚠️ 自动播放被拦截，请点击页面任意处恢复');
            });
        }
        else { audioObj.pause(); isPlaying = false; updateBgmUI(); }
    });

    $('#cr-prev-btn').click(prevSong);
    $('#cr-next-btn').click(nextSong);

    // 手机黑胶底栏播放控制
    $('#v-mob-play-btn').on('click', function() { $('#bgm-play-pause').click(); });
    $('#v-mob-prev-btn').on('click', prevSong);
    $('#v-mob-next-btn').on('click', nextSong);
    $('#v-mob-fav-btn').on('click', function() {
        if (!currentPlayingTrackInfo.title) return;
        toggleFavorite(currentPlayingTrackInfo.title, currentPlayingTrackInfo.artist);
    });
    $('#v-mob-dl-btn').on('click', downloadCurrentAudio);

    $('#bgm-progress-bar').click(function(e) {
        if(!audioObj.src || !audioObj.duration) return;
        const rect = this.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioObj.currentTime = percent * audioObj.duration;
    });

    // 手机黑胶底栏进度条点击 seek
    $('#v-mob-prog-row').on('click', function(e) {
        if(!audioObj.src || !audioObj.duration) return;
        const rect = this.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        audioObj.currentTime = percent * audioObj.duration;
    });

    function formatTime(sec) {
        if (!Number.isFinite(sec) || sec < 0) return '0:00';
        sec = Math.floor(sec);
        return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    }
    // === 音频元素事件挂载（真实频谱模式重建元素后需重挂，处理器动态读 audioObj 变量） ===
    function attachAudioListeners(el) {
        el.addEventListener('timeupdate', () => {
            if(audioObj.duration) {
                const pct = (audioObj.currentTime / audioObj.duration) * 100;
                $('#bgm-progress-fill').css('width', pct + '%');
                $('#v-mob-prog-fill').css('width', pct + '%');
                $('#pb-cur-time').text(formatTime(audioObj.currentTime));
            }
            updateLyricHighlight();
        });

        // === 硬核时长防护（1分钟以下、20分钟以上彻底拦截屏蔽） ===
        el.addEventListener('loadedmetadata', () => {
            if (audioObj.duration) {
                let dur = audioObj.duration;
                $('#pb-total-time').text(formatTime(dur));
                if (dur < 60 || dur > 1200) {
                    console.warn(`[太空电台·时长拦截] 检测到音频时长为 ${Math.round(dur)} 秒(非标准歌曲时长 1~20 分钟)，已强行熔断拦截！`);
                    showPlayerToast(`⚠️ 时长异常(${Math.round(dur)}s)，已自动跳过...`, 1500);
                    audioObj.pause();
                    setTimeout(nextSong, 1200);
                }
            }
        });

        el.addEventListener('ended', () => {
            if (playMode === 'loop') { audioObj.currentTime = 0; audioObj.play(); }
            else { nextSong(); }
        });
    }
    attachAudioListeners(audioObj);

    // === 全宇宙配乐/古典大师库 ===
    const OST_COMPOSERS = [
        'evan call', '泽野弘之', 'hiroyuki sawano', '梶浦由记', 'yuki kajiura',
        '久石让', 'joe hisaishi', 'hans zimmer', 'andrew prahlow', 'sea power',
        'jim bonney', 'abel korzeniowski', 'alan silvestri', 'steve jablonsky',
        'yoko kanno', '菅野洋子', 'monaca', '神前晓', '川井宪次', 'kenji kawai',
        '植松伸夫', 'nobuo uematsu', '林友树', 'yuki hayashi', '高梨康治',
        'kohta yamamoto', '山本康太', 'george gershwin', 'erik satie', 'debussy', 'lorien testard',
        'charlie jeer', '1lkay', 'bubble tea and cigarettes', 'monodrone',
        'aurenth', '三亩地', 'the outer worlds', 'disco elysium'
    ];

    // === 连字符双态自适应通用打分矩阵 ===
    function scoreTrackCandidate(track, cleanQuery) {
        let score = 100;
        const targetTitle = normalizeStr(cleanQuery.title);
        const targetFullTitle = normalizeStr(cleanQuery.fullTitle);
        const targetAlias = normalizeStr(cleanQuery.aliasTitle);
        const targetAliasFull = normalizeStr(cleanQuery.aliasFullTitle);
        const targetSub = normalizeStr(cleanQuery.subTitle);
        const targetArtist = normalizeStr(cleanQuery.artist);

        const rawTrackName = track.name || '';
        const cleanTrackName = cleanEditionTags(rawTrackName);
        const trackName = normalizeStr(rawTrackName);
        const normCleanTrackName = normalizeStr(cleanTrackName);

        const rawArtistList = Array.isArray(track.artist) ? track.artist : [track.artist || ''];
        const normArtists = rawArtistList.map(a => normalizeStr(a));
        const trackArtistCombined = normArtists.join(' ');
        const trackAlbum = (track.album || '').toLowerCase();
        const normAlbum = normalizeStr(trackAlbum);

        let matchedFullTitle = (trackName === targetFullTitle || normCleanTrackName === targetFullTitle || 
                                (targetAliasFull && (trackName === targetAliasFull || normCleanTrackName === targetAliasFull)));

        let matchedSingleTitle = (trackName === targetTitle || normCleanTrackName === targetTitle || 
                                  (targetAlias && (trackName === targetAlias || normCleanTrackName === targetAlias)) || 
                                  (targetSub && (trackName === targetSub || normCleanTrackName === targetSub)));

        if (matchedFullTitle) {
            score += 100;
        } else if (matchedSingleTitle) {
            score += 90;
        } else {
            let isPartial = ((targetFullTitle && (targetFullTitle.includes(trackName) || trackName.includes(targetFullTitle))) ||
                             (targetTitle && (targetTitle.includes(trackName) || trackName.includes(targetTitle) || normCleanTrackName.includes(targetTitle))) ||
                             (targetAlias && (targetAlias.includes(trackName) || trackName.includes(targetAlias) || normCleanTrackName.includes(targetAlias))) ||
                             (targetSub && (targetSub.includes(trackName) || trackName.includes(targetSub) || normCleanTrackName.includes(targetSub))));
            if (isPartial) {
                let lenRatio = Math.min((targetFullTitle || targetTitle).length, trackName.length) / Math.max((targetFullTitle || targetTitle).length, trackName.length, 1);
                score += Math.round(30 * lenRatio);
            } else {
                score -= 200;
            }
        }

        if (targetArtist && !matchedFullTitle) {
            let matchedArtist = false;
            for (let a of normArtists) {
                if (a === targetArtist || a.includes(targetArtist) || targetArtist.includes(a)) {
                    score += 50;
                    matchedArtist = true;
                    break;
        }
            }
            if (!matchedArtist) {
                if (trackArtistCombined.includes(targetArtist)) {
                    score += 30;
        } else {
                    if (!trackName.includes(targetArtist)) {
                        score -= 100;
                    }
        }
            }
        } else if (!targetArtist) {
            const qualityMarkers = ['remaster', 'original', 'soundtrack', 'album', 'classic', 'greatest', 'best', 'edition', 'collection', '192', '193', '194', '195'];
            if (qualityMarkers.some(qm => trackAlbum.includes(qm) || rawTrackName.toLowerCase().includes(qm))) {
                score += 25;
            }
        }

        const ostMarkers = ['soundtrack', 'ost', 'originalscore', 'anime', '动画', '原声', 'bgm', 'theme', 'score', 'サウンドトラック', 'サントラ', 'オリジナル'];
        let hasOstTag = ostMarkers.some(m => trackAlbum.includes(m) || normAlbum.includes(m) || trackName.includes(m));
        if (hasOstTag || cleanQuery.isOstIntent) {
            score += 40;
        }

        for (let comp of OST_COMPOSERS) {
            let ncomp = normalizeStr(comp);
            if (normArtists.some(a => a.includes(ncomp)) || normAlbum.includes(ncomp) || targetTitle.includes(ncomp) || targetFullTitle.includes(ncomp)) {
                score += 30;
                break;
            }
        }

        const negativeKeywords = ['dj', '慢摇', '电音', '车载', '喊麦', '翻唱', 'cover', '剪辑', '3d环绕', '纯伴奏', '伴奏', '铃声', '片段'];
        for (let neg of negativeKeywords) {
            if (rawTrackName.toLowerCase().includes(neg) || normAlbum.includes(neg)) {
                if (!targetTitle.includes(neg) && !targetFullTitle.includes(neg)) {
                    score -= 150;
                    break;
        }
            }
        }

        const audiobookKeywords = ['有声书', '有声小说', '第', '集', '朗读', '主播', '评书', '小盟盟', '电台节目', '小品', '相声', '评弹'];
        for (let ab of audiobookKeywords) {
            if (normAlbum.includes(ab) || trackArtistCombined.includes(ab) || trackName.includes(ab)) {
                score -= 300;
                break;
            }
        }

        return score;
    }

    async function searchAndResolveBestTrack(cleanQuery) {
        let gdsSearchDead = false; // gdstudio 搜索整体宕机标记（本曲内熔断，避免逐源空等超时）
        const fetchSearch = async (kw, source) => {
            const rawSearchUrl = `https://music-api.gdstudio.xyz/api.php?types=search&source=${source}&name=${encodeURIComponent(kw)}&count=5&pages=1`;
            if (!gdsSearchDead) {
                try {
                    const res = await fetch(rawSearchUrl);
                    return await res.json();
                } catch (e) {
                    try {
                        const searchUrl = `https://corsproxy.io/?${encodeURIComponent(rawSearchUrl)}`;
                        const searchRes = await fetch(searchUrl);
                        return await searchRes.json();
                    } catch (err) { gdsSearchDead = true; }
                }
            }
            // 备源 motues（仅 netease，返回结构与 gdstudio 同构）
            if (source === 'netease') {
                try {
                    const mRes = await fetch(`https://open.motues.top/music?server=netease&type=search&id=${encodeURIComponent(kw)}&limit=5`);
                    const mData = await mRes.json();
                    if (Array.isArray(mData)) return mData;
                } catch (e) {}
            }
            return [];
        };

        const fetchDirectUrl = async (source, id) => {
            const checkUrlData = (data) => {
                if (data && data.url) {
                    if (data.size && data.br) {
                        const bytesPerSec = (data.br * 1000) / 8;
                        const estDur = data.size / bytesPerSec;
                        if (estDur < 55 || estDur > 1200) {
                            console.warn(`[前置过滤] 跳过时长不合格音频: 预估 ${Math.round(estDur)}s`);
                            return null;
                        }
                    }
                    return data.url;
                }
                return null;
            };
            const rawUrlReq = `https://music-api.gdstudio.xyz/api.php?types=url&source=${source}&id=${id}&br=320`;
            // 主源 gdstudio（直连→corsproxy 兜底）
            try {
                const directRes = await fetch(rawUrlReq);
                const url = checkUrlData(await directRes.json());
                if (url) return url;
            } catch (e) {
                try {
                    const urlReq = `https://corsproxy.io/?${encodeURIComponent(rawUrlReq)}`;
                    const urlRes = await fetch(urlReq);
                    const url = checkUrlData(await urlRes.json());
                    if (url) return url;
                } catch (err) {}
            }
            // 备源 motues（仅 netease，ID 同空间）：主源无url/试听片段/宕机时兜底
            if (source === 'netease') {
                try {
                    const mRes = await fetch(`https://open.motues.top/music?server=netease&type=url&id=${id}&br=320`);
                    const url = checkUrlData(await mRes.json());
                    if (url) return url;
                } catch (e) {}
            }
            return null;
        };

        let searchQuery = cleanQuery.fullTitle;
        const sources = ['netease', 'kuwo', 'migu', 'kugou', 'tencent'];
        let candidatePool = [];

        for (const src of sources) {
            try {
                let results = await fetchSearch(searchQuery, src);
                if ((!results || results.length === 0) && cleanQuery.aliasFullTitle && cleanQuery.aliasFullTitle !== searchQuery) {
                    results = await fetchSearch(cleanQuery.aliasFullTitle, src);
        }
                if ((!results || results.length === 0) && cleanQuery.title !== searchQuery) {
                    results = await fetchSearch(cleanQuery.title, src);
        }
                if ((!results || results.length === 0) && cleanQuery.subTitle) {
                    results = await fetchSearch(cleanQuery.subTitle, src);
        }

                if (Array.isArray(results) && results.length > 0) {
                    for (const track of results) {
                        let score = scoreTrackCandidate(track, cleanQuery);
                        if (score > 30) {
                            candidatePool.push({ ...track, _score: score, source: src });
                        }
                    }
        }
            } catch (err) {}
        }

        candidatePool.sort((a, b) => b._score - a._score);

        for (let i = 0; i < Math.min(candidatePool.length, 6); i++) {
            let cand = candidatePool[i];
            let directUrl = await fetchDirectUrl(cand.source, cand.id);
            if (directUrl) {
                return {
                    url: directUrl,
                    track: cand
        };
            }
        }
        return null;
    }

    async function getTrackUrl(rawTitle, rawArtist) {
        const isHttpUrl = (str) => /^https?:\/\/.+/i.test(str);

        if (isHttpUrl(rawTitle)) return { url: rawTitle, track: { name: '自定义直链音频', artist: 'Network Stream' } };
        if (isHttpUrl(rawArtist)) return { url: rawArtist, track: { name: rawTitle || '自定义直链音频', artist: 'Network Stream' } };

        let localCustomUrls = JSON.parse(localStorage.getItem('celestial_custom_urls') || '{}');
        let fullKey = rawArtist ? `${rawTitle} - ${rawArtist}` : rawTitle;
        let mappedUrl = customUrlDb[rawTitle] || customUrlDb[fullKey] || localCustomUrls[rawTitle] || localCustomUrls[fullKey];
        if (mappedUrl) {
            return { url: mappedUrl, track: { name: fullKey, artist: '本地直连解析' } };
        }

        let trackId = directLinkDb[rawTitle] || directLinkDb[fullKey] || directLinkDb[normalizeStr(rawTitle)] || directLinkDb[normalizeStr(fullKey)];
        if (trackId) {
            const rawUrlReq = `https://music-api.gdstudio.xyz/api.php?types=url&source=netease&id=${trackId}&br=320`;
            let urlData = null;
            try {
                const res = await fetch(rawUrlReq);
                urlData = await res.json();
            } catch (e) {}
            if (!urlData || !urlData.url) {
                try {
                    const proxyUrlReq = `https://corsproxy.io/?${encodeURIComponent(rawUrlReq)}`;
                    const res = await fetch(proxyUrlReq);
                    urlData = await res.json();
                } catch (e) {}
            }
            if (!urlData || !urlData.url) {
                try {
                    const motuesRes = await fetch(`https://open.motues.top/music?server=netease&type=url&id=${trackId}&br=320`);
                    urlData = await motuesRes.json();
                } catch (e) {}
            }
            if (urlData && urlData.url) return { url: urlData.url, track: { name: rawTitle, artist: rawArtist || 'Classic Master' } };
        }

        let cleanQuery = cleanTrackQuery(rawTitle, rawArtist);
        let matchResult = await searchAndResolveBestTrack(cleanQuery);
        if (matchResult && matchResult.url) {
            return matchResult;
        }

        return null;
    }

    function findSongInPlaylists(title, artist) {
        const t1 = normalizeStr(title);
        const a1 = normalizeStr(artist || '');
        const f1 = normalizeStr(artist ? `${title} - ${artist}` : title);

        for (let pIdx = 0; pIdx < bgmPlaylists.length; pIdx++) {
            let songs = bgmPlaylists[pIdx].songs;
            for (let sIdx = 0; sIdx < songs.length; sIdx++) {
                const song = songs[sIdx];
                const sTitle = normalizeStr(song.title);
                const sArt = normalizeStr(song.artist || '');
                const sFull = normalizeStr(song.artist ? `${song.title} - ${song.artist}` : song.title);

                if (sTitle === t1 || sFull === f1 || (sTitle && (sTitle.includes(t1) || t1.includes(sTitle)))) {
                    if (!a1 || !sArt || sArt.includes(a1) || a1.includes(sArt) || sFull === f1) {
                        return { pIdx, sIdx };
                    }
        }
            }
        }
        return null;
    }

    async function playSpecificSong(pIdx, sIdx) {
        if (pIdx < 0 || pIdx >= bgmPlaylists.length) return;
        let pList = bgmPlaylists[pIdx].songs;
        if (sIdx < 0 || sIdx >= pList.length) return;

        currentPlaylistIndex = pIdx; currentSongIndex = sIdx;
        let song = pList[sIdx];
        currentPlayingTrackInfo = { title: song.title, artist: song.artist || '' };

        // 局部切换高亮与加载态，避免全量重新渲染 DOM
        $('.pl-nav-item').removeClass('active-playlist');
        $('#nav-' + pIdx).addClass('active-playlist');
        $('.song-item').removeClass('playing loading');
        $(`.song-item[data-pidx="${pIdx}"][data-sidx="${sIdx}"]`).addClass('loading');

        // 静默转圈加载提示
        isLoading = true;
        isPlaying = false;
        $('#bgm-now-playing').text(song.title);
        $('#bgm-now-artist').text(song.artist ? `${song.artist} · 正在连接音频源...` : '正在连接音频源...');
        updateBgmUI();

        const result = await getTrackUrl(song.title, song.artist);

        if (currentPlaylistIndex !== pIdx || currentSongIndex !== sIdx) return;

        if(result && result.url) {
            await prepareSpectrumForSrc(result.url);
            audioObj.src = result.url;
            audioObj.play().then(() => {
                isLoading = false;
                isPlaying = true;
                $('.song-item').removeClass('loading');
                $(`.song-item[data-pidx="${pIdx}"][data-sidx="${sIdx}"]`).addClass('playing');
                updateBgmUI();
                $('#bgm-now-playing').text(song.title);
                $('#bgm-now-artist').text(song.artist || 'Unknown Node');
                localStorage.setItem('cr_last_song_title', song.title);
                localStorage.setItem('cr_last_song_artist', song.artist || '');
                recordPlayHistory(song.title, song.artist);
                applyCurrentCover(song.title, song.artist);
                applyCurrentLyric(song.title, song.artist);
            }).catch(e => {
                isLoading = false;
                isPlaying = false;
                $('.song-item').removeClass('loading');
                updateBgmUI();
                showPlayerToast("⚠️ 自动播放受阻，请点击播放按钮");
            });
        } else {
            isLoading = false;
            isPlaying = false;
            $('.song-item').removeClass('loading');
            $('#bgm-now-playing').text(`[连接丢失]`);
            $('#bgm-now-artist').text(song.title);
            updateBgmUI();
            showPlayerToast("⚠️ 该信标失效，2秒后跳跃至下一首...", 2000);
            setTimeout(nextSong, 2000);
        }
    }

    // 返回 boolean：true=播放已发起（曲库命中走信标失效自愈；自动发声被浏览器拦截也算，重试无意义），
    // false=多源检索无果——调用方据此清锁重试，杜绝"选歌成功却无歌可播"被当作决策成功锁死本楼
    async function playDirect(title, artist) {
        let loc = findSongInPlaylists(title, artist);
        if (loc) {
            console.log("雷达探测到曲目已在内部频段中，自动锚定进度！");
            playSpecificSong(loc.pIdx, loc.sIdx);
            return true;
        }

        let displayTarget = artist ? `${title} - ${artist}` : title;
        currentPlayingTrackInfo = { title, artist: artist || '' };
        currentPlaylistIndex = -1; currentSongIndex = -1;

        $('.pl-nav-item').removeClass('active-playlist');
        renderSidebarNav();
        $('.song-item').removeClass('playing loading');

        isLoading = true;
        isPlaying = false;
        $('#bgm-now-playing').text(title);
        $('#bgm-now-artist').text(artist ? `${artist} · 多源检索中...` : '多源检索中...');
        updateBgmUI();

        const result = await getTrackUrl(title, artist);

        if(result && result.url) {
            let finalTitle = result.track.name || displayTarget;
            let finalArtist = Array.isArray(result.track.artist) ? result.track.artist.join(' / ') : (result.track.artist || artist);
            currentPlayingTrackInfo = { title: finalTitle, artist: finalArtist || '' };

            await prepareSpectrumForSrc(result.url);
            audioObj.src = result.url;
            try {
                await audioObj.play();
                isLoading = false;
                isPlaying = true;
                updateBgmUI();
                $('#bgm-now-playing').text(finalTitle);
                $('#bgm-now-artist').text(finalArtist || 'Unknown Interception');
                localStorage.setItem('cr_last_song_title', finalTitle);
                localStorage.setItem('cr_last_song_artist', finalArtist || '');
                recordPlayHistory(finalTitle, finalArtist);
                const neteasePic = (result.track && result.track.source === 'netease' && result.track.pic_id) ? { picId: String(result.track.pic_id), album: Array.isArray(result.track.album) ? result.track.album.join(' / ') : (result.track.album || '') } : null;
                applyCurrentCover(finalTitle, finalArtist, neteasePic);
                applyCurrentLyric(finalTitle, finalArtist);
            } catch (e) {
                isLoading = false;
                isPlaying = false;
                $('#bgm-now-playing').text(finalTitle);
                $('#bgm-now-artist').text(finalArtist || 'Unknown Interception');
                updateBgmUI();
                showPlayerToast("⚠️ 浏览器阻断自动发声，请点击播放按钮");
            }
            return true;
        } else {
            isLoading = false;
            isPlaying = false;
            $('#bgm-now-playing').text(`[连接丢失]`);
            $('#bgm-now-artist').text(displayTarget);
            updateBgmUI();
            showPlayerToast("⚠️ 未找到匹配资源", 2500);
            return false;
        }
    }

    function updateBgmUI() {
        if (isLoading) {
            $('#bgm-play-pause').html('<div class="cr-play-spinner"></div>');
            $('#v-mob-play-btn').html('<div class="cr-play-spinner"></div>');
        } else if (isPlaying) {
            $('#bgm-play-pause').html(ICONS.pauseBig);
            $('#v-mob-play-btn').html('<svg id="v-mob-play-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>');
        } else {
            $('#bgm-play-pause').html(ICONS.playBig);
            $('#v-mob-play-btn').html('<svg id="v-mob-play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>');
            if(currentPlaylistIndex === -1 && !audioObj.src) { $('#bgm-now-playing').text('频段静默'); $('#bgm-now-artist').text('---'); }
        }
        $('#cr-vinyl-disc').toggleClass('spinning', isPlaying && !isLoading && !audioObj.paused);
        $('#cr-vinyl-tonearm').toggleClass('on', isPlaying && !isLoading);
        // 黑胶页与手机底栏标题实时跟随切歌（切歌路径必经本函数）
        const nowTitle = currentPlayingTrackInfo.title || $('#bgm-now-playing').text();
        const nowArtist = currentPlayingTrackInfo.artist || $('#bgm-now-artist').text();
        $('#cr-vinyl-title').text(nowTitle);
        $('#cr-vinyl-artist').text(nowArtist);
        $('#v-mob-title').text(nowTitle);
        $('#v-mob-artist').text(nowArtist);
        if ($('#cr-lyric-scroll-mob').hasClass('expanded')) {
            $('#cr-lyric-head-title').text(nowTitle);
            $('#cr-lyric-head-sub').text(nowArtist);
        }
        updateVolAnimState();
        updatePlayerFavBtn();
    }

    // === 封面解析链：网易云 pic_id → types=pic 换 CDN 直链（带缓存与切歌过期丢弃） ===
    const coverCache = new Map();
    let currentCoverUrl = '';
    let currentNeteaseSongId = '';
    const COVER_PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#14161c"/><circle cx="60" cy="60" r="34" fill="none" stroke="#C4A77D" stroke-width="2" opacity="0.5"/><circle cx="60" cy="60" r="5" fill="#C4A77D" opacity="0.7"/><path d="M52 74 L52 46 L74 42 L74 70" stroke="#C4A77D" stroke-width="2.5" fill="none" opacity="0.85" stroke-linejoin="round"/><circle cx="47" cy="74" r="5.5" fill="#C4A77D" opacity="0.85"/><circle cx="69" cy="70" r="5.5" fill="#C4A77D" opacity="0.85"/></svg>');

    async function fetchPicIdBySearch(title, artist) {
        const kw = artist ? `${title} - ${artist}` : title;
        const url = `https://music-api.gdstudio.xyz/api.php?types=search&source=netease&name=${encodeURIComponent(kw)}&count=3&pages=1`;
        try {
            const res = await fetch(url);
            const arr = await res.json();
            if (Array.isArray(arr) && arr.length > 0 && arr[0] && arr[0].pic_id) {
                return { picId: String(arr[0].pic_id), songId: String(arr[0].id || ''), album: Array.isArray(arr[0].album) ? arr[0].album.join(' / ') : (arr[0].album || '') };
            }
        } catch (e) {}
        return null;
    }

    async function resolveCoverUrl(title, artist, knownPic) {
        const key = normalizeStr(title) + '|' + normalizeStr(artist || '');
        if (coverCache.has(key)) return coverCache.get(key);
        if (!knownPic || !knownPic.picId) { coverCache.set(key, null); return null; }
        try {
            const res = await fetch(`https://music-api.gdstudio.xyz/api.php?types=pic&source=netease&id=${encodeURIComponent(knownPic.picId)}`);
            const data = await res.json();
            const url = (data && data.url) ? data.url.replace('param=300y300', 'param=500y500') : null;
            coverCache.set(key, url);
            return url;
        } catch (e) { coverCache.set(key, null); return null; }
    }

    async function applyCurrentCover(title, artist, knownPic) {
        currentCoverUrl = '';
        currentNeteaseSongId = '';
        updateCoverUI();
        const info = knownPic || await fetchPicIdBySearch(title, artist);
        if (info && info.album) $('#cr-vinyl-album').text(info.album).show(); else $('#cr-vinyl-album').hide();
        if (info && info.songId) currentNeteaseSongId = info.songId;
        const url = info ? await resolveCoverUrl(title, artist, info) : null;
        if (currentPlayingTrackInfo.title !== title) return; // 播放已切歌：丢弃过期结果
        if (url) { currentCoverUrl = url; updateCoverUI(); }
    }

    function updateCoverUI() {
        const url = currentCoverUrl || COVER_PLACEHOLDER;
        $('#pb-cover').html(`<img src="${url}" alt="">`);
        $('#cr-vinyl-cover').attr('src', url);
        $('#fs-cover-img').attr('src', url);
        if (currentCoverUrl) $('#cr-vinyl-bg').css('background-image', `url("${currentCoverUrl}")`);
        else $('#cr-vinyl-bg').css('background-image', 'none');
    }

    // === 歌词链：网易云 LRC + 翻译歌词（复用封面链取得的 songId，缺失时按歌名补查） ===
    const lyricCache = new Map();
    let lyricLines = [];
    let currentLyricIdx = -1;
    const lyricManualUntil = { pc: 0, mob: 0 };

    const escLyric = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    function parseLrc(text) {
        const out = [];
        if (!text) return out;
        String(text).split('\n').forEach(raw => {
            const tags = raw.match(/\[\d{1,2}:\d{1,2}(?:[.:]\d{1,3})?\]/g);
            if (!tags) return;
            const content = raw.replace(/^(\[[^\]]*\])+/, '').trim();
            tags.forEach(tag => {
                const t = tag.match(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/);
                let frac = t[3] || '';
                if (frac.length === 2) frac += '0';
                if (frac.length === 1) frac += '00';
                out.push({ time: parseInt(t[1], 10) * 60 + parseInt(t[2], 10) + (parseInt(frac, 10) || 0) / 1000, text: content, trans: '' });
            });
        });
        return out.sort((a, b) => a.time - b.time);
    }

    // 翻译歌词时间轴与主歌词为独立时间戳，按时间就近匹配（0.6s 容差）
    function mergeLyricTrans(main, trans) {
        if (!trans.length) return main;
        main.forEach(l => {
            let best = null, bestDiff = 0.6;
            trans.forEach(t => {
                const d = Math.abs(t.time - l.time);
                if (d < bestDiff) { bestDiff = d; best = t; }
            });
            if (best && best.text) l.trans = best.text;
        });
        return main;
    }

    async function fetchLyricById(id) {
        if (!id) return null;
        if (lyricCache.has(id)) return lyricCache.get(id);
        let data = null;
        try {
            const res = await fetch(`https://music-api.gdstudio.xyz/api.php?types=lyric&source=netease&id=${encodeURIComponent(id)}`);
            data = await res.json();
        } catch (e) {}
        if (!data || !data.lyric) {
            try {
                const res = await fetch(`https://open.motues.top/music?server=netease&type=lyric&id=${encodeURIComponent(id)}`);
                data = await res.json();
            } catch (e) {}
        }
        const result = (data && data.lyric) ? { lyric: data.lyric, tlyric: data.tlyric || '' } : null;
        lyricCache.set(id, result);
        return result;
    }

    // === 歌曲背景扩展信息（网易云公开 detail 接口，经 cors.isteed.cc 代理；失败静默不显示） ===
    const detailCache = new Map();
    async function fetchSongDetail(id) {
        if (!id) return null;
        if (detailCache.has(id)) return detailCache.get(id);
        let result = null;
        try {
            const api = `https://music.163.com/api/song/detail/?ids=%5B${encodeURIComponent(id)}%5D`;
            const res = await fetch(`https://cors.isteed.cc/${api}`);
            const data = await res.json();
            const s = data && data.songs && data.songs[0];
            if (s) {
                result = {
                    alias: (Array.isArray(s.alias) && s.alias[0]) || '',
                    album: (s.album && s.album.name) || '',
                    artist: (s.artists || []).map(a => a.name).join(' / ')
                };
            }
        } catch (e) {}
        detailCache.set(id, result);
        return result;
    }

    function renderLyrics() {
        const html = lyricLines.length
            ? lyricLines.map((l, i) => `<p class="cr-lyric-line" data-idx="${i}"><span class="cr-lyric-main">${escLyric(l.text) || '♪'}</span>${l.trans ? `<span class="cr-lyric-trans">${escLyric(l.trans)}</span>` : ''}</p>`).join('')
            : `<p class="cr-lyric-empty">暂无歌词</p>`;
        $('#cr-lyric-inner-pc, #cr-lyric-inner-mob').html(html);
        currentLyricIdx = -1;
        updateLyricHighlight(true);
    }

    // 歌词滚动用 rAF 指数缓动：逐帧赋值若叠加 CSS scroll-behavior:smooth 会被逐帧平滑化，滚动滞后于高亮；
    // 目标变化时只更新目标值（平滑接续），不会像逐行动画那样被打断重启
    function animateLyricScroll(el, target) {
        const st = el.__lyricScroll || (el.__lyricScroll = { raf: 0, target: 0 });
        st.target = target;
        if (st.raf) return;
        const step = () => {
            const cur = el.scrollTop;
            const diff = st.target - cur;
            if (Math.abs(diff) < 0.8) { el.scrollTop = st.target; st.raf = 0; return; }
            el.scrollTop = cur + diff * 0.14;
            st.raf = requestAnimationFrame(step);
        };
        st.raf = requestAnimationFrame(step);
    }

    function scrollLyricToCenter(sel) {
        const el = document.querySelector(sel);
        if (!el) return;
        const line = el.querySelector('.cr-lyric-line.active');
        if (!line) return;
        // 用 rect 差值算行相对滚动容器的位置：offsetTop 会混入 offsetParent（.vinyl-stage）的偏移导致落点错位
        const delta = line.getBoundingClientRect().top - el.getBoundingClientRect().top;
        const target = Math.max(0, el.scrollTop + delta - el.clientHeight / 2 + line.offsetHeight / 2);
        animateLyricScroll(el, target);
    }

    function updateLyricHighlight(force) {
        if (!lyricLines.length) return;
        const t = audioObj.currentTime || 0;
        let idx = -1;
        for (let i = 0; i < lyricLines.length; i++) {
            if (lyricLines[i].time <= t + 0.15) idx = i; else break;
        }
        if (idx === currentLyricIdx && !force) return;
        currentLyricIdx = idx;
        ['#cr-lyric-inner-pc', '#cr-lyric-inner-mob'].forEach(sel => {
            const $lines = $(sel).children('.cr-lyric-line');
            $lines.removeClass('active');
            if (idx >= 0) $lines.eq(idx).addClass('active');
        });
        if (Date.now() > lyricManualUntil.pc) scrollLyricToCenter('#cr-lyric-scroll-pc');
        if (Date.now() > lyricManualUntil.mob) scrollLyricToCenter('#cr-lyric-scroll-mob');
    }

    async function applyCurrentLyric(title, artist) {
        lyricLines = [];
        currentLyricIdx = -1;
        renderLyrics();
        $('#cr-vinyl-source-wrap').hide();
        if (!title) return;
        let id = currentNeteaseSongId;
        if (!id) {
            const info = await fetchPicIdBySearch(title, artist);
            if (currentPlayingTrackInfo.title !== title) return;
            id = (info && info.songId) || '';
            if (id) currentNeteaseSongId = id;
        }
        if (!id) return;
        const data = await fetchLyricById(id);
        if (currentPlayingTrackInfo.title !== title) return; // 播放已切歌：丢弃过期结果
        if (data) lyricLines = mergeLyricTrans(parseLrc(data.lyric), parseLrc(data.tlyric));
        renderLyrics();
        const detail = await fetchSongDetail(id);
        if (currentPlayingTrackInfo.title !== title) return;
        if (detail) {
            if (detail.alias) { $('#cr-vinyl-source').text(detail.alias); $('#cr-vinyl-source-wrap').show(); }
            if (detail.album) $('#cr-vinyl-album').text(detail.album).show();
        }
    }

    // 移动端歌词区：点击展开全屏歌词 / 展开态点击歌词正文以外区域收起
    $('#cr-lyric-scroll-mob').on('click', function(e) {
        const $el = $(this);
        if ($el.hasClass('expanded')) {
            if ($(e.target).closest('.cr-lyric-line').length) return;
            $el.removeClass('expanded');
            currentLyricIdx = -1;
            setTimeout(() => { currentLyricIdx = -1; updateLyricHighlight(true); }, 350);
        } else {
            $('#cr-lyric-head-title').text($('#v-mob-title').text());
            $('#cr-lyric-head-sub').text($('#v-mob-artist').text());
            $el.addClass('expanded');
            currentLyricIdx = -1;
            updateLyricHighlight(true);
            // 展开后布局尺寸变化，等过渡稳定再重新居中一次
            setTimeout(() => { currentLyricIdx = -1; updateLyricHighlight(true); }, 400);
        }
    });
    // 手动滑动歌词后 3 秒内不自动抢回滚动位置（rAF 缓动进行中的滚动不计为手动）
    $('#cr-lyric-scroll-pc').on('scroll', function() {
        const st = this.__lyricScroll;
        if (st && st.raf) return;
        lyricManualUntil.pc = Date.now() + 3000;
    });
    $('#cr-lyric-scroll-mob').on('scroll', function() {
        const st = this.__lyricScroll;
        if (st && st.raf) return;
        lyricManualUntil.mob = Date.now() + 3000;
    });

    function openVinylPage() {
        $('#cr-vinyl-overlay').addClass('open');
        updateCoverUI();
        updateBgmUI();
        // 歌词区此时才从隐藏转为显示，scrollTop 归零，需重新居中到当前播放位置
        currentLyricIdx = -1;
        updateLyricHighlight(true);
        setTimeout(() => { currentLyricIdx = -1; updateLyricHighlight(true); }, 350);
    }
    $('#pb-cover').on('click', openVinylPage);
    $('.pb-info').on('click', openVinylPage);
    $('#cr-vinyl-close').on('click', () => $('#cr-vinyl-overlay').removeClass('open'));

    // === 播放器模式：全屏封面 / 经典黑胶（模式类挂在 overlay 上，两模式共用同一套歌词 DOM） ===
    const PLAYBACK_MODE_KEY = 'cr_playback_mode';
    function setPlaybackMode(mode, silent) {
        const m = (mode === 'vinyl') ? 'vinyl' : 'fullscreen-cover';
        $('#cr-vinyl-overlay').removeClass('mode-fullscreen-cover mode-vinyl').addClass('mode-' + m);
        $('#pm-card-cover').toggleClass('selected', m === 'fullscreen-cover');
        $('#pm-card-vinyl').toggleClass('selected', m === 'vinyl');
        localStorage.setItem(PLAYBACK_MODE_KEY, m);
        // 两模式下歌词容器的几何位置不同，切换后需重新居中到当前播放行
        currentLyricIdx = -1;
        updateLyricHighlight(true);
        setTimeout(() => { currentLyricIdx = -1; updateLyricHighlight(true); }, 60);
        if (!silent) showPlayerToast(m === 'fullscreen-cover' ? '已切换至：全屏封面模式' : '已切换至：经典黑胶模式', 1600);
    }

    function initPlayerModeControls() {
        const $modal = $('#cr-player-mode-modal');
        $('#cr-vinyl-mode-btn').on('click', function(e) {
            e.stopPropagation();
            $modal.toggleClass('open');
        });
        $('.pm-mode-card').on('click', function(e) {
            e.stopPropagation();
            setPlaybackMode($(this).data('mode'));
            $modal.removeClass('open');
        });
        $(document).on('click', function(e) {
            if ($modal.hasClass('open') && !$(e.target).closest('#cr-player-mode-modal, #cr-vinyl-mode-btn').length) {
                $modal.removeClass('open');
            }
        });
    }

    // === 打开网易云歌曲原页面（便于登录账号收藏红心） ===
    async function openNeteaseSongPage() {
        const title = currentPlayingTrackInfo.title;
        if (!title || !audioObj.src) { showPlayerToast('当前无正在播放的曲目', 1800); return; }
        if (!currentNeteaseSongId) {
            showPlayerToast('正在定位网易云源曲目...', 1500);
            const info = await fetchPicIdBySearch(title, currentPlayingTrackInfo.artist);
            currentNeteaseSongId = (info && info.songId) || '';
        }
        if (currentNeteaseSongId) {
            window.open(`https://music.163.com/#/song?id=${currentNeteaseSongId}`, '_blank');
        } else {
            showPlayerToast('⚠️ 未能定位到网易云源曲目（自定义/直链歌曲无对应页面）', 2200);
        }
    }
    $('#cr-vinyl-netease-btn').on('click', function(e) {
        e.stopPropagation();
        openNeteaseSongPage();
    });


    function getAllLibrarySongs() {
        let all = [];
        bgmPlaylists.forEach((pl, pIdx) => {
            pl.songs.forEach((song, sIdx) => {
                all.push({ pIdx, sIdx, song });
            });
        });
        return all;
    }

    function prevSong() {
        let allSongs = getAllLibrarySongs();
        if (allSongs.length === 0) return;

        if (playMode === 'shuffle_all') {
            let candidatePool = allSongs;
            if (allSongs.length > 1 && currentPlaylistIndex !== -1) {
                candidatePool = allSongs.filter(item => !(item.pIdx === currentPlaylistIndex && item.sIdx === currentSongIndex));
            }
            let pick = candidatePool[Math.floor(Math.random() * candidatePool.length)];
            playSpecificSong(pick.pIdx, pick.sIdx);
            return;
        }

        if (currentPlaylistIndex === -1) {
            let validLists = bgmPlaylists.map((pl, idx) => ({pl, idx})).filter(item => item.pl.songs.length > 0);
            if (validLists.length === 0) return;
            let targetList = validLists[0];
            playSpecificSong(targetList.idx, 0);
            return;
        }

        let list = bgmPlaylists[currentPlaylistIndex].songs;
        if (!list || list.length === 0) return;

        let targetIdx = currentSongIndex;
        if (playMode === 'list_random') {
            if (list.length > 1) {
                let pool = [];
                for (let i = 0; i < list.length; i++) {
                    if (i !== currentSongIndex) pool.push(i);
                }
                targetIdx = pool[Math.floor(Math.random() * pool.length)];
            } else {
                targetIdx = 0;
            }
        } else {
            targetIdx = (currentSongIndex <= 0) ? list.length - 1 : currentSongIndex - 1;
        }
        playSpecificSong(currentPlaylistIndex, targetIdx);
    }

    function nextSong() {
        let allSongs = getAllLibrarySongs();
        if (allSongs.length === 0) return;

        if (playMode === 'shuffle_all') {
            let candidatePool = allSongs;
            if (allSongs.length > 1 && currentPlaylistIndex !== -1) {
                candidatePool = allSongs.filter(item => !(item.pIdx === currentPlaylistIndex && item.sIdx === currentSongIndex));
            }
            let pick = candidatePool[Math.floor(Math.random() * candidatePool.length)];
            playSpecificSong(pick.pIdx, pick.sIdx);
            return;
        }

        if (currentPlaylistIndex === -1) {
            let validLists = bgmPlaylists.map((pl, idx) => ({pl, idx})).filter(item => item.pl.songs.length > 0);
            if (validLists.length === 0) return;
            let targetList = validLists[0];
            playSpecificSong(targetList.idx, 0);
            return;
        }

        let list = bgmPlaylists[currentPlaylistIndex].songs;
        if (!list || list.length === 0) return;

        let targetIdx = currentSongIndex;
        if (playMode === 'list_random') {
            if (list.length > 1) {
                let pool = [];
                for (let i = 0; i < list.length; i++) {
                    if (i !== currentSongIndex) pool.push(i);
                }
                targetIdx = pool[Math.floor(Math.random() * pool.length)];
            } else {
                targetIdx = 0;
            }
        } else {
            targetIdx = (currentSongIndex >= list.length - 1) ? 0 : currentSongIndex + 1;
        }
        playSpecificSong(currentPlaylistIndex, targetIdx);
    }

    // === 全页布局：加载即渲染左侧歌单与中央曲目表 ===
    renderPlaylists();
    applyCurrentCover(localStorage.getItem('cr_last_song_title') || '', localStorage.getItem('cr_last_song_artist') || '');
    applyCurrentLyric(localStorage.getItem('cr_last_song_title') || '', localStorage.getItem('cr_last_song_artist') || '');
    $('#cr-vinyl-album').hide();

    // === 播放器模式初始化（默认全屏封面，读取上次记忆） ===
    initPlayerModeControls();
    setPlaybackMode(localStorage.getItem(PLAYBACK_MODE_KEY) || 'fullscreen-cover', true);

    // === 启动初始化记忆恢复与播放控制 ===
    setTimeout(() => {
        let initAutoplay = localStorage.getItem('cr_init_autoplay') === 'true';
        let lastTitle = localStorage.getItem('cr_last_song_title');
        let lastArtist = localStorage.getItem('cr_last_song_artist');

        if (initAutoplay) {
            if (lastTitle) {
                playDirect(lastTitle, lastArtist || '');
            } else {
                playDirect('Echoes of the Eye', '');
            }
        } else {
            // 静默待机模式：回填曲目信息但暂不自动播放音频
            if (lastTitle) {
                let loc = findSongInPlaylists(lastTitle, lastArtist);
                if (loc) {
                    currentPlaylistIndex = loc.pIdx;
                    currentSongIndex = loc.sIdx;
                }
                currentPlayingTrackInfo = { title: lastTitle, artist: lastArtist || '未知艺术家', url: '' };
                $('#bgm-now-playing').text(lastTitle);
                $('#bgm-now-artist').text(lastArtist ? `- ${lastArtist}` : '');
                applyCurrentCover(lastTitle, lastArtist || '');
                applyCurrentLyric(lastTitle, lastArtist || '');
                updatePlayerFavBtn();
            } else {
                $('#bgm-now-playing').text('音乐电台');
                $('#bgm-now-artist').text('就绪 (待机中)');
            }
            isPlaying = false;
            updateBgmUI();
        }
    }, 1000);

    // 页面卸载时安全销毁
    $(window).on('pagehide', () => {
        $('#cr-app, #celestial-radio-css, #celestial-radio-font').remove();
    });

})();