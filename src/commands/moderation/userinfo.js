const { createEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');

module.exports = {
    name: 'userinfo',
    description: 'Get information about a user',
    usage: '?userinfo [user]',
    aliases: ['ui', 'whois', 'user'],
    async execute(message, args, client, guildData) {
        const target = message.mentions.members.first() || 
                       message.guild.members.cache.get(args[0]) || 
                       message.member;
        
        const roles = target.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .slice(0, 10)
            .join(', ') || 'None';
        
        const permissions = [];
        if (target.permissions.has('Administrator')) permissions.push('Administrator');
        if (target.permissions.has('ManageGuild')) permissions.push('Manage Server');
        if (target.permissions.has('ManageChannels')) permissions.push('Manage Channels');
        if (target.permissions.has('ManageRoles')) permissions.push('Manage Roles');
        if (target.permissions.has('BanMembers')) permissions.push('Ban Members');
        if (target.permissions.has('KickMembers')) permissions.push('Kick Members');
        if (target.permissions.has('ManageMessages')) permissions.push('Manage Messages');
        
        const embed = createEmbed({
            title: `${config.emojis.user_member} User Info: ${target.user.tag}`,
            color: target.displayColor || config.colors.info,
            timestamp: true,
            thumbnail: target.user.displayAvatarURL({ dynamic: true, size: 256 }),
            fields: [
                { name: 'User ID', value: target.id, inline: true },
                { name: 'Nickname', value: target.nickname || 'None', inline: true },
                { name: 'Bot', value: target.user.bot ? 'Yes' : 'No', inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Joined Server', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Highest Role', value: target.roles.highest.toString(), inline: true },
                { name: `Roles [${target.roles.cache.size - 1}]`, value: roles.length > 1000 ? roles.substring(0, 1000) + '...' : roles, inline: false },
                { name: 'Key Permissions', value: permissions.length > 0 ? permissions.join(', ') : 'None', inline: false }
            ],
            footer: { text: `Requested by ${message.author.tag}` }
        });
        
        return message.reply({ embeds: [embed] });
    }
};
