const { errorEmbed, successEmbed, modEmbed } = require('../../utils/embedBuilder');
const Mute = require('../../models/Mute');
const config = require('../../config');

module.exports = {
    name: 'unmute',
    description: 'Unmute a member',
    usage: '?unmute <user> [reason]',
    aliases: ['um'],
    async execute(message, args, client, guildData) {
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!target) {
            return message.reply({ embeds: [errorEmbed('Please mention a user or provide a valid user ID.')] });
        }
        
        const mutedRole = message.guild.roles.cache.get(guildData.mutedRoleId);
        
        if (!mutedRole) {
            return message.reply({ embeds: [errorEmbed('No muted role is configured for this server.')] });
        }
        
        if (!target.roles.cache.has(mutedRole.id)) {
            return message.reply({ embeds: [errorEmbed('This user is not muted.')] });
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            await target.roles.remove(mutedRole, `${reason} | Unmuted by ${message.author.tag}`);
            await Mute.deleteOne({ guildId: message.guild.id, oderId: target.id });
            
            const dmEmbed = modEmbed({
                title: `${config.emojis.approved} You have been unmuted`,
                description: `**Server:** ${message.guild.name}\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}`
            });
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            const embed = successEmbed(`${target.user.tag} has been unmuted.\n**Reason:** ${reason}`);
            await message.reply({ embeds: [embed] });
            
            if (guildData.logs.moderation) {
                const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.approved} Member Unmuted`,
                        description: `**User:** ${target.user.tag} (${target.id})\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}`,
                        footer: { text: `User ID: ${target.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error unmuting user:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while unmuting the user.')] });
        }
    }
};
