const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { getUser, addCards } = require('../../db/users.js');
const { parseCardList } = require('../../helperFunctions/parseCardList.js');
const { verifyCards, describeInvalid } = require('../../helperFunctions/scryfall.js');

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
      await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Scryfall lookup can exceed 3s
      await addAndReply(interaction, parseCardList(quick.split(';').join('\n')));
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
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await addAndReply(interaction, parseCardList(interaction.fields.getTextInputValue('cardsInput')));
  },
};

/** Checks names with Scryfall, adds the real ones, and reports what happened. Interaction must be deferred. */
async function addAndReply(interaction, names) {
  const { valid, invalid, unverified } = await verifyCards(names);
  const result = await addCards(interaction.user.id, valid);

  const parts = [];
  if (!result) {
    parts.push('❌ You need to create a profile first using `/createprofile`.');
  } else if (!result.added.length) {
    parts.push('ℹ️ Nothing new to add: those cards are already on your list (or none were valid).');
  } else {
    parts.push(`✅ Added ${result.added.length} card${result.added.length === 1 ? '' : 's'} (${result.added.join(', ')}). You now have ${result.total} on your list.`);
  }

  if (invalid.length) {
    parts.push(`⚠️ Couldn't find these on Scryfall, so I skipped them:\n${describeInvalid(invalid)}`);
  }
  if (unverified) {
    parts.push("ℹ️ Scryfall couldn't be reached, so card names weren't checked this time.");
  }

  await interaction.editReply({ content: parts.join('\n\n').slice(0, 2000) });
}
