const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

const CATEGORIES = ['bans', 'kicks', 'roles', 'channels', 'webhooks', 'emojis', 'all'];

function initializeCategoryWhitelist(guildData) {
    if (!guildData.antiNuke.categoryWhitelist) {
        guildData.antiNuke.categoryWhitelist = {};
    }
    for (const cat of CATEGORIES) {
        if (!guildData.antiNuke.categoryWhitelist[cat]) {
            guildData.antiNuke.categoryWhitelist[cat] = { users: [], roles: [] };
        }
    }
    return guildData;
}

module.exports = {
    name: 'antinuke-whitelist',
    description: 'Manage anti-nuke whitelist for users and roles by category',
    usage: '?antinuke-whitelist <add/remove/list> <category> [user/role]',
    aliases: ['an-wl', 'anwl'],
    data: new SlashCommandBuilder()
        .setName('antinuke-whitelist')
        .setDescription('Manage anti-nuke whitelist for users and roles by category')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Add a user or role to the whitelist for a specific category')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('The category to whitelist for')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Bans', value: 'bans' },
                            { name: 'Kicks', value: 'kicks' },
                            { name: 'Roles', value: 'roles' },
                            { name: 'Channels', value: 'channels' },
                            { name: 'Webhooks', value: 'webhooks' },
                            { name: 'Emojis', value: 'emojis' },
                            { name: 'All Categories', value: 'all' }
                        ))
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to whitelist')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to whitelist')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Remove a user or role from the whitelist for a specific category')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('The category to remove from whitelist')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Bans', value: 'bans' },
                            { name: 'Kicks', value: 'kicks' },
                            { name: 'Roles', value: 'roles' },
                            { name: 'Channels', value: 'channels' },
                            { name: 'Webhooks', value: 'webhooks' },
                            { name: 'Emojis', value: 'emojis' },
                            { name: 'All Categories', value: 'all' }
                        ))
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from whitelist')
                        .setRequired(false))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove from whitelist')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('View all whitelisted users and roles')
                .addStringOption(option =>
                    option.setName('category')
                        .setDescription('The category to view (leave empty for all)')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Bans', value: 'bans' },
                            { name: 'Kicks', value: 'kicks' },
                            { name: 'Roles', value: 'roles' },
                            { name: 'Channels', value: 'channels' },
                            { name: 'Webhooks', value: 'webhooks' },
                            { name: 'Emojis', value: 'emojis' },
                            { name: 'All Categories', value: 'all' }
                        ))),

    async execute(message, args, client, guildData) {
        const action = args[0]?.toLowerCase();
        
        if (!action || !['add', 'remove', 'list'].includes(action)) {
            return message.reply({ embeds: [errorEmbed('Usage: `?antinuke-whitelist <add/remove/list> <category> [user/role]`\nCategories: bans, kicks, roles, channels, webhooks, emojis, all')] });
        }

        guildData = initializeCategoryWhitelist(guildData);
        
        if (action === 'list') {
            const category = args[1]?.toLowerCase();
            const categoriesToShow = category && CATEGORIES.includes(category) ? [category] : CATEGORIES;
            
            const fields = [];
            for (const cat of categoriesToShow) {
                const catData = guildData.antiNuke.categoryWhitelist[cat] || { users: [], roles: [] };
                const users = catData.users || [];
                const roles = catData.roles || [];
                
                if (users.length > 0 || roles.length > 0) {
                    const userList = users.length > 0 ? users.map(id => `<@${id}>`).join(', ') : 'None';
                    const roleList = roles.length > 0 ? roles.map(id => `<@&${id}>`).join(', ') : 'None';
                    fields.push({
                        name: `${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
                        value: `**Users:** ${userList}\n**Roles:** ${roleList}`,
                        inline: false
                    });
                }
            }
            
            if (fields.length === 0) {
                return message.reply({ embeds: [createEmbed({
                    title: `${config.emojis.note} Anti-Nuke Whitelist`,
                    description: 'No users or roles are whitelisted.',
                    color: config.colors.info
                })] });
            }
            
            return message.reply({ embeds: [createEmbed({
                title: `${config.emojis.document_approved} Anti-Nuke Whitelist`,
                fields: fields,
                color: config.colors.info,
                timestamp: true
            })] });
        }
        
        const category = args[1]?.toLowerCase();
        if (!category || !CATEGORIES.includes(category)) {
            return message.reply({ embeds: [errorEmbed(`Please specify a valid category: ${CATEGORIES.join(', ')}`)] });
        }
        
        const mentionedUser = message.mentions.users.first();
        const mentionedRole = message.mentions.roles.first();
        const targetId = args[2];
        
        let target = null;
        let isRole = false;
        
        if (mentionedRole) {
            target = mentionedRole;
            isRole = true;
        } else if (mentionedUser) {
            target = mentionedUser;
            isRole = false;
        } else if (targetId) {
            const role = message.guild.roles.cache.get(targetId);
            if (role) {
                target = role;
                isRole = true;
            } else {
                const user = await client.users.fetch(targetId).catch(() => null);
                if (user) {
                    target = user;
                    isRole = false;
                }
            }
        }
        
        if (!target) {
            return message.reply({ embeds: [errorEmbed('Please mention a user or role, or provide a valid ID.')] });
        }
        
        const field = isRole 
            ? `antiNuke.categoryWhitelist.${category}.roles` 
            : `antiNuke.categoryWhitelist.${category}.users`;
        const currentList = isRole 
            ? (guildData.antiNuke.categoryWhitelist[category]?.roles || [])
            : (guildData.antiNuke.categoryWhitelist[category]?.users || []);
        
        const targetName = isRole ? target.name : target.tag;
        const targetMention = isRole ? `<@&${target.id}>` : `<@${target.id}>`;
        
        if (action === 'add') {
            if (currentList.includes(target.id)) {
                return message.reply({ embeds: [errorEmbed(`This ${isRole ? 'role' : 'user'} is already whitelisted for ${category}.`)] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $push: { [field]: target.id } }
            );
            
            return message.reply({ embeds: [successEmbed(`${targetMention} has been added to the anti-nuke whitelist for **${category}**.`)] });
        }
        
        if (action === 'remove') {
            if (!currentList.includes(target.id)) {
                return message.reply({ embeds: [errorEmbed(`This ${isRole ? 'role' : 'user'} is not whitelisted for ${category}.`)] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $pull: { [field]: target.id } }
            );
            
            return message.reply({ embeds: [successEmbed(`${targetMention} has been removed from the anti-nuke whitelist for **${category}**.`)] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const action = interaction.options.getSubcommand();
        
        guildData = initializeCategoryWhitelist(guildData);
        
        if (action === 'list') {
            const category = interaction.options.getString('category');
            const categoriesToShow = category ? [category] : CATEGORIES;
            
            const fields = [];
            for (const cat of categoriesToShow) {
                const catData = guildData.antiNuke.categoryWhitelist[cat] || { users: [], roles: [] };
                const users = catData.users || [];
                const roles = catData.roles || [];
                
                if (users.length > 0 || roles.length > 0) {
                    const userList = users.length > 0 ? users.map(id => `<@${id}>`).join(', ') : 'None';
                    const roleList = roles.length > 0 ? roles.map(id => `<@&${id}>`).join(', ') : 'None';
                    fields.push({
                        name: `${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
                        value: `**Users:** ${userList}\n**Roles:** ${roleList}`,
                        inline: false
                    });
                }
            }
            
            if (fields.length === 0) {
                return interaction.reply({ embeds: [createEmbed({
                    title: `${config.emojis.note} Anti-Nuke Whitelist`,
                    description: 'No users or roles are whitelisted.',
                    color: config.colors.info
                })] });
            }
            
            return interaction.reply({ embeds: [createEmbed({
                title: `${config.emojis.document_approved} Anti-Nuke Whitelist`,
                fields: fields,
                color: config.colors.info,
                timestamp: true
            })] });
        }
        
        const category = interaction.options.getString('category');
        const targetUser = interaction.options.getUser('user');
        const targetRole = interaction.options.getRole('role');
        
        if (!targetUser && !targetRole) {
            return interaction.reply({ embeds: [errorEmbed('Please specify a user or role to whitelist.')], ephemeral: true });
        }
        
        const target = targetRole || targetUser;
        const isRole = !!targetRole;
        
        const field = isRole 
            ? `antiNuke.categoryWhitelist.${category}.roles` 
            : `antiNuke.categoryWhitelist.${category}.users`;
        const currentList = isRole 
            ? (guildData.antiNuke.categoryWhitelist[category]?.roles || [])
            : (guildData.antiNuke.categoryWhitelist[category]?.users || []);
        
        const targetMention = isRole ? `<@&${target.id}>` : `<@${target.id}>`;
        
        if (action === 'add') {
            if (currentList.includes(target.id)) {
                return interaction.reply({ embeds: [errorEmbed(`This ${isRole ? 'role' : 'user'} is already whitelisted for ${category}.`)], ephemeral: true });
            }
            
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { $push: { [field]: target.id } }
            );
            
            return interaction.reply({ embeds: [successEmbed(`${targetMention} has been added to the anti-nuke whitelist for **${category}**.`)] });
        }
        
        if (action === 'remove') {
            if (!currentList.includes(target.id)) {
                return interaction.reply({ embeds: [errorEmbed(`This ${isRole ? 'role' : 'user'} is not whitelisted for ${category}.`)], ephemeral: true });
            }
            
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { $pull: { [field]: target.id } }
            );
            
            return interaction.reply({ embeds: [successEmbed(`${targetMention} has been removed from the anti-nuke whitelist for **${category}**.`)] });
        }
    }
};
