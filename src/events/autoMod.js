const Guild = require('../models/Guild');
const Warning = require('../models/Warning');
const { createEmbed, warningEmbed } = require('../utils/embedBuilder');
const config = require('../config');
const ms = require('ms');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;
        if (message.member?.permissions.has('Administrator')) return;
        
        const guildData = await Guild.findOne({ guildId: message.guild.id });
        if (!guildData || !guildData.autoMod.enabled) return;
        if (guildData.autoMod.blockedWords.length === 0) return;
        
        const content = message.content.toLowerCase();
        
        for (const blockedWord of guildData.autoMod.blockedWords) {
            if (content.includes(blockedWord.word.toLowerCase())) {
                try {
                    await message.delete();
                } catch (e) {}
                
                let actionTaken = '';
                
                switch (blockedWord.action) {
                    case 'warn':
                        await Warning.create({
                            guildId: message.guild.id,
                            oderId: message.author.id,
                            moderatorId: client.user.id,
                            reason: `[AutoMod] Used blocked word: ${blockedWord.word}`
                        });
                        actionTaken = 'Warned';
                        break;
                        
                    case 'mute':
                        const muteDuration = ms(blockedWord.muteDuration || '10m');
                        if (message.member.moderatable) {
                            await message.member.timeout(muteDuration, `[AutoMod] Used blocked word: ${blockedWord.word}`);
                        }
                        actionTaken = `Timed out for ${blockedWord.muteDuration || '10m'}`;
                        break;
                        
                    case 'kick':
                        if (message.member.kickable) {
                            await message.member.kick(`[AutoMod] Used blocked word: ${blockedWord.word}`);
                        }
                        actionTaken = 'Kicked';
                        break;
                        
                    case 'ban':
                        if (message.member.bannable) {
                            await message.member.ban({ reason: `[AutoMod] Used blocked word: ${blockedWord.word}` });
                        }
                        actionTaken = 'Banned';
                        break;
                }
                
                try {
                    const dmEmbed = warningEmbed(
                        `Your message in **${message.guild.name}** was removed for containing a blocked word.\n**Action:** ${actionTaken}`
                    );
                    await message.author.send({ embeds: [dmEmbed] }).catch(() => {});
                } catch (e) {}
                
                if (guildData.logs.autoMod) {
                    const logChannel = message.guild.channels.cache.get(guildData.logs.autoMod);
                    if (logChannel) {
                        const logEmbed = createEmbed({
                            title: `${config.emojis.alarm} AutoMod - Blocked Word`,
                            description: `**User:** ${message.author.tag} (${message.author.id})\n**Channel:** ${message.channel}\n**Word:** ||${blockedWord.word}||\n**Action:** ${actionTaken}`,
                            color: config.colors.warning,
                            timestamp: true
                        });
                        await logChannel.send({ embeds: [logEmbed] });
                    }
                }
                
                break;
            }
        }
    }
};
