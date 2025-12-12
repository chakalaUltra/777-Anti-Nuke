const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { errorEmbed, successEmbed, modEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');

module.exports = {
    name: 'unlock',
    description: 'Unlock a channel (allow members to send messages)',
    usage: '?unlock [channel] [reason]',
    aliases: [],
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock a channel (allow members to send messages)')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to unlock (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for unlocking the channel')
                .setRequired(false)),

    async execute(message, args, client, guildData) {
        const channel = message.mentions.channels.first() || message.channel;
        const reason = args.slice(message.mentions.channels.size > 0 ? 1 : 0).join(' ') || 'No reason provided';
        
        try {
            await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                SendMessages: null
            }, { reason: `Unlocked by ${message.author.tag}: ${reason}` });
            
            await message.reply({ embeds: [successEmbed(`${channel} has been unlocked.\n**Reason:** ${reason}`)] });
            
            if (channel.id !== message.channel.id) {
                await channel.send({ embeds: [modEmbed({
                    title: `${config.emojis.approved} Channel Unlocked`,
                    description: `This channel has been unlocked by ${message.author}.\n**Reason:** ${reason}`
                })] });
            }
            
            if (guildData.logs.moderation) {
                const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.approved} Channel Unlocked`,
                        description: `**Channel:** ${channel}\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}`,
                        footer: { text: `Channel ID: ${channel.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error unlocking channel:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while unlocking the channel.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: null
            }, { reason: `Unlocked by ${interaction.user.tag}: ${reason}` });
            
            await interaction.reply({ embeds: [successEmbed(`${channel} has been unlocked.\n**Reason:** ${reason}`)] });
            
            if (channel.id !== interaction.channel.id) {
                await channel.send({ embeds: [modEmbed({
                    title: `${config.emojis.approved} Channel Unlocked`,
                    description: `This channel has been unlocked by ${interaction.user}.\n**Reason:** ${reason}`
                })] });
            }
            
            if (guildData.logs.moderation) {
                const logChannel = interaction.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.approved} Channel Unlocked`,
                        description: `**Channel:** ${channel}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`,
                        footer: { text: `Channel ID: ${channel.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error unlocking channel:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while unlocking the channel.')], ephemeral: true });
        }
    }
};
