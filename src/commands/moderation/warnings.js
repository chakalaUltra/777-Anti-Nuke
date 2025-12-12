const { errorEmbed, createEmbed } = require('../../utils/embedBuilder');
const Warning = require('../../models/Warning');
const config = require('../../config');

module.exports = {
    name: 'warnings',
    description: 'View warnings for a member',
    usage: '?warnings <user>',
    aliases: ['warns', 'infractions'],
    async execute(message, args, client, guildData) {
        const target = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;
        
        try {
            const warnings = await Warning.find({ 
                guildId: message.guild.id, 
                oderId: target.id 
            }).sort({ createdAt: -1 });
            
            if (warnings.length === 0) {
                return message.reply({ embeds: [createEmbed({
                    title: `${config.emojis.approved} No Warnings`,
                    description: `${target.tag} has no warnings in this server.`,
                    color: config.colors.success,
                    timestamp: true
                })] });
            }
            
            const warningList = warnings.slice(0, 10).map((warn, index) => {
                const moderator = client.users.cache.get(warn.moderatorId);
                const date = new Date(warn.createdAt).toLocaleDateString();
                return `**${index + 1}.** ${warn.reason}\n   ${config.emojis.user_member} Moderator: ${moderator?.tag || 'Unknown'} | ${date}`;
            }).join('\n\n');
            
            const embed = createEmbed({
                title: `${config.emojis.note} Warnings for ${target.tag}`,
                description: warningList,
                color: config.colors.warning,
                timestamp: true,
                footer: { text: `Total Warnings: ${warnings.length} | Showing last 10` }
            });
            
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching warnings:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while fetching warnings.')] });
        }
    }
};
