const Guild = require('../models/Guild');
const { trackAction } = require('../utils/antiNukeTracker');
const { antiNukeEmbed } = require('../utils/embedBuilder');
const { isWhitelistedForCategory, isBlacklistedForCategory } = require('../utils/antiNukeHelper');
const config = require('../config');

module.exports = {
    name: 'channelCreate',
    async execute(channel, client) {
        if (!channel.guild) return;
        
        const guild = channel.guild;
        const guildData = await Guild.findOne({ guildId: guild.id });
        
        if (guildData?.blacklistRoleId) {
            const blacklistRole = guild.roles.cache.get(guildData.blacklistRoleId);
            if (blacklistRole) {
                try {
                    await channel.permissionOverwrites.create(blacklistRole, {
                        ViewChannel: false,
                        SendMessages: false,
                        AddReactions: false,
                        Connect: false
                    });
                } catch (e) {}
            }
        }
        
        if (!guildData || !guildData.antiNuke.enabled) return;
        
        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: 10 }).catch(() => null);
        if (!fetchedLogs) return;
        
        const createLog = fetchedLogs.entries.first();
        if (!createLog || Date.now() - createLog.createdTimestamp > 5000) return;
        
        const executor = createLog.executor;
        if (executor.id === client.user.id) return;
        if (executor.id === guild.ownerId) return;
        
        const executorMember = await guild.members.fetch(executor.id).catch(() => null);
        const executorRoles = executorMember ? Array.from(executorMember.roles.cache.keys()) : [];
        
        const isBlacklisted = isBlacklistedForCategory(guildData, executor.id, executorRoles, 'channels', executor.bot);
        
        if (!isBlacklisted) {
            if (isWhitelistedForCategory(guildData, executor.id, executorRoles, 'channels', executor.bot)) return;
        }
        
        const result = isBlacklisted ? { triggered: true, count: 1, limit: 1 } : trackAction(guild.id, executor.id, 'channelCreate');
        
        if (result.triggered) {
            try {
                await channel.delete('[Anti-Nuke] Mass channel creation').catch(() => {});
                
                const member = await guild.members.fetch(executor.id).catch(() => null);
                if (member) {
                    await member.ban({ reason: isBlacklisted ? '[Anti-Nuke] Blacklisted user created channel' : '[Anti-Nuke] Mass channel creation detected' });
                }
                
                const owner = await client.users.fetch(guild.ownerId).catch(() => null);
                if (owner) {
                    const dmEmbed = antiNukeEmbed({
                        title: `${config.emojis.alarm} Anti-Nuke Alert`,
                        description: `**Server:** ${guild.name}\n**User:** ${executor.tag} (${executor.id})\n**Action:** ${isBlacklisted ? 'Blacklisted User Channel Creation' : 'Mass Channel Creation'}\n**Channels Created:** ${result.count}/${result.limit}\n**Punishment:** Banned`,
                        timestamp: true
                    });
                    await owner.send({ embeds: [dmEmbed] }).catch(() => {});
                }
                
                if (guildData.logs.antiNuke) {
                    const logChannel = guild.channels.cache.get(guildData.logs.antiNuke);
                    if (logChannel) {
                        const logEmbed = antiNukeEmbed({
                            title: `${config.emojis.alarm} Anti-Nuke Triggered`,
                            description: `**User:** ${executor.tag} (${executor.id})\n**Action:** ${isBlacklisted ? 'Blacklisted User Channel Creation' : 'Mass Channel Creation'}\n**Count:** ${result.count} channels\n**Punishment:** Banned`,
                            timestamp: true
                        });
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
            } catch (error) {
                console.error('Error in anti-nuke channel create handler:', error);
            }
        }
    }
};
