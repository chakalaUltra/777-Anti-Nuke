const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, createEmbed } = require('../../utils/embedBuilder');
const Warning = require('../../models/Warning');
const config = require('../../config');

module.exports = {
    name: 'warnings',
    description: 'View warnings for a member',
    usage: '?warnings <user>',
    aliases: ['warns', 'infractions'],
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a member')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to check warnings for (defaults to yourself)')
                .setRequired(false)),

    async execute(message, args, client, guildData) {
        const target = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author;
        
        try {
            const warnings = await Warning.find({ 
                guildId: message.guild.id, 
                userId: target.id 
            }).sort({ createdAt: -1 });
            
            if (warnings.length === 0) {
                return message.reply({ embeds: [createEmbed({
                    title: `${config.emojis.approved} No Warnings`,
                    description: `**${target.tag}** has no warnings in this server.`,
                    color: config.colors.success
                })] });
            }
            
            const fields = warnings.slice(0, 10).map((warn, index) => {
                const moderator = client.users.cache.get(warn.moderatorId);
                const date = new Date(warn.createdAt).toLocaleDateString();
                return {
                    name: `#${index + 1} - ${date}`,
                    value: `${config.emojis.note} **Reason:** ${warn.reason}\n${config.emojis.user_member} **By:** ${moderator?.tag || 'Unknown'}`,
                    inline: false
                };
            });
            
            const embed = createEmbed({
                title: `${config.emojis.alarm} Warnings for ${target.tag}`,
                description: `${config.emojis.important} **Total Warnings:** ${warnings.length}`,
                color: config.colors.warning,
                fields: fields,
                footer: { text: `Showing ${Math.min(warnings.length, 10)} of ${warnings.length} warnings` }
            });
            
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching warnings:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while fetching warnings.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const target = interaction.options.getUser('user') || interaction.user;
        
        try {
            const warnings = await Warning.find({ 
                guildId: interaction.guild.id, 
                userId: target.id 
            }).sort({ createdAt: -1 });
            
            if (warnings.length === 0) {
                return interaction.reply({ embeds: [createEmbed({
                    title: `${config.emojis.approved} No Warnings`,
                    description: `**${target.tag}** has no warnings in this server.`,
                    color: config.colors.success
                })] });
            }
            
            const fields = warnings.slice(0, 10).map((warn, index) => {
                const moderator = client.users.cache.get(warn.moderatorId);
                const date = new Date(warn.createdAt).toLocaleDateString();
                return {
                    name: `#${index + 1} - ${date}`,
                    value: `${config.emojis.note} **Reason:** ${warn.reason}\n${config.emojis.user_member} **By:** ${moderator?.tag || 'Unknown'}`,
                    inline: false
                };
            });
            
            const embed = createEmbed({
                title: `${config.emojis.alarm} Warnings for ${target.tag}`,
                description: `${config.emojis.important} **Total Warnings:** ${warnings.length}`,
                color: config.colors.warning,
                fields: fields,
                footer: { text: `Showing ${Math.min(warnings.length, 10)} of ${warnings.length} warnings` }
            });
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching warnings:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while fetching warnings.')], ephemeral: true });
        }
    }
};
