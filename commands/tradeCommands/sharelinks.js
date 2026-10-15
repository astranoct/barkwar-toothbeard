const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUser } = require('../../db/users.js');
const { createTradelinksEmbed } = require('../../helperFunctions/formatEmbed.js');
const { describeUser } = require('../../helperFunctions/userDisplay.js');
const { websiteButtonRow } = require('../../helperFunctions/webLink.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tradelinks')
    .setDescription('Shares your trade link\'s.')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user whose trade links you want to view')
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

    // Build the embed using their data
    const embed = createTradelinksEmbed({
      displayName,
      avatarUrl,
      collectionUrl: userData.collectionUrl || null,
      tradebinderUrl: userData.tradebinderUrl || null,
    });

    const buttons = websiteButtonRow(interaction.guildId);
    await interaction.reply({ embeds: [embed], components: buttons ? [buttons] : [] });
  },
};
