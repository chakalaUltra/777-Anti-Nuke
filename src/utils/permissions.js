const Guild = require('../models/Guild');
const { PermissionFlagsBits } = require('discord.js');

async function hasCommandPermission(member, command, guildData) {
    if (member.guild.ownerId === member.id) return true;
    
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }
    
    if (guildData && guildData.rolePermissions) {
        for (const rolePerm of guildData.rolePermissions) {
            if (member.roles.cache.has(rolePerm.roleId)) {
                if (rolePerm.commands.includes(command) || rolePerm.commands.includes('*')) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

async function hasDangerousCommandPermission(member, guild) {
    if (member.guild.ownerId === member.id) return true;
    
    const botMember = guild.members.cache.get(guild.client.user.id);
    if (!botMember) return false;
    
    const botHighestRole = botMember.roles.highest.position;
    const memberHighestRole = member.roles.highest.position;
    
    return memberHighestRole > botHighestRole;
}

function isAboveTarget(executor, target) {
    if (executor.guild.ownerId === executor.id) return true;
    if (target.guild.ownerId === target.id) return false;
    
    return executor.roles.highest.position > target.roles.highest.position;
}

module.exports = {
    hasCommandPermission,
    hasDangerousCommandPermission,
    isAboveTarget
};
