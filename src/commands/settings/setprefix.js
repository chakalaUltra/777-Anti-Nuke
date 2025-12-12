const { SlashCommandBuilder } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

module.exports = {
    name: 'setprefix',
    description: 'Change the bot prefix for this server',
    usage: '?setprefix <new_prefix>',
    aliases: ['prefix'],
    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Change the bot prefix for this server')
        .addStringOption(option =>
            option.setName('prefix')
                .setDescription('The new prefix (max 5 characters)')
                .setRequired(true)),

    async execute(message, args, client, guildData) {
        const newPrefix = args[0];
        
        if (!newPrefix) {
            return message.reply({ embeds: [errorEmbed('Please provide a new prefix.')] });
        }
        
        if (newPrefix.length > 5) {
            return message.reply({ embeds: [errorEmbed('Prefix cannot be longer than 5 characters.')] });
        }
        
        try {
            await Guild.updateOne(
                { guildId: message.guild.id },
                { prefix: newPrefix }
            );
            
            return message.reply({ embeds: [successEmbed(`Prefix has been changed to \`${newPrefix}\``)] });
        } catch (error) {
            console.error('Error changing prefix:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while changing the prefix.')] });
        }
    },

    async executeSlash(interaction, client, guildData) {
        const newPrefix = interaction.options.getString('prefix');
        
        if (newPrefix.length > 5) {
            return interaction.reply({ embeds: [errorEmbed('Prefix cannot be longer than 5 characters.')], ephemeral: true });
        }
        
        try {
            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { prefix: newPrefix }
            );
            
            return interaction.reply({ embeds: [successEmbed(`Prefix has been changed to \`${newPrefix}\``)] });
        } catch (error) {
            console.error('Error changing prefix:', error);
            return interaction.reply({ embeds: [errorEmbed('An error occurred while changing the prefix.')], ephemeral: true });
        }
    }
};
