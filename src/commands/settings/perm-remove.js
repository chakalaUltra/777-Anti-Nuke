const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

module.exports = {
    name: 'perm-remove',
    description: 'Remove command permission from a role',
    usage: '?perm-remove <role> <command|*|all>',
    aliases: ['permremove', 'removeperm'],
    data: new SlashCommandBuilder()
        .setName('perm-remove')
        .setDescription('Remove command permission from a role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to remove permission from')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command name, * for all, or "all" to remove all permissions')
                .setRequired(true)),

    async execute(message, args, client, guildData) {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        
        if (!role) {
            return message.reply({ embeds: [errorEmbed('Please mention a role or provide a valid role ID.')] });
        }
        
        const commandName = args[1]?.toLowerCase();
        
        if (!commandName) {
            return message.reply({ embeds: [errorEmbed('Please provide a command name, `*`, or `all` to remove all permissions.')] });
        }
        
        try {
            const existingPerm = guildData.rolePermissions.find(rp => rp.roleId === role.id);
            
            if (!existingPerm) {
                return message.reply({ embeds: [errorEmbed('This role has no custom permissions.')] });
            }
            
            if (commandName === 'all') {
                await Guild.updateOne(
                    { guildId: message.guild.id },
                    { $pull: { rolePermissions: { roleId: role.id } } }
                );
                
                return message.reply({ embeds: [successEmbed(`Removed all permissions from ${role}.`)] });
            }
            
            if (!existingPerm.commands.includes(commandName)) {
                return message.reply({ embeds: [errorEmbed(`Role does not have permission for \`${commandName}\`.`)] });
            }
            
            if (existingPerm.commands.length === 1) {
                await Guild.updateOne(
                    { guildId: message.guild.id },
                    { $pull: { rolePermissions: { roleId: role.id } } }
                );
            } else {
                await Guild.updateOne(
                    { guildId: message.guild.id, 'rolePermissions.roleId': role.id },
                    { $pull: { 'rolePermissions.$.commands': commandName } }
                );
            }
            
            const permText = commandName === '*' ? 'all commands' : `command \`${commandName}\``;
            return message.reply({ embeds: [successEmbed(`Removed ${permText} permission from ${role}.`)] });
        } catch (error) {
            console.error('Error removing permission:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while removing the permission.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const role = interaction.options.getRole('role');
        const commandName = interaction.options.getString('command').toLowerCase();
        
        try {
            const existingPerm = guildData.rolePermissions.find(rp => rp.roleId === role.id);
            
            if (!existingPerm) {
                return interaction.reply({ embeds: [errorEmbed('This role has no custom permissions.')], ephemeral: true });
            }
            
            if (commandName === 'all') {
                await Guild.updateOne(
                    { guildId: interaction.guild.id },
                    { $pull: { rolePermissions: { roleId: role.id } } }
                );
                
                return interaction.reply({ embeds: [successEmbed(`Removed all permissions from ${role}.`)] });
            }
            
            if (!existingPerm.commands.includes(commandName)) {
                return interaction.reply({ embeds: [errorEmbed(`Role does not have permission for \`${commandName}\`.`)], ephemeral: true });
            }
            
            if (existingPerm.commands.length === 1) {
                await Guild.updateOne(
                    { guildId: interaction.guild.id },
                    { $pull: { rolePermissions: { roleId: role.id } } }
                );
            } else {
                await Guild.updateOne(
                    { guildId: interaction.guild.id, 'rolePermissions.roleId': role.id },
                    { $pull: { 'rolePermissions.$.commands': commandName } }
                );
            }
            
            const permText = commandName === '*' ? 'all commands' : `command \`${commandName}\``;
            return interaction.reply({ embeds: [successEmbed(`Removed ${permText} permission from ${role}.`)] });
        } catch (error) {
            console.error('Error removing permission:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while removing the permission.')], ephemeral: true });
        }
    }
};
