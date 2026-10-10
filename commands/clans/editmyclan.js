const { ComponentType } = require('discord.js');
const { textBlock, divider, payloadOf, ACCENT_COLOR, COMPONENTS_V2 } = require('../../utils/render/embeds');
const { EMOJI } = require('../../utils/emojis');
const { peek } = require('../../utils/runtime/cooldown');
const activeComponents = require('../../utils/runtime/activeComponents');
const clans = require('../../models/economy/clans');
const { rehostImage } = require('../../services/imageHost');

const EPHEMERAL = 1 << 6;
const PANEL_MS = 10 * 60 * 1000;
const MODAL_MS = 2 * 60 * 1000;

const COOLDOWNS = {
  name: { key: 'editmyclan:name', ms: 60 * 1000 },
  tag: { key: 'editmyclan:tag', ms: 500 * 1000 },
  avatar: { key: 'editmyclan:avatar', ms: 60 * 1000 },
  color: { key: 'editmyclan:color', ms: 60 * 1000 },
  icon: { key: 'editmyclan:icon', ms: 60 * 1000 },
};

const BUTTONS = [[['name', 'Name'], ['avatar', 'Avatar'], ['icon', 'Icon'], ['color', 'Color'], ['tag', 'Tag']]];

const canSetIcon = (guild) => guild.features.includes('ROLE_ICONS');
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_AVATAR_BYTES = 8 * 1024 * 1024;
const MAX_ICON_BYTES = 256 * 1024;

const FORMS = {
  name: { title: 'Rename the clan', fields: [{ id: 'value', label: 'New name (3-32 characters)', max: 32 }] },
  avatar: { title: 'Upload the clan picture', upload: 'Leave it empty to remove the current picture' },
  icon: { title: 'Upload the clan role icon', upload: 'Leave it empty to remove the current icon' },
  color: { title: 'Change the clan color', fields: [{ id: 'value', label: 'Hex color', placeholder: 'ff8800', max: 7 }] },
  tag: { title: 'Change the clan tag', fields: [{ id: 'value', label: 'Tag (1-10 characters) or "off"', max: 10 }] },
};

const modalOf = (action, messageId, clan) => {
  const custom_id = `emc_modal:${action}:${messageId}`;
  if (FORMS[action].upload) {
    return {
      title: FORMS[action].title,
      custom_id,
      components: [{
        type: 18,
        label: action === 'icon' ? 'Icon (PNG, JPG, GIF or WebP, up to 256 KB)' : 'Picture (PNG, JPG, GIF or WebP, up to 8 MB)',
        description: FORMS[action].upload,
        component: { type: 19, custom_id: 'file', min_values: 0, max_values: 1, required: false },
      }],
    };
  }
  if (action === 'tag') {
    const current = clan.tagPosition === 'suffix' ? 'suffix' : 'prefix';
    return {
      title: FORMS.tag.title,
      custom_id,
      components: [
        { type: 18, label: 'Tag', component: { type: 4, custom_id: 'value', style: 1, placeholder: 'Your tag, or "off" to remove it', min_length: 1, max_length: 10, required: true } },
        {
          type: 18,
          label: 'Tag position',
          component: {
            type: 3,
            custom_id: 'position',
            placeholder: 'Choose where the tag goes',
            min_values: 1,
            max_values: 1,
            options: [
              { label: '[tag]name', value: 'prefix', description: 'The tag in front of the name', default: current === 'prefix' },
              { label: 'name[tag]', value: 'suffix', description: 'The tag after the name', default: current === 'suffix' },
            ],
          },
        },
      ],
    };
  }
  return {
    title: FORMS[action].title,
    custom_id,
    components: FORMS[action].fields.map((f) => ({
      type: 1,
      components: [{ type: 4, custom_id: f.id, label: f.label, style: 1, placeholder: f.placeholder, max_length: f.max, min_length: f.optional ? 0 : 1, required: !f.optional }],
    })),
  };
};

