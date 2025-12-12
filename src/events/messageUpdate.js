const Guild = require('../models/Guild');
const { createEmbed } = require('../utils/embedBuilder');
const config = require('../config');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage, client) {
        if (!oldMessage.guild || oldMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;
        
        const guildData = await Guild.findOne({ guildId: oldMessage.guild.id });
        if (!guildData || !guildData.logs.editedMessages) return;
        
        const logChannel = oldMessage.guild.channels.cache.get(guildData.logs.editedMessages);
        if (!logChannel) return;
        
        const embed = createEmbed({
            title: `${config.emojis.note} Message Edited`,
            description: `**Author:** ${oldMessage.author?.tag || 'Unknown'} (${oldMessage.author?.id || 'Unknown'})\n**Channel:** ${oldMessage.channel}\n[Jump to Message](${newMessage.url})`,
            color: config.colors.info,
            timestamp: true,
            footer: { text: `Message ID: ${oldMessage.id}` },
            fields: [
                { name: 'Before', value: oldMessage.content?.substring(0, 1024) || '*No content*', inline: false },
                { name: 'After', value: newMessage.content?.substring(0, 1024) || '*No content*', inline: false }
            ]
        });
        
        try {
            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging edited message:', error);
        }
    }
};
