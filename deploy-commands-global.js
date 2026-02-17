// deploy-commands.js
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { token, clientId } = require('./config.json'); // make sure you have these

const commands = [];

// load all command files
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} global application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(clientId), // global commands
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} global application (/) commands.`);
    console.log('⚠️ Note: Global commands can take up to 1 hour to appear in all servers.');
  } catch (error) {
    console.error(error);
  }
})();