function panelPayload(guild, clan, messageId, { locked = false } = {}) {
  const role = guild.roles.cache.get(clan.roleId);
  const coleaders = clan.coleaderIds.length ? clan.coleaderIds.map((id) => `<@${id}>`).join(', ') : 'None';
  const info = textBlock([
    `**Clan ID : ${clan.clanId}**`,
    `  ⟿ __Leader__ : <@${clan.leaderId}>`,
    `  ⟿ __Co-Leaders__ : ${clan.coleaderIds.length}/${clan.coleaderLimit} (${coleaders})`,
    `  ⟿ __Members__ : ${clan.memberIds.length}/${clan.memberLimit}`,
    `  ⟿ __Tag__ : ${clan.tag ? `[${clan.tag}] (${clan.tagPosition || 'prefix'})` : 'None'}`,
    `  ⟿ __Color__ : ${clan.color ? `\`#${clan.color}\`` : 'Default'}`,
    `  ⟿ __Role__ : ${role ? `${role}` : 'None'}`,
  ].join('\n'));
  const iconUrl = clan.avatarUrl || role?.iconURL({ size: 256 });
  const details = iconUrl
    ? { type: 9, components: [info], accessory: { type: 11, media: { url: iconUrl }, description: clan.name, spoiler: false } }
    : info;

  const rows = locked ? [] : [
    ...BUTTONS.map((row) => ({
      type: 1,
      components: row.map(([action, label, style]) => ({ type: 2, custom_id: `emc:${action}:${messageId}`, label, style: style || 2, disabled: action === 'icon' && !canSetIcon(guild) })),
    })),
  ];
  return {
    flags: COMPONENTS_V2,
    components: [{
      type: 17,
      accent_color: ACCENT_COLOR,
      components: [
        textBlock(`## ${EMOJI.clan} Edit ${clan.name}`),
        divider(),
        details,
        divider(),
        textBlock(locked ? '-# This panel was closed.' : '-# Only the clan leader can use these buttons.'),
        ...(rows.length ? [divider(), ...rows] : []),
      ],
      spoiler: false,
    }],
  };
}

const wait = (ms) => (ms >= 60000 ? `${Math.ceil(ms / 60000)}m` : `${Math.ceil(ms / 1000)}s`);

