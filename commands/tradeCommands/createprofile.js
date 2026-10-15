const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUser, createUser } = require('../../db/users.js');
const { validateUrl } = require('../../helperFunctions/validateUrl.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createprofile')
    .setDescription('Creates your profile in the trading app')
    .addStringOption(option =>
      option.setName('collection')
        .setDescription('Your collection URL')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('tradebinder')
        .setDescription('Your trade binder URL if different from collection URL')
        .setRequired(false)
    ),

  async execute(interaction) {
    const discordId = interaction.user.id;
    const rawCollection = interaction.options.getString('collection');
    const rawTradebinder = interaction.options.getString('tradebinder');
    const collectionUrl = validateUrl(rawCollection);
    const tradebinderUrl = validateUrl(rawTradebinder);

    if ((rawCollection && !collectionUrl) || (rawTradebinder && !tradebinderUrl)) {
      await interaction.reply({
        content: '⚠️ Links must be valid http(s) URLs, e.g. https://example.com/my-collection.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const existingUser = await getUser(discordId);

      if (existingUser) {
        await interaction.reply({
          content: 'ℹ️ You already have a profile. Use /tradelist to view it or /updatelist to update your seeking list.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const created = await createUser(discordId, collectionUrl, tradebinderUrl);

      if (created) {
        await interaction.reply({
          content: '✅ Your profile has been created! You can now use /updatelist to upload your seeking list and /tradelist to share it with others.',
          flags: MessageFlags.Ephemeral,
        });
      } else {
        // This case should rarely happen
        await interaction.reply({
          content: '⚠️ Could not create your profile. Please try again.',
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (err) {
      // Let index.js log and report the error to the user
      throw err;
    }
  },
};
