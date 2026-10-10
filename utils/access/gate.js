'use strict';
const { PermissionFlagsBits: P } = require('discord.js');
const { isOwner } = require('../../models/economy/premium');

const COMPONENTS_V2 = 1 << 15;
const EPHEMERAL = 1 << 6;

const REQUIRED = {
  setup: P.Administrator,
  autotag: P.Administrator,
  tempvoice: P.Administrator,
  guildprofile: P.Administrator,
  resetverificators: P.Administrator,
  rolemanager: P.ManageRoles,
  searchmessage: P.ManageMessages,
  move: P.MoveMembers,
  randommembervoice: P.MoveMembers,
  setstatus: P.ManageChannels,
};

function lacksPermission(message, command) {
  const needed = REQUIRED[command.name];
  if (!needed || !message.guild || !message.member) return false;
  if (isOwner(message.author.id)) return false;
  return !message.member.permissions.has(needed);
}

function notYours(interaction) {
  return interaction.reply({
    flags: COMPONENTS_V2 | EPHEMERAL,
    components: [{
      type: 17,
      accent_color: 13944790,
      components: [
        { type: 10, content: '## Notice' },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: '- __Only the person who ran this command can use these buttons__  ⁘' },
      ],
      spoiler: false,
    }],
  }).catch(() => {});
}

async function invokerOf(interaction) {
  const message = interaction.message;
  const slashUser = message.interactionMetadata?.user?.id || message.interaction?.user?.id;
  if (slashUser) return slashUser;
  const refId = message.reference?.messageId;
  if (!refId) return null;
  const original = await message.channel.messages.fetch(refId).catch(() => null);
  return original ? original.author.id : null;
}

module.exports = { lacksPermission, notYours, invokerOf };
