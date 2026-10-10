'use strict';
const { PermissionFlagsBits } = require('discord.js');
const { resolveUser, resolveRole } = require('./resolve');
const { checkRoleTarget, checkTarget } = require('./permissions');

async function resolveMemberAndRole(message, args) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return { error: "You don't have permission" };
  }
  const target = await resolveUser(message, args, { fallbackToAuthor: false });
  if (!target) return { error: "Couldn't find that user" };

  const role = resolveRole(message, args.slice(1).join(' '));
  if (!role) return { error: "Couldn't find that role" };

  const roleCheck = checkRoleTarget(message, role);
  if (!roleCheck.ok) return { error: roleCheck.reason };

  const member = await message.guild.members.fetch(target.id).catch(() => null);
  if (!member) return { error: "That user isn't in this server" };

  if (member.id !== message.author.id) {
    const targetCheck = checkTarget(message, member);
    if (!targetCheck.ok) return { error: targetCheck.reason };
  }

  return { member, role };
}

function resolveManagedRole(message, query) {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return { error: "You don't have permission" };
  }
  const role = resolveRole(message, query);
  if (!role) return { error: "Couldn't find that role" };
  const roleCheck = checkRoleTarget(message, role);
  if (!roleCheck.ok) return { error: roleCheck.reason };
  return { role };
}

module.exports = { resolveMemberAndRole, resolveManagedRole };
