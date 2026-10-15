const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUser, removeCard } = require('../../db/users.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removecard')
    .setDescription('Remove a card from your list (e.g. after you got it)')
    .addStringOption(option =>
      option.setName('card')
        .setDescription('The card to remove')
        .setAutocomplete(true)
        .setRequired(true)
    ),

  // Suggest cards from the user's own list as they type
  async autocomplete(interaction) {
    const typed = interaction.options.getFocused().toLowerCase();
    const userData = await getUser(interaction.user.id);
    const cards = userData ? userData.cards : [];

    await interaction.respond(
      cards
        .filter(card => card.toLowerCase().includes(typed))
        .slice(0, 25)
        .map(card => ({ name: card.slice(0, 100), value: card.slice(0, 100) }))
    );
  },

  async execute(interaction) {
    const card = interaction.options.getString('card');
    const result = await removeCard(interaction.user.id, card);

    let content;
    if (result === null) {
      content = '❌ You need to create a profile first using `/createprofile`.';
    } else if (result === false) {
      content = `ℹ️ **${card}** isn't on your list.`;
    } else {
      content = `✅ Removed **${card}** from your list.`;
    }

    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  },
};
