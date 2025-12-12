const Guild = require('../models/Guild');
const { hasCommandPermission, hasDangerousCommandPermission } = require('../utils/permissions');
const { errorEmbed } = require('../utils/embedBuilder');
const config = require('../config');

const dangerousCommands = [
    'antinuke', 'antinuke-toggle', 'antinuke-whitelist', 'antinuke-blacklist',
    'antinuke-botwhitelist', 'antinuke-botblacklist', 'automod', 'automod-toggle',
    'blockedwords', 'setprefix', 'settings', 'perm-add', 'perm-remove'
];

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;
        
        let guildData = await Guild.findOne({ guildId: message.guild.id });
        if (!guildData) {
            guildData = await Guild.create({ guildId: message.guild.id });
        }
        
        const prefix = guildData.prefix || config.defaultPrefix;
        
        if (!message.content.startsWith(prefix)) return;
        
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        let command = client.commands.get(commandName);
        if (!command) {
            const aliasCommand = client.aliases.get(commandName);
            if (aliasCommand) {
                command = client.commands.get(aliasCommand);
            }
        }
        
        if (!command) return;
        
        const hasPermission = await hasCommandPermission(message.member, command.name, guildData);
        if (!hasPermission) {
            return message.reply({ embeds: [errorEmbed('You do not have permission to use this command.')] });
        }
        
        if (dangerousCommands.includes(command.name)) {
            const hasDangerousPerm = await hasDangerousCommandPermission(message.member, message.guild);
            if (!hasDangerousPerm) {
                return message.reply({ 
                    embeds: [errorEmbed('This is a dangerous command. You must have a role **above** the bot to use it.')] 
                });
            }
        }
        
        try {
            await command.execute(message, args, client, guildData);
        } catch (error) {
            console.error(`Error executing command ${command.name}:`, error);
            message.reply({ embeds: [errorEmbed('There was an error executing this command.')] });
        }
    }
};
