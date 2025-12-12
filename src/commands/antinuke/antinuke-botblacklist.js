const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    name: 'antinuke-botblacklist',
    description: 'Manage anti-nuke bot blacklist (auto-ban when added)',
    usage: '?antinuke-botblacklist <add/remove/list> [botId]',
    aliases: ['an-botbl', 'anbotbl'],
    async execute(message, args, client, guildData) {
        const action = args[0]?.toLowerCase();
        
        if (!action || !['add', 'remove', 'list'].includes(action)) {
            return message.reply({ embeds: [errorEmbed('Usage: `?antinuke-botblacklist <add/remove/list> [botId]`')] });
        }
        
        if (action === 'list') {
            const blacklisted = guildData.antiNuke.blacklistedBots;
            
            if (blacklisted.length === 0) {
                return message.reply({ embeds: [createEmbed({
                    title: `${config.emojis.note} Blacklisted Bots`,
                    description: 'No bots are blacklisted.',
                    color: config.colors.info
                })] });
            }
            
            const botList = await Promise.all(blacklisted.map(async (id) => {
                const user = await client.users.fetch(id).catch(() => null);
                return user ? `${user.tag} (${id})` : `Unknown Bot (${id})`;
            }));
            
            return message.reply({ embeds: [createEmbed({
                title: `${config.emojis.x_} Blacklisted Bots`,
                description: botList.join('\n'),
                color: config.colors.error,
                timestamp: true
            })] });
        }
        
        const botId = message.mentions.users.first()?.id || args[1];
        
        if (!botId) {
            return message.reply({ embeds: [errorEmbed('Please mention a bot or provide a valid bot ID.')] });
        }
        
        const bot = await client.users.fetch(botId).catch(() => null);
        
        if (action === 'add') {
            if (guildData.antiNuke.blacklistedBots.includes(botId)) {
                return message.reply({ embeds: [errorEmbed('This bot is already blacklisted.')] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $push: { 'antiNuke.blacklistedBots': botId } }
            );
            
            return message.reply({ embeds: [successEmbed(`${bot?.tag || botId} has been added to the bot blacklist.\nThis bot will be auto-banned if added to the server.`)] });
        }
        
        if (action === 'remove') {
            if (!guildData.antiNuke.blacklistedBots.includes(botId)) {
                return message.reply({ embeds: [errorEmbed('This bot is not blacklisted.')] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $pull: { 'antiNuke.blacklistedBots': botId } }
            );
            
            return message.reply({ embeds: [successEmbed(`${bot?.tag || botId} has been removed from the bot blacklist.`)] });
        }
    }
};
