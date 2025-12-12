const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    name: 'blockedwords',
    description: 'Manage blocked words for automod',
    usage: '?blockedwords <add/remove/list> [word] [action] [duration]',
    aliases: ['bw', 'badwords'],
    data: new SlashCommandBuilder()
        .setName('blockedwords')
        .setDescription('Manage blocked words for automod')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Add a word to the blocked list')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('The word to block')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to take when word is used')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Warn', value: 'warn' },
                            { name: 'Mute', value: 'mute' },
                            { name: 'Kick', value: 'kick' },
                            { name: 'Ban', value: 'ban' }
                        ))
                .addStringOption(option =>
                    option.setName('duration')
                        .setDescription('Mute duration (only for mute action)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('Remove a word from the blocked list')
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('The word to unblock')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('View all blocked words')),

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
    },

    async executeSlash(interaction, client, guildData) {
        const action = interaction.options.getSubcommand();
        
        if (action === 'list') {
            const blockedWords = guildData.autoMod.blockedWords;
            
            if (blockedWords.length === 0) {
                return interaction.reply({ embeds: [createEmbed({
                    title: `${config.emojis.note} Blocked Words`,
                    description: 'No words are currently blocked.',
                    color: config.colors.info
                })] });
            }
            
            const wordList = blockedWords.map((bw, index) => {
                const duration = bw.action === 'mute' ? ` (${bw.muteDuration})` : '';
                return `${index + 1}. ||${bw.word}|| - ${bw.action}${duration}`;
            }).join('\n');
            
            return interaction.reply({ embeds: [createEmbed({
                title: `${config.emojis.x_} Blocked Words`,
                description: wordList,
                color: config.colors.warning,
                timestamp: true,
                footer: { text: `Total: ${blockedWords.length} words` }
            })] });
        }
        
        const word = interaction.options.getString('word')?.toLowerCase();
        
        if (action === 'add') {
            const wordAction = interaction.options.getString('action') || 'warn';
            const muteDuration = interaction.options.getString('duration') || '10m';
            
            const existingWord = guildData.autoMod.blockedWords.find(bw => bw.word === word);
            if (existingWord) {
                return interaction.reply({ embeds: [errorEmbed('This word is already blocked.')], ephemeral: true });
            }
            
            await Guild.updateOne(
                { guildId: interaction.guild.id },
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
            return interaction.reply({ embeds: [successEmbed(`Word ||${word}|| has been blocked.\n**Action:** ${wordAction}${durationText}`)] });
        }
        
        if (action === 'remove') {
            const existingWord = guildData.autoMod.blockedWords.find(bw => bw.word === word);
            if (!existingWord) {
                return interaction.reply({ embeds: [errorEmbed('This word is not blocked.')], ephemeral: true });
            }
            
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { $pull: { 'autoMod.blockedWords': { word } } }
            );
            
            return interaction.reply({ embeds: [successEmbed(`Word ||${word}|| has been removed from blocked words.`)] });
        }
    }
};
