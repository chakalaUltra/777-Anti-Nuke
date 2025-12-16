const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const TicketConfig = require('../models/TicketConfig');
const Ticket = require('../models/Ticket');
const config = require('../config');
const { createEmbed, successEmbed, errorEmbed } = require('./embedBuilder');

const wizardSessions = new Map();

async function handleTicketInteraction(interaction, client) {
    const customId = interaction.customId;

    if (customId.startsWith('ticket_wizard_')) {
        return handleWizardStep(interaction, client);
    }

    if (customId === 'ticket_create') {
        return handleTicketCreate(interaction, client);
    }

    if (customId === 'ticket_close') {
        return handleTicketClose(interaction, client);
    }

    if (customId === 'ticket_claim') {
        return handleTicketClaim(interaction, client);
    }

    if (customId === 'ticket_transcript') {
        return handleTicketTranscript(interaction, client);
    }

    if (customId === 'ticket_delete') {
        return handleTicketDelete(interaction, client);
    }

    if (customId === 'ticket_reopen') {
        return handleTicketReopen(interaction, client);
    }

    if (customId.startsWith('ticket_questions_modal')) {
        return;
    }
}

async function handleWizardStep(interaction, client) {
    const sessionKey = `${interaction.guild.id}-${interaction.user.id}`;
    let session = wizardSessions.get(sessionKey);

    if (!session) {
        session = {
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
        wizardSessions.set(sessionKey, session);
    }

    const customId = interaction.customId;

    if (customId === 'ticket_wizard_panel_channel') {
        session.panelChannelId = interaction.values[0];
        session.step = 2;
        wizardSessions.set(sessionKey, session);

        const embed = createEmbed({
            title: `${config.emojis.configure_settings} Ticket System Setup - Step 2/10`,
            description: '**Enter the panel title and description.**\n\nClick the button below to set the panel text.',
            color: config.colors.info
        });

        const button = new ButtonBuilder()
            .setCustomId('ticket_wizard_panel_text')
            .setLabel('Set Panel Text')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    else if (customId === 'ticket_wizard_panel_text') {
        const modal = new ModalBuilder()
            .setCustomId('ticket_wizard_panel_text_modal')
            .setTitle('Ticket Panel Text');

        const titleInput = new TextInputBuilder()
            .setCustomId('panel_title')
            .setLabel('Panel Title')
            .setStyle(TextInputStyle.Short)
            .setValue(session.panelTitle)
            .setRequired(true)
            .setMaxLength(256);

        const descInput = new TextInputBuilder()
            .setCustomId('panel_description')
            .setLabel('Panel Description')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(session.panelDescription)
            .setRequired(true)
            .setMaxLength(2000);

        const colorInput = new TextInputBuilder()
            .setCustomId('panel_color')
            .setLabel('Embed Color (hex, e.g. #5865F2)')
            .setStyle(TextInputStyle.Short)
            .setValue(session.panelColor)
            .setRequired(false)
            .setMaxLength(7);

        modal.addComponents(
            new ActionRowBuilder().addComponents(titleInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(colorInput)
        );

        await interaction.showModal(modal);
    }

    else if (customId === 'ticket_wizard_ask_questions_yes') {
        session.askQuestions = true;
        session.step = 4;
        wizardSessions.set(sessionKey, session);

        const embed = createEmbed({
            title: `${config.emojis.configure_settings} Ticket System Setup - Step 4/10`,
            description: '**Enter the questions to ask before creating a ticket.**\n\nClick the button below to set up to 5 questions.',
            color: config.colors.info
        });

        const button = new ButtonBuilder()
            .setCustomId('ticket_wizard_set_questions')
            .setLabel('Set Questions')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    else if (customId === 'ticket_wizard_ask_questions_no') {
        session.askQuestions = false;
        session.step = 5;
        wizardSessions.set(sessionKey, session);
        await showCategorySelect(interaction, session);
    }

    else if (customId === 'ticket_wizard_set_questions') {
        const modal = new ModalBuilder()
            .setCustomId('ticket_wizard_questions_modal')
            .setTitle('Ticket Questions');

        for (let i = 0; i < 5; i++) {
            const input = new TextInputBuilder()
                .setCustomId(`question_${i}`)
                .setLabel(`Question ${i + 1}${i === 0 ? ' (required)' : ' (optional)'}`)
                .setStyle(TextInputStyle.Short)
                .setRequired(i === 0)
                .setMaxLength(100);
            
            modal.addComponents(new ActionRowBuilder().addComponents(input));
        }

        await interaction.showModal(modal);
    }

    else if (customId === 'ticket_wizard_ticket_category') {
        session.ticketCategoryId = interaction.values[0];
        session.step = 6;
        wizardSessions.set(sessionKey, session);

        const categories = interaction.guild.channels.cache
            .filter(c => c.type === ChannelType.GuildCategory)
            .first(25);

        const embed = createEmbed({
            title: `${config.emojis.configure_settings} Ticket System Setup - Step 6/10`,
            description: '**Select the category for closed tickets.**\n\nClosed tickets will be moved here.',
            color: config.colors.info
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_wizard_closed_category')
            .setPlaceholder('Select a category for closed tickets')
            .addOptions(categories.map(cat => ({
                label: cat.name,
                value: cat.id
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    else if (customId === 'ticket_wizard_closed_category') {
        session.closedCategoryId = interaction.values[0];
        session.step = 7;
        wizardSessions.set(sessionKey, session);

        const textChannels = interaction.guild.channels.cache
            .filter(c => c.type === ChannelType.GuildText)
            .first(25);

        const embed = createEmbed({
            title: `${config.emojis.configure_settings} Ticket System Setup - Step 7/10`,
            description: '**Select the channel for ticket logs.**\n\nAll ticket events will be logged here.',
            color: config.colors.info
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_wizard_log_channel')
            .setPlaceholder('Select a log channel')
            .addOptions(textChannels.map(channel => ({
                label: `#${channel.name}`,
                value: channel.id
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    else if (customId === 'ticket_wizard_log_channel') {
        session.logChannelId = interaction.values[0];
        session.step = 8;
        wizardSessions.set(sessionKey, session);

        const roles = interaction.guild.roles.cache
            .filter(r => !r.managed && r.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .first(25);

        const embed = createEmbed({
            title: `${config.emojis.configure_settings} Ticket System Setup - Step 8/10`,
            description: '**Select the support team roles.**\n\nThese roles will have access to all tickets.',
            color: config.colors.info
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('ticket_wizard_support_roles')
            .setPlaceholder('Select support roles')
            .setMinValues(1)
            .setMaxValues(Math.min(roles.size, 10))
            .addOptions(roles.map(role => ({
                label: role.name,
                value: role.id
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.update({ embeds: [embed], components: [row] });
    }

    else if (customId === 'ticket_wizard_support_roles') {
        session.supportRoles = interaction.values;
        session.step = 9;
        wizardSessions.set(sessionKey, session);

        const embed = createEmbed({
            title: `${config.emojis.configure_settings} Ticket System Setup - Step 9/10`,
            description: '**Configure additional options.**',
            color: config.colors.info
        });

        const pingButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_ping_toggle')
            .setLabel(`Ping Support: ${session.pingSupportOnCreate ? 'ON' : 'OFF'}`)
            .setStyle(session.pingSupportOnCreate ? ButtonStyle.Success : ButtonStyle.Secondary);

        const dmButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_dm_toggle')
            .setLabel(`DM Transcript: ${session.dmTranscript ? 'ON' : 'OFF'}`)
            .setStyle(session.dmTranscript ? ButtonStyle.Success : ButtonStyle.Secondary);

        const welcomeButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_welcome_msg')
            .setLabel('Set Welcome Message')
            .setStyle(ButtonStyle.Primary);

        const continueButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_continue')
            .setLabel('Continue')
            .setStyle(ButtonStyle.Success);

        const row1 = new ActionRowBuilder().addComponents(pingButton, dmButton);
        const row2 = new ActionRowBuilder().addComponents(welcomeButton, continueButton);

        await interaction.update({ embeds: [embed], components: [row1, row2] });
    }

    else if (customId === 'ticket_wizard_ping_toggle') {
        session.pingSupportOnCreate = !session.pingSupportOnCreate;
        wizardSessions.set(sessionKey, session);

        const embed = createEmbed({
            title: `${config.emojis.configure_settings} Ticket System Setup - Step 9/10`,
            description: '**Configure additional options.**',
            color: config.colors.info
        });

        const pingButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_ping_toggle')
            .setLabel(`Ping Support: ${session.pingSupportOnCreate ? 'ON' : 'OFF'}`)
            .setStyle(session.pingSupportOnCreate ? ButtonStyle.Success : ButtonStyle.Secondary);

        const dmButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_dm_toggle')
            .setLabel(`DM Transcript: ${session.dmTranscript ? 'ON' : 'OFF'}`)
            .setStyle(session.dmTranscript ? ButtonStyle.Success : ButtonStyle.Secondary);

        const welcomeButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_welcome_msg')
            .setLabel('Set Welcome Message')
            .setStyle(ButtonStyle.Primary);

        const continueButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_continue')
            .setLabel('Continue')
            .setStyle(ButtonStyle.Success);

        const row1 = new ActionRowBuilder().addComponents(pingButton, dmButton);
        const row2 = new ActionRowBuilder().addComponents(welcomeButton, continueButton);

        await interaction.update({ embeds: [embed], components: [row1, row2] });
    }

    else if (customId === 'ticket_wizard_dm_toggle') {
        session.dmTranscript = !session.dmTranscript;
        wizardSessions.set(sessionKey, session);

        const embed = createEmbed({
            title: `${config.emojis.configure_settings} Ticket System Setup - Step 9/10`,
            description: '**Configure additional options.**',
            color: config.colors.info
        });

        const pingButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_ping_toggle')
            .setLabel(`Ping Support: ${session.pingSupportOnCreate ? 'ON' : 'OFF'}`)
            .setStyle(session.pingSupportOnCreate ? ButtonStyle.Success : ButtonStyle.Secondary);

        const dmButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_dm_toggle')
            .setLabel(`DM Transcript: ${session.dmTranscript ? 'ON' : 'OFF'}`)
            .setStyle(session.dmTranscript ? ButtonStyle.Success : ButtonStyle.Secondary);

        const welcomeButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_welcome_msg')
            .setLabel('Set Welcome Message')
            .setStyle(ButtonStyle.Primary);

        const continueButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_continue')
            .setLabel('Continue')
            .setStyle(ButtonStyle.Success);

        const row1 = new ActionRowBuilder().addComponents(pingButton, dmButton);
        const row2 = new ActionRowBuilder().addComponents(welcomeButton, continueButton);

        await interaction.update({ embeds: [embed], components: [row1, row2] });
    }

    else if (customId === 'ticket_wizard_welcome_msg') {
        const modal = new ModalBuilder()
            .setCustomId('ticket_wizard_welcome_modal')
            .setTitle('Welcome Message');

        const input = new TextInputBuilder()
            .setCustomId('welcome_message')
            .setLabel('Welcome message for new tickets')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(session.welcomeMessage)
            .setRequired(true)
            .setMaxLength(1000);

        modal.addComponents(new ActionRowBuilder().addComponents(input));

        await interaction.showModal(modal);
    }

    else if (customId === 'ticket_wizard_continue') {
        session.step = 10;
        wizardSessions.set(sessionKey, session);
        await showConfirmation(interaction, session);
    }

    else if (customId === 'ticket_wizard_confirm') {
        await saveTicketConfig(interaction, session);
        wizardSessions.delete(sessionKey);
    }

    else if (customId === 'ticket_wizard_cancel') {
        wizardSessions.delete(sessionKey);
        await interaction.update({
            embeds: [errorEmbed('Ticket system setup cancelled.')],
            components: []
        });
    }
}

async function handleModalSubmit(interaction, client) {
    const customId = interaction.customId;
    const sessionKey = `${interaction.guild.id}-${interaction.user.id}`;
    let session = wizardSessions.get(sessionKey);

    if (!session) {
        return interaction.reply({ embeds: [errorEmbed('Session expired. Please run /ticket-wizard again.')], ephemeral: true });
    }

    if (customId === 'ticket_wizard_panel_text_modal') {
        session.panelTitle = interaction.fields.getTextInputValue('panel_title');
        session.panelDescription = interaction.fields.getTextInputValue('panel_description');
        const colorInput = interaction.fields.getTextInputValue('panel_color');
        if (colorInput && /^#[0-9A-Fa-f]{6}$/.test(colorInput)) {
            session.panelColor = colorInput;
        }
        session.step = 3;
        wizardSessions.set(sessionKey, session);

        const embed = createEmbed({
            title: `${config.emojis.configure_settings} Ticket System Setup - Step 3/10`,
            description: '**Should users answer questions before creating a ticket?**',
            color: config.colors.info
        });

        const yesButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_ask_questions_yes')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success);

        const noButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_ask_questions_no')
            .setLabel('No')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(yesButton, noButton);

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    else if (customId === 'ticket_wizard_questions_modal') {
        const questions = [];
        for (let i = 0; i < 5; i++) {
            const question = interaction.fields.getTextInputValue(`question_${i}`);
            if (question && question.trim()) {
                questions.push(question.trim());
            }
        }
        session.questions = questions;
        session.step = 5;
        wizardSessions.set(sessionKey, session);
        await showCategorySelect(interaction, session);
    }

    else if (customId === 'ticket_wizard_welcome_modal') {
        session.welcomeMessage = interaction.fields.getTextInputValue('welcome_message');
        wizardSessions.set(sessionKey, session);

        const embed = createEmbed({
            title: `${config.emojis.configure_settings} Ticket System Setup - Step 9/10`,
            description: `**Configure additional options.**\n\nWelcome message updated!`,
            color: config.colors.info
        });

        const pingButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_ping_toggle')
            .setLabel(`Ping Support: ${session.pingSupportOnCreate ? 'ON' : 'OFF'}`)
            .setStyle(session.pingSupportOnCreate ? ButtonStyle.Success : ButtonStyle.Secondary);

        const dmButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_dm_toggle')
            .setLabel(`DM Transcript: ${session.dmTranscript ? 'ON' : 'OFF'}`)
            .setStyle(session.dmTranscript ? ButtonStyle.Success : ButtonStyle.Secondary);

        const welcomeButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_welcome_msg')
            .setLabel('Set Welcome Message')
            .setStyle(ButtonStyle.Primary);

        const continueButton = new ButtonBuilder()
            .setCustomId('ticket_wizard_continue')
            .setLabel('Continue')
            .setStyle(ButtonStyle.Success);

        const row1 = new ActionRowBuilder().addComponents(pingButton, dmButton);
        const row2 = new ActionRowBuilder().addComponents(welcomeButton, continueButton);

        await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
    }

    else if (customId === 'ticket_questions_modal') {
        await createTicketChannel(interaction, client);
    }
}

async function showCategorySelect(interaction, session) {
    const categories = interaction.guild.channels.cache
        .filter(c => c.type === ChannelType.GuildCategory)
        .first(25);

    if (categories.size === 0) {
        const embed = createEmbed({
            title: `${config.emojis.x_} No Categories Found`,
            description: 'Please create at least one category for tickets before running this wizard.',
            color: config.colors.error
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = createEmbed({
        title: `${config.emojis.configure_settings} Ticket System Setup - Step 5/10`,
        description: '**Select the category for new ticket channels.**\n\nNew tickets will be created in this category.',
        color: config.colors.info
    });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_wizard_ticket_category')
        .setPlaceholder('Select a category for tickets')
        .addOptions(categories.map(cat => ({
            label: cat.name,
            value: cat.id
        })));

    const row = new ActionRowBuilder().addComponents(selectMenu);

    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
    } else if (interaction.isModalSubmit()) {
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    } else {
        await interaction.update({ embeds: [embed], components: [row] });
    }
}

async function showConfirmation(interaction, session) {
    const panelChannel = interaction.guild.channels.cache.get(session.panelChannelId);
    const ticketCategory = interaction.guild.channels.cache.get(session.ticketCategoryId);
    const closedCategory = interaction.guild.channels.cache.get(session.closedCategoryId);
    const logChannel = interaction.guild.channels.cache.get(session.logChannelId);
    const supportRoleNames = session.supportRoles.map(id => {
        const role = interaction.guild.roles.cache.get(id);
        return role ? role.name : 'Unknown';
    }).join(', ');

    const embed = createEmbed({
        title: `${config.emojis.configure_settings} Ticket System Setup - Confirmation`,
        description: '**Please review your settings:**',
        color: config.colors.info,
        fields: [
            { name: 'Panel Channel', value: panelChannel ? `#${panelChannel.name}` : 'Unknown', inline: true },
            { name: 'Panel Title', value: session.panelTitle, inline: true },
            { name: 'Embed Color', value: session.panelColor, inline: true },
            { name: 'Ask Questions', value: session.askQuestions ? 'Yes' : 'No', inline: true },
            { name: 'Questions', value: session.questions.length > 0 ? session.questions.join('\n') : 'None', inline: false },
            { name: 'Ticket Category', value: ticketCategory ? ticketCategory.name : 'Unknown', inline: true },
            { name: 'Closed Category', value: closedCategory ? closedCategory.name : 'Unknown', inline: true },
            { name: 'Log Channel', value: logChannel ? `#${logChannel.name}` : 'Unknown', inline: true },
            { name: 'Support Roles', value: supportRoleNames || 'None', inline: false },
            { name: 'Ping on Create', value: session.pingSupportOnCreate ? 'Yes' : 'No', inline: true },
            { name: 'DM Transcript', value: session.dmTranscript ? 'Yes' : 'No', inline: true }
        ]
    });

    const confirmButton = new ButtonBuilder()
        .setCustomId('ticket_wizard_confirm')
        .setLabel('Confirm & Create Panel')
        .setStyle(ButtonStyle.Success);

    const cancelButton = new ButtonBuilder()
        .setCustomId('ticket_wizard_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    await interaction.update({ embeds: [embed], components: [row] });
}

async function saveTicketConfig(interaction, session) {
    try {
        let ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
        
        if (ticketConfig) {
            Object.assign(ticketConfig, {
                panelChannelId: session.panelChannelId,
                panelTitle: session.panelTitle,
                panelDescription: session.panelDescription,
                panelColor: session.panelColor,
                askQuestions: session.askQuestions,
                questions: session.questions,
                ticketCategoryId: session.ticketCategoryId,
                closedCategoryId: session.closedCategoryId,
                logChannelId: session.logChannelId,
                supportRoles: session.supportRoles,
                pingSupportOnCreate: session.pingSupportOnCreate,
                welcomeMessage: session.welcomeMessage,
                dmTranscript: session.dmTranscript
            });
        } else {
            ticketConfig = new TicketConfig({
                guildId: interaction.guild.id,
                ...session
            });
        }

        const panelChannel = interaction.guild.channels.cache.get(session.panelChannelId);
        if (!panelChannel) {
            return interaction.update({
                embeds: [errorEmbed('Panel channel not found. Please try again.')],
                components: []
            });
        }

        const panelEmbed = new EmbedBuilder()
            .setTitle(session.panelTitle)
            .setDescription(session.panelDescription)
            .setColor(session.panelColor)
            .setFooter({ text: 'Click the button below to create a ticket' });

        const createButton = new ButtonBuilder()
            .setCustomId('ticket_create')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫');

        const row = new ActionRowBuilder().addComponents(createButton);

        const panelMessage = await panelChannel.send({ embeds: [panelEmbed], components: [row] });
        ticketConfig.panelMessageId = panelMessage.id;

        await ticketConfig.save();

        await interaction.update({
            embeds: [successEmbed(`Ticket system has been configured successfully!\n\nPanel sent to <#${session.panelChannelId}>`)],
            components: []
        });

    } catch (error) {
        console.error('Error saving ticket config:', error);
        await interaction.update({
            embeds: [errorEmbed('An error occurred while saving the configuration.')],
            components: []
        });
    }
}

async function handleTicketCreate(interaction, client) {
    const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
    
    if (!ticketConfig) {
        return interaction.reply({ embeds: [errorEmbed('Ticket system is not configured.')], ephemeral: true });
    }

    const existingTicket = await Ticket.findOne({
        guildId: interaction.guild.id,
        openerId: interaction.user.id,
        status: 'open'
    });

    if (existingTicket) {
        const channel = interaction.guild.channels.cache.get(existingTicket.channelId);
        if (channel) {
            return interaction.reply({ 
                embeds: [errorEmbed(`You already have an open ticket: <#${channel.id}>`)], 
                ephemeral: true 
            });
        }
    }

    if (ticketConfig.askQuestions && ticketConfig.questions.length > 0) {
        const modal = new ModalBuilder()
            .setCustomId('ticket_questions_modal')
            .setTitle('Ticket Information');

        ticketConfig.questions.slice(0, 5).forEach((question, index) => {
            const input = new TextInputBuilder()
                .setCustomId(`answer_${index}`)
                .setLabel(question.substring(0, 45))
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMaxLength(1000);

            modal.addComponents(new ActionRowBuilder().addComponents(input));
        });

        await interaction.showModal(modal);
    } else {
        await interaction.deferReply({ ephemeral: true });
        await createTicketChannel(interaction, client);
    }
}

async function createTicketChannel(interaction, client) {
    const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
    
    if (!ticketConfig) {
        const replyMethod = interaction.deferred ? 'editReply' : 'reply';
        return interaction[replyMethod]({ embeds: [errorEmbed('Ticket system is not configured.')], ephemeral: true });
    }

    ticketConfig.ticketCounter += 1;
    const ticketNumber = ticketConfig.ticketCounter;

    const answers = [];
    if (interaction.isModalSubmit() && ticketConfig.askQuestions) {
        ticketConfig.questions.forEach((question, index) => {
            const answer = interaction.fields.getTextInputValue(`answer_${index}`);
            if (answer) {
                answers.push({ question, answer });
            }
        });
    }

    const category = interaction.guild.channels.cache.get(ticketConfig.ticketCategoryId);
    if (!category) {
        const replyMethod = interaction.deferred ? 'editReply' : 'reply';
        return interaction[replyMethod]({ embeds: [errorEmbed('Ticket category not found. Please reconfigure the ticket system.')], ephemeral: true });
    }

    const permissionOverwrites = [
        {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
        },
        {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles]
        },
        {
            id: client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages]
        }
    ];

    ticketConfig.supportRoles.forEach(roleId => {
        permissionOverwrites.push({
            id: roleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles]
        });
    });

    try {
        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${ticketNumber}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites
        });

        const ticket = new Ticket({
            guildId: interaction.guild.id,
            ticketNumber,
            channelId: ticketChannel.id,
            openerId: interaction.user.id,
            openerTag: interaction.user.tag,
            answers
        });
        await ticket.save();
        await ticketConfig.save();

        let welcomeDescription = ticketConfig.welcomeMessage;
        if (answers.length > 0) {
            welcomeDescription += '\n\n**Submitted Information:**\n';
            answers.forEach(a => {
                welcomeDescription += `\n**${a.question}**\n${a.answer}\n`;
            });
        }

        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`Ticket #${ticketNumber}`)
            .setDescription(welcomeDescription)
            .setColor(ticketConfig.panelColor)
            .addFields(
                { name: 'Created By', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Status', value: '🟢 Open', inline: true }
            )
            .setTimestamp();

        const closeButton = new ButtonBuilder()
            .setCustomId('ticket_close')
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒');

        const claimButton = new ButtonBuilder()
            .setCustomId('ticket_claim')
            .setLabel('Claim')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✋');

        const row = new ActionRowBuilder().addComponents(closeButton, claimButton);

        let content = '';
        if (ticketConfig.pingSupportOnCreate) {
            content = ticketConfig.supportRoles.map(id => `<@&${id}>`).join(' ');
        }

        await ticketChannel.send({ content: content || undefined, embeds: [welcomeEmbed], components: [row] });

        if (ticketConfig.logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(ticketConfig.logChannelId);
            if (logChannel) {
                const logEmbed = createEmbed({
                    title: `${config.emojis.document_approved} Ticket Created`,
                    color: config.colors.success,
                    fields: [
                        { name: 'Ticket', value: `#${ticketNumber}`, inline: true },
                        { name: 'Channel', value: `<#${ticketChannel.id}>`, inline: true },
                        { name: 'Created By', value: `<@${interaction.user.id}>`, inline: true }
                    ],
                    timestamp: true
                });
                await logChannel.send({ embeds: [logEmbed] });
            }
        }

        const replyMethod = interaction.deferred ? 'editReply' : 'reply';
        await interaction[replyMethod]({ 
            embeds: [successEmbed(`Your ticket has been created: <#${ticketChannel.id}>`)], 
            ephemeral: true 
        });

    } catch (error) {
        console.error('Error creating ticket channel:', error);
        const replyMethod = interaction.deferred ? 'editReply' : 'reply';
        await interaction[replyMethod]({ 
            embeds: [errorEmbed('An error occurred while creating your ticket.')], 
            ephemeral: true 
        });
    }
}

async function handleTicketClose(interaction, client) {
    const ticket = await Ticket.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id });
    
    if (!ticket) {
        return interaction.reply({ embeds: [errorEmbed('This is not a valid ticket channel.')], ephemeral: true });
    }

    if (ticket.status === 'closed') {
        return interaction.reply({ embeds: [errorEmbed('This ticket is already closed.')], ephemeral: true });
    }

    const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
    if (!ticketConfig) {
        return interaction.reply({ embeds: [errorEmbed('Ticket system is not configured.')], ephemeral: true });
    }

    const isStaff = ticketConfig.supportRoles.some(roleId => interaction.member.roles.cache.has(roleId)) ||
                   interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (!isStaff && interaction.user.id !== ticket.openerId) {
        return interaction.reply({ embeds: [errorEmbed('You do not have permission to close this ticket.')], ephemeral: true });
    }

    await interaction.deferUpdate();

    ticket.status = 'closed';
    ticket.closedBy = interaction.user.id;
    ticket.closedByTag = interaction.user.tag;
    ticket.closedAt = new Date();
    await ticket.save();

    await interaction.channel.permissionOverwrites.edit(ticket.openerId, {
        ViewChannel: false
    });

    if (ticketConfig.closedCategoryId) {
        const closedCategory = interaction.guild.channels.cache.get(ticketConfig.closedCategoryId);
        if (closedCategory) {
            await interaction.channel.setParent(closedCategory.id, { lockPermissions: false });
        }
    }

    await interaction.channel.setName(`closed-${ticket.ticketNumber}`);

    const closedEmbed = new EmbedBuilder()
        .setTitle('Ticket Closed')
        .setDescription(`This ticket has been closed by <@${interaction.user.id}>`)
        .setColor('#ff0000')
        .addFields(
            { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Claimed By', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Not claimed', inline: true }
        )
        .setTimestamp();

    const transcriptButton = new ButtonBuilder()
        .setCustomId('ticket_transcript')
        .setLabel('Transcript')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝');

    const deleteButton = new ButtonBuilder()
        .setCustomId('ticket_delete')
        .setLabel('Delete')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️');

    const reopenButton = new ButtonBuilder()
        .setCustomId('ticket_reopen')
        .setLabel('Re-Open')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🔓');

    const row = new ActionRowBuilder().addComponents(transcriptButton, deleteButton, reopenButton);

    await interaction.channel.send({ embeds: [closedEmbed], components: [row] });

    if (ticketConfig.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(ticketConfig.logChannelId);
        if (logChannel) {
            const logEmbed = createEmbed({
                title: `${config.emojis.x_} Ticket Closed`,
                color: config.colors.error,
                fields: [
                    { name: 'Ticket', value: `#${ticket.ticketNumber}`, inline: true },
                    { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Claimed By', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Not claimed', inline: true },
                    { name: 'Opened By', value: `<@${ticket.openerId}>`, inline: true }
                ],
                timestamp: true
            });
            await logChannel.send({ embeds: [logEmbed] });
        }
    }
}

async function handleTicketClaim(interaction, client) {
    const ticket = await Ticket.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id });
    
    if (!ticket) {
        return interaction.reply({ embeds: [errorEmbed('This is not a valid ticket channel.')], ephemeral: true });
    }

    const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
    if (!ticketConfig) {
        return interaction.reply({ embeds: [errorEmbed('Ticket system is not configured.')], ephemeral: true });
    }

    const isStaff = ticketConfig.supportRoles.some(roleId => interaction.member.roles.cache.has(roleId)) ||
                   interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (!isStaff) {
        return interaction.reply({ embeds: [errorEmbed('Only support staff can claim tickets.')], ephemeral: true });
    }

    if (ticket.claimedBy) {
        return interaction.reply({ embeds: [errorEmbed(`This ticket is already claimed by <@${ticket.claimedBy}>`)], ephemeral: true });
    }

    ticket.claimedBy = interaction.user.id;
    ticket.claimedByTag = interaction.user.tag;
    ticket.claimedAt = new Date();
    await ticket.save();

    await interaction.reply({ embeds: [successEmbed(`This ticket has been claimed by <@${interaction.user.id}>`)] });

    if (ticketConfig.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(ticketConfig.logChannelId);
        if (logChannel) {
            const logEmbed = createEmbed({
                title: `${config.emojis.user_member} Ticket Claimed`,
                color: config.colors.info,
                fields: [
                    { name: 'Ticket', value: `#${ticket.ticketNumber}`, inline: true },
                    { name: 'Claimed By', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Opened By', value: `<@${ticket.openerId}>`, inline: true }
                ],
                timestamp: true
            });
            await logChannel.send({ embeds: [logEmbed] });
        }
    }
}

async function handleTicketTranscript(interaction, client) {
    const ticket = await Ticket.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id });
    
    if (!ticket) {
        return interaction.reply({ embeds: [errorEmbed('This is not a valid ticket channel.')], ephemeral: true });
    }

    const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
    if (!ticketConfig) {
        return interaction.reply({ embeds: [errorEmbed('Ticket system is not configured.')], ephemeral: true });
    }

    const isStaff = ticketConfig.supportRoles.some(roleId => interaction.member.roles.cache.has(roleId)) ||
                   interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (!isStaff) {
        return interaction.reply({ embeds: [errorEmbed('Only support staff can generate transcripts.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
        const discordTranscripts = require('discord-html-transcripts');
        
        const transcript = await discordTranscripts.createTranscript(interaction.channel, {
            limit: -1,
            filename: `ticket-${ticket.ticketNumber}-transcript.html`,
            saveImages: true,
            poweredBy: false
        });

        if (ticketConfig.logChannelId) {
            const logChannel = interaction.guild.channels.cache.get(ticketConfig.logChannelId);
            if (logChannel) {
                const transcriptEmbed = createEmbed({
                    title: `${config.emojis.document_approved} Ticket Transcript`,
                    color: config.colors.info,
                    fields: [
                        { name: 'Ticket', value: `#${ticket.ticketNumber}`, inline: true },
                        { name: 'Created By', value: `<@${ticket.openerId}>`, inline: true },
                        { name: 'Claimed By', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Not claimed', inline: true },
                        { name: 'Generated By', value: `<@${interaction.user.id}>`, inline: true }
                    ],
                    timestamp: true
                });

                await logChannel.send({ embeds: [transcriptEmbed], files: [transcript] });
            }
        }

        if (ticketConfig.dmTranscript) {
            try {
                const opener = await client.users.fetch(ticket.openerId);
                const dmEmbed = createEmbed({
                    title: `Ticket #${ticket.ticketNumber} Transcript`,
                    description: `Here is the transcript for your closed ticket in **${interaction.guild.name}**`,
                    color: config.colors.info,
                    timestamp: true
                });
                await opener.send({ embeds: [dmEmbed], files: [transcript] });
            } catch (dmError) {
                console.log('Could not DM transcript to user:', dmError.message);
            }
        }

        await interaction.editReply({ embeds: [successEmbed('Transcript has been generated and sent to the log channel.')] });

    } catch (error) {
        console.error('Error generating transcript:', error);
        await interaction.editReply({ embeds: [errorEmbed('An error occurred while generating the transcript.')] });
    }
}

async function handleTicketDelete(interaction, client) {
    const ticket = await Ticket.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id });
    
    if (!ticket) {
        return interaction.reply({ embeds: [errorEmbed('This is not a valid ticket channel.')], ephemeral: true });
    }

    const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
    if (!ticketConfig) {
        return interaction.reply({ embeds: [errorEmbed('Ticket system is not configured.')], ephemeral: true });
    }

    const isStaff = ticketConfig.supportRoles.some(roleId => interaction.member.roles.cache.has(roleId)) ||
                   interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (!isStaff) {
        return interaction.reply({ embeds: [errorEmbed('Only support staff can delete tickets.')], ephemeral: true });
    }

    await interaction.reply({ embeds: [infoEmbed('This ticket will be deleted in 5 seconds...')] });

    ticket.status = 'deleted';
    ticket.deletedBy = interaction.user.id;
    ticket.deletedByTag = interaction.user.tag;
    ticket.deletedAt = new Date();
    await ticket.save();

    if (ticketConfig.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(ticketConfig.logChannelId);
        if (logChannel) {
            try {
                const discordTranscripts = require('discord-html-transcripts');
                const transcript = await discordTranscripts.createTranscript(interaction.channel, {
                    limit: -1,
                    filename: `ticket-${ticket.ticketNumber}-transcript.html`,
                    saveImages: true,
                    poweredBy: false
                });

                const logEmbed = createEmbed({
                    title: `${config.emojis.x_} Ticket Deleted`,
                    color: config.colors.error,
                    fields: [
                        { name: 'Ticket', value: `#${ticket.ticketNumber}`, inline: true },
                        { name: 'Opened By', value: `<@${ticket.openerId}>`, inline: true },
                        { name: 'Claimed By', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Not claimed', inline: true },
                        { name: 'Deleted By', value: `<@${interaction.user.id}>`, inline: true }
                    ],
                    timestamp: true
                });

                await logChannel.send({ embeds: [logEmbed], files: [transcript] });

                if (ticketConfig.dmTranscript) {
                    try {
                        const opener = await client.users.fetch(ticket.openerId);
                        const dmEmbed = createEmbed({
                            title: `Ticket #${ticket.ticketNumber} Deleted`,
                            description: `Your ticket in **${interaction.guild.name}** has been deleted. Here is the transcript.`,
                            color: config.colors.info,
                            timestamp: true
                        });
                        await opener.send({ embeds: [dmEmbed], files: [transcript] });
                    } catch (dmError) {
                        console.log('Could not DM transcript to user:', dmError.message);
                    }
                }
            } catch (transcriptError) {
                console.log('Could not generate transcript:', transcriptError.message);
                const logEmbed = createEmbed({
                    title: `${config.emojis.x_} Ticket Deleted`,
                    color: config.colors.error,
                    fields: [
                        { name: 'Ticket', value: `#${ticket.ticketNumber}`, inline: true },
                        { name: 'Opened By', value: `<@${ticket.openerId}>`, inline: true },
                        { name: 'Claimed By', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Not claimed', inline: true },
                        { name: 'Deleted By', value: `<@${interaction.user.id}>`, inline: true }
                    ],
                    timestamp: true
                });
                await logChannel.send({ embeds: [logEmbed] });
            }
        }
    }

    setTimeout(async () => {
        try {
            await interaction.channel.delete();
        } catch (error) {
            console.error('Error deleting ticket channel:', error);
        }
    }, 5000);
}

async function handleTicketReopen(interaction, client) {
    const ticket = await Ticket.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id });
    
    if (!ticket) {
        return interaction.reply({ embeds: [errorEmbed('This is not a valid ticket channel.')], ephemeral: true });
    }

    if (ticket.status === 'open') {
        return interaction.reply({ embeds: [errorEmbed('This ticket is already open.')], ephemeral: true });
    }

    const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
    if (!ticketConfig) {
        return interaction.reply({ embeds: [errorEmbed('Ticket system is not configured.')], ephemeral: true });
    }

    const isStaff = ticketConfig.supportRoles.some(roleId => interaction.member.roles.cache.has(roleId)) ||
                   interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    
    if (!isStaff) {
        return interaction.reply({ embeds: [errorEmbed('Only support staff can re-open tickets.')], ephemeral: true });
    }

    ticket.status = 'open';
    ticket.closedBy = null;
    ticket.closedByTag = null;
    ticket.closedAt = null;
    await ticket.save();

    await interaction.channel.permissionOverwrites.edit(ticket.openerId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
    });

    if (ticketConfig.ticketCategoryId) {
        const ticketCategory = interaction.guild.channels.cache.get(ticketConfig.ticketCategoryId);
        if (ticketCategory) {
            await interaction.channel.setParent(ticketCategory.id, { lockPermissions: false });
        }
    }

    await interaction.channel.setName(`ticket-${ticket.ticketNumber}`);

    await interaction.reply({ embeds: [successEmbed(`This ticket has been re-opened by <@${interaction.user.id}>`)] });

    if (ticketConfig.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(ticketConfig.logChannelId);
        if (logChannel) {
            const logEmbed = createEmbed({
                title: `${config.emojis.approved} Ticket Re-Opened`,
                color: config.colors.success,
                fields: [
                    { name: 'Ticket', value: `#${ticket.ticketNumber}`, inline: true },
                    { name: 'Re-Opened By', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Opened By', value: `<@${ticket.openerId}>`, inline: true }
                ],
                timestamp: true
            });
            await logChannel.send({ embeds: [logEmbed] });
        }
    }
}

module.exports = {
    handleTicketInteraction,
    handleModalSubmit,
    wizardSessions
};
