const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * A "View on website" button row, or null if the WEB_URL environment variable isn't set
 * (e.g. https://your-site.herokuapp.com) or isn't a valid http(s) address.
 * Inside a server, the button opens that server's page; elsewhere, the site's front page.
 *
 * @param {string|null} guildId
 * @param {string|undefined} baseUrl Defaults to process.env.WEB_URL
 */
function websiteButtonRow(guildId, baseUrl = process.env.WEB_URL) {
  if (!baseUrl) return null;

  let url;
  try {
    url = new URL(guildId ? `/servers/${guildId}` : '/', baseUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('View on website').setStyle(ButtonStyle.Link).setURL(url.href)
  );
}

module.exports = {
  websiteButtonRow,
};
