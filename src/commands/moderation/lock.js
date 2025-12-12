const { errorEmbed, successEmbed, modEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');

module.exports = {
    name: 'lock',
    description: 'Lock a channel (prevent members from sending messages)',
    usage: '?lock [channel] [reason]',
    aliases: ['lockdown'],
    async execute(message, args, client, guildData) {
        const channel = message.mentions.channels.first() || message.channel;
        const reason = args.slice(message.mentions.channels.size > 0 ? 1 : 0).join(' ') || 'No reason provided';
        
        try {
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: false
            }, { reason: `Locked by ${message.author.tag}: ${reason}` });
            
            await message.reply({ embeds: [successEmbed(`${channel} has been locked.\n**Reason:** ${reason}`)] });
            
            if (channel.id !== message.channel.id) {
                await channel.send({ embeds: [modEmbed({
                    title: `${config.emojis.alarm} Channel Locked`,
                    description: `This channel has been locked by ${message.author}.\n**Reason:** ${reason}`
                })] });
            }
            
            if (guildData.logs.moderation) {
                const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.alarm} Channel Locked`,
                        description: `**Channel:** ${channel}\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}`,
                        footer: { text: `Channel ID: ${channel.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error locking channel:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while locking the channel.')] });
        }
    }
};
