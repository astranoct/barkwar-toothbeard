const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const { createRateLimiter } = require('./helperFunctions/rateLimiter.js');
const { recordActivity } = require('./db/users.js');
// const config = require('./config.json');
const config = process.env.CONFIG ? JSON.parse(process.env.CONFIG) : {};
const token = config.token;

if (!token) {
	console.error('Missing Discord bot token. Set the CONFIG environment variable to JSON like {"token": "..."}.');
	process.exit(1);
}

require('./db/users.js').getDb(); // fail now, not on the first command, if the Firebase key is missing

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	// Set by Heroku when "dyno metadata" is enabled (heroku labs:enable runtime-dyno-metadata)
	if (process.env.HEROKU_SLUG_COMMIT) console.log(`Running commit ${process.env.HEROKU_SLUG_COMMIT.slice(0, 7)}`);
	console.log(`In ${readyClient.guilds.cache.size} server(s): ${readyClient.guilds.cache.map((g) => g.name).join(', ')}`);
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

// 5 commands per 10 seconds per user. Commands hit Firestore and Scryfall, so don't let one user spam them.
const checkRateLimit = createRateLimiter({ max: 5, windowMs: 10_000 });

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isModalSubmit() || interaction.isChatInputCommand()) {
		const retryAfter = checkRateLimit(interaction.user.id);
		if (retryAfter > 0) {
			await safeReply(interaction, `⏳ Slow down a little! Try again in ${retryAfter} second${retryAfter === 1 ? '' : 's'}.`);
			return;
		}
	}

	// Modal submits go to the command that owns the modal (its `modalId` / `modalSubmit`)
	if (interaction.isModalSubmit()) {
		const owner = client.commands.find((cmd) => cmd.modalId === interaction.customId);
		if (!owner) return;
		try {
			await owner.modalSubmit(interaction);
			recordActivity(interaction.user, interaction.guild);
		} catch (error) {
			console.error(error);
			await safeReply(interaction, '❌ Something went wrong saving that. Please try again.');
		}
		return;
	}

	if (interaction.isAutocomplete()) {
		const command = client.commands.get(interaction.commandName);
		if (!command || !command.autocomplete) return;
		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
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
		// After the command, so a brand-new /createprofile profile exists to attach the server to.
		// Not awaited: the user already has their reply, and it handles its own errors.
		recordActivity(interaction.user, interaction.guild);
	} catch (error) {
		console.error(error);
		await safeReply(interaction, 'There was an error while executing this command!');
	}
});

client.login(token);
