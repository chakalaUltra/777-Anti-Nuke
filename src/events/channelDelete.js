const Guild = require('../models/Guild');
const { trackAction } = require('../utils/antiNukeTracker');
const { antiNukeEmbed } = require('../utils/embedBuilder');
const config = require('../config');

module.exports = {
    name: 'channelDelete',
    async execute(channel, client) {
        if (!channel.guild) return;
        
        const guild = channel.guild;
        const guildData = await Guild.findOne({ guildId: guild.id });
        
        if (!guildData || !guildData.antiNuke.enabled) return;
        
        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: 12 }).catch(() => null);
        if (!fetchedLogs) return;
        
        const deleteLog = fetchedLogs.entries.first();
        if (!deleteLog || Date.now() - deleteLog.createdTimestamp > 5000) return;
        
        const executor = deleteLog.executor;
        if (executor.id === client.user.id) return;
        if (executor.id === guild.ownerId) return;
        if (guildData.antiNuke.whitelistedUsers.includes(executor.id)) return;
        
        const result = trackAction(guild.id, executor.id, 'channelDelete');
        
        if (result.triggered) {
            try {
                const member = await guild.members.fetch(executor.id).catch(() => null);
                if (member) {
                    await member.ban({ reason: '[Anti-Nuke] Mass channel deletion detected' });
                }
                
                const owner = await client.users.fetch(guild.ownerId).catch(() => null);
                if (owner) {
                    const dmEmbed = antiNukeEmbed({
                        title: `${config.emojis.alarm} Anti-Nuke Alert`,
                        description: `**Server:** ${guild.name}\n**User:** ${executor.tag} (${executor.id})\n**Action:** Mass Channel Deletion\n**Channels Deleted:** ${result.count}/${result.limit}\n**Punishment:** Banned`,
                        timestamp: true
                    });
                    await owner.send({ embeds: [dmEmbed] }).catch(() => {});
                }
                
                if (guildData.logs.antiNuke) {
                    const logChannel = guild.channels.cache.get(guildData.logs.antiNuke);
                    if (logChannel) {
                        const logEmbed = antiNukeEmbed({
                            title: `${config.emojis.alarm} Anti-Nuke Triggered`,
                            description: `**User:** ${executor.tag} (${executor.id})\n**Action:** Mass Channel Deletion\n**Count:** ${result.count} channels\n**Punishment:** Banned`,
                            timestamp: true
                        });
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
            } catch (error) {
                console.error('Error in anti-nuke channel delete handler:', error);
            }
        }
    }
};
