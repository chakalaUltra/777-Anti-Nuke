const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed, modEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');

module.exports = {
    name: 'unban',
    description: 'Unban a user from the server',
    usage: '?unban <userId> [reason]',
    aliases: ['ub'],
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option => 
            option.setName('userid')
                .setDescription('The user ID to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the unban')
                .setRequired(false)),

    async execute(message, args, client, guildData) {
        const userId = args[0];
        
        if (!userId) {
            return message.reply({ embeds: [errorEmbed('Please provide a user ID to unban.')] });
        }
        
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            const banList = await message.guild.bans.fetch();
            const bannedUser = banList.get(userId);
            
            if (!bannedUser) {
                return message.reply({ embeds: [errorEmbed('This user is not banned.')] });
            }
            
            await message.guild.members.unban(userId, `${reason} | Unbanned by ${message.author.tag}`);
            
            const embed = successEmbed(`${bannedUser.user.tag} has been unbanned.\n**Reason:** ${reason}`);
            await message.reply({ embeds: [embed] });
            
            if (guildData.logs.moderation) {
                const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.approved} User Unbanned`,
                        description: `**User:** ${bannedUser.user.tag} (${userId})\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}`,
                        footer: { text: `User ID: ${userId}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error unbanning user:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while unbanning the user. Make sure the ID is valid.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            const banList = await interaction.guild.bans.fetch();
            const bannedUser = banList.get(userId);
            
            if (!bannedUser) {
                return interaction.reply({ embeds: [errorEmbed('This user is not banned.')], ephemeral: true });
            }
            
            await interaction.guild.members.unban(userId, `${reason} | Unbanned by ${interaction.user.tag}`);
            
            const embed = successEmbed(`${bannedUser.user.tag} has been unbanned.\n**Reason:** ${reason}`);
            await interaction.reply({ embeds: [embed] });
            
            if (guildData.logs.moderation) {
                const logChannel = interaction.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.approved} User Unbanned`,
                        description: `**User:** ${bannedUser.user.tag} (${userId})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`,
                        footer: { text: `User ID: ${userId}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error unbanning user:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while unbanning the user. Make sure the ID is valid.')], ephemeral: true });
        }
    }
};
