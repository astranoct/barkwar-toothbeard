const { EmbedBuilder } = require('discord.js');

/**
 * Creates a tradelist embed for a user
 * @param {string} username - Discord username or display name
 * @param {Object} tradelist - User tradelist data
 * @param {string[]} tradelist.highPrio - High priority cards
 * @param {string[]} tradelist.lowPrio - Low priority cards
 * @param {string} deckUrl - Optional: Collection URL
 * @returns {EmbedBuilder} - A Discord embed
 */
function createTradelistEmbed(username, tradelist, deckUrl = null, tradebinderUrl = null) {
  const fields = [
    {
      name: 'Needs',
      value: tradelist.highPrio.length
        ? tradelist.highPrio.map(card => `[${card}](https://scryfall.com/search?q=${encodeURIComponent(card)})`).join('\n')
        : 'No cards',
      inline: true,
    },
  ];

  if (tradelist.lowPrio.length) {
    fields.push({
      name: 'Wants',
      value: tradelist.lowPrio.map(card => `[${card}](https://scryfall.com/search?q=${encodeURIComponent(card)})`).join('\n'),
      inline: true,
    });
  }

  // Only add the blank spacer if either link will be shown
  if (deckUrl || tradebinderUrl) {
    fields.push({
      name: '\u200B',
      value: '\u200B',
      inline: false,
    });
  }

  // Only add Collection field if deckUrl is provided
  if (deckUrl) {
    fields.push({
      name: '',
      value: `[Collection](${deckUrl})`,
      inline: true,
    });
  }

  // Only add Tradebinder field if tradebinderUrl is provided
  if (tradebinderUrl) {
    fields.push({
      name: '',
      value: `[Tradebinder](${tradebinderUrl})`,
      inline: true,
    });
  }

  return new EmbedBuilder()
    .setColor(0xFF69B4)
    .setTitle(`${username}'s Trade Card`)
    .setURL(deckUrl || 'https://moxfield.com/')
    .setThumbnail('https://i.imgur.com/JEStEX3.png')
    .addFields(fields)
    .setTimestamp()
    .setFooter({ text: username, iconURL: 'https://i.imgur.com/JEStEX3.png' });
}

module.exports = {
  createTradelistEmbed,
};
