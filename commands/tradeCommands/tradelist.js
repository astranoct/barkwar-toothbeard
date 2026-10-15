const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUser } = require('../../db/users.js');
const { createTradelistEmbed } = require('../../helperFunctions/formatEmbed.js');

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
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      // Build the embed using their data
      const embed = createTradelistEmbed(
        username,
        userData.cards,
        userData.collectionUrl || null,
        userData.tradebinderUrl || null
      );

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      // Let index.js report the error to the user
      throw err;
    }
  },
};
