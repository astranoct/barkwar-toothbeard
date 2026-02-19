const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUser, updateUserLinks } = require('../../db/users.js');

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
    const collectionUrl = interaction.options.getString('collection');
    const tradebinderUrl = interaction.options.getString('tradebinder');

    if (!collectionUrl && !tradebinderUrl) {
      return interaction.reply({
        content: '⚠️ You must provide at least one link to update.',
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
      console.error(err);
      await interaction.reply({
        content: '❌ There was an error updating your links. Please try again later.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
