const { EmbedBuilder } = require('discord.js');

const MAX_DESCRIPTION_LENGTH = 4096; // Discord embed description limit

/**
 * Formats cards as Scryfall links, one per line, truncated to fit in `limit` characters.
 * @param {string[]} cards
 * @param {number} limit
 * @returns {string}
 */
function formatCardList(cards, limit = MAX_DESCRIPTION_LENGTH) {
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
    if (length + line.length + 1 + moreNote.length > limit) {
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
 * @param {string[]} cards Cards the user is looking for
 * @param {string} deckUrl
 * @param {string} tradebinderUrl
 * @returns {EmbedBuilder}
 */
function createTradelistEmbed(
  username,
  cards,
  deckUrl = null,
  tradebinderUrl = null
) {
  const links = [];

  if (deckUrl) {
    links.push(`[Collection](${deckUrl})`);
  }

  if (tradebinderUrl) {
    links.push(`[Tradebinder](${tradebinderUrl})`);
  }

  const embed = new EmbedBuilder()
    .setColor(0xff69b4)
    .setTitle(`${username} is looking for (${cards.length})`)
    .setThumbnail('https://i.imgur.com/JEStEX3.png')
    .setDescription(cards.length ? formatCardList(cards) : 'No cards listed yet. Use /addcards to add some.')
    .setTimestamp()
    .setFooter({
      text: username,
      iconURL: 'https://i.imgur.com/JEStEX3.png',
    });

  if (links.length) {
    embed.addFields({ name: 'Links', value: links.join(' • ') });
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
