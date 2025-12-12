const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    name: 'antinuke-blacklist',
    description: 'Manage anti-nuke user blacklist',
    usage: '?antinuke-blacklist <add/remove/list> [user]',
    aliases: ['an-bl', 'anbl'],
    async execute(message, args, client, guildData) {
        const action = args[0]?.toLowerCase();
        
        if (!action || !['add', 'remove', 'list'].includes(action)) {
            return message.reply({ embeds: [errorEmbed('Usage: `?antinuke-blacklist <add/remove/list> [user]`')] });
        }
        
        if (action === 'list') {
            const blacklisted = guildData.antiNuke.blacklistedUsers;
            
            if (blacklisted.length === 0) {
                return message.reply({ embeds: [createEmbed({
                    title: `${config.emojis.note} Blacklisted Users`,
                    description: 'No users are blacklisted.',
                    color: config.colors.info
                })] });
            }
            
            const userList = await Promise.all(blacklisted.map(async (id) => {
                const user = await client.users.fetch(id).catch(() => null);
                return user ? `${user.tag} (${id})` : `Unknown (${id})`;
            }));
            
            return message.reply({ embeds: [createEmbed({
                title: `${config.emojis.x_} Blacklisted Users`,
                description: userList.join('\n'),
                color: config.colors.error,
                timestamp: true
            })] });
        }
        
        const target = message.mentions.users.first() || client.users.cache.get(args[1]);
        
        if (!target) {
            return message.reply({ embeds: [errorEmbed('Please mention a user or provide a valid user ID.')] });
        }
        
        if (action === 'add') {
            if (guildData.antiNuke.blacklistedUsers.includes(target.id)) {
                return message.reply({ embeds: [errorEmbed('This user is already blacklisted.')] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $push: { 'antiNuke.blacklistedUsers': target.id } }
            );
            
            return message.reply({ embeds: [successEmbed(`${target.tag} has been added to the anti-nuke blacklist.`)] });
        }
        
        if (action === 'remove') {
            if (!guildData.antiNuke.blacklistedUsers.includes(target.id)) {
                return message.reply({ embeds: [errorEmbed('This user is not blacklisted.')] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $pull: { 'antiNuke.blacklistedUsers': target.id } }
            );
            
            return message.reply({ embeds: [successEmbed(`${target.tag} has been removed from the anti-nuke blacklist.`)] });
        }
    }
};
