const { EmbedBuilder } = require('discord.js');

const COLOR = 0xff69b4;
const MAX_FIELD_LENGTH = 1024; // Discord embed field value limit
const MAX_DESCRIPTION_LENGTH = 4096;
const COLUMNS = 3; // inline fields per row
const SHORT_LIST = 8; // up to this many cards are listed in the description, longer lists use columns

/** One card as a markdown link to an exact-name Scryfall search. */
function cardLink(card) {
  // Escape characters that would break the markdown link text
  const label = card.replace(/([\[\]\\*_`~|>])/g, '\\$1');
  // encodeURIComponent leaves ( and ) alone, which would end the link early
  const query = encodeURIComponent(`!"${card}"`).replace(/\(/g, '%28').replace(/\)/g, '%29');
  return `[${label}](https://scryfall.com/search?q=${query})`;
}

/**
 * Splits links into up to three side-by-side columns, reading down each one.
 * If the full list doesn't fit in Discord's field size limit, only the first cards are kept.
 * @param {string[]} links
 * @returns {string[][]}
 */
function buildColumns(links) {
  let perColumn = Math.ceil(links.length / COLUMNS);
  while (perColumn > 0) {
    const columns = [];
    for (let i = 0; i < COLUMNS; i++) {
      columns.push(links.slice(i * perColumn, (i + 1) * perColumn));
    }
    if (columns.every((column) => column.join('\n').length <= MAX_FIELD_LENGTH)) {
      return columns.filter((column) => column.length);
    }
    perColumn--;
  }
  return [];
}

/**
 * Formats cards as Scryfall links, one per line, truncated to fit in `limit` characters.
 * Used for short lists that go in the embed description.
 */
function formatCardList(cards, limit = MAX_DESCRIPTION_LENGTH) {
  const lines = [];
  let length = 0;

  for (let i = 0; i < cards.length; i++) {
    const line = cardLink(cards[i]);
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
 * Creates a tradelist embed for a user.
 * @param {Object} options
 * @param {string} options.displayName Server nickname if there is one, otherwise their Discord name
 * @param {string|null} [options.avatarUrl]
 * @param {string[]} options.cards Cards the user is looking for
 * @param {string|null} [options.collectionUrl]
 * @param {string|null} [options.tradebinderUrl]
 * @param {Date|null} [options.updatedAt] When the list last changed
 * @param {string|null} [options.thumbnailUrl] Small picture, e.g. art of the first card
 * @param {boolean} [options.websiteHint] Mention the website when a very long list is cut off
 * @returns {EmbedBuilder}
 */
function createTradelistEmbed({
  displayName,
  avatarUrl = null,
  cards,
  collectionUrl = null,
  tradebinderUrl = null,
  updatedAt = null,
  thumbnailUrl = null,
  websiteHint = false,
}) {
  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setAuthor({ name: displayName, ...(avatarUrl ? { iconURL: avatarUrl } : {}) })
    .setTitle(
      cards.length ? `Looking for ${cards.length} card${cards.length === 1 ? '' : 's'}` : 'Nothing on the list yet'
    );

  if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

  // The description is built from blocks separated by a blank line; empty blocks are left out
  // (Discord rejects an empty description).
  const header = [];
  const links = [];
  if (collectionUrl) links.push(`[Collection](${collectionUrl})`);
  if (tradebinderUrl) links.push(`[Tradebinder](${tradebinderUrl})`);
  if (links.length) header.push(links.join(' • '));

  // Discord turns <t:seconds:R> into "3 days ago" in the viewer's own time zone
  if (updatedAt) header.push(`-# Updated <t:${Math.floor(updatedAt.getTime() / 1000)}:R>`);

  let body = '';
  const fields = [];
  if (!cards.length) {
    body = 'No cards listed yet. Use /addcards to add some.';
  } else if (cards.length <= SHORT_LIST) {
    body = formatCardList(cards);
  } else {
    const columns = buildColumns(cards.map(cardLink));
    columns.forEach((column) => fields.push({ name: '​', value: column.join('\n'), inline: true }));
    const shown = columns.reduce((total, column) => total + column.length, 0);
    if (shown < cards.length) {
      body = `…and ${cards.length - shown} more${websiteHint ? ': see the full list on the website' : ''}`;
    }
  }

  const description = [header.join('\n'), body].filter(Boolean).join('\n\n');
  if (description) embed.setDescription(description.slice(0, MAX_DESCRIPTION_LENGTH));
  if (fields.length) embed.addFields(fields);

  return embed;
}

/**
 * Creates a trade links embed for a user.
 * @param {Object} options
 * @param {string} options.displayName
 * @param {string|null} [options.avatarUrl]
 * @param {string|null} [options.collectionUrl]
 * @param {string|null} [options.tradebinderUrl]
 * @returns {EmbedBuilder}
 */
function createTradelinksEmbed({ displayName, avatarUrl = null, collectionUrl = null, tradebinderUrl = null }) {
  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setAuthor({ name: displayName, ...(avatarUrl ? { iconURL: avatarUrl } : {}) })
    .setTitle('Trade links');

  const links = [];
  if (collectionUrl) links.push(`[View Collection](${collectionUrl})`);
  if (tradebinderUrl) links.push(`[View Tradebinder](${tradebinderUrl})`);

  embed.setDescription(links.length ? links.join('\n') : 'No links have been set yet. Use /updatelinks to add some.');

  return embed;
}

module.exports = {
  createTradelistEmbed,
  createTradelinksEmbed,
};
