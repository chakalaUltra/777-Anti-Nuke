const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    name: 'blockedwords',
    description: 'Manage blocked words for automod',
    usage: '?blockedwords <add/remove/list> [words] [action] [duration]',
    aliases: ['bw', 'badwords'],
    data: new SlashCommandBuilder()
        .setName('blockedwords')
        .setDescription('Manage blocked words for automod')
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('Add word(s) to the blocked list (comma-separated)')
                .addStringOption(option =>
                    option.setName('words')
                        .setDescription('The word(s) to block (separate multiple with commas)')
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
                .setDescription('Remove word(s) from the blocked list (comma-separated)')
                .addStringOption(option =>
                    option.setName('words')
                        .setDescription('The word(s) to unblock (separate multiple with commas)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('View all blocked words')),

    async execute(message, args, client, guildData) {
        const action = args[0]?.toLowerCase();
        
        if (!action || !['add', 'remove', 'list'].includes(action)) {
            return message.reply({ embeds: [errorEmbed('Usage: `?blockedwords add <words> [warn/mute/kick/ban] [duration]`\n`?blockedwords remove <words>`\n`?blockedwords list`\n\nSeparate multiple words with commas: `?blockedwords add hello, hi, hey warn`')] });
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
                footer: { text: `Total: ${blockedWords.length} words` }
            })] });
        }
        
        const remainingArgs = args.slice(1);
        
        if (remainingArgs.length === 0) {
            return message.reply({ embeds: [errorEmbed('Please provide at least one word.')] });
        }
        
        let wordAction = 'warn';
        let muteDuration = '10m';
        let wordsString = '';
        
        if (action === 'add') {
            const lastArg = remainingArgs[remainingArgs.length - 1]?.toLowerCase();
            const secondLastArg = remainingArgs[remainingArgs.length - 2]?.toLowerCase();
            
            if (['warn', 'mute', 'kick', 'ban'].includes(lastArg)) {
                wordAction = lastArg;
                wordsString = remainingArgs.slice(0, -1).join(' ');
            } else if (['warn', 'mute', 'kick', 'ban'].includes(secondLastArg)) {
                wordAction = secondLastArg;
                muteDuration = lastArg;
                wordsString = remainingArgs.slice(0, -2).join(' ');
            } else {
                wordsString = remainingArgs.join(' ');
            }
        } else {
            wordsString = remainingArgs.join(' ');
        }
        
        const words = wordsString.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
        
        if (words.length === 0) {
            return message.reply({ embeds: [errorEmbed('Please provide at least one word.')] });
        }
        
        if (action === 'add') {
            const existingWords = guildData.autoMod.blockedWords.map(bw => bw.word);
            const newWords = words.filter(w => !existingWords.includes(w));
            const skippedWords = words.filter(w => existingWords.includes(w));
            
            if (newWords.length === 0) {
                return message.reply({ embeds: [errorEmbed('All specified words are already blocked.')] });
            }
            
            const wordsToAdd = newWords.map(word => ({
                word,
                action: wordAction,
                muteDuration
            }));
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $push: { 'autoMod.blockedWords': { $each: wordsToAdd } } }
            );
            
            const durationText = wordAction === 'mute' ? ` for ${muteDuration}` : '';
            let response = `Added ${newWords.length} word(s): ${newWords.map(w => `||${w}||`).join(', ')}\n**Action:** ${wordAction}${durationText}`;
            if (skippedWords.length > 0) {
                response += `\n\nSkipped (already blocked): ${skippedWords.map(w => `||${w}||`).join(', ')}`;
            }
            
            return message.reply({ embeds: [successEmbed(response)] });
        }
        
        if (action === 'remove') {
            const existingWords = guildData.autoMod.blockedWords.map(bw => bw.word);
            const wordsToRemove = words.filter(w => existingWords.includes(w));
            const notFoundWords = words.filter(w => !existingWords.includes(w));
            
            if (wordsToRemove.length === 0) {
                return message.reply({ embeds: [errorEmbed('None of the specified words are blocked.')] });
            }
            
            await Guild.updateOne(
                { guildId: message.guild.id },
                { $pull: { 'autoMod.blockedWords': { word: { $in: wordsToRemove } } } }
            );
            
            let response = `Removed ${wordsToRemove.length} word(s): ${wordsToRemove.map(w => `||${w}||`).join(', ')}`;
            if (notFoundWords.length > 0) {
                response += `\n\nNot found: ${notFoundWords.map(w => `||${w}||`).join(', ')}`;
            }
            
            return message.reply({ embeds: [successEmbed(response)] });
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
                footer: { text: `Total: ${blockedWords.length} words` }
            })] });
        }
        
        const wordsString = interaction.options.getString('words');
        const words = wordsString.split(',').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
        
        if (words.length === 0) {
            return interaction.reply({ embeds: [errorEmbed('Please provide at least one word.')], ephemeral: true });
        }
        
        if (action === 'add') {
            const wordAction = interaction.options.getString('action') || 'warn';
            const muteDuration = interaction.options.getString('duration') || '10m';
            
            const existingWords = guildData.autoMod.blockedWords.map(bw => bw.word);
            const newWords = words.filter(w => !existingWords.includes(w));
            const skippedWords = words.filter(w => existingWords.includes(w));
            
            if (newWords.length === 0) {
                return interaction.reply({ embeds: [errorEmbed('All specified words are already blocked.')], ephemeral: true });
            }
            
            const wordsToAdd = newWords.map(word => ({
                word,
                action: wordAction,
                muteDuration
            }));
            
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { $push: { 'autoMod.blockedWords': { $each: wordsToAdd } } }
            );
            
            const durationText = wordAction === 'mute' ? ` for ${muteDuration}` : '';
            let response = `Added ${newWords.length} word(s): ${newWords.map(w => `||${w}||`).join(', ')}\n**Action:** ${wordAction}${durationText}`;
            if (skippedWords.length > 0) {
                response += `\n\nSkipped (already blocked): ${skippedWords.map(w => `||${w}||`).join(', ')}`;
            }
            
            return interaction.reply({ embeds: [successEmbed(response)] });
        }
        
        if (action === 'remove') {
            const existingWords = guildData.autoMod.blockedWords.map(bw => bw.word);
            const wordsToRemove = words.filter(w => existingWords.includes(w));
            const notFoundWords = words.filter(w => !existingWords.includes(w));
            
            if (wordsToRemove.length === 0) {
                return interaction.reply({ embeds: [errorEmbed('None of the specified words are blocked.')], ephemeral: true });
            }
            
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { $pull: { 'autoMod.blockedWords': { word: { $in: wordsToRemove } } } }
            );
            
            let response = `Removed ${wordsToRemove.length} word(s): ${wordsToRemove.map(w => `||${w}||`).join(', ')}`;
            if (notFoundWords.length > 0) {
                response += `\n\nNot found: ${notFoundWords.map(w => `||${w}||`).join(', ')}`;
            }
            
            return interaction.reply({ embeds: [successEmbed(response)] });
        }
    }
};
