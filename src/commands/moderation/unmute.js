const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed, modEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');

module.exports = {
    name: 'unmute',
    description: 'Remove timeout from a member',
    usage: '?unmute <user> [reason]',
    aliases: ['um', 'untimeout'],
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remove timeout from a member')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to remove timeout from')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for removing the timeout')
                .setRequired(false)),

    async execute(message, args, client, guildData) {
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!target) {
            return message.reply({ embeds: [errorEmbed('Please mention a user or provide a valid user ID.')] });
        }

        if (!target.isCommunicationDisabled()) {
            return message.reply({ embeds: [errorEmbed('This user is not timed out.')] });
        }

        if (!target.moderatable) {
            return message.reply({ embeds: [errorEmbed('I cannot remove timeout from this user. They may have higher permissions than me.')] });
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            await target.timeout(null, `${reason} | Timeout removed by ${message.author.tag}`);
            
            const dmEmbed = modEmbed({
                title: `${config.emojis.approved} Your timeout has been removed`,
                description: `**Server:** ${message.guild.name}\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}`
            });
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            const embed = successEmbed(`${target.user.tag}'s timeout has been removed.\n**Reason:** ${reason}`);
            await message.reply({ embeds: [embed] });
            
            if (guildData.logs.moderation) {
                const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.approved} Member Timeout Removed`,
                        description: `**User:** ${target.user.tag} (${target.id})\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}`,
                        footer: { text: `User ID: ${target.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error removing timeout:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while removing the timeout.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const target = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        if (!target) {
            return interaction.reply({ embeds: [errorEmbed('User not found in this server.')], ephemeral: true });
        }

        if (!target.isCommunicationDisabled()) {
            return interaction.reply({ embeds: [errorEmbed('This user is not timed out.')], ephemeral: true });
        }

        if (!target.moderatable) {
            return interaction.reply({ embeds: [errorEmbed('I cannot remove timeout from this user. They may have higher permissions than me.')], ephemeral: true });
        }
        
        try {
            await target.timeout(null, `${reason} | Timeout removed by ${interaction.user.tag}`);
            
            const dmEmbed = modEmbed({
                title: `${config.emojis.approved} Your timeout has been removed`,
                description: `**Server:** ${interaction.guild.name}\n**Reason:** ${reason}\n**Moderator:** ${interaction.user.tag}`
            });
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            const embed = successEmbed(`${target.user.tag}'s timeout has been removed.\n**Reason:** ${reason}`);
            await interaction.reply({ embeds: [embed] });
            
            if (guildData.logs.moderation) {
                const logChannel = interaction.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.approved} Member Timeout Removed`,
                        description: `**User:** ${target.user.tag} (${target.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`,
                        footer: { text: `User ID: ${target.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error removing timeout:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while removing the timeout.')], ephemeral: true });
        }
    }
};
