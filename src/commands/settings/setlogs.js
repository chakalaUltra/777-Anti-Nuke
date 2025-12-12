const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { errorEmbed, successEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

const LOG_TYPES = ['moderation', 'deleted', 'edited', 'antinuke', 'automod'];

module.exports = {
    name: 'setlogs',
    description: 'Set log channels for different events',
    usage: '?setlogs <type> <#channel|off>',
    aliases: ['logs', 'setlog', 'logchannel'],
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('Set log channels for different events')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The type of logs to set')
                .setRequired(true)
                .addChoices(
                    { name: 'Moderation', value: 'moderation' },
                    { name: 'Deleted Messages', value: 'deleted' },
                    { name: 'Edited Messages', value: 'edited' },
                    { name: 'Anti-Nuke', value: 'antinuke' },
                    { name: 'AutoMod', value: 'automod' }
                ))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send logs to (leave empty to disable)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false)),

    async execute(message, args, client, guildData) {
        const type = args[0]?.toLowerCase();
        
        if (!type || !LOG_TYPES.includes(type)) {
            return message.reply({ embeds: [errorEmbed(`Please specify a valid log type: ${LOG_TYPES.join(', ')}`)] });
        }
        
        const channel = message.mentions.channels.first();
        const isDisabling = args[1]?.toLowerCase() === 'off' || args[1]?.toLowerCase() === 'disable';
        
        const logField = getLogField(type);
        
        try {
            if (isDisabling || !channel) {
                await Guild.findOneAndUpdate(
                    { guildId: message.guild.id },
                    { $set: { [`logs.${logField}`]: null } }
                );
                return message.reply({ embeds: [successEmbed(`${formatType(type)} logs have been disabled.`)] });
            }
            
            await Guild.findOneAndUpdate(
                { guildId: message.guild.id },
                { $set: { [`logs.${logField}`]: channel.id } }
            );
            
            return message.reply({ embeds: [successEmbed(`${formatType(type)} logs will now be sent to ${channel}.`)] });
        } catch (error) {
            console.error('Error setting logs:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while setting the log channel.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const type = interaction.options.getString('type');
        const channel = interaction.options.getChannel('channel');
        
        const logField = getLogField(type);
        
        try {
            if (!channel) {
                await Guild.findOneAndUpdate(
                    { guildId: interaction.guild.id },
                    { $set: { [`logs.${logField}`]: null } }
                );
                return interaction.reply({ embeds: [successEmbed(`${formatType(type)} logs have been disabled.`)] });
            }
            
            await Guild.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { $set: { [`logs.${logField}`]: channel.id } }
            );
            
            return interaction.reply({ embeds: [successEmbed(`${formatType(type)} logs will now be sent to ${channel}.`)] });
        } catch (error) {
            console.error('Error setting logs:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while setting the log channel.')] });
        }
    }
};

function getLogField(type) {
    switch (type) {
        case 'moderation': return 'moderation';
        case 'deleted': return 'deletedMessages';
        case 'edited': return 'editedMessages';
        case 'antinuke': return 'antiNuke';
        case 'automod': return 'autoMod';
        default: return type;
    }
}

function formatType(type) {
    switch (type) {
        case 'moderation': return 'Moderation';
        case 'deleted': return 'Deleted Messages';
        case 'edited': return 'Edited Messages';
        case 'antinuke': return 'Anti-Nuke';
        case 'automod': return 'AutoMod';
        default: return type;
    }
}
