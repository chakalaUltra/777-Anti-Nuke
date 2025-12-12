const { errorEmbed, successEmbed, modEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');

module.exports = {
    name: 'unban',
    description: 'Unban a user from the server',
    usage: '?unban <userId> [reason]',
    aliases: ['ub'],
    async execute(message, args, client, guildData) {
        const userId = args[0];
        
        if (!userId) {
            return message.reply({ embeds: [errorEmbed('Please provide a user ID to unban.')] });
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            const banList = await message.guild.bans.fetch();
            const bannedUser = banList.get(userId);
            
            if (!bannedUser) {
                return message.reply({ embeds: [errorEmbed('This user is not banned.')] });
            }
            
            await message.guild.members.unban(userId, `${reason} | Unbanned by ${message.author.tag}`);
            
            const embed = successEmbed(`${bannedUser.user.tag} has been unbanned.\n**Reason:** ${reason}`);
            await message.reply({ embeds: [embed] });
            
            if (guildData.logs.moderation) {
                const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.approved} User Unbanned`,
                        description: `**User:** ${bannedUser.user.tag} (${userId})\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}`,
                        footer: { text: `User ID: ${userId}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error unbanning user:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while unbanning the user. Make sure the ID is valid.')] });
        }
    }
};
