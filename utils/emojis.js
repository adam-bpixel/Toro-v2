'use strict';
const EMOJI = {
  coin: '<:rvpcoins:1551750396223955005>',
  gift: '<:gift:1551750411986149386>',
  box: '<:box:1551750407519207426>',
  cards: '<:cardvw:1551750416444956702>',
  card: '<:card100:1551750421213880391>',
  inventory: '<:ittoro:1551750401102188594>',
  success: '<a:toro_success:1551750377756561571>',
  point: '<:point:1551750386967122050>',
  left: '<a:left:1551750276745003040>',
  right: '<a:right:1551750281555873882>',
  premiumFree: '<:prmfree:1551750382206718012>',
  premiumActive: '<:prmActivated:1552285203777454231>',
  getPremium: '<:getpremium:1551750391841165342>',
  clan: '<:clans:1553391182330073128>',
};

const ROLES_LIST_EMOJI = {
  title: '<:roles:1529701366711324682>',
};

const TICKET_EMOJI = {
  header: '<:ticket:1552111291790008350>',
  pub: '<:allumi:1552111294759571536>',
  bugs: '<:bughunter2:1551750291098042448>',
  abuse: '<:discord_employee:1552111297628213290>',
  server: '<:quarantined:1552111300916547705>',
  staff: '<:bans:1552111305375359041>',
  donate: '<:premiumbot:1551750296118497390>',
  footer: '<:torocc:1551750443221393448>',
};

const TICKET_LOG_EMOJI = {
  opened: '<:ticket_lock_open:1553168137929625731>',
  closed: '<:ticket_lock_closed:1553168139230126146>',
};

const SETUP_EMOJI = {
  param: '<:param:1551750316867850291>',
  dropdown: '<:4151dropdownmenu:1551750312304443395>',
};

const SERVER_EMOJI = {
  ownership: '<:ownership:1552285172404064367>',
  members: '<:members:1551750325835268146>',
  bot: '<:bot:1552285175935934526>',
  text: '<:text:1552285180054474774>',
  voice: '<:voicee:1551750355497386036>',
  category: '<:categorys:1552285182373929022>',
  thread: '<:thread:1551750360014524528>',
  channels: '<:channels:1551750330595811338>',
  region: '<:region:1552285186434142319>',
  link: '<:link:1551750321330589696>',
  emoji: '<:emoji:1552285188795404340>',
  sticker: '<:sticker:1551750368906448946>',
  boost: '<:boostmax:1552285191001870497>',
  premiumActive: '<:prmActivated:1552285203777454231>',
};

const FAIL = '❌';

const BADGE_EMOJI = {
  hypesquadBravery: '<:house_bravery:1552357115245494345>',
  rare: '<:rare_badge:1552357117229535253>',
};

const APPLY_EMOJI = {
  staff: '<a:emoji_1:1552357124300865577>',
  designer: '<:designer:1552357127237144719>',
  developer: '<:eardev:1552357132190486698>',
  eventHoster: '<a:eventHoster:1552357141862547528>',
  partnership: '<:partner:1552357147801559140>',
  review: '<:applyreview:1552360110938919084>',
  accept: '<a:toro_accepte:1552363403031478283>',
  reject: '<a:toro_reject:1552363412275855390>',
};

const CLAIMROLES_EMOJI = {
  header: '<:link:1551750321330589696>',
  add: { name: '1484pluse', id: '1552807509423558787' },
  edit: { name: '3639edit', id: '1552807511030108271' },
  remove: { name: '1343logautomodminusd', id: '1552807518168940666' },
};

const ROLE_REQUEST_EMOJI = {
  header: APPLY_EMOJI.review,
  param: SETUP_EMOJI.param,
  dropdown: SETUP_EMOJI.dropdown,
  channel: '<:3639edit:1552807511030108271>',
  add: '<:1484pluse:1552807509423558787>',
  remove: '<:1343logautomodminusd:1552807518168940666>',
  send: EMOJI.right,
  back: EMOJI.left,
  settings: SETUP_EMOJI.param,
  categories: '<:rr_categories:1553112889206771892>',
  request: '<:link:1551750321330589696>',
  member: SERVER_EMOJI.members,
  role: '<:rr_roles:1553112893149544479>',
  accept: APPLY_EMOJI.accept,
  dmAccepted: '<:rr_accepted:1553159964904923177>',
  dmDenied: '<:rr_denied:1553159967052406909>',
  reject: APPLY_EMOJI.reject,
  success: EMOJI.success,
  point: EMOJI.point,
};

