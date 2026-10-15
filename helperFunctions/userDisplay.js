/**
 * Works out how to show a Discord user: their server nickname and server avatar if they have
 * them, otherwise their display name and global avatar.
 *
 * @param {import('discord.js').User} user
 * @param {import('discord.js').GuildMember | object | null} member The user's membership in this server, if known.
 *   Discord sometimes hands over a bare data object instead of a full member (when the member isn't
 *   cached); that has no helpers on it, so it is ignored.
 * @returns {{displayName: string, avatarUrl: string}}
 */
function describeUser(user, member = null) {
  const fullMember = member && typeof member.displayAvatarURL === 'function' ? member : null;
  return {
    displayName: fullMember?.displayName || user.globalName || user.username,
    avatarUrl: (fullMember || user).displayAvatarURL({ extension: 'png', size: 128 }),
  };
}

module.exports = {
  describeUser,
};
