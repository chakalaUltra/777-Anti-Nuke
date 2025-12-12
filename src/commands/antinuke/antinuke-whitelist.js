const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    name: 'antinuke-whitelist',
    description: 'Manage anti-nuke user whitelist',
    usage: '?antinuke-whitelist <add/remove/list> [user]',
    aliases: ['an-wl', 'anwl'],
    data: new SlashCommandBuilder()
        .setName('antinuke-whitelist')
        .setDescription('Manage anti-nuke user whitelist')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Add a user to the whitelist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Remove a user from the whitelist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('View all whitelisted users')),

    async execute(message, args, client, guildData) {
        const action = args[0]?.toLowerCase();
        
        if (!action || !['add', 'remove', 'list'].includes(action)) {
            return message.reply({ embeds: [errorEmbed('Usage: `?antinuke-whitelist <add/remove/list> [user]`')] });
        }
        
        if (action === 'list') {
            const whitelisted = guildData.antiNuke.whitelistedUsers;
            
            if (whitelisted.length === 0) {
                return message.reply({ embeds: [createEmbed({
                    title: `${config.emojis.note} Whitelisted Users`,
                    description: 'No users are whitelisted.',
                    color: config.colors.info
                })] });
            }
            
            const userList = await Promise.all(whitelisted.map(async (id) => {
                const user = await client.users.fetch(id).catch(() => null);
                return user ? `${user.tag} (${id})` : `Unknown (${id})`;
            }));
            
            return message.reply({ embeds: [createEmbed({
                title: `${config.emojis.document_approved} Whitelisted Users`,
                description: userList.join('\n'),
                color: config.colors.info,
                timestamp: true
            })] });
        }
        
        const target = message.mentions.users.first() || client.users.cache.get(args[1]);
        
        if (!target) {
            return message.reply({ embeds: [errorEmbed('Please mention a user or provide a valid user ID.')] });
        }
        
        if (action === 'add') {
            if (guildData.antiNuke.whitelistedUsers.includes(target.id)) {
                return message.reply({ embeds: [errorEmbed('This user is already whitelisted.')] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $push: { 'antiNuke.whitelistedUsers': target.id } }
            );
            
            return message.reply({ embeds: [successEmbed(`${target.tag} has been added to the anti-nuke whitelist.`)] });
        }
        
        if (action === 'remove') {
            if (!guildData.antiNuke.whitelistedUsers.includes(target.id)) {
                return message.reply({ embeds: [errorEmbed('This user is not whitelisted.')] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $pull: { 'antiNuke.whitelistedUsers': target.id } }
            );
            
            return message.reply({ embeds: [successEmbed(`${target.tag} has been removed from the anti-nuke whitelist.`)] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const action = interaction.options.getSubcommand();
        
        if (action === 'list') {
            const whitelisted = guildData.antiNuke.whitelistedUsers;
            
            if (whitelisted.length === 0) {
                return interaction.reply({ embeds: [createEmbed({
                    title: `${config.emojis.note} Whitelisted Users`,
                    description: 'No users are whitelisted.',
                    color: config.colors.info
                })] });
            }
            
            const userList = await Promise.all(whitelisted.map(async (id) => {
                const user = await client.users.fetch(id).catch(() => null);
                return user ? `${user.tag} (${id})` : `Unknown (${id})`;
            }));
            
            return interaction.reply({ embeds: [createEmbed({
                title: `${config.emojis.document_approved} Whitelisted Users`,
                description: userList.join('\n'),
                color: config.colors.info,
                timestamp: true
            })] });
        }
        
        const target = interaction.options.getUser('user');
        
        if (action === 'add') {
            if (guildData.antiNuke.whitelistedUsers.includes(target.id)) {
                return interaction.reply({ embeds: [errorEmbed('This user is already whitelisted.')], ephemeral: true });
            }
            
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { $push: { 'antiNuke.whitelistedUsers': target.id } }
            );
            
            return interaction.reply({ embeds: [successEmbed(`${target.tag} has been added to the anti-nuke whitelist.`)] });
        }
        
        if (action === 'remove') {
            if (!guildData.antiNuke.whitelistedUsers.includes(target.id)) {
                return interaction.reply({ embeds: [errorEmbed('This user is not whitelisted.')], ephemeral: true });
            }
            
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { $pull: { 'antiNuke.whitelistedUsers': target.id } }
            );
            
            return interaction.reply({ embeds: [successEmbed(`${target.tag} has been removed from the anti-nuke whitelist.`)] });
        }
    }
};
