const { errorEmbed, successEmbed, modEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');

module.exports = {
    name: 'purge',
    description: 'Delete multiple messages at once',
    usage: '?purge <amount> [user]',
    aliases: ['clear', 'prune', 'bulkdelete'],
    async execute(message, args, client, guildData) {
        const amount = parseInt(args[0]);
        
        if (!amount || amount < 1 || amount > 100) {
            return message.reply({ embeds: [errorEmbed('Please provide a number between 1 and 100.')] });
        }
        
        const target = message.mentions.users.first();
        
        try {
            await message.delete();
            
            let messages = await message.channel.messages.fetch({ limit: amount + 1 });
            
            if (target) {
                messages = messages.filter(msg => msg.author.id === target.id);
            }
            
            messages = messages.filter(msg => Date.now() - msg.createdTimestamp < 1209600000);
            
            const deleted = await message.channel.bulkDelete(messages, true);
            
            const confirmation = await message.channel.send({ 
                embeds: [successEmbed(`Deleted ${deleted.size} messages${target ? ` from ${target.tag}` : ''}.`)] 
            });
            
            setTimeout(() => confirmation.delete().catch(() => {}), 5000);
            
            if (guildData.logs.moderation) {
                const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.important} Messages Purged`,
                        description: `**Channel:** ${message.channel}\n**Moderator:** ${message.author.tag}\n**Messages Deleted:** ${deleted.size}${target ? `\n**Target User:** ${target.tag}` : ''}`,
                        footer: { text: `Channel ID: ${message.channel.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error purging messages:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred. Messages older than 14 days cannot be bulk deleted.')] });
        }
    }
};
