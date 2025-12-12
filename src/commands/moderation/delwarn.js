const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed, modEmbed } = require('../../utils/embedBuilder');
const Warning = require('../../models/Warning');
const config = require('../../config');

module.exports = {
    name: 'delwarn',
    description: 'Delete a warning from a member',
    usage: '?delwarn <user> [warning_number|all]',
    aliases: ['removewarn', 'clearwarn'],
    data: new SlashCommandBuilder()
        .setName('delwarn')
        .setDescription('Delete a warning from a member')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to delete warning from')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('warning')
                .setDescription('Warning number to delete or "all" for all warnings')
                .setRequired(false)),

    async execute(message, args, client, guildData) {
        const target = message.mentions.users.first() || client.users.cache.get(args[0]);
        
        if (!target) {
            return message.reply({ embeds: [errorEmbed('Please mention a user or provide a valid user ID.')] });
        }
        
        const option = args[1]?.toLowerCase() || '1';
        
        try {
            if (option === 'all') {
                const result = await Warning.deleteMany({ 
                    guildId: message.guild.id, 
                    oderId: target.id 
                });
                
                const embed = successEmbed(`Deleted all ${result.deletedCount} warnings for ${target.tag}.`);
                await message.reply({ embeds: [embed] });
                
                if (guildData.logs.moderation) {
                    const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                    if (logChannel) {
                        const logEmbed = modEmbed({
                            title: `${config.emojis.approved} Warnings Cleared`,
                            description: `**User:** ${target.tag} (${target.id})\n**Moderator:** ${message.author.tag}\n**Warnings Removed:** ${result.deletedCount}`,
                            footer: { text: `User ID: ${target.id}` }
                        });
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
            } else {
                const warningIndex = parseInt(option) - 1;
                
                if (isNaN(warningIndex) || warningIndex < 0) {
                    return message.reply({ embeds: [errorEmbed('Please provide a valid warning number or "all".')] });
                }
                
                const warnings = await Warning.find({ 
                    guildId: message.guild.id, 
                    oderId: target.id 
                }).sort({ createdAt: -1 });
                
                if (warnings.length === 0) {
                    return message.reply({ embeds: [errorEmbed('This user has no warnings.')] });
                }
                
                if (warningIndex >= warnings.length) {
                    return message.reply({ embeds: [errorEmbed(`This user only has ${warnings.length} warnings.`)] });
                }
                
                const warningToDelete = warnings[warningIndex];
                await Warning.deleteOne({ _id: warningToDelete._id });
                
                const embed = successEmbed(`Deleted warning #${warningIndex + 1} for ${target.tag}.\n**Reason was:** ${warningToDelete.reason}`);
                await message.reply({ embeds: [embed] });
                
                if (guildData.logs.moderation) {
                    const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                    if (logChannel) {
                        const logEmbed = modEmbed({
                            title: `${config.emojis.approved} Warning Deleted`,
                            description: `**User:** ${target.tag} (${target.id})\n**Moderator:** ${message.author.tag}\n**Warning Reason:** ${warningToDelete.reason}`,
                            footer: { text: `User ID: ${target.id}` }
                        });
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
            }
        } catch (error) {
            console.error('Error deleting warning:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while deleting the warning.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const target = interaction.options.getUser('user');
        const option = interaction.options.getString('warning')?.toLowerCase() || '1';
        
        try {
            if (option === 'all') {
                const result = await Warning.deleteMany({ 
                    guildId: interaction.guild.id, 
                    oderId: target.id 
                });
                
                const embed = successEmbed(`Deleted all ${result.deletedCount} warnings for ${target.tag}.`);
                await interaction.reply({ embeds: [embed] });
                
                if (guildData.logs.moderation) {
                    const logChannel = interaction.guild.channels.cache.get(guildData.logs.moderation);
                    if (logChannel) {
                        const logEmbed = modEmbed({
                            title: `${config.emojis.approved} Warnings Cleared`,
                            description: `**User:** ${target.tag} (${target.id})\n**Moderator:** ${interaction.user.tag}\n**Warnings Removed:** ${result.deletedCount}`,
                            footer: { text: `User ID: ${target.id}` }
                        });
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
            } else {
                const warningIndex = parseInt(option) - 1;
                
                if (isNaN(warningIndex) || warningIndex < 0) {
                    return interaction.reply({ embeds: [errorEmbed('Please provide a valid warning number or "all".')], ephemeral: true });
                }
                
                const warnings = await Warning.find({ 
                    guildId: interaction.guild.id, 
                    oderId: target.id 
                }).sort({ createdAt: -1 });
                
                if (warnings.length === 0) {
                    return interaction.reply({ embeds: [errorEmbed('This user has no warnings.')], ephemeral: true });
                }
                
                if (warningIndex >= warnings.length) {
                    return interaction.reply({ embeds: [errorEmbed(`This user only has ${warnings.length} warnings.`)], ephemeral: true });
                }
                
                const warningToDelete = warnings[warningIndex];
                await Warning.deleteOne({ _id: warningToDelete._id });
                
                const embed = successEmbed(`Deleted warning #${warningIndex + 1} for ${target.tag}.\n**Reason was:** ${warningToDelete.reason}`);
                await interaction.reply({ embeds: [embed] });
                
                if (guildData.logs.moderation) {
                    const logChannel = interaction.guild.channels.cache.get(guildData.logs.moderation);
                    if (logChannel) {
                        const logEmbed = modEmbed({
                            title: `${config.emojis.approved} Warning Deleted`,
                            description: `**User:** ${target.tag} (${target.id})\n**Moderator:** ${interaction.user.tag}\n**Warning Reason:** ${warningToDelete.reason}`,
                            footer: { text: `User ID: ${target.id}` }
                        });
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
            }
        } catch (error) {
            console.error('Error deleting warning:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while deleting the warning.')], ephemeral: true });
        }
    }
};
