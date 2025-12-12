const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed, modEmbed } = require('../../utils/embedBuilder');
const { isAboveTarget } = require('../../utils/permissions');
const Warning = require('../../models/Warning');
const config = require('../../config');

module.exports = {
    name: 'warn',
    description: 'Warn a member',
    usage: '?warn <user> [reason]',
    aliases: ['w'],
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(false)),

    async execute(message, args, client, guildData) {
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!target) {
            return message.reply({ embeds: [errorEmbed('Please mention a user or provide a valid user ID.')] });
        }
        
        if (!isAboveTarget(message.member, target)) {
            return message.reply({ embeds: [errorEmbed('You cannot warn this user as they have a higher or equal role.')] });
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            await Warning.create({
                guildId: message.guild.id,
                userId: target.id,
                moderatorId: message.author.id,
                reason
            });
            
            const warningCount = await Warning.countDocuments({ 
                guildId: message.guild.id, 
                userId: target.id 
            });
            
            const dmEmbed = modEmbed({
                title: `${config.emojis.alarm} You have been warned`,
                description: `**Server:** ${message.guild.name}\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}\n**Total Warnings:** ${warningCount}`
            });
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            const embed = successEmbed(`${target.user.tag} has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`);
            await message.reply({ embeds: [embed] });
            
            if (guildData.logs.moderation) {
                const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.alarm} Member Warned`,
                        description: `**User:** ${target.user.tag} (${target.id})\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`,
                        footer: { text: `User ID: ${target.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error warning user:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while warning the user.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (!target) {
            return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], ephemeral: true });
        }
        
        if (!isAboveTarget(interaction.member, target)) {
            return interaction.reply({ embeds: [errorEmbed('You cannot warn this user as they have a higher or equal role.')], ephemeral: true });
        }
        
        try {
            await Warning.create({
                guildId: interaction.guild.id,
                userId: target.id,
                moderatorId: interaction.user.id,
                reason
            });
            
            const warningCount = await Warning.countDocuments({ 
                guildId: interaction.guild.id, 
                userId: target.id 
            });
            
            const dmEmbed = modEmbed({
                title: `${config.emojis.alarm} You have been warned`,
                description: `**Server:** ${interaction.guild.name}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}\n**Total Warnings:** ${warningCount}`
            });
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            const embed = successEmbed(`${target.user.tag} has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`);
            await interaction.reply({ embeds: [embed] });
            
            if (guildData.logs.moderation) {
                const logChannel = interaction.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.alarm} Member Warned`,
                        description: `**User:** ${target.user.tag} (${target.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`,
                        footer: { text: `User ID: ${target.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error warning user:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while warning the user.')], ephemeral: true });
        }
    }
};
