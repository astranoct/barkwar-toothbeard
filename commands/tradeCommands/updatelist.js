const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { getUser } = require('../../db/users.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('updatelist')
    .setDescription('Update your trading priority list'),

  async execute(interaction) {
    const discordId = interaction.user.id;

    // Check if user exists
    const userData = await getUser(discordId);
    if (!userData) {
      await interaction.reply({
        content: '❌ You need to create a profile first using `/createprofile`.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId('updatelistModal')
      .setTitle('Update Your Tradelist');

    const listInput = new TextInputBuilder()
      .setCustomId('listInput')
      .setLabel('Paste your tradelist here')
      .setStyle(TextInputStyle.Paragraph) // Multi-line input
      .setPlaceholder(
`Need:
Fabled Passage
Snapcaster Mage

Want:
Mudhole
Sorrow's Path`
      )
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(listInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  },
};
