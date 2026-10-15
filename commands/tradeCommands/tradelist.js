const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUser } = require('../../db/users.js');
const { createTradelistEmbed } = require('../../helperFunctions/formatEmbed.js');
const { describeUser } = require('../../helperFunctions/userDisplay.js');
const { getCardArt } = require('../../helperFunctions/scryfall.js');
const { websiteButtonRow } = require('../../helperFunctions/webLink.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tradelist')
    .setDescription('Shares your tradelist or someone else\'s.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user whose tradelist you want to view')
        .setRequired(false)
    ),

  async execute(interaction) {
    // Determine target user
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const isSelf = targetUser.id === interaction.user.id;
    const member = isSelf ? interaction.member : interaction.options.getMember('user');
    const { displayName, avatarUrl } = describeUser(targetUser, member);

    // Fetch the user's profile
    const userData = await getUser(targetUser.id);

    if (!userData) {
      await interaction.reply({
        content: `❌ ${isSelf ? 'You do' : `${displayName} does`} not have a profile yet.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // The artwork lookup can take a moment, so tell Discord we're working on it
    await interaction.deferReply();

    const cards = userData.cards;
    const thumbnailUrl = cards.length ? await getCardArt(cards[0]) : null;
    const buttons = websiteButtonRow(interaction.guildId);

    const embed = createTradelistEmbed({
      displayName,
      avatarUrl,
      cards,
      collectionUrl: userData.collectionUrl || null,
      tradebinderUrl: userData.tradebinderUrl || null,
      updatedAt: userData.updatedAt?.toDate?.() ?? null,
      thumbnailUrl,
      websiteHint: buttons !== null,
    });

    await interaction.editReply({ embeds: [embed], components: buttons ? [buttons] : [] });
  },
};
