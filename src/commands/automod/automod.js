const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    name: 'automod',
    description: 'View or toggle automod',
    usage: '?automod [on/off]',
    aliases: ['am'],
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('View or toggle automod')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Enable or disable automod')
                .setRequired(false)
                .addChoices(
                    { name: 'Enable', value: 'on' },
                    { name: 'Disable', value: 'off' }
                )),

    async execute(message, args, client, guildData) {
        const option = args[0]?.toLowerCase();
        
        if (!option) {
            const status = guildData.autoMod.enabled ? config.emojis.turned_on : config.emojis.turned_off;
            const blockedWords = guildData.autoMod.blockedWords.length;
            
            const embed = createEmbed({
                title: `${config.emojis.configure_settings} AutoMod Settings`,
                description: `**Status:** ${status} ${guildData.autoMod.enabled ? 'Enabled' : 'Disabled'}`,
                color: config.colors.info,
                timestamp: true,
                fields: [
                    { name: `${config.emojis.x_} Blocked Words`, value: `${blockedWords} words`, inline: true },
                    { name: `${config.emojis.notification} Log Channel`, value: guildData.logs.autoMod ? `<#${guildData.logs.autoMod}>` : 'Not set', inline: true }
                ]
            });
            
            return message.reply({ embeds: [embed] });
        }
        
        if (option === 'on' || option === 'enable') {
            await Guild.updateOne(
                { guildId: message.guild.id },
                { 'autoMod.enabled': true }
            );
            
            return message.reply({ embeds: [successEmbed('AutoMod has been **enabled**.', 'AutoMod Enabled')] });
        }
        
        if (option === 'off' || option === 'disable') {
            await Guild.updateOne(
                { guildId: message.guild.id },
                { 'autoMod.enabled': false }
            );
            
            return message.reply({ embeds: [successEmbed('AutoMod has been **disabled**.', 'AutoMod Disabled')] });
        }
        
        return message.reply({ embeds: [errorEmbed('Invalid option. Use `on` or `off`.')] });
    },

    async executeSlash(interaction, client, guildData) {
        const option = interaction.options.getString('action');
        
        if (!option) {
            const status = guildData.autoMod.enabled ? config.emojis.turned_on : config.emojis.turned_off;
            const blockedWords = guildData.autoMod.blockedWords.length;
            
            const embed = createEmbed({
                title: `${config.emojis.configure_settings} AutoMod Settings`,
                description: `**Status:** ${status} ${guildData.autoMod.enabled ? 'Enabled' : 'Disabled'}`,
                color: config.colors.info,
                timestamp: true,
                fields: [
                    { name: `${config.emojis.x_} Blocked Words`, value: `${blockedWords} words`, inline: true },
                    { name: `${config.emojis.notification} Log Channel`, value: guildData.logs.autoMod ? `<#${guildData.logs.autoMod}>` : 'Not set', inline: true }
                ]
            });
            
            return interaction.reply({ embeds: [embed] });
        }
        
        if (option === 'on') {
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { 'autoMod.enabled': true }
            );
            
            return interaction.reply({ embeds: [successEmbed('AutoMod has been **enabled**.', 'AutoMod Enabled')] });
        }
        
        if (option === 'off') {
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { 'autoMod.enabled': false }
            );
            
            return interaction.reply({ embeds: [successEmbed('AutoMod has been **disabled**.', 'AutoMod Disabled')] });
        }
    }
};