const LEADERBOARD_EMOJI = {
  title: '<:clans:1553391182330073128>',
  top: '<a:_top_:1553391202769051658>',
  ranks: {
    1: '<a:1_:1553391212344381531>',
    2: '<a:2_:1551750434140590133>',
    3: '<a:3_:1551750429581254801>',
    4: '<a:4_:1553391217188802640>',
    5: '<a:5_:1551992630609584299>',
    6: '<a:6_:1553391504205021214>',
    7: '<a:7_:1553391511058649178>',
    8: '<a:8_:1553391516964102205>',
    9: '<a:9_:1551973016248783019>',
  },
  zero: '<a:0_:1553428217636069468>',
  messages: '<:messages:1553428196379328595>',
  invites: '<:invites:1553428200174911639>',
  fake: '<:fake:1553428207418482809>',
  left: '<:leftt:1553428213739557075>',
  invite: '<:9437invite:1551750351017873490>',
};

const nameStyleIcon = (name, id) => ({ name, id, text: '<:' + name + ':' + id + '>' });
const NAME_STYLE_EMOJI = {
  font: nameStyleIcon('ns_font', '1553429242581221407'),
  effects: nameStyleIcon('ns_effects', '1553429244342702182'),
  home: nameStyleIcon('ns_home', '1553429246515355658'),
  title: nameStyleIcon('ns_house', '1553453659939930314'),
};

const INVITES_EMOJI = '<:invites_icon:1553425312745005106>';

const VOICE_EMOJI = {
  title: '<:ohhh:1553451244440395776>',
  lock: '<:vclock:1553451248215134260>',
  unlock: '<:vcunlock:1553451253147631629>',
  ghost: '<:vcghost:1553451257903980587>',
  reveal: '<:vcreveal:1553451263121686670>',
  name: '<:vcname:1553451267748012044>',
  limit: '<:vclimit:1553451272357548203>',
  claim: '<:vcclaim:1553451276363239565>',
  kick: '<:vcdisconnect:1553451281031634994>',
  activity: '<:vcactivity:1553451286123253810>',
  owner: '<:vcinfo:1553451296579649637>',
  info: '<:vc_info_icon:1553487031517188238>',
};

const VOICEMASTER_EMOJI = {
  lock: { name: 'vm_lock', id: '1553455547754487871' },
  unlock: { name: 'vm_unlock', id: '1553455551042560000' },
  hide: { name: 'vm_hide', id: '1553482964480823306' },
  reveal: { name: 'vm_reveal', id: '1553455557476884652' },
  rename: { name: 'vm_rename', id: '1553455560039465001' },
  claim: { name: 'vm_claim', id: '1553455562753187910' },
  increase: { name: 'vm_increase', id: '1553455564766445645' },
  decrease: { name: 'vm_decrease', id: '1553455567090094091' },
  delete: { name: 'vm_delete', id: '1553455569753346208' },
  info: { name: 'vm_info', id: '1553455572236509194' },
  title: { name: 'vm_title', id: '1553488499326582836' },
};

const OWNER_EMOJI = {
  servers: '<:owner_servers:1553511873687724184>',
  leave: '<:owner_leave:1553511876581658744>',
  reload: '<:owner_reload:1553511881321484358>',
  restart: '<:owner_restart:1553511883976474654>',
};

const IQ_EMOJI = {
  title: '<:iq_brain:1553514599171624980>',
  user: '<:iq_user:1553514600924979220>',
  score: '<:iq_gauge:1553514606725570744>',
  verdict: '<:iq_award:1553514609351331960>',
};

const STATS_EMOJI = { title: '<a:stats_heart:1553540392409104536>' };

const PING_EMOJI = { title: '<:ping:1553864652675481712>' };

const ROLES_EMOJI = {
  jail: '<:jail:1553870977455231128>',
  muted: '<:servermuted:1553870983818121287>',
  boy: '<:male_:1553870986284109838>',
  girl: '<:female_png:1553870990386405387>',
  unverified: '<:5139help:1553870998598590465>',
  leader: SERVER_EMOJI.ownership,
  coleader: SERVER_EMOJI.members,
};

