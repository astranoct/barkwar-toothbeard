const { EmbedBuilder } = require('discord.js');

const MAX_FIELD_LENGTH = 1024; // Discord embed field value limit

/**
 * Formats cards as Scryfall links, one per line, truncated to fit in an embed field.
 * @param {string[]} cards
 * @returns {string}
 */
function formatCardList(cards) {
  const lines = [];
  let length = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    // Escape characters that would break the markdown link text
    const label = card.replace(/([\[\]\\*_`~|>])/g, '\\$1');
    // encodeURIComponent leaves ( and ) alone, which would end the link early
    const query = encodeURIComponent(`!"${card}"`).replace(/\(/g, '%28').replace(/\)/g, '%29');
    const line = `[${label}](https://scryfall.com/search?q=${query})`;

    const remaining = cards.length - i;
    const moreNote = `\n…and ${remaining} more`;
    if (length + line.length + 1 + moreNote.length > MAX_FIELD_LENGTH) {
      lines.push(`…and ${remaining} more`);
      break;
    }
    lines.push(line);
    length += line.length + 1;
  }

  return lines.join('\n');
}

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
  const highPrio = tradelist.highPrio || [];
  const lowPrio = tradelist.lowPrio || [];

  if (highPrio.length) {
    fields.push({
      name: 'Needs',
      value: formatCardList(highPrio),
      inline: true,
    });
  }

  if (lowPrio.length) {
    fields.push({
      name: 'Wants',
      value: formatCardList(lowPrio),
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

  const embed = new EmbedBuilder()
    .setColor(0xff69b4)
    .setTitle(`${username}'s Trade Links`)
    .setThumbnail('https://i.imgur.com/JEStEX3.png')
    .setTimestamp()
    .setFooter({
      text: username,
      iconURL: 'https://i.imgur.com/JEStEX3.png',
    });

  if (fields.length) {
    embed.addFields(fields);
  } else {
    embed.setDescription('No links have been set yet. Use /updatelinks to add some.');
  }

  return embed;
}

module.exports = {
  createTradelistEmbed,
  createTradelinksEmbed,
};