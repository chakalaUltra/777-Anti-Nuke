const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed, modEmbed } = require('../../utils/embedBuilder');
const { isAboveTarget } = require('../../utils/permissions');
const config = require('../../config');

module.exports = {
    name: 'kick',
    description: 'Kick a member from the server',
    usage: '?kick <user> [reason]',
    aliases: ['k'],
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false)),

    async execute(message, args, client, guildData) {
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!target) {
            return message.reply({ embeds: [errorEmbed('Please mention a user or provide a valid user ID.')] });
        }
        
        if (!isAboveTarget(message.member, target)) {
            return message.reply({ embeds: [errorEmbed('You cannot kick this user as they have a higher or equal role.')] });
        }
        
        if (!target.kickable) {
            return message.reply({ embeds: [errorEmbed('I cannot kick this user. They may have higher permissions than me.')] });
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            const dmEmbed = modEmbed({
                title: `${config.emojis.important} You have been kicked`,
                description: `**Server:** ${message.guild.name}\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}`
            });
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            await target.kick(`${reason} | Kicked by ${message.author.tag}`);
            
            const embed = successEmbed(`${target.user.tag} has been kicked.\n**Reason:** ${reason}`);
            await message.reply({ embeds: [embed] });
            
            if (guildData.logs.moderation) {
                const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.notification} Member Kicked`,
                        description: `**User:** ${target.user.tag} (${target.id})\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}`,
                        footer: { text: `User ID: ${target.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error kicking user:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while kicking the user.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (!target) {
            return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], ephemeral: true });
        }
        
        if (!isAboveTarget(interaction.member, target)) {
            return interaction.reply({ embeds: [errorEmbed('You cannot kick this user as they have a higher or equal role.')], ephemeral: true });
        }
        
        if (!target.kickable) {
            return interaction.reply({ embeds: [errorEmbed('I cannot kick this user. They may have higher permissions than me.')], ephemeral: true });
        }
        
        try {
            const dmEmbed = modEmbed({
                title: `${config.emojis.important} You have been kicked`,
                description: `**Server:** ${interaction.guild.name}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}`
            });
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            await target.kick(`${reason} | Kicked by ${interaction.user.tag}`);
            
            const embed = successEmbed(`${target.user.tag} has been kicked.\n**Reason:** ${reason}`);
            await interaction.reply({ embeds: [embed] });
            
            if (guildData.logs.moderation) {
                const logChannel = interaction.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.notification} Member Kicked`,
                        description: `**User:** ${target.user.tag} (${target.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`,
                        footer: { text: `User ID: ${target.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error kicking user:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while kicking the user.')], ephemeral: true });
        }
    }
};
