const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    name: 'blockedwords',
    description: 'Manage blocked words for automod',
    usage: '?blockedwords <add/remove/list> [word] [action] [duration]',
    aliases: ['bw', 'badwords'],
    async execute(message, args, client, guildData) {
        const action = args[0]?.toLowerCase();
        
        if (!action || !['add', 'remove', 'list'].includes(action)) {
            return message.reply({ embeds: [errorEmbed('Usage: `?blockedwords <add/remove/list> [word] [action: warn/mute/kick/ban] [mute_duration]`')] });
        }
        
        if (action === 'list') {
            const blockedWords = guildData.autoMod.blockedWords;
            
            if (blockedWords.length === 0) {
                return message.reply({ embeds: [createEmbed({
                    title: `${config.emojis.note} Blocked Words`,
                    description: 'No words are currently blocked.',
                    color: config.colors.info
                })] });
            }
            
            const wordList = blockedWords.map((bw, index) => {
                const duration = bw.action === 'mute' ? ` (${bw.muteDuration})` : '';
                return `${index + 1}. ||${bw.word}|| - ${bw.action}${duration}`;
            }).join('\n');
            
            return message.reply({ embeds: [createEmbed({
                title: `${config.emojis.x_} Blocked Words`,
                description: wordList,
                color: config.colors.warning,
                timestamp: true,
                footer: { text: `Total: ${blockedWords.length} words` }
            })] });
        }
        
        const word = args[1]?.toLowerCase();
        
        if (!word) {
            return message.reply({ embeds: [errorEmbed('Please provide a word.')] });
        }
        
        if (action === 'add') {
            const wordAction = args[2]?.toLowerCase() || 'warn';
            
            if (!['warn', 'mute', 'kick', 'ban'].includes(wordAction)) {
                return message.reply({ embeds: [errorEmbed('Action must be: warn, mute, kick, or ban.')] });
            }
            
            const muteDuration = args[3] || '10m';
            
            const existingWord = guildData.autoMod.blockedWords.find(bw => bw.word === word);
            if (existingWord) {
                return message.reply({ embeds: [errorEmbed('This word is already blocked.')] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { 
                    $push: { 
                        'autoMod.blockedWords': {
                            word,
                            action: wordAction,
                            muteDuration
                        }
                    }
                }
            );
            
            const durationText = wordAction === 'mute' ? ` for ${muteDuration}` : '';
            return message.reply({ embeds: [successEmbed(`Word ||${word}|| has been blocked.\n**Action:** ${wordAction}${durationText}`)] });
        }
        
        if (action === 'remove') {
            const existingWord = guildData.autoMod.blockedWords.find(bw => bw.word === word);
            if (!existingWord) {
                return message.reply({ embeds: [errorEmbed('This word is not blocked.')] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $pull: { 'autoMod.blockedWords': { word } } }
            );
            
            return message.reply({ embeds: [successEmbed(`Word ||${word}|| has been removed from blocked words.`)] });
        }
    }
};
