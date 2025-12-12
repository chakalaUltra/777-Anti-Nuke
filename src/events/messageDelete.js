const Guild = require('../models/Guild');
const { createEmbed } = require('../utils/embedBuilder');
const config = require('../config');

module.exports = {
    name: 'messageDelete',
    async execute(message, client) {
        if (!message.guild || message.author?.bot) return;
        
        const guildData = await Guild.findOne({ guildId: message.guild.id });
        if (!guildData || !guildData.logs.deletedMessages) return;
        
        const logChannel = message.guild.channels.cache.get(guildData.logs.deletedMessages);
        if (!logChannel) return;
        
        const embed = createEmbed({
            title: `${config.emojis.important} Message Deleted`,
            description: `**Author:** ${message.author?.tag || 'Unknown'} (${message.author?.id || 'Unknown'})\n**Channel:** ${message.channel}\n**Content:**\n${message.content || '*No text content*'}`,
            color: config.colors.warning,
            timestamp: true,
            footer: { text: `Message ID: ${message.id}` }
        });
        
        if (message.attachments.size > 0) {
            embed.addFields({ 
                name: 'Attachments', 
                value: message.attachments.map(a => a.url).join('\n').substring(0, 1024) 
            });
        }
        
        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging deleted message:', error);
        }
    }
};
