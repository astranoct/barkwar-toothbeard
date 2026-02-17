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
  return new EmbedBuilder()
    .setColor(0xFF69B4) // Pink color
    .setTitle(`${username}'s Trade Card`)
    .setURL(deckUrl || 'https://moxfield.com/')
    .setThumbnail('https://i.imgur.com/JEStEX3.png')
    .addFields(
      {
        name: 'Needs',
        value: tradelist.highPrio.length
          ? tradelist.highPrio.map(card => `[${card}](https://scryfall.com/search?q=${encodeURIComponent(card)})`).join('\n')
          : 'No cards',
        inline: true,
      },
      {
        name: 'Wants',
        value: tradelist.lowPrio.length
          ? tradelist.lowPrio.map(card => `[${card}](https://scryfall.com/search?q=${encodeURIComponent(card)})`).join('\n')
          : 'No cards',
        inline: true,
      },
      {
        name: '\u200B',
        value: '\u200B',
        inline: false,
      },
      {
        name: '',
        value: deckUrl ? `[Collection](${deckUrl})` : '',
        inline: true,
      },
      {
        name: '',
        value: tradebinderUrl ? `[Tradebinder](${tradebinderUrl})` : '',
        inline: true,
      }
    )
    .setTimestamp()
    .setFooter({ text: username, iconURL: 'https://i.imgur.com/JEStEX3.png' });
}

module.exports = {
  createTradelistEmbed,
};
