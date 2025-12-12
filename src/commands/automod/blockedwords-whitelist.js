const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    name: 'blockedwords-whitelist',
    description: 'Manage users/roles exempt from blocked words filter',
    usage: '?blockedwords-whitelist <add/remove/list> <user/role>',
    aliases: ['bw-whitelist', 'automod-whitelist'],
    data: new SlashCommandBuilder()
        .setName('blockedwords-whitelist')
        .setDescription('Manage users/roles exempt from blocked words filter')
        .addSubcommand(subcommand =>
            subcommand.setName('add-user')
                .setDescription('Add a user to the whitelist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove-user')
                .setDescription('Remove a user from the whitelist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('add-role')
                .setDescription('Add a role to the whitelist')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to whitelist')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove-role')
                .setDescription('Remove a role from the whitelist')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('View all whitelisted users and roles')),

    async execute(message, args, client, guildData) {
        const action = args[0]?.toLowerCase();
        
        if (!action || !['add', 'remove', 'list'].includes(action)) {
            return message.reply({ embeds: [errorEmbed('Usage: `?blockedwords-whitelist <add/remove/list> [@user/@role]`')] });
        }
        
        if (action === 'list') {
            const whitelistedUsers = guildData.autoMod.whitelistedUsers || [];
            const whitelistedRoles = guildData.autoMod.whitelistedRoles || [];
            
            if (whitelistedUsers.length === 0 && whitelistedRoles.length === 0) {
                return message.reply({ embeds: [createEmbed({
                    title: `${config.emojis.note} Blocked Words Whitelist`,
                    description: 'No users or roles are whitelisted.',
                    color: config.colors.info
                })] });
            }
            
            const userList = whitelistedUsers.length > 0 
                ? whitelistedUsers.map(id => `<@${id}>`).join(', ')
                : 'None';
            const roleList = whitelistedRoles.length > 0
                ? whitelistedRoles.map(id => `<@&${id}>`).join(', ')
                : 'None';
            
            return message.reply({ embeds: [createEmbed({
                title: `${config.emojis.approved} Blocked Words Whitelist`,
                fields: [
                    { name: 'Users', value: userList, inline: false },
                    { name: 'Roles', value: roleList, inline: false }
                ],
                color: config.colors.success
            })] });
        }
        
        const target = message.mentions.users.first() || message.mentions.roles.first();
        const isRole = message.mentions.roles.size > 0;
        
        if (!target) {
            return message.reply({ embeds: [errorEmbed('Please mention a user or role.')] });
        }
        
        const targetId = target.id;
        const field = isRole ? 'autoMod.whitelistedRoles' : 'autoMod.whitelistedUsers';
        const currentList = isRole 
            ? (guildData.autoMod.whitelistedRoles || [])
            : (guildData.autoMod.whitelistedUsers || []);
        
        if (action === 'add') {
            if (currentList.includes(targetId)) {
                return message.reply({ embeds: [errorEmbed(`${isRole ? 'Role' : 'User'} is already whitelisted.`)] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $push: { [field]: targetId } }
            );
            
            return message.reply({ embeds: [successEmbed(`${isRole ? `<@&${targetId}>` : `<@${targetId}>`} has been added to the blocked words whitelist.`)] });
        }
        
        if (action === 'remove') {
            if (!currentList.includes(targetId)) {
                return message.reply({ embeds: [errorEmbed(`${isRole ? 'Role' : 'User'} is not whitelisted.`)] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $pull: { [field]: targetId } }
            );
            
            return message.reply({ embeds: [successEmbed(`${isRole ? `<@&${targetId}>` : `<@${targetId}>`} has been removed from the blocked words whitelist.`)] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const action = interaction.options.getSubcommand();
        
        if (action === 'list') {
            const whitelistedUsers = guildData.autoMod.whitelistedUsers || [];
            const whitelistedRoles = guildData.autoMod.whitelistedRoles || [];
            
            if (whitelistedUsers.length === 0 && whitelistedRoles.length === 0) {
                return interaction.reply({ embeds: [createEmbed({
                    title: `${config.emojis.note} Blocked Words Whitelist`,
                    description: 'No users or roles are whitelisted.',
                    color: config.colors.info
                })] });
            }
            
            const userList = whitelistedUsers.length > 0 
                ? whitelistedUsers.map(id => `<@${id}>`).join(', ')
                : 'None';
            const roleList = whitelistedRoles.length > 0
                ? whitelistedRoles.map(id => `<@&${id}>`).join(', ')
                : 'None';
            
            return interaction.reply({ embeds: [createEmbed({
                title: `${config.emojis.approved} Blocked Words Whitelist`,
                fields: [
                    { name: 'Users', value: userList, inline: false },
                    { name: 'Roles', value: roleList, inline: false }
                ],
                color: config.colors.success
            })] });
        }
        
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const isRole = action.includes('role');
        const target = isRole ? role : user;
        
        const targetId = target.id;
        const field = isRole ? 'autoMod.whitelistedRoles' : 'autoMod.whitelistedUsers';
        const currentList = isRole 
            ? (guildData.autoMod.whitelistedRoles || [])
            : (guildData.autoMod.whitelistedUsers || []);
        
        if (action.includes('add')) {
            if (currentList.includes(targetId)) {
                return interaction.reply({ embeds: [errorEmbed(`${isRole ? 'Role' : 'User'} is already whitelisted.`)], ephemeral: true });
            }
            
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { $push: { [field]: targetId } }
            );
            
            return interaction.reply({ embeds: [successEmbed(`${isRole ? `<@&${targetId}>` : `<@${targetId}>`} has been added to the blocked words whitelist.`)] });
        }
        
        if (action.includes('remove')) {
            if (!currentList.includes(targetId)) {
                return interaction.reply({ embeds: [errorEmbed(`${isRole ? 'Role' : 'User'} is not whitelisted.`)], ephemeral: true });
            }
            
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { $pull: { [field]: targetId } }
            );
            
            return interaction.reply({ embeds: [successEmbed(`${isRole ? `<@&${targetId}>` : `<@${targetId}>`} has been removed from the blocked words whitelist.`)] });
        }
    }
};
