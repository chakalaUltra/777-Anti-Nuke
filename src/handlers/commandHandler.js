const fs = require('fs');
const path = require('path');

function loadCommands(client) {
    client.commands = new Map();
    client.aliases = new Map();
    
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
                
                console.log(`Loaded command: ${command.name}`);
            }
        }
    }
}

module.exports = { loadCommands };
