const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const { parseTradelist } = require('./helperFunctions/parseTradelist.js');
// const config = require('./config.json');
const config = process.env.CONFIG ? JSON.parse(process.env.CONFIG) : {};
const token = config.token;
// db/users.js initializes firebase-admin, so it must not be initialized again here.
const { db, admin } = require('./db/users.js');

if (!token) {
	console.error('Missing Discord bot token. Set the CONFIG environment variable to JSON like {"token": "..."}.');
	process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

/**
 * Replies to an interaction, or follows up if it was already replied to / deferred.
 */
async function safeReply(interaction, content) {
	const payload = { content, flags: MessageFlags.Ephemeral };
	try {
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(payload);
		} else {
			await interaction.reply(payload);
		}
	} catch (err) {
		console.error('Failed to send error reply:', err);
	}
}

async function handleUpdatelistModal(interaction) {
	const discordId = interaction.user.id;
	const listInput = interaction.fields.getTextInputValue('listInput');

	try {
		const { highPrio, lowPrio } = parseTradelist(listInput);

		await db.collection('users').doc(discordId).update({
			highPrio,
			lowPrio,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		await interaction.reply({
			content: `✅ Your tradelist has been updated! Needs: ${highPrio.length}, Wants: ${lowPrio.length} cards.`,
			flags: MessageFlags.Ephemeral,
		});
	} catch (err) {
		console.error(err);
		await safeReply(interaction, '❌ There was an error updating your tradelist. Please check your format and try again.');
	}
}

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isModalSubmit()) {
		if (interaction.customId === 'updatelistModal') {
			await handleUpdatelistModal(interaction);
		}
		return;
	}

	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await safeReply(interaction, 'There was an error while executing this command!');
	}
});

client.login(token);
