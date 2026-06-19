const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUser } = require('../../db/users.js');
const { createTradelinksEmbed } = require('../../helperFunctions/formatEmbed.js');

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
    try {
      // Determine target user
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const discordId = targetUser.id;
      const username = targetUser.username;

      // Fetch the user's profile
      const userData = await getUser(discordId);

      if (!userData) {
        await interaction.reply({
          content: `❌ ${targetUser.id === interaction.user.id ? 'You do' : `${username} does`} not have a profile yet.`,
          ephemeral: true,
        });
        return;
      }

      // Build the embed using their data
      const embed = createTradelinksEmbed(
        username,
        userData.collectionUrl || null,
        userData.tradebinderUrl || null
      );

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: '❌ There was an error fetching the trade links. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
