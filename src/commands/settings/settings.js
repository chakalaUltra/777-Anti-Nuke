const { createEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');

module.exports = {
    name: 'settings',
    description: 'View all bot settings for this server',
    usage: '?settings',
    aliases: ['config', 'configuration'],
    async execute(message, args, client, guildData) {
        const antiNukeStatus = guildData.antiNuke.enabled ? config.emojis.turned_on : config.emojis.turned_off;
        const autoModStatus = guildData.autoMod.enabled ? config.emojis.turned_on : config.emojis.turned_off;
        
        const embed = createEmbed({
            title: `${config.emojis.configure_settings} Server Settings`,
            color: config.colors.info,
            timestamp: true,
            fields: [
                { 
                    name: `${config.emojis.info} General`, 
                    value: `**Prefix:** \`${guildData.prefix}\`\n**Muted Role:** ${guildData.mutedRoleId ? `<@&${guildData.mutedRoleId}>` : 'Not set'}`, 
                    inline: false 
                },
                { 
                    name: `${config.emojis.alarm} Anti-Nuke`, 
                    value: `**Status:** ${antiNukeStatus}\n**Whitelisted Users:** ${guildData.antiNuke.whitelistedUsers.length}\n**Whitelisted Bots:** ${guildData.antiNuke.whitelistedBots.length}\n**Blacklisted Users:** ${guildData.antiNuke.blacklistedUsers.length}\n**Blacklisted Bots:** ${guildData.antiNuke.blacklistedBots.length}`, 
                    inline: true 
                },
                { 
                    name: `${config.emojis.important} AutoMod`, 
                    value: `**Status:** ${autoModStatus}\n**Blocked Words:** ${guildData.autoMod.blockedWords.length}`, 
                    inline: true 
                },
                { 
                    name: `${config.emojis.notification} Log Channels`, 
                    value: `**Moderation:** ${guildData.logs.moderation ? `<#${guildData.logs.moderation}>` : 'Not set'}\n**Deleted Messages:** ${guildData.logs.deletedMessages ? `<#${guildData.logs.deletedMessages}>` : 'Not set'}\n**Edited Messages:** ${guildData.logs.editedMessages ? `<#${guildData.logs.editedMessages}>` : 'Not set'}\n**Anti-Nuke:** ${guildData.logs.antiNuke ? `<#${guildData.logs.antiNuke}>` : 'Not set'}\n**AutoMod:** ${guildData.logs.autoMod ? `<#${guildData.logs.autoMod}>` : 'Not set'}`, 
                    inline: false 
                },
                { 
                    name: `${config.emojis.user_member} Role Permissions`, 
                    value: guildData.rolePermissions.length > 0 
                        ? guildData.rolePermissions.map(rp => `<@&${rp.roleId}>: ${rp.commands.length} commands`).join('\n')
                        : 'No custom role permissions set', 
                    inline: false 
                }
            ],
            footer: { text: `Requested by ${message.author.tag}` }
        });
        
        return message.reply({ embeds: [embed] });
    }
};