const USER_BADGE_EMOJI = {
  staff: '<:b_staff:1550921003280892064>',
  partner: '<:b_partner:1550921006053466245>',
  certifiedModerator: '<:b_certified_moderator:1550921008620376084>',
  hypesquad: '<:b_hypesquad:1550921010725916893>',
  house1: '<:b_hypesquad_house_1:1550916877826392255>',
  house2: '<:b_hypesquad_house_2:1550921012994899968>',
  house3: '<:b_hypesquad_house_3:1550921014857175171>',
  bugHunter1: '<:b_bug_hunter_level_1:1550921017239805982>',
  bugHunter2: '<:b_bug_hunter_level_2:1550921023296114729>',
  earlySupporter: '<:b_early_supporter:1550921029814329407>',
  verifiedDeveloper: '<:b_verified_developer:1550921027540754492>',
  activeDeveloper: '<:b_active_developer:1550921032146227243>',
  verifiedBot: '<:b_verified_bot:1550923819915419688>',
  nitro: '<:b_premium:1550927669418401925>',
  badge5: '<:badge5:1559600616790167603>',
  boost: [
    '<:b_guild_booster_lvl1:1550923764198543360>',
    '<:b_guild_booster_lvl2:1550923774952734720>',
    '<:b_guild_booster_lvl3:1550923696946815018>',
    '<:b_guild_booster_lvl4:1550923779470008392>',
    '<:b_guild_booster_lvl5:1550923784536461446>',
    '<:b_guild_booster_lvl6:1550923790836306020>',
    '<:b_guild_booster_lvl7:1550923796159135857>',
    '<:b_guild_booster_lvl8:1550923803482136716>',
    '<:b_guild_booster_lvl9:1550923812176928889>',
  ],
};

const SUGGEST_EMOJI = {
  header: '<:early_supporter:1551750285586731123>',
  accept: APPLY_EMOJI.accept,
  reject: APPLY_EMOJI.reject,
};

const HONEYPOT_EMOJI = {
  pot: '<:pot:1557171813140668466>',
  brand: '<:vynelcc:1477838126880657518>',
};

const BOOSTERS_EMOJI = {
  header: '<:boosterr:1558644896620085328>',
};

let EXPORTS = { USER_BADGE_EMOJI, IQ_EMOJI, STATS_EMOJI, PING_EMOJI, ROLES_EMOJI, ROLES_LIST_EMOJI, EMOJI, VOICE_EMOJI, OWNER_EMOJI, VOICEMASTER_EMOJI, INVITES_EMOJI, NAME_STYLE_EMOJI, FAIL, LEADERBOARD_EMOJI, ROLE_REQUEST_EMOJI, TICKET_EMOJI, TICKET_LOG_EMOJI, SETUP_EMOJI, SERVER_EMOJI, BADGE_EMOJI, APPLY_EMOJI, CLAIMROLES_EMOJI, SUGGEST_EMOJI, HONEYPOT_EMOJI, BOOSTERS_EMOJI };

const mapFile = require('path').join(__dirname, '..', 'data', 'emoji-map.json');
if (require('fs').existsSync(mapFile)) {
  const map = JSON.parse(require('fs').readFileSync(mapFile, 'utf8'));
  const remap = (value) => {
    if (typeof value === 'string') {
      return value.replace(/<(a?):([^:>]+):(\d+)>/g, (full, anim, name, id) => {
        const entry = map[id];
        if (!entry) return full;
        const newId = typeof entry === 'string' ? entry : entry.id;
        const newAnim = typeof entry === 'string' ? anim : (entry.animated ? 'a' : '');
        return `<${newAnim}:${name}:${newId}>`;
      });
    }
    if (Array.isArray(value)) return value.map(remap);
    if (value && typeof value === 'object') {
      const out = {};
      for (const key of Object.keys(value)) {
        if (key === 'id' && map[value[key]]) {
          const entry = map[value[key]];
          out[key] = typeof entry === 'string' ? entry : entry.id;
        } else out[key] = remap(value[key]);
      }
      return out;
    }
    return value;
  };
  if (Object.keys(map).length) EXPORTS = remap(EXPORTS);
}

module.exports = EXPORTS;
