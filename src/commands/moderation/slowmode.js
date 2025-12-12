const { SlashCommandBuilder } = require('discord.js');
const { errorEmbed, successEmbed, modEmbed, createEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');
const ms = require('ms');

module.exports = {
    name: 'slowmode',
    description: 'Set slowmode for a channel',
    usage: '?slowmode <duration|off>',
    aliases: ['sm'],
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set slowmode for a channel')
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration (e.g., 5s, 10m, 1h) or "off" to disable')
                .setRequired(false)),

    async execute(message, args, client, guildData) {
        const input = args[0]?.toLowerCase();
        
        if (!input) {
            const current = message.channel.rateLimitPerUser;
            return message.reply({ embeds: [createEmbed({
                description: `${config.emojis.info} Current slowmode: ${current > 0 ? `${current} seconds` : 'Off'}`,
                color: config.colors.info
            })] });
        }
        
        let seconds = 0;
        
        if (input !== 'off' && input !== '0') {
            const duration = ms(input);
            if (!duration) {
                return message.reply({ embeds: [errorEmbed('Invalid duration. Use formats like: 5s, 10m, 1h, or "off".')] });
            }
            seconds = Math.floor(duration / 1000);
            
            if (seconds > 21600) {
                return message.reply({ embeds: [errorEmbed('Slowmode cannot exceed 6 hours.')] });
            }
        }
        
        try {
            await message.channel.setRateLimitPerUser(seconds, `Set by ${message.author.tag}`);
            
            const statusText = seconds > 0 ? `set to ${input}` : 'disabled';
            await message.reply({ embeds: [successEmbed(`Slowmode has been ${statusText} for this channel.`)] });
            
            if (guildData.logs.moderation) {
                const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.configure_settings} Slowmode Changed`,
                        description: `**Channel:** ${message.channel}\n**Moderator:** ${message.author.tag}\n**Slowmode:** ${seconds > 0 ? input : 'Disabled'}`,
                        footer: { text: `Channel ID: ${message.channel.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error setting slowmode:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while setting slowmode.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const input = interaction.options.getString('duration')?.toLowerCase();
        
        if (!input) {
            const current = interaction.channel.rateLimitPerUser;
            return interaction.reply({ embeds: [createEmbed({
                description: `${config.emojis.info} Current slowmode: ${current > 0 ? `${current} seconds` : 'Off'}`,
                color: config.colors.info
            })] });
        }
        
        let seconds = 0;
        
        if (input !== 'off' && input !== '0') {
            const duration = ms(input);
            if (!duration) {
                return interaction.reply({ embeds: [errorEmbed('Invalid duration. Use formats like: 5s, 10m, 1h, or "off".')], ephemeral: true });
            }
            seconds = Math.floor(duration / 1000);
            
            if (seconds > 21600) {
                return interaction.reply({ embeds: [errorEmbed('Slowmode cannot exceed 6 hours.')], ephemeral: true });
            }
        }
        
        try {
            await interaction.channel.setRateLimitPerUser(seconds, `Set by ${interaction.user.tag}`);
            
            const statusText = seconds > 0 ? `set to ${input}` : 'disabled';
            await interaction.reply({ embeds: [successEmbed(`Slowmode has been ${statusText} for this channel.`)] });
            
            if (guildData.logs.moderation) {
                const logChannel = interaction.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.configure_settings} Slowmode Changed`,
                        description: `**Channel:** ${interaction.channel}\n**Moderator:** ${interaction.user.tag}\n**Slowmode:** ${seconds > 0 ? input : 'Disabled'}`,
                        footer: { text: `Channel ID: ${interaction.channel.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error setting slowmode:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while setting slowmode.')], ephemeral: true });
        }
    }
};
