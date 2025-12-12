const { successEmbed, errorEmbed, createEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    name: 'perm-add',
    description: 'Add command permission to a role',
    usage: '?perm-add <role> <command|*>',
    aliases: ['permadd', 'addperm'],
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
    }
};