async function apply(action, guild, clan, member, values) {
  const value = (values.value || '').trim();
  const spec = COOLDOWNS[action];
  const key = spec && `${spec.key}:${guild.id}:${clan.clanId}`;
  if (spec) {
    const cd = peek(key, spec.ms);
    if (cd.onCooldown) return { error: `Slow down, try again in ${wait(cd.remainingMs)}` };
  }
  const done = (problem, text) => {
    if (problem) return { error: problem };
    if (key) clans.startCooldown(key);
    return { text };
  };

  if (action === 'name') return done(await clans.renameClan(guild, clan, value), `The clan was renamed to **${value}**`);
  if (action === 'color') return done(await clans.setClanColor(guild, clan, value), `The clan color is now \`#${value.replace(/^#/, '').toLowerCase()}\``);
  if (action === 'avatar' || action === 'icon') {
    const file = values.file;
    const isIcon = action === 'icon';
    if (file) {
      if (!IMAGE_TYPES.includes((file.contentType || '').split(';')[0])) return { error: 'The file must be a PNG, JPG, GIF or WebP image' };
      if (file.size > (isIcon ? MAX_ICON_BYTES : MAX_AVATAR_BYTES)) return { error: isIcon ? 'A role icon must be under 256 KB' : 'The picture must be under 8 MB' };
    }
    if (isIcon) {
      if (!canSetIcon(guild)) return { error: 'This server needs boost level 2 to give roles an icon' };
      const role = guild.roles.cache.get(clan.roleId);
      if (!role) return { error: 'The clan has no role' };
      try {
        await role.setIcon(file ? file.url : null, 'Clan icon');
      } catch (error) {
        return { error: `Discord refused the icon: ${error.rawError?.message || error.message}` };
      }
      return done(null, file ? 'The clan role icon was updated' : 'The clan role icon was removed');
    }
    if (!file) return done(await clans.setClanAvatar(guild, clan, null), 'The clan picture was removed');
    const hosted = await rehostImage({ url: file.url, name: file.name }).catch(() => null);
    if (!hosted) return { error: "I couldn't save that picture, try again" };
    return done(await clans.setClanAvatar(guild, clan, hosted), 'The clan picture was updated');
  }
  if (action === 'tag') {
    const off = ['off', 'none', 'remove'].includes(value.toLowerCase());
    const position = (values.position || 'prefix').trim().toLowerCase();
    if (!off && !['prefix', 'suffix'].includes(position)) return { error: 'The position must be `prefix` or `suffix`' };
    const result = await clans.setClanTag(guild, clan, off ? null : value, off ? 'prefix' : position);
    if (typeof result === 'string') return { error: result };
    const note = result.failed ? ` (${result.failed} nickname${result.failed === 1 ? '' : 's'} could not be changed)` : '';
    return done(null, `${off ? 'The tag was removed' : `The tag is now \`[${value}]\` as a ${position}`}${note}`);
  }

  return { error: 'Unknown action' };
}

module.exports = {
  name: 'editmyclan',
  aliases: ['editclan'],
  description: 'Edit your clan (leader only)',
  usage: '',
  category: 'Clans Commands',
  async execute(message) {
    const { guild } = message;
    const clan = await clans.requireClanRank(message, { leaderOnly: true });
    if (!clan) return;

    const sent = await message.reply({ ...panelPayload(guild, clan, message.id), allowedMentions: { repliedUser: true, parse: [] } });
    activeComponents.claim(sent.id);
    const collector = sent.createMessageComponentCollector({ componentType: ComponentType.Button, time: PANEL_MS });

    const currentClan = async () => {
      const fresh = await clans.getClanOf(guild.id, message.author.id);
      return fresh && fresh.leaderId === message.author.id ? fresh : null;
    };
    const reply = (interaction, opts) => interaction.reply({ ...payloadOf(opts), flags: COMPONENTS_V2 | EPHEMERAL, allowedMentions: { parse: [] } });

    collector.on('collect', async (interaction) => {
      try {
        if (interaction.user.id !== message.author.id) {
          return await reply(interaction, { title: 'Notice', lines: ['__Only the person who opened this panel can use it__'] });
        }
        const action = interaction.customId.split(':')[1];
        const current = await currentClan();
        if (!current) return await reply(interaction, { title: 'Notice', lines: ['__You are not a clan leader anymore__'] });

        await interaction.showModal(modalOf(action, message.id, current));
        const submit = await interaction.awaitModalSubmit({
          time: MODAL_MS,
          filter: (i) => i.customId === `emc_modal:${action}:${message.id}` && i.user.id === message.author.id,
        }).catch(() => null);
        if (!submit) return;

        const fresh = await currentClan();
        if (!fresh) return await reply(submit, { title: 'Notice', lines: ['__You are not a clan leader anymore__'] });
        const values = FORMS[action].upload
          ? { file: submit.fields.getUploadedFiles('file')?.first() || null }
          : Object.fromEntries(FORMS[action].fields.map((f) => [f.id, submit.fields.getTextInputValue(f.id)]));
        if (action === 'tag') [values.position] = submit.fields.getStringSelectValues('position');
        await submit.deferUpdate();
        const result = await apply(action, guild, fresh, interaction.member, values);
        if (result.error) return await submit.followUp({ ...payloadOf({ title: 'Notice', lines: [`__${result.error}__`] }), flags: COMPONENTS_V2 | EPHEMERAL, allowedMentions: { parse: [] } });

        const updated = await currentClan();
        if (updated) await submit.editReply(panelPayload(guild, updated, message.id));
        else await submit.editReply(panelPayload(guild, fresh, message.id, { locked: true }));
        await submit.followUp({ ...payloadOf({ title: 'Clan Command', lines: [`__${result.text}__`] }), flags: COMPONENTS_V2 | EPHEMERAL, allowedMentions: { parse: [] } });
      } catch (error) {
        console.error('Edit clan panel failed:', error);
      }
    });

    collector.on('end', async (_collected, reason) => {
      activeComponents.release(sent.id);
      const fresh = await clans.getClan(guild.id, clan.clanId).catch(() => null);
      sent.edit(panelPayload(guild, fresh || clan, message.id, { locked: true })).catch(() => {});
    });
  },
};
