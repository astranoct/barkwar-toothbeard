const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { getUser, addCards } = require('../../db/users.js');
const { parseCardList } = require('../../helperFunctions/parseCardList.js');

const MODAL_ID = 'addcardsModal';

module.exports = {
  modalId: MODAL_ID,

  data: new SlashCommandBuilder()
    .setName('addcards')
    .setDescription('Add cards to your list without touching the rest')
    .addStringOption(option =>
      option.setName('cards')
        .setDescription('Card names separated by ; (leave empty to paste a longer list)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const quick = interaction.options.getString('cards');

    if (quick) {
      const result = await addCards(interaction.user.id, parseCardList(quick.split(';').join('\n')));
      await replyWithResult(interaction, result);
      return;
    }

    const userData = await getUser(interaction.user.id);
    if (!userData) {
      await interaction.reply({
        content: '❌ You need to create a profile first using `/createprofile`.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const input = new TextInputBuilder()
      .setCustomId('cardsInput')
      .setLabel('Cards to add, one per line')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Fabled Passage\nSnapcaster Mage')
      .setRequired(true);

    const modal = new ModalBuilder()
      .setCustomId(MODAL_ID)
      .setTitle('Add Cards')
      .addComponents(new ActionRowBuilder().addComponents(input));

    await interaction.showModal(modal);
  },

  async modalSubmit(interaction) {
    const cards = parseCardList(interaction.fields.getTextInputValue('cardsInput'));
    const result = await addCards(interaction.user.id, cards);
    await replyWithResult(interaction, result);
  },
};

async function replyWithResult(interaction, result) {
  let content;
  if (!result) {
    content = '❌ You need to create a profile first using `/createprofile`.';
  } else if (!result.added.length) {
    content = 'ℹ️ Those cards are already on your list (or nothing was entered).';
  } else {
    content = `✅ Added ${result.added.length} card${result.added.length === 1 ? '' : 's'} (${result.added.join(', ')}). You now have ${result.total} on your list.`;
  }
  await interaction.reply({ content: content.slice(0, 2000), flags: MessageFlags.Ephemeral });
}
