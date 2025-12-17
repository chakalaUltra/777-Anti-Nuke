const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, errorEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');

module.exports = {
    name: 'perm-list',
    description: 'View all command permissions for roles',
    usage: '?perm-list [role]',
    aliases: ['permlist', 'perms', 'permissions'],
    data: new SlashCommandBuilder()
        .setName('perm-list')
        .setDescription('View all command permissions for roles')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('View permissions for a specific role')
                .setRequired(false)),

    async execute(message, args, client, guildData) {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        
        if (role) {
            return this.showRolePermissions(message, role, guildData);
        }
        
        return this.showAllPermissions(message, guildData);
    },

    async executeSlash(interaction, client, guildData) {
        const role = interaction.options.getRole('role');
        
        if (role) {
            return this.showRolePermissions(interaction, role, guildData);
        }
        
        return this.showAllPermissions(interaction, guildData);
    },

    async showRolePermissions(context, role, guildData) {
        const isInteraction = context.isChatInputCommand?.();
        const reply = (opts) => isInteraction ? context.reply(opts) : context.reply(opts);
        
        const rolePerms = guildData.rolePermissions?.find(rp => rp.roleId === role.id);
        
        if (!rolePerms || rolePerms.commands.length === 0) {
            return reply({ embeds: [createEmbed({
                title: `${config.emojis.info} Permissions for ${role.name}`,
                description: 'This role has no custom command permissions.',
                color: config.colors.info
            })] });
        }
        
        const commandList = rolePerms.commands.map(cmd => cmd === '*' ? '**All Commands** (*)' : `\`${cmd}\``).join('\n');
        
        return reply({ embeds: [createEmbed({
            title: `${config.emojis.document_approved} Permissions for ${role.name}`,
            description: commandList,
            color: config.colors.info,
            timestamp: true
        })] });
    },

    async showAllPermissions(context, guildData) {
        const isInteraction = context.isChatInputCommand?.();
        const reply = (opts) => isInteraction ? context.reply(opts) : context.reply(opts);
        const guild = isInteraction ? context.guild : context.guild;
        
        if (!guildData.rolePermissions || guildData.rolePermissions.length === 0) {
            return reply({ embeds: [createEmbed({
                title: `${config.emojis.info} Command Permissions`,
                description: 'No custom command permissions have been set.\n\nUse `/perm-add` to assign commands to roles.',
                color: config.colors.info
            })] });
        }
        
        const fields = [];
        
        for (const rolePerm of guildData.rolePermissions) {
            const role = guild.roles.cache.get(rolePerm.roleId);
            if (!role) continue;
            
            const commands = rolePerm.commands.map(cmd => cmd === '*' ? '**All** (*)' : `\`${cmd}\``).join(', ');
            
            fields.push({
                name: role.name,
                value: commands || 'No commands',
                inline: false
            });
        }
        
        if (fields.length === 0) {
            return reply({ embeds: [createEmbed({
                title: `${config.emojis.info} Command Permissions`,
                description: 'No valid role permissions found.',
                color: config.colors.info
            })] });
        }
        
        return reply({ embeds: [createEmbed({
            title: `${config.emojis.document_approved} Command Permissions`,
            description: 'Roles with custom command permissions:',
            color: config.colors.info,
            fields: fields,
            timestamp: true
        })] });
    }
};
