const Guild = require('../models/Guild');
const { hasCommandPermission, hasDangerousCommandPermission } = require('../utils/permissions');
const { errorEmbed } = require('../utils/embedBuilder');

const dangerousCommands = [
    'antinuke', 'antinuke-whitelist', 'antinuke-blacklist',
    'antinuke-botwhitelist', 'antinuke-botblacklist', 'automod',
    'blockedwords', 'setprefix', 'settings', 'perm-add', 'perm-remove'
];

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        let guildData = await Guild.findOne({ guildId: interaction.guild.id });
        if (!guildData) {
            guildData = await Guild.create({ guildId: interaction.guild.id });
        }

        const hasPermission = await hasCommandPermission(interaction.member, command.name, guildData);
        if (!hasPermission) {
            return interaction.reply({ 
                embeds: [errorEmbed('You do not have permission to use this command.')],
                ephemeral: true 
            });
        }

        if (dangerousCommands.includes(command.name)) {
            const hasDangerousPerm = await hasDangerousCommandPermission(interaction.member, interaction.guild);
            if (!hasDangerousPerm) {
                return interaction.reply({ 
                    embeds: [errorEmbed('This is a dangerous command. You must have a role **above** the bot to use it.')],
                    ephemeral: true 
                });
            }
        }

        if (!command.executeSlash) {
            return interaction.reply({ 
                embeds: [errorEmbed('This command does not support slash commands yet.')],
                ephemeral: true 
            });
        }

        try {
            await command.executeSlash(interaction, client, guildData);
        } catch (error) {
            console.error(`Error executing slash command ${command.name}:`, error);
            const replyMethod = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
            await interaction[replyMethod]({ 
                embeds: [errorEmbed('There was an error executing this command.')],
                ephemeral: true 
            });
        }
    }
};
