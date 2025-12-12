const Guild = require('../models/Guild');
const Mute = require('../models/Mute');
const { antiNukeEmbed } = require('../utils/embedBuilder');
const config = require('../config');

async function getOrCreateBlacklistRole(guild) {
    const guildData = await Guild.findOne({ guildId: guild.id });
    
    if (guildData?.blacklistRoleId) {
        const existingRole = guild.roles.cache.get(guildData.blacklistRoleId);
        if (existingRole) return existingRole;
    }
    
    let blacklistRole = guild.roles.cache.find(r => r.name === 'Blacklisted');
    
    if (!blacklistRole) {
        try {
            blacklistRole = await guild.roles.create({
                name: 'Blacklisted',
                color: '#000000',
                permissions: [],
                reason: '[Anti-Nuke] Created quarantine role'
            });
            
            const channels = guild.channels.cache;
            for (const [, channel] of channels) {
                try {
                    await channel.permissionOverwrites.create(blacklistRole, {
                        ViewChannel: false,
                        SendMessages: false,
                        AddReactions: false,
                        Connect: false
                    });
                } catch (e) {}
            }
            
            await Guild.updateOne(
                { guildId: guild.id },
                { $set: { blacklistRoleId: blacklistRole.id } }
            );
        } catch (error) {
            console.error('Error creating blacklist role:', error);
            return null;
        }
    }
    
    return blacklistRole;
}

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        if (member.user.bot) {
            const guild = member.guild;
            const guildData = await Guild.findOne({ guildId: guild.id });
            
            if (guildData && guildData.antiNuke.enabled) {
                const isWhitelisted = guildData.antiNuke.whitelistedBots.includes(member.id);
                const isBlacklisted = guildData.antiNuke.blacklistedBots.includes(member.id);
                
                if (isBlacklisted || !isWhitelisted) {
                    try {
                        await member.ban({ reason: `[Anti-Nuke] ${isBlacklisted ? 'Blacklisted' : 'Non-whitelisted'} bot added` });
                        
                        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: 28 }).catch(() => null);
                        if (fetchedLogs) {
                            const botAddLog = fetchedLogs.entries.first();
                            if (botAddLog && Date.now() - botAddLog.createdTimestamp < 10000) {
                                const executor = botAddLog.executor;
                                if (executor.id !== guild.ownerId) {
                                    const executorMember = await guild.members.fetch(executor.id).catch(() => null);
                                    
                                    if (executorMember) {
                                        const blacklistRole = await getOrCreateBlacklistRole(guild);
                                        
                                        if (blacklistRole) {
                                            try {
                                                const rolesToRemove = executorMember.roles.cache.filter(r => r.id !== guild.id);
                                                await executorMember.roles.remove(rolesToRemove, '[Anti-Nuke] Added unauthorized bot');
                                                await executorMember.roles.add(blacklistRole, '[Anti-Nuke] Quarantined for adding unauthorized bot');
                                            } catch (e) {
                                                console.error('Error managing roles:', e);
                                            }
                                        }
                                    }
                                    
                                    const owner = await client.users.fetch(guild.ownerId).catch(() => null);
                                    if (owner) {
                                        const dmEmbed = antiNukeEmbed({
                                            title: `${config.emojis.alarm} Anti-Nuke Alert`,
                                            description: `**Server:** ${guild.name}\n\n**Threat Detected:**\n**User:** ${executor.tag} (${executor.id})\n**Action:** Added ${isBlacklisted ? 'Blacklisted' : 'Non-Whitelisted'} Bot\n**Bot:** ${member.user.tag} (${member.id})\n\n**Actions Taken:**\n• Bot has been banned\n• User's roles have been removed\n• User has been quarantined with Blacklisted role\n\n**Note:** The quarantined user cannot see any channels until you manually review and restore their access.`
                                        });
                                        await owner.send({ embeds: [dmEmbed] }).catch(() => {});
                                    }
                                    
                                    if (guildData.logs.antiNuke) {
                                        const logChannel = guild.channels.cache.get(guildData.logs.antiNuke);
                                        if (logChannel) {
                                            const logEmbed = antiNukeEmbed({
                                                title: `${config.emojis.alarm} Unauthorized Bot Blocked`,
                                                description: `**Bot:** ${member.user.tag} (${member.id})\n**Type:** ${isBlacklisted ? 'Blacklisted' : 'Not Whitelisted'}\n**Added By:** ${executor.tag} (${executor.id})\n\n**Actions Taken:**\n• Bot banned\n• ${executor.tag} quarantined (all roles removed, Blacklisted role applied)`,
                                                footer: { text: `User ID: ${executor.id} | Bot ID: ${member.id}` }
                                            });
                                            await logChannel.send({ embeds: [logEmbed] });
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error handling unauthorized bot:', error);
                    }
                }
            }
            return;
        }
        
        const mute = await Mute.findOne({ 
            guildId: member.guild.id, 
            userId: member.id 
        });
        
        if (mute) {
            const guildData = await Guild.findOne({ guildId: member.guild.id });
            if (guildData && guildData.mutedRoleId) {
                const mutedRole = member.guild.roles.cache.get(guildData.mutedRoleId);
                if (mutedRole) {
                    try {
                        await member.roles.add(mutedRole, 'Re-applying mute after rejoin');
                    } catch (error) {
                        console.error('Error re-applying mute:', error);
                    }
                }
            }
        }
        
        const guildData = await Guild.findOne({ guildId: member.guild.id });
        if (guildData?.blacklistRoleId) {
            const blacklistRole = member.guild.roles.cache.get(guildData.blacklistRoleId);
            if (blacklistRole) {
                const channels = member.guild.channels.cache;
                for (const [, channel] of channels) {
                    try {
                        const perms = channel.permissionOverwrites.cache.get(blacklistRole.id);
                        if (!perms) {
                            await channel.permissionOverwrites.create(blacklistRole, {
                                ViewChannel: false,
                                SendMessages: false,
                                AddReactions: false,
                                Connect: false
                            });
                        }
                    } catch (e) {}
                }
            }
        }
    }
};
