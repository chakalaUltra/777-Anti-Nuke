const Guild = require('../models/Guild');
const { trackAction } = require('../utils/antiNukeTracker');
const { antiNukeEmbed } = require('../utils/embedBuilder');
const config = require('../config');

module.exports = {
    name: 'webhookUpdate',
    async execute(channel, client) {
        const guild = channel.guild;
        const guildData = await Guild.findOne({ guildId: guild.id });
        
        if (!guildData || !guildData.antiNuke.enabled) return;
        
        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: 50 }).catch(() => null);
        if (!fetchedLogs) return;
        
        const webhookLog = fetchedLogs.entries.first();
        if (!webhookLog || Date.now() - webhookLog.createdTimestamp > 5000) return;
        
        const executor = webhookLog.executor;
        if (executor.id === client.user.id) return;
        if (executor.id === guild.ownerId) return;
        if (guildData.antiNuke.whitelistedUsers.includes(executor.id)) return;
        if (executor.bot && guildData.antiNuke.whitelistedBots.includes(executor.id)) return;
        
        const result = trackAction(guild.id, executor.id, 'webhookCreate');
        
        if (result.triggered) {
            try {
                const webhooks = await channel.fetchWebhooks();
                for (const webhook of webhooks.values()) {
                    if (webhook.owner?.id === executor.id) {
                        await webhook.delete('[Anti-Nuke] Spam webhook creation').catch(() => {});
                    }
                }
                
                const member = await guild.members.fetch(executor.id).catch(() => null);
                if (member) {
                    await member.ban({ reason: '[Anti-Nuke] Spam webhook creation detected' });
                }
                
                const owner = await client.users.fetch(guild.ownerId).catch(() => null);
                if (owner) {
                    const dmEmbed = antiNukeEmbed({
                        title: `${config.emojis.alarm} Anti-Nuke Alert`,
                        description: `**Server:** ${guild.name}\n**User:** ${executor.tag} (${executor.id})\n**Action:** Spam Webhook Creation\n**Webhooks:** ${result.count}/${result.limit}\n**Punishment:** Banned`,
                        timestamp: true
                    });
                    await owner.send({ embeds: [dmEmbed] }).catch(() => {});
                }
                
                if (guildData.logs.antiNuke) {
                    const logChannel = guild.channels.cache.get(guildData.logs.antiNuke);
                    if (logChannel) {
                        const logEmbed = antiNukeEmbed({
                            title: `${config.emojis.alarm} Anti-Nuke Triggered`,
                            description: `**User:** ${executor.tag} (${executor.id})\n**Action:** Spam Webhook Creation\n**Count:** ${result.count} webhooks\n**Punishment:** Banned`,
                            timestamp: true
                        });
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
            } catch (error) {
                console.error('Error in anti-nuke webhook handler:', error);
            }
        }
    }
};
