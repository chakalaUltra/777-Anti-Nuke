const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

module.exports = {
    name: 'perm-add',
    description: 'Add command permission to a role',
    usage: '?perm-add <role> <command|*>',
    aliases: ['permadd', 'addperm'],
    data: new SlashCommandBuilder()
        .setName('perm-add')
        .setDescription('Add command permission to a role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to give permission to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command name or * for all commands')
                .setRequired(true)),

    async execute(message, args, client, guildData) {
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
        
        if (!role) {
            return message.reply({ embeds: [errorEmbed('Please mention a role or provide a valid role ID.')] });
        }
        
        const commandName = args[1]?.toLowerCase();
        
        if (!commandName) {
            return message.reply({ embeds: [errorEmbed('Please provide a command name or `*` for all commands.')] });
        }
        
        if (commandName !== '*' && !client.commands.has(commandName)) {
            return message.reply({ embeds: [errorEmbed(`Command \`${commandName}\` does not exist.`)] });
        }
        
        try {
            const existingPerm = guildData.rolePermissions.find(rp => rp.roleId === role.id);
            
            if (existingPerm) {
                if (existingPerm.commands.includes(commandName)) {
                    return message.reply({ embeds: [errorEmbed(`Role already has permission for \`${commandName}\`.`)] });
                }
                
                await Guild.updateOne(
                    { guildId: message.guild.id, 'rolePermissions.roleId': role.id },
                    { $push: { 'rolePermissions.$.commands': commandName } }
                );
            } else {
                await Guild.updateOne(
                    { guildId: message.guild.id },
                    { $push: { rolePermissions: { roleId: role.id, commands: [commandName] } } }
                );
            }
            
            const permText = commandName === '*' ? 'all commands' : `command \`${commandName}\``;
            return message.reply({ embeds: [successEmbed(`Added ${permText} permission to ${role}.`)] });
        } catch (error) {
            console.error('Error adding permission:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while adding the permission.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const role = interaction.options.getRole('role');
        const commandName = interaction.options.getString('command').toLowerCase();
        
        if (commandName !== '*' && !client.commands.has(commandName)) {
            return interaction.reply({ embeds: [errorEmbed(`Command \`${commandName}\` does not exist.`)], ephemeral: true });
        }
        
        try {
            const existingPerm = guildData.rolePermissions.find(rp => rp.roleId === role.id);
            
            if (existingPerm) {
                if (existingPerm.commands.includes(commandName)) {
                    return interaction.reply({ embeds: [errorEmbed(`Role already has permission for \`${commandName}\`.`)], ephemeral: true });
                }
                
                await Guild.updateOne(
                    { guildId: interaction.guild.id, 'rolePermissions.roleId': role.id },
                    { $push: { 'rolePermissions.$.commands': commandName } }
                );
            } else {
                await Guild.updateOne(
                    { guildId: interaction.guild.id },
                    { $push: { rolePermissions: { roleId: role.id, commands: [commandName] } } }
                );
            }
            
            const permText = commandName === '*' ? 'all commands' : `command \`${commandName}\``;
            return interaction.reply({ embeds: [successEmbed(`Added ${permText} permission to ${role}.`)] });
        } catch (error) {
            console.error('Error adding permission:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while adding the permission.')], ephemeral: true });
        }
    }
};
