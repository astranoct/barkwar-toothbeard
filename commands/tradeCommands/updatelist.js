const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { getUser, setCards } = require('../../db/users.js');
const { parseCardList } = require('../../helperFunctions/parseCardList.js');

const MODAL_ID = 'updatelistModal';
const MAX_MODAL_TEXT = 4000; // Discord's limit for a paragraph text input

module.exports = {
  modalId: MODAL_ID,

  data: new SlashCommandBuilder()
    .setName('updatelist')
    .setDescription('Edit your whole card list (use /addcards or /removecard for quick changes)'),

  async execute(interaction) {
    const userData = await getUser(interaction.user.id);
    if (!userData) {
      await interaction.reply({
        content: '❌ You need to create a profile first using `/createprofile`.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const current = userData.cards.join('\n');
    if (current.length > MAX_MODAL_TEXT) {
      // Prefilling would silently cut off cards, and saving would then delete them.
      await interaction.reply({
        content: '⚠️ Your list is too long to edit all at once. Use `/addcards` and `/removecard` instead.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const listInput = new TextInputBuilder()
      .setCustomId('listInput')
      .setLabel('One card per line')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Fabled Passage\nSnapcaster Mage\nMudhole')
      .setMaxLength(MAX_MODAL_TEXT)
      .setRequired(false); // an empty box clears the list

    if (current) listInput.setValue(current);

    const modal = new ModalBuilder()
      .setCustomId(MODAL_ID)
      .setTitle('Edit Your Card List')
      .addComponents(new ActionRowBuilder().addComponents(listInput));

    await interaction.showModal(modal);
  },

  async modalSubmit(interaction) {
    const cards = parseCardList(interaction.fields.getTextInputValue('listInput'));
    await setCards(interaction.user.id, cards);

    await interaction.reply({
      content: cards.length
        ? `✅ Your list has been saved with ${cards.length} card${cards.length === 1 ? '' : 's'}.`
        : '✅ Your list has been cleared.',
      flags: MessageFlags.Ephemeral,
    });
  },
};
