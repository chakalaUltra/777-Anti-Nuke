const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    name: 'antinuke',
    description: 'View or toggle anti-nuke protection',
    usage: '?antinuke [on/off]',
    aliases: ['an'],
    data: new SlashCommandBuilder()
        .setName('antinuke')
        .setDescription('View or toggle anti-nuke protection')
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Enable or disable anti-nuke')
                .setRequired(false)
                .addChoices(
                    { name: 'Enable', value: 'on' },
                    { name: 'Disable', value: 'off' }
                )),

    async execute(message, args, client, guildData) {
        const option = args[0]?.toLowerCase();
        
        if (!option) {
            const status = guildData.antiNuke.enabled ? config.emojis.turned_on : config.emojis.turned_off;
            const whitelistedUsers = guildData.antiNuke.whitelistedUsers.length;
            const whitelistedBots = guildData.antiNuke.whitelistedBots.length;
            const blacklistedUsers = guildData.antiNuke.blacklistedUsers.length;
            const blacklistedBots = guildData.antiNuke.blacklistedBots.length;
            
            const embed = createEmbed({
                title: `${config.emojis.configure_settings} Anti-Nuke Settings`,
                description: `**Status:** ${status} ${guildData.antiNuke.enabled ? 'Enabled' : 'Disabled'}`,
                color: config.colors.info,
                timestamp: true,
                fields: [
                    { name: `${config.emojis.user_member} Whitelisted Users`, value: `${whitelistedUsers} users`, inline: true },
                    { name: `${config.emojis.approved} Whitelisted Bots`, value: `${whitelistedBots} bots`, inline: true },
                    { name: `${config.emojis.x_} Blacklisted Users`, value: `${blacklistedUsers} users`, inline: true },
                    { name: `${config.emojis.important} Blacklisted Bots`, value: `${blacklistedBots} bots`, inline: true },
                    { name: `${config.emojis.notification} Log Channel`, value: guildData.logs.antiNuke ? `<#${guildData.logs.antiNuke}>` : 'Not set', inline: true },
                    { name: `${config.emojis.info} Punishment`, value: guildData.antiNuke.punishmentType || 'ban', inline: true }
                ]
            });
            
            return message.reply({ embeds: [embed] });
        }
        
        if (option === 'on' || option === 'enable') {
            await Guild.updateOne(
                { guildId: message.guild.id },
                { 'antiNuke.enabled': true }
            );
            
            return message.reply({ embeds: [successEmbed('Anti-Nuke protection has been **enabled**.', 'Anti-Nuke Enabled')] });
        }
        
        if (option === 'off' || option === 'disable') {
            await Guild.updateOne(
                { guildId: message.guild.id },
                { 'antiNuke.enabled': false }
            );
            
            return message.reply({ embeds: [successEmbed('Anti-Nuke protection has been **disabled**.', 'Anti-Nuke Disabled')] });
        }
        
        return message.reply({ embeds: [errorEmbed('Invalid option. Use `on` or `off`.')] });
    },

    async executeSlash(interaction, client, guildData) {
        const option = interaction.options.getString('action');
        
        if (!option) {
            const status = guildData.antiNuke.enabled ? config.emojis.turned_on : config.emojis.turned_off;
            const whitelistedUsers = guildData.antiNuke.whitelistedUsers.length;
            const whitelistedBots = guildData.antiNuke.whitelistedBots.length;
            const blacklistedUsers = guildData.antiNuke.blacklistedUsers.length;
            const blacklistedBots = guildData.antiNuke.blacklistedBots.length;
            
            const embed = createEmbed({
                title: `${config.emojis.configure_settings} Anti-Nuke Settings`,
                description: `**Status:** ${status} ${guildData.antiNuke.enabled ? 'Enabled' : 'Disabled'}`,
                color: config.colors.info,
                timestamp: true,
                fields: [
                    { name: `${config.emojis.user_member} Whitelisted Users`, value: `${whitelistedUsers} users`, inline: true },
                    { name: `${config.emojis.approved} Whitelisted Bots`, value: `${whitelistedBots} bots`, inline: true },
                    { name: `${config.emojis.x_} Blacklisted Users`, value: `${blacklistedUsers} users`, inline: true },
                    { name: `${config.emojis.important} Blacklisted Bots`, value: `${blacklistedBots} bots`, inline: true },
                    { name: `${config.emojis.notification} Log Channel`, value: guildData.logs.antiNuke ? `<#${guildData.logs.antiNuke}>` : 'Not set', inline: true },
                    { name: `${config.emojis.info} Punishment`, value: guildData.antiNuke.punishmentType || 'ban', inline: true }
                ]
            });
            
            return interaction.reply({ embeds: [embed] });
        }
        
        if (option === 'on') {
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { 'antiNuke.enabled': true }
            );
            
            return interaction.reply({ embeds: [successEmbed('Anti-Nuke protection has been **enabled**.', 'Anti-Nuke Enabled')] });
        }
        
        if (option === 'off') {
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { 'antiNuke.enabled': false }
            );
            
            return interaction.reply({ embeds: [successEmbed('Anti-Nuke protection has been **disabled**.', 'Anti-Nuke Disabled')] });
        }
    }
};
