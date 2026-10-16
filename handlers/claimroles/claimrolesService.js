'use strict';
const { PermissionsBitField, MessageFlags } = require('discord.js');
const { EMOJI } = require('../../utils/emojis');
const { container, COMPONENTS_V2 } = require('../../utils/render/embeds');

const DANGEROUS_PERMISSIONS = [
  'Administrator', 'ManageGuild', 'ManageRoles', 'ManageChannels', 'ManageWebhooks', 'ManageGuildExpressions',
  'ManageEvents', 'ManageMessages', 'ManageThreads', 'ManageNicknames', 'KickMembers', 'BanMembers',
  'ModerateMembers', 'MuteMembers', 'DeafenMembers', 'MoveMembers', 'MentionEveryone', 'ViewAuditLog',
];

function checkRoleEligibility(guild, role, claimableRoleIds) {
  if (!role || !claimableRoleIds.has(role.id)) return 'no longer available';
  if (new PermissionsBitField(role.permissions).any(DANGEROUS_PERMISSIONS, false)) return 'has elevated permissions';
  if (role.managed || role.position >= guild.members.me.roles.highest.position) return "I can't assign that role";
  return null;
}

function buildClaimResult({ added, removed, skipped }) {
  const names = (roles) => roles.map((role) => `\`${role.name.replaceAll('`', "'")}\``).join(', ');
  const card = (title, label, roles) => container({
    title: `${EMOJI.success} ${title}`,
    lines: [`**${label}:** ${names(roles)}`],
  });

  return {
    flags: COMPONENTS_V2 | MessageFlags.Ephemeral,
    components: [
      ...(added.length ? [card('Role Added', 'Added', added)] : []),
      ...(removed.length ? [card('Role Removed', 'Removed', removed)] : []),
      ...(skipped.length ? [container({ title: 'Notice', lines: skipped })] : []),
    ],
  };
}

async function executeRoleAssignment(interaction, roleIds, claimableRoleIds, noticeFn) {
  const { guild, member } = interaction;
  const toAdd = [];
  const toRemove = [];
  const skipped = [];

  for (const roleId of roleIds) {
    const role = guild.roles.cache.get(roleId);
    const problem = checkRoleEligibility(guild, role, claimableRoleIds);
    if (problem) {
      skipped.push(`__Skipped__ : <@&${roleId}>`, `__Reason__ : ${problem}`);
    } else if (member.roles.cache.has(roleId)) {
      toRemove.push(role);
    } else {
      toAdd.push(role);
    }
  }

  try {
    if (toAdd.length) await member.roles.add(toAdd, 'Claim roles panel');
    if (toRemove.length) await member.roles.remove(toRemove, 'Claim roles panel');
  } catch (error) {
    console.error(`Claiming roles failed for ${member.id} in ${guild.name}:`, error);
    return interaction.reply(noticeFn("__Couldn't change your roles - I may be missing the Manage Roles permission__"));
  }

  return interaction.reply(buildClaimResult({ added: toAdd, removed: toRemove, skipped }));
}

module.exports = {
  DANGEROUS_PERMISSIONS,
  checkRoleEligibility,
  executeRoleAssignment,
};
