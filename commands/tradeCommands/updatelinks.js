const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUser, updateUserLinks } = require('../../db/users.js');
const { validateUrl } = require('../../helperFunctions/validateUrl.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('updatelinks')
    .setDescription('Update your collection or trade binder links')
    .addStringOption(option =>
      option.setName('collection')
        .setDescription('Your new collection URL')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('tradebinder')
        .setDescription('Your new trade binder URL')
        .setRequired(false)
    ),

  async execute(interaction) {
    const discordId = interaction.user.id;
    const rawCollection = interaction.options.getString('collection');
    const rawTradebinder = interaction.options.getString('tradebinder');
    const collectionUrl = validateUrl(rawCollection);
    const tradebinderUrl = validateUrl(rawTradebinder);

    if (!rawCollection && !rawTradebinder) {
      return interaction.reply({
        content: '⚠️ You must provide at least one link to update.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if ((rawCollection && !collectionUrl) || (rawTradebinder && !tradebinderUrl)) {
      return interaction.reply({
        content: '⚠️ Links must be valid http(s) URLs, e.g. https://example.com/my-collection.',
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const existingUser = await getUser(discordId);

      if (!existingUser) {
        return interaction.reply({
          content: '❌ You do not have a profile yet. Use /createprofile first.',
          flags: MessageFlags.Ephemeral,
        });
      }

      await updateUserLinks(discordId, collectionUrl, tradebinderUrl);

      await interaction.reply({
        content: '✅ Your links have been updated successfully!',
        flags: MessageFlags.Ephemeral,
      });

    } catch (err) {
      // Let index.js log and report the error to the user
      throw err;
    }
  },
};
