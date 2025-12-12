const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');

module.exports = {
    name: 'help',
    description: 'View all available commands',
    usage: '?help [command]',
    aliases: ['h', 'commands'],
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all available commands')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Get detailed info about a specific command')
                .setRequired(false)),

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
            'Moderation': ['ban', 'kick', 'mute', 'unmute', 'unban', 'warn', 'warnings', 'delwarn', 'purge', 'lock', 'unlock', 'slowmode', 'userinfo', 'serverinfo'],
            'Anti-Nuke': ['antinuke', 'antinuke-whitelist', 'antinuke-blacklist', 'antinuke-botwhitelist', 'antinuke-botblacklist'],
            'AutoMod': ['automod', 'blockedwords'],
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
            description: `**Prefix:** \`${prefix}\` | **Slash Commands:** Enabled\nUse \`${prefix}help <command>\` or \`/help <command>\` for detailed info.\n\n${config.emojis.alarm} **Dangerous commands** require your role to be above the bot.`,
            color: config.colors.info,
            timestamp: true,
            fields,
            footer: { text: `Requested by ${message.author.tag}` }
        });
        
        return message.reply({ embeds: [embed] });
    },

    async executeSlash(interaction, client, guildData) {
        const commandName = interaction.options.getString('command');
        
        if (commandName) {
            const command = client.commands.get(commandName.toLowerCase()) || 
                           client.commands.get(client.aliases.get(commandName.toLowerCase()));
            
            if (!command) {
                return interaction.reply({ embeds: [createEmbed({
                    description: `${config.emojis.x_} Command not found.`,
                    color: config.colors.error
                })], ephemeral: true });
            }
            
            const embed = createEmbed({
                title: `${config.emojis.info} Command: ${command.name}`,
                color: config.colors.info,
                timestamp: true,
                fields: [
                    { name: 'Description', value: command.description || 'No description', inline: false },
                    { name: 'Slash Command', value: `\`/${command.name}\``, inline: true },
                    { name: 'Aliases', value: command.aliases?.map(a => `\`${a}\``).join(', ') || 'None', inline: true }
                ]
            });
            
            return interaction.reply({ embeds: [embed] });
        }
        
        const categories = {
            'Moderation': ['ban', 'kick', 'mute', 'unmute', 'unban', 'warn', 'warnings', 'delwarn', 'purge', 'lock', 'unlock', 'slowmode', 'userinfo', 'serverinfo'],
            'Anti-Nuke': ['antinuke', 'antinuke-whitelist', 'antinuke-blacklist', 'antinuke-botwhitelist', 'antinuke-botblacklist'],
            'AutoMod': ['automod', 'blockedwords'],
            'Settings': ['setprefix', 'settings', 'perm-add', 'perm-remove', 'help']
        };
        
        const fields = Object.entries(categories).map(([category, commands]) => {
            const commandList = commands
                .filter(cmd => client.commands.has(cmd))
                .map(cmd => `\`/${cmd}\``)
                .join(', ');
            
            return { name: `${config.emojis.note} ${category}`, value: commandList || 'No commands', inline: false };
        });
        
        const embed = createEmbed({
            title: `${config.emojis.info} Anti-Nuke Bot Commands`,
            description: `**Slash Commands:** Enabled\nUse \`/help <command>\` for detailed info.\n\n${config.emojis.alarm} **Dangerous commands** require your role to be above the bot.`,
            color: config.colors.info,
            timestamp: true,
            fields,
            footer: { text: `Requested by ${interaction.user.tag}` }
        });
        
        return interaction.reply({ embeds: [embed] });
    }
};
