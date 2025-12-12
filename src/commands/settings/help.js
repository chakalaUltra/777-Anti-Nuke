const { createEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');

module.exports = {
    name: 'help',
    description: 'View all available commands',
    usage: '?help [command]',
    aliases: ['h', 'commands'],
    async execute(message, args, client, guildData) {
        const prefix = guildData.prefix;
        
        if (args[0]) {
            const commandName = args[0].toLowerCase();
            const command = client.commands.get(commandName) || 
                           client.commands.get(client.aliases.get(commandName));
            
            if (!command) {
                return message.reply({ embeds: [createEmbed({
                    description: `${config.emojis.x_} Command not found.`,
                    color: config.colors.error
                })] });
            }
            
            const embed = createEmbed({
                title: `${config.emojis.info} Command: ${command.name}`,
                color: config.colors.info,
                timestamp: true,
                fields: [
                    { name: 'Description', value: command.description || 'No description', inline: false },
                    { name: 'Usage', value: `\`${command.usage?.replace('?', prefix) || `${prefix}${command.name}`}\``, inline: true },
                    { name: 'Aliases', value: command.aliases?.map(a => `\`${a}\``).join(', ') || 'None', inline: true }
                ]
            });
            
            return message.reply({ embeds: [embed] });
        }
        
        const categories = {
            'Moderation': ['ban', 'kick', 'mute', 'unmute', 'unban', 'warn', 'warnings', 'delwarn'],
            'Anti-Nuke': ['antinuke', 'antinuke-whitelist', 'antinuke-blacklist', 'antinuke-botwhitelist', 'antinuke-botblacklist'],
            'AutoMod': ['automod', 'blockedwords'],
            'Logs': ['logs'],
            'Settings': ['setprefix', 'settings', 'perm-add', 'perm-remove', 'help']
        };
        
        const fields = Object.entries(categories).map(([category, commands]) => {
            const commandList = commands
                .filter(cmd => client.commands.has(cmd))
                .map(cmd => `\`${cmd}\``)
                .join(', ');
            
            return { name: `${config.emojis.note} ${category}`, value: commandList || 'No commands', inline: false };
        });
        
        const embed = createEmbed({
            title: `${config.emojis.info} Anti-Nuke Bot Commands`,
            description: `**Prefix:** \`${prefix}\`\nUse \`${prefix}help <command>\` for detailed info on a command.\n\n${config.emojis.alarm} **Dangerous commands** require your role to be above the bot.`,
            color: config.colors.info,
            timestamp: true,
            fields,
            footer: { text: `Requested by ${message.author.tag}` }
        });
        
        return message.reply({ embeds: [embed] });
    }
};
