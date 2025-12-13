const Guild = require('../models/Guild');
const { trackAction } = require('../utils/antiNukeTracker');
const { antiNukeEmbed } = require('../utils/embedBuilder');
const { isWhitelistedForCategory, isBlacklistedForCategory } = require('../utils/antiNukeHelper');
const config = require('../config');

module.exports = {
    name: 'roleCreate',
    async execute(role, client) {
        const guild = role.guild;
        const guildData = await Guild.findOne({ guildId: guild.id });
        
        if (!guildData || !guildData.antiNuke.enabled) return;
        
        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: 30 }).catch(() => null);
        if (!fetchedLogs) return;
        
        const createLog = fetchedLogs.entries.first();
        if (!createLog || Date.now() - createLog.createdTimestamp > 5000) return;
        
        const executor = createLog.executor;
        if (executor.id === client.user.id) return;
        if (executor.id === guild.ownerId) return;
        
        const executorMember = await guild.members.fetch(executor.id).catch(() => null);
        const executorRoles = executorMember ? Array.from(executorMember.roles.cache.keys()) : [];
        
        const isBlacklisted = isBlacklistedForCategory(guildData, executor.id, executorRoles, 'roles', executor.bot);
        
        if (!isBlacklisted) {
            if (isWhitelistedForCategory(guildData, executor.id, executorRoles, 'roles', executor.bot)) return;
        }
        
        const result = isBlacklisted ? { triggered: true, count: 1, limit: 1 } : trackAction(guild.id, executor.id, 'roleCreate');
        
        if (result.triggered) {
            try {
                await role.delete('[Anti-Nuke] Mass role creation').catch(() => {});
                
                const member = await guild.members.fetch(executor.id).catch(() => null);
                if (member) {
                    await member.ban({ reason: isBlacklisted ? '[Anti-Nuke] Blacklisted user created role' : '[Anti-Nuke] Mass role creation detected' });
                }
                
                const owner = await client.users.fetch(guild.ownerId).catch(() => null);
                if (owner) {
                    const dmEmbed = antiNukeEmbed({
                        title: `${config.emojis.alarm} Anti-Nuke Alert`,
                        description: `**Server:** ${guild.name}\n**User:** ${executor.tag} (${executor.id})\n**Action:** ${isBlacklisted ? 'Blacklisted User Role Creation' : 'Mass Role Creation'}\n**Roles Created:** ${result.count}/${result.limit}\n**Punishment:** Banned`,
                        timestamp: true
                    });
                    await owner.send({ embeds: [dmEmbed] }).catch(() => {});
                }
                
                if (guildData.logs.antiNuke) {
                    const logChannel = guild.channels.cache.get(guildData.logs.antiNuke);
                    if (logChannel) {
                        const logEmbed = antiNukeEmbed({
                            title: `${config.emojis.alarm} Anti-Nuke Triggered`,
                            description: `**User:** ${executor.tag} (${executor.id})\n**Action:** ${isBlacklisted ? 'Blacklisted User Role Creation' : 'Mass Role Creation'}\n**Count:** ${result.count} roles\n**Punishment:** Banned`,
                            timestamp: true
                        });
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
            } catch (error) {
                console.error('Error in anti-nuke role create handler:', error);
            }
        }
    }
};
