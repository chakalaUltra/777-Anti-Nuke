const Guild = require('../models/Guild');
const { trackAction } = require('../utils/antiNukeTracker');
const { antiNukeEmbed } = require('../utils/embedBuilder');
const config = require('../config');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        const guild = member.guild;
        const guildData = await Guild.findOne({ guildId: guild.id });
        
        if (!guildData || !guildData.antiNuke.enabled) return;
        
        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: 20 }).catch(() => null);
        if (!fetchedLogs) return;
        
        const kickLog = fetchedLogs.entries.first();
        if (!kickLog || Date.now() - kickLog.createdTimestamp > 5000) return;
        if (kickLog.target.id !== member.id) return;
        
        const executor = kickLog.executor;
        if (executor.id === client.user.id) return;
        if (executor.id === guild.ownerId) return;
        if (guildData.antiNuke.whitelistedUsers.includes(executor.id)) return;
        
        const result = trackAction(guild.id, executor.id, 'memberKick');
        
        if (result.triggered) {
            try {
                const executorMember = await guild.members.fetch(executor.id).catch(() => null);
                if (executorMember) {
                    await executorMember.ban({ reason: '[Anti-Nuke] Mass kick detected' });
                }
                
                const owner = await client.users.fetch(guild.ownerId).catch(() => null);
                if (owner) {
                    const dmEmbed = antiNukeEmbed({
                        title: `${config.emojis.alarm} Anti-Nuke Alert`,
                        description: `**Server:** ${guild.name}\n**User:** ${executor.tag} (${executor.id})\n**Action:** Mass Kick Detected\n**Kicks:** ${result.count}/${result.limit}\n**Punishment:** Banned`,
                        timestamp: true
                    });
                    await owner.send({ embeds: [dmEmbed] }).catch(() => {});
                }
                
                if (guildData.logs.antiNuke) {
                    const logChannel = guild.channels.cache.get(guildData.logs.antiNuke);
                    if (logChannel) {
                        const logEmbed = antiNukeEmbed({
                            title: `${config.emojis.alarm} Anti-Nuke Triggered`,
                            description: `**User:** ${executor.tag} (${executor.id})\n**Action:** Mass Kick\n**Count:** ${result.count} kicks\n**Punishment:** Banned`,
                            timestamp: true
                        });
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
            } catch (error) {
                console.error('Error in anti-nuke kick handler:', error);
            }
        }
    }
};
