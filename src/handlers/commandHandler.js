const fs = require('fs');
const path = require('path');
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

function loadCommands(client) {
    client.commands = new Map();
    client.aliases = new Map();
    client.slashCommands = [];
    
    const commandFolders = fs.readdirSync(path.join(__dirname, '../commands'));
    
    for (const folder of commandFolders) {
        const commandFiles = fs.readdirSync(path.join(__dirname, '../commands', folder)).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const command = require(path.join(__dirname, '../commands', folder, file));
            
            if (command.name) {
                client.commands.set(command.name, command);
                
                if (command.aliases && Array.isArray(command.aliases)) {
                    for (const alias of command.aliases) {
                        client.aliases.set(alias, command.name);
                    }
                }
                
                if (command.data) {
                    client.slashCommands.push(command.data.toJSON());
                }
                
                console.log(`Loaded command: ${command.name}`);
            }
        }
    }
}

async function registerSlashCommands(client) {
    if (!process.env.DISCORD_TOKEN) {
        console.error('DISCORD_TOKEN not found, cannot register slash commands');
        return;
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log(`Started refreshing ${client.slashCommands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: client.slashCommands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
}

module.exports = { loadCommands, registerSlashCommands };
