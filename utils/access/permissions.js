'use strict';

function checkTarget(message, targetMember) {
  if (!targetMember) return { ok: true };
  if (targetMember.id === message.author.id) return { ok: false, reason: "You can't target yourself" };
  if (targetMember.id === message.client.user.id) return { ok: false, reason: "You can't target me" };
  if (targetMember.id === message.guild.ownerId) return { ok: false, reason: "You can't target the server owner" };

  const actorMember = message.member;
  if (message.guild.ownerId !== actorMember.id) {
    if (actorMember.roles.highest.position <= targetMember.roles.highest.position) {
      return { ok: false, reason: "You can't target someone with an equal or higher role than you" };
    }
  }

  const me = message.guild.members.me;
  if (me.roles.highest.position <= targetMember.roles.highest.position) {
    return { ok: false, reason: 'My role is too low to do that to this member' };
  }

  return { ok: true };
}

function checkRoleTarget(message, role) {
  const actorMember = message.member;
  if (message.guild.ownerId !== actorMember.id && actorMember.roles.highest.position <= role.position) {
    return { ok: false, reason: "You can't manage a role equal to or higher than your own" };
  }
  const me = message.guild.members.me;
  if (me.roles.highest.position <= role.position) {
    return { ok: false, reason: 'My role is too low to manage that role' };
  }
  return { ok: true };
}

function isJailer(member, config) {
  if (member.permissions.has('ManageRoles') || member.permissions.has('Administrator')) return true;
  const jailerRoleIds = (config && config.jailerRoleIds) || [];
  return member.roles.cache.some((r) => jailerRoleIds.includes(r.id));
}

function isMuter(member, config) {
  if (member.permissions.has('MuteMembers') || member.permissions.has('Administrator')) return true;
  const muterRoleIds = (config && config.muterRoleIds) || [];
  return member.roles.cache.some((r) => muterRoleIds.includes(r.id));
}

module.exports = { checkTarget, checkRoleTarget, isJailer, isMuter };
