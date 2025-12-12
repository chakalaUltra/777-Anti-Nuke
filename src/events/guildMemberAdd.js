const Guild = require('../models/Guild');
const Mute = require('../models/Mute');
const { antiNukeEmbed } = require('../utils/embedBuilder');
const config = require('../config');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        if (member.user.bot) {
            const guild = member.guild;
            const guildData = await Guild.findOne({ guildId: guild.id });
            
            if (guildData && guildData.antiNuke.enabled) {
                if (guildData.antiNuke.blacklistedBots.includes(member.id)) {
                    try {
                        await member.ban({ reason: '[Anti-Nuke] Blacklisted bot added' });
                        
                        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: 28 }).catch(() => null);
                        if (fetchedLogs) {
                            const botAddLog = fetchedLogs.entries.first();
                            if (botAddLog && Date.now() - botAddLog.createdTimestamp < 10000) {
                                const executor = botAddLog.executor;
                                if (executor.id !== guild.ownerId) {
                                    const executorMember = await guild.members.fetch(executor.id).catch(() => null);
                                    if (executorMember) {
                                        await executorMember.ban({ reason: '[Anti-Nuke] Added blacklisted bot' });
                                    }
                                    
                                    const owner = await client.users.fetch(guild.ownerId).catch(() => null);
                                    if (owner) {
                                        const dmEmbed = antiNukeEmbed({
                                            title: `${config.emojis.alarm} Anti-Nuke Alert`,
                                            description: `**Server:** ${guild.name}\n**User:** ${executor.tag} (${executor.id})\n**Action:** Added Blacklisted Bot\n**Bot:** ${member.user.tag} (${member.id})\n**Punishment:** Both banned`,
                                            timestamp: true
                                        });
                                        await owner.send({ embeds: [dmEmbed] }).catch(() => {});
                                    }
                                }
                            }
                        }
                        
                        if (guildData.logs.antiNuke) {
                            const logChannel = guild.channels.cache.get(guildData.logs.antiNuke);
                            if (logChannel) {
                                const logEmbed = antiNukeEmbed({
                                    title: `${config.emojis.alarm} Blacklisted Bot Removed`,
                                    description: `**Bot:** ${member.user.tag} (${member.id})\n**Action:** Banned on sight`,
                                    timestamp: true
                                });
                                await logChannel.send({ embeds: [logEmbed] });
                            }
                        }
                    } catch (error) {
                        console.error('Error handling blacklisted bot:', error);
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
    }
};
