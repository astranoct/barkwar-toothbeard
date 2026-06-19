const { EmbedBuilder } = require('discord.js');

/**
 * Creates a tradelist embed for a user
 * @param {string} username
 * @param {Object} tradelist
 * @param {string[]} tradelist.highPrio
 * @param {string[]} tradelist.lowPrio
 * @param {string} deckUrl
 * @param {string} tradebinderUrl
 * @returns {EmbedBuilder}
 */
function createTradelistEmbed(
  username,
  tradelist,
  deckUrl = null,
  tradebinderUrl = null
) {
  const fields = [];

  if (tradelist.highPrio.length) {
    fields.push({
      name: 'Needs',
      value: tradelist.highPrio
        .map(
          card =>
            `[${card}](https://scryfall.com/search?q=${encodeURIComponent(card)})`
        )
        .join('\n'),
      inline: true,
    });
  }

  if (tradelist.lowPrio.length) {
    fields.push({
      name: 'Wants',
      value: tradelist.lowPrio
        .map(
          card =>
            `[${card}](https://scryfall.com/search?q=${encodeURIComponent(card)})`
        )
        .join('\n'),
      inline: true,
    });
  }

  const links = [];

  if (deckUrl) {
    links.push(`[Collection](${deckUrl})`);
  }

  if (tradebinderUrl) {
    links.push(`[Tradebinder](${tradebinderUrl})`);
  }

  const embed = new EmbedBuilder()
    .setColor(0xff69b4)
    .setTitle(`${username}'s Trade Card`)
    .setThumbnail('https://i.imgur.com/JEStEX3.png')
    .setTimestamp()
    .setFooter({
      text: username,
      iconURL: 'https://i.imgur.com/JEStEX3.png',
    });

  if (links.length) {
    embed.setDescription(links.join(' • '));
  }

  if (fields.length) {
    embed.addFields(fields);
  }

  return embed;
}

function createTradelinksEmbed(
  username,
  deckUrl = null,
  tradebinderUrl = null
) {
  const fields = [];

  if (deckUrl) {
    fields.push({
      name: 'Collection',
      value: `[View Collection](${deckUrl})`,
      inline: true,
    });
  }

  if (tradebinderUrl) {
    fields.push({
      name: 'Tradebinder',
      value: `[View Tradebinder](${tradebinderUrl})`,
      inline: true,
    });
  }

  return new EmbedBuilder()
    .setColor(0xff69b4)
    .setTitle(`${username}'s Trade Links`)
    .setThumbnail('https://i.imgur.com/JEStEX3.png')
    .addFields(fields)
    .setTimestamp()
    .setFooter({
      text: username,
      iconURL: 'https://i.imgur.com/JEStEX3.png',
    });
}

module.exports = {
  createTradelistEmbed,
  createTradelinksEmbed,
};