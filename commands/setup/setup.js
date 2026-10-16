const { replay } = require('../../utils/runtime/replay');
const { container, ACCENT_COLOR } = require('../../utils/render/embeds');

// The &setup panel: one card per page, each with up to four "description + button" rows and
// previous/next arrows. To add a setting, add a row here and give its button a route in
// handlers/<feature>/index.js; the tests fail if a button below has no route.

const ID = (name) => `${name}_1398395532103254157`;
const BANNER = 'https://cdn.discordapp.com/attachments/1553531361329938523/1553559033422544916/ezgif-7330ede79c09b445.gif?ex=6ab9b019&is=6ab85e99&hm=de5e907c79527e2fb4c1a2c4ccb5f1c61d5966fa789e328177fe46f837563e13&';
const BULLET = '<:4151dropdownmenu:1551750312304443395>';
const LEFT = { id: '1551750276745003040', name: 'left', animated: true };
const RIGHT = { id: '1551750281555873882', name: 'right', animated: true };

// [button id (before the shared ID suffix), button label, description]
const PAGES = [
  [
    ['setup_autorole', 'Auto Role', 'Configure automatic role assignment for new members'],
    ['setup_autotag', 'Auto Tag', 'Configure automatic nickname tags based on roles'],
    ['setup_staffapply', 'Staff Apply', 'Configure staff application system'],
    ['setup_logs_button', 'Logs Server', 'Configure server logging system'],
  ],
  [
    ['setup_muter', 'Muter', 'Configure muter roles for voice moderation'],
    ['setup_rolerequest', 'RoleRequest', 'Configure role request system channels'],
    ['setup_levelroles', 'Level Roles', 'Configure level roles XP reward system'],
    ['setup_jailer', 'Jailer', 'Configure jailer roles for jail moderation'],
  ],
  [
    ['setup_ticket', 'Ticket', 'Configure ticket support system'],
    ['setup_verificator', 'Verificator', 'Configure verificator roles for member verification'],
    ['setup_aliases', 'Aliases', 'Configure command aliases for custom shortcuts'],
    ['setup_clearsetup', 'Clear Setup', 'Configure channels to bypass clear command'],
  ],
  [
    ['setup_clanmanager', 'Manager', 'Configure clan manager roles for clan system'],
    ['setup_prefix', 'Prefix', 'Configure server prefix for commands'],
    ['setup_counter', 'Counter', 'Configure member and voice counter channels'],
    ['setup_roles_button', 'Roles', 'Configure various role settings for the server'],
  ],
  [
    ['setup_tempvoice', 'Temp Voice', 'Configure temporary voice channels'],
    ['setup_subscription', 'Subscription', 'Check premium subscription status'],
    ['setup_command', 'Manage', 'Enable or disable commands in your server'],
    ['setup_theme', 'Theme', 'Configure server theme accent color'],
  ],
  [
    ['setup_autoreply', 'Auto Reply', 'Configure auto replies for specific messages'],
    ['setup_noprefix', 'No Prefix', 'Configure commands that run without a prefix'],
    ['setup_welcomer', 'Welcomer', 'Configure welcome notification for new members'],
    ['setup_boost', 'Boost Notification', 'Configure boost notification channel and message'],
  ],
  [
    ['setup_honeypot', 'Honeypot', 'Set a trap channel that softbans compromised accounts'],
    ['setup_azkar', 'Azkar', 'Send Azkar reminders to a channel on a schedule'],
  ],
];

const divider = { type: 14, spacing: 1, divider: true };
const pageButton = (to, emoji, disabled) => ({ type: 2, custom_id: `${ID('setup_page')}_${to}`, style: 2, ...(disabled && { disabled: true }), emoji });
const stateOf = (n) => `p${n}`;

function pageCard(n) {
  const rows = PAGES[n - 1].flatMap(([id, label, text]) => [
    { type: 9, components: [{ type: 10, content: `- ${BULLET} __${text}__  ⁘` }], accessory: { type: 2, custom_id: ID(id), style: 2, label } },
    divider,
  ]);
  return {
    type: 17,
    accent_color: ACCENT_COLOR,
    components: [
      { type: 12, items: [{ media: { url: BANNER }, description: "{{displayName}}'s server Server Setup", spoiler: false }] },
      divider,
      { type: 10, content: `## Server Setup • Page ${n}/${PAGES.length}` },
      divider,
      ...rows,
      { type: 1, components: [pageButton(n - 1, LEFT, n === 1), pageButton(n + 1, RIGHT, n === PAGES.length)] },
    ],
    spoiler: false,
  };
}

const snapshot = (n, extra) => ({ content: '', embeds: [], components: [pageCard(n)], v2: true, attachments: [], ...extra });

// Shown only if a button has no route in handlers/ (the router answers every routed button first).
// The transition must still exist: replay disables any button it has no transition for.
const notSetUp = (from, customId) => ({
  from,
  custom_id: customId,
  value: null,
  global: true,
  kind: 'reply',
  to: null,
  reply: [{
    content: '', embeds: [], components: [container({ title: 'Notice', lines: ['__This is not set up yet__'] })],
    v2: true, attachments: [], reply: false, ping: false, ephemeral: true,
  }],
  action: false,
  modal: null,
});
const turnPage = (from, to) => ({
  from: stateOf(from), custom_id: `${ID('setup_page')}_${to}`, value: null, global: false, kind: 'update', to: stateOf(to), reply: null, action: false, modal: null,
});

const pageNumbers = PAGES.map((_, i) => i + 1);

const recorded = {
  replies: [snapshot(1, { reply: true, ping: true, primary: true })],
  reactions: [],
  flow: {
    start: stateOf(1),
    states: Object.fromEntries(pageNumbers.map((n) => [stateOf(n), snapshot(n, { reply: false, ping: false })])),
    transitions: pageNumbers.flatMap((n) => [
      ...PAGES[n - 1].map(([id]) => notSetUp(stateOf(n), ID(id))),
      ...(n > 1 ? [turnPage(n, n - 1)] : []),
      ...(n < PAGES.length ? [turnPage(n, n + 1)] : []),
    ]),
  },
};

module.exports = {
  name: 'setup',
  aliases: [],
  description: '',
  usage: '',
  category: 'Setup Commands',
  idleDisableMs: 5 * 60 * 1000,
  recorded,
  buttonIds: PAGES.flat().map(([id]) => ID(id)),
  async execute(message, args) {
    await replay(message, this, args);
  },
};
