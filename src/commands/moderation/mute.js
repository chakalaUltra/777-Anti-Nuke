const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed, modEmbed } = require('../../utils/embedBuilder');
const { isAboveTarget } = require('../../utils/permissions');
const config = require('../../config');
const ms = require('ms');

module.exports = {
    name: 'mute',
    description: 'Timeout a member using Discord\'s native timeout feature',
    usage: '?mute <user> [duration] [reason]',
    aliases: ['m', 'timeout'],
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeout a member using Discord\'s native timeout feature')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of the timeout (e.g., 10m, 1h, 1d). Max: 28 days')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false)),

    async execute(message, args, client, guildData) {
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!target) {
            return message.reply({ embeds: [errorEmbed('Please mention a user or provide a valid user ID.')] });
        }
        
        if (!isAboveTarget(message.member, target)) {
            return message.reply({ embeds: [errorEmbed('You cannot timeout this user as they have a higher or equal role.')] });
        }

        if (!target.moderatable) {
            return message.reply({ embeds: [errorEmbed('I cannot timeout this user. They may have higher permissions than me.')] });
        }
        
        const durationStr = args[1] || '10m';
        const duration = ms(durationStr);
        
        if (!duration || duration < 1000 || duration > 2419200000) {
            return message.reply({ embeds: [errorEmbed('Please provide a valid duration (e.g., 10m, 1h, 1d). Max: 28 days.')] });
        }
        
        const reason = args.slice(2).join(' ') || 'No reason provided';
        
        try {
            await target.timeout(duration, `${reason} | Timed out by ${message.author.tag}`);
            
            const dmEmbed = modEmbed({
                title: `${config.emojis.alarm} You have been timed out`,
                description: `**Server:** ${message.guild.name}\n**Duration:** ${durationStr}\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}`
            });
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            const embed = successEmbed(`${target.user.tag} has been timed out for ${durationStr}.\n**Reason:** ${reason}`);
            await message.reply({ embeds: [embed] });
            
            if (guildData.logs.moderation) {
                const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.alarm} Member Timed Out`,
                        description: `**User:** ${target.user.tag} (${target.id})\n**Moderator:** ${message.author.tag}\n**Duration:** ${durationStr}\n**Reason:** ${reason}`,
                        footer: { text: `User ID: ${target.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error timing out user:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while timing out the user.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const target = interaction.options.getMember('user');
        const durationStr = interaction.options.getString('duration') || '10m';
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (!target) {
            return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], ephemeral: true });
        }
        
        if (!isAboveTarget(interaction.member, target)) {
            return interaction.reply({ embeds: [errorEmbed('You cannot timeout this user as they have a higher or equal role.')], ephemeral: true });
        }

        if (!target.moderatable) {
            return interaction.reply({ embeds: [errorEmbed('I cannot timeout this user. They may have higher permissions than me.')], ephemeral: true });
        }
        
        const duration = ms(durationStr);
        
        if (!duration || duration < 1000 || duration > 2419200000) {
            return interaction.reply({ embeds: [errorEmbed('Please provide a valid duration (e.g., 10m, 1h, 1d). Max: 28 days.')], ephemeral: true });
        }
        
        try {
            await target.timeout(duration, `${reason} | Timed out by ${interaction.user.tag}`);
            
            const dmEmbed = modEmbed({
                title: `${config.emojis.alarm} You have been timed out`,
                description: `**Server:** ${interaction.guild.name}\n**Duration:** ${durationStr}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}`
            });
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            const embed = successEmbed(`${target.user.tag} has been timed out for ${durationStr}.\n**Reason:** ${reason}`);
            await interaction.reply({ embeds: [embed] });
            
            if (guildData.logs.moderation) {
                const logChannel = interaction.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.alarm} Member Timed Out`,
                        description: `**User:** ${target.user.tag} (${target.id})\n**Moderator:** ${interaction.user.tag}\n**Duration:** ${durationStr}\n**Reason:** ${reason}`,
                        footer: { text: `User ID: ${target.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error timing out user:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while timing out the user.')], ephemeral: true });
        }
    }
};
