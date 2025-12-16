const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const TicketConfig = require('../../models/TicketConfig');
const config = require('../../config');
const { successEmbed, errorEmbed, infoEmbed, createEmbed } = require('../../utils/embedBuilder');

const wizardSessions = new Map();

module.exports = {
    name: 'ticket-wizard',
    description: 'Setup the ticket system with a step-by-step wizard',
    data: new SlashCommandBuilder()
        .setName('ticket-wizard')
        .setDescription('Setup the ticket system with a step-by-step wizard')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async executeSlash(interaction, client, guildData) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ embeds: [errorEmbed('You need Administrator permission to use this command.')], ephemeral: true });
        }

        const sessionData = {
            step: 1,
            panelChannelId: null,
            panelTitle: 'Support Tickets',
            panelDescription: 'Click the button below to create a support ticket.',
            panelColor: '#5865F2',
            askQuestions: false,
            questions: [],
            ticketCategoryId: null,
            closedCategoryId: null,
            logChannelId: null,
            supportRoles: [],
            pingSupportOnCreate: true,
            welcomeMessage: 'Welcome to the ticket channel. Please be patient till the Support Team arrives!',
            dmTranscript: false
        };

        wizardSessions.set(`${interaction.guild.id}-${interaction.user.id}`, sessionData);

        const embed = createEmbed({
            title: `${config.emojis.configure_settings} Ticket System Setup - Step 1/10`,
            description: '**Select the channel where the ticket panel should be sent.**\n\nThis is where users will click to create a new ticket.',
            color: config.colors.info,
            footer: { text: 'Type "cancel" at any time to cancel the setup' }
        });

        const textChannels = interaction.guild.channels.cache
            .filter(c => c.type === ChannelType.GuildText)
            .first(25);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_wizard_panel_channel')
            .setPlaceholder('Select a channel for the ticket panel')
            .addOptions(textChannels.map(channel => ({
                label: `#${channel.name}`,
                value: channel.id,
                description: channel.topic ? channel.topic.substring(0, 50) : 'No topic'
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};

module.exports.wizardSessions = wizardSessions;
