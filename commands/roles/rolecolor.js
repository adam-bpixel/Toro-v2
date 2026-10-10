const { Colors } = require('discord.js');
const { resolveManagedRole } = require('../../utils/access/roleTarget');
const { card, notice } = require('../../utils/render/embeds');

function parseColor(input) {
  if (!input) return null;
  const named = Colors[input[0].toUpperCase() + input.slice(1).toLowerCase()];
  if (typeof named === 'number') return named;
  const hex = input.replace(/^#/, '');
  return /^[0-9a-f]{6}$/i.test(hex) ? parseInt(hex, 16) : null;
}

module.exports = {
  name: 'rolecolor',
  aliases: [],
  description: 'Change role color',
  usage: '<@role|roleID|rolename> <solid|gradient|holographic> [color]',
  category: 'Roles Commands',
  async execute(message, args) {
    const mode = (args[1] || '').toLowerCase();
    if (!args.length || !['solid', 'gradient', 'holographic'].includes(mode)) {
      return card(message, {
        title: 'Rolecolor Command',
        lines: [
          '__`&rolecolor <@role|roleID|rolename> <solid|gradient|holographic> [color]`__',
          '',
          '**:: Effects ::**',
          '`solid <hex|color>` - Solid color',
          '`gradient <color1> <color2>` - Gradient effect',
          '`holographic` - Holographic effect',
        ],
      });
    }

    const result = resolveManagedRole(message, args[0]);
    if (result.error) return notice(message, `__${result.error}__`);
    const { role } = result;

    if (mode === 'solid') {
      const color = parseColor(args[2]);
      if (color === null) return notice(message, '__Give a valid hex color, e.g. `#ff0000`__');
      await role.setColor(color).catch(() => null);
      return card(message, { title: 'Rolecolor Command', lines: [`__Set__ ${role} __to a solid color__`] });
    }

    if (mode === 'gradient') {
      const c1 = parseColor(args[2]);
      const c2 = parseColor(args[3]);
      if (c1 === null || c2 === null) return notice(message, '__Give two valid hex colors, e.g. `#ff0000 #0000ff`__');
      const applied = await role.edit({ colors: { primaryColor: c1, secondaryColor: c2 } }).catch(() => null);
      if (!applied) return notice(message, '__Gradient roles need this server to be boost level 2 or higher__');
      return card(message, { title: 'Rolecolor Command', lines: [`__Set__ ${role} __to a gradient__`] });
    }

    return notice(message, "__Holographic role styling isn't supported yet - try `solid` or `gradient`__");
  },
};
