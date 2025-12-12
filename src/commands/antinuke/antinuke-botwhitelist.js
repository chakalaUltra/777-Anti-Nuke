const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    name: 'antinuke-botwhitelist',
    description: 'Manage anti-nuke bot whitelist',
    usage: '?antinuke-botwhitelist <add/remove/list> [botId]',
    aliases: ['an-botwl', 'anbotwl'],
    data: new SlashCommandBuilder()
        .setName('antinuke-botwhitelist')
        .setDescription('Manage anti-nuke bot whitelist')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Add a bot to the whitelist')
                .addStringOption(option =>
                    option.setName('botid')
                        .setDescription('The bot ID to whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Remove a bot from the whitelist')
                .addStringOption(option =>
                    option.setName('botid')
                        .setDescription('The bot ID to remove from whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('View all whitelisted bots')),

    async execute(message, args, client, guildData) {
        const action = args[0]?.toLowerCase();
        
        if (!action || !['add', 'remove', 'list'].includes(action)) {
            return message.reply({ embeds: [errorEmbed('Usage: `?antinuke-botwhitelist <add/remove/list> [botId]`')] });
        }
        
        if (action === 'list') {
            const whitelisted = guildData.antiNuke.whitelistedBots;
            
            if (whitelisted.length === 0) {
                return message.reply({ embeds: [createEmbed({
                    title: `${config.emojis.note} Whitelisted Bots`,
                    description: 'No bots are whitelisted.',
                    color: config.colors.info
                })] });
            }
            
            const botList = await Promise.all(whitelisted.map(async (id) => {
                const user = await client.users.fetch(id).catch(() => null);
                return user ? `${user.tag} (${id})` : `Unknown Bot (${id})`;
            }));
            
            return message.reply({ embeds: [createEmbed({
                title: `${config.emojis.document_approved} Whitelisted Bots`,
                description: botList.join('\n'),
                color: config.colors.info,
                timestamp: true
            })] });
        }
        
        const botId = message.mentions.users.first()?.id || args[1];
        
        if (!botId) {
            return message.reply({ embeds: [errorEmbed('Please mention a bot or provide a valid bot ID.')] });
        }
        
        const bot = await client.users.fetch(botId).catch(() => null);
        
        if (action === 'add') {
            if (guildData.antiNuke.whitelistedBots.includes(botId)) {
                return message.reply({ embeds: [errorEmbed('This bot is already whitelisted.')] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $push: { 'antiNuke.whitelistedBots': botId } }
            );
            
            return message.reply({ embeds: [successEmbed(`${bot?.tag || botId} has been added to the bot whitelist.`)] });
        }
        
        if (action === 'remove') {
            if (!guildData.antiNuke.whitelistedBots.includes(botId)) {
                return message.reply({ embeds: [errorEmbed('This bot is not whitelisted.')] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $pull: { 'antiNuke.whitelistedBots': botId } }
            );
            
            return message.reply({ embeds: [successEmbed(`${bot?.tag || botId} has been removed from the bot whitelist.`)] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const action = interaction.options.getSubcommand();
        
        if (action === 'list') {
            const whitelisted = guildData.antiNuke.whitelistedBots;
            
            if (whitelisted.length === 0) {
                return interaction.reply({ embeds: [createEmbed({
                    title: `${config.emojis.note} Whitelisted Bots`,
                    description: 'No bots are whitelisted.',
                    color: config.colors.info
                })] });
            }
            
            const botList = await Promise.all(whitelisted.map(async (id) => {
                const user = await client.users.fetch(id).catch(() => null);
                return user ? `${user.tag} (${id})` : `Unknown Bot (${id})`;
            }));
            
            return interaction.reply({ embeds: [createEmbed({
                title: `${config.emojis.document_approved} Whitelisted Bots`,
                description: botList.join('\n'),
                color: config.colors.info,
                timestamp: true
            })] });
        }
        
        const botId = interaction.options.getString('botid');
        const bot = await client.users.fetch(botId).catch(() => null);
        
        if (action === 'add') {
            if (guildData.antiNuke.whitelistedBots.includes(botId)) {
                return interaction.reply({ embeds: [errorEmbed('This bot is already whitelisted.')], ephemeral: true });
            }
            
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { $push: { 'antiNuke.whitelistedBots': botId } }
            );
            
            return interaction.reply({ embeds: [successEmbed(`${bot?.tag || botId} has been added to the bot whitelist.`)] });
        }
        
        if (action === 'remove') {
            if (!guildData.antiNuke.whitelistedBots.includes(botId)) {
                return interaction.reply({ embeds: [errorEmbed('This bot is not whitelisted.')], ephemeral: true });
            }
            
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { $pull: { 'antiNuke.whitelistedBots': botId } }
            );
            
            return interaction.reply({ embeds: [successEmbed(`${bot?.tag || botId} has been removed from the bot whitelist.`)] });
        }
    }
};
