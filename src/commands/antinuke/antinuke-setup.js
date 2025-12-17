const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { createEmbed, successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');
const config = require('../../config');

module.exports = {
    name: 'antinuke-setup',
    description: 'Interactive setup wizard for anti-nuke protection',
    usage: '?antinuke-setup',
    aliases: ['an-setup', 'ansetup'],
    data: new SlashCommandBuilder()
        .setName('antinuke-setup')
        .setDescription('Interactive setup wizard for anti-nuke protection'),

    async execute(message, args, client, guildData) {
        await this.runSetup(message, message.author, client, guildData);
    },

    async executeSlash(interaction, client, guildData) {
        await this.runSetup(interaction, interaction.user, client, guildData);
    },

    async runSetup(context, user, client, guildData) {
        const isInteraction = context.isChatInputCommand?.();
        const reply = isInteraction 
            ? (opts) => context.reply(opts)
            : (opts) => context.reply(opts);
        const editReply = isInteraction
            ? (opts) => context.editReply(opts)
            : null;

        const mainEmbed = createEmbed({
            title: `${config.emojis.configure_settings} Anti-Nuke Setup Wizard`,
            description: 'Configure your anti-nuke protection settings. Use the menu below to select what you want to configure.',
            color: config.colors.info,
            fields: [
                { 
                    name: `${config.emojis.turned_on} Status`, 
                    value: guildData.antiNuke.enabled ? 'Enabled' : 'Disabled', 
                    inline: true 
                },
                { 
                    name: `${config.emojis.info} Punishment`, 
                    value: guildData.antiNuke.punishmentType || 'ban', 
                    inline: true 
                },
                { 
                    name: `${config.emojis.notification} Log Channel`, 
                    value: guildData.antiNuke.logChannelId ? `<#${guildData.antiNuke.logChannelId}>` : 'Not set', 
                    inline: true 
                }
            ],
            timestamp: true
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('antinuke_setup_menu')
            .setPlaceholder('Select a setting to configure...')
            .addOptions([
                {
                    label: 'Toggle Anti-Nuke',
                    description: 'Enable or disable anti-nuke protection',
                    value: 'toggle',
                    emoji: guildData.antiNuke.enabled ? '🟢' : '🔴'
                },
                {
                    label: 'Set Punishment',
                    description: 'Choose punishment for detected threats',
                    value: 'punishment',
                    emoji: '⚡'
                },
                {
                    label: 'Set Log Channel',
                    description: 'Set the channel for anti-nuke logs',
                    value: 'logchannel',
                    emoji: '📝'
                },
                {
                    label: 'Protection Settings',
                    description: 'Configure individual protection modules',
                    value: 'protections',
                    emoji: '🛡️'
                },
                {
                    label: 'Thresholds',
                    description: 'Set action limits before punishment',
                    value: 'thresholds',
                    emoji: '📊'
                }
            ]);

        const closeButton = new ButtonBuilder()
            .setCustomId('antinuke_setup_close')
            .setLabel('Close')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        const buttonRow = new ActionRowBuilder().addComponents(closeButton);

        const response = await reply({ embeds: [mainEmbed], components: [row, buttonRow], fetchReply: true });
        
        const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === user.id,
            time: 300000
        });

        collector.on('collect', async (i) => {
            try {
                if (i.customId === 'antinuke_setup_close') {
                    await i.update({ 
                        embeds: [createEmbed({
                            title: `${config.emojis.approved} Setup Complete`,
                            description: 'Anti-nuke setup wizard closed.',
                            color: config.colors.success
                        })], 
                        components: [] 
                    });
                    collector.stop();
                    return;
                }

                if (i.customId === 'antinuke_setup_menu') {
                    const value = i.values[0];
                    
                    if (value === 'toggle') {
                        await this.handleToggle(i, guildData);
                    } else if (value === 'punishment') {
                        await this.handlePunishment(i, guildData);
                    } else if (value === 'logchannel') {
                        await this.handleLogChannel(i, guildData);
                    } else if (value === 'protections') {
                        await this.handleProtections(i, guildData);
                    } else if (value === 'thresholds') {
                        await this.handleThresholds(i, guildData);
                    }
                } else if (i.customId === 'antinuke_toggle_on') {
                    await Guild.updateOne({ guildId: i.guild.id }, { 'antiNuke.enabled': true });
                    guildData.antiNuke.enabled = true;
                    await i.update({ embeds: [successEmbed('Anti-nuke protection has been **enabled**.')], components: [] });
                    setTimeout(() => this.refreshMainMenu(response, guildData, user), 1500);
                } else if (i.customId === 'antinuke_toggle_off') {
                    await Guild.updateOne({ guildId: i.guild.id }, { 'antiNuke.enabled': false });
                    guildData.antiNuke.enabled = false;
                    await i.update({ embeds: [successEmbed('Anti-nuke protection has been **disabled**.')], components: [] });
                    setTimeout(() => this.refreshMainMenu(response, guildData, user), 1500);
                } else if (i.customId.startsWith('antinuke_punishment_')) {
                    const punishment = i.customId.replace('antinuke_punishment_', '');
                    await Guild.updateOne({ guildId: i.guild.id }, { 'antiNuke.punishmentType': punishment });
                    guildData.antiNuke.punishmentType = punishment;
                    await i.update({ embeds: [successEmbed(`Punishment set to **${punishment}**.`)], components: [] });
                    setTimeout(() => this.refreshMainMenu(response, guildData, user), 1500);
                } else if (i.customId === 'antinuke_logchannel_select') {
                    const channelId = i.values[0];
                    await Guild.updateOne({ guildId: i.guild.id }, { 'antiNuke.logChannelId': channelId });
                    guildData.antiNuke.logChannelId = channelId;
                    await i.update({ embeds: [successEmbed(`Log channel set to <#${channelId}>.`)], components: [] });
                    setTimeout(() => this.refreshMainMenu(response, guildData, user), 1500);
                } else if (i.customId === 'antinuke_back') {
                    await this.refreshMainMenu(response, guildData, user, i);
                } else if (i.customId.startsWith('antinuke_protection_')) {
                    await this.handleProtectionToggle(i, guildData);
                } else if (i.customId.startsWith('antinuke_threshold_')) {
                    await this.handleThresholdSet(i, guildData);
                }
            } catch (error) {
                console.error('Anti-nuke setup error:', error);
            }
        });

        collector.on('end', () => {
            response.edit({ components: [] }).catch(() => {});
        });
    },

    async handleToggle(interaction, guildData) {
        const toggleEmbed = createEmbed({
            title: `${config.emojis.configure_settings} Toggle Anti-Nuke`,
            description: `Current status: ${guildData.antiNuke.enabled ? '**Enabled**' : '**Disabled**'}\n\nChoose an option below:`,
            color: config.colors.info
        });

        const enableBtn = new ButtonBuilder()
            .setCustomId('antinuke_toggle_on')
            .setLabel('Enable')
            .setStyle(ButtonStyle.Success)
            .setDisabled(guildData.antiNuke.enabled);

        const disableBtn = new ButtonBuilder()
            .setCustomId('antinuke_toggle_off')
            .setLabel('Disable')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!guildData.antiNuke.enabled);

        const backBtn = new ButtonBuilder()
            .setCustomId('antinuke_back')
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(enableBtn, disableBtn, backBtn);
        await interaction.update({ embeds: [toggleEmbed], components: [row] });
    },

    async handlePunishment(interaction, guildData) {
        const punishmentEmbed = createEmbed({
            title: `${config.emojis.configure_settings} Set Punishment`,
            description: `Current punishment: **${guildData.antiNuke.punishmentType || 'ban'}**\n\nChoose punishment for detected threats:`,
            color: config.colors.info,
            fields: [
                { name: '🔨 Ban', value: 'Permanently ban the user', inline: true },
                { name: '👢 Kick', value: 'Kick the user from server', inline: true },
                { name: '🔇 Timeout', value: 'Timeout for 28 days', inline: true },
                { name: '📋 Strip Roles', value: 'Remove all roles from user', inline: true }
            ]
        });

        const banBtn = new ButtonBuilder()
            .setCustomId('antinuke_punishment_ban')
            .setLabel('Ban')
            .setStyle(ButtonStyle.Danger);

        const kickBtn = new ButtonBuilder()
            .setCustomId('antinuke_punishment_kick')
            .setLabel('Kick')
            .setStyle(ButtonStyle.Primary);

        const timeoutBtn = new ButtonBuilder()
            .setCustomId('antinuke_punishment_timeout')
            .setLabel('Timeout')
            .setStyle(ButtonStyle.Primary);

        const stripBtn = new ButtonBuilder()
            .setCustomId('antinuke_punishment_strip')
            .setLabel('Strip Roles')
            .setStyle(ButtonStyle.Secondary);

        const backBtn = new ButtonBuilder()
            .setCustomId('antinuke_back')
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary);

        const row1 = new ActionRowBuilder().addComponents(banBtn, kickBtn, timeoutBtn, stripBtn);
        const row2 = new ActionRowBuilder().addComponents(backBtn);
        await interaction.update({ embeds: [punishmentEmbed], components: [row1, row2] });
    },

    async handleLogChannel(interaction, guildData) {
        const logEmbed = createEmbed({
            title: `${config.emojis.configure_settings} Set Log Channel`,
            description: `Current log channel: ${guildData.antiNuke.logChannelId ? `<#${guildData.antiNuke.logChannelId}>` : 'Not set'}\n\nSelect a channel below:`,
            color: config.colors.info
        });

        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('antinuke_logchannel_select')
            .setPlaceholder('Select a channel...')
            .setChannelTypes(ChannelType.GuildText);

        const backBtn = new ButtonBuilder()
            .setCustomId('antinuke_back')
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary);

        const row1 = new ActionRowBuilder().addComponents(channelSelect);
        const row2 = new ActionRowBuilder().addComponents(backBtn);
        await interaction.update({ embeds: [logEmbed], components: [row1, row2] });
    },

    async handleProtections(interaction, guildData) {
        const protections = guildData.antiNuke.protections || {
            antiBan: true,
            antiKick: true,
            antiRoleCreate: true,
            antiRoleDelete: true,
            antiChannelCreate: true,
            antiChannelDelete: true,
            antiWebhook: true,
            antiBot: true
        };

        const protectionEmbed = createEmbed({
            title: `${config.emojis.configure_settings} Protection Settings`,
            description: 'Enable or disable individual protection modules:',
            color: config.colors.info,
            fields: [
                { name: '🔨 Anti-Ban', value: protections.antiBan !== false ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '👢 Anti-Kick', value: protections.antiKick !== false ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '🎭 Anti-Role Create', value: protections.antiRoleCreate !== false ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '🎭 Anti-Role Delete', value: protections.antiRoleDelete !== false ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '📁 Anti-Channel Create', value: protections.antiChannelCreate !== false ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '📁 Anti-Channel Delete', value: protections.antiChannelDelete !== false ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '🔗 Anti-Webhook', value: protections.antiWebhook !== false ? '✅ Enabled' : '❌ Disabled', inline: true },
                { name: '🤖 Anti-Bot', value: protections.antiBot !== false ? '✅ Enabled' : '❌ Disabled', inline: true }
            ]
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('antinuke_protection_toggle')
            .setPlaceholder('Select a protection to toggle...')
            .addOptions([
                { label: 'Anti-Ban', value: 'antiBan', emoji: '🔨' },
                { label: 'Anti-Kick', value: 'antiKick', emoji: '👢' },
                { label: 'Anti-Role Create', value: 'antiRoleCreate', emoji: '🎭' },
                { label: 'Anti-Role Delete', value: 'antiRoleDelete', emoji: '🎭' },
                { label: 'Anti-Channel Create', value: 'antiChannelCreate', emoji: '📁' },
                { label: 'Anti-Channel Delete', value: 'antiChannelDelete', emoji: '📁' },
                { label: 'Anti-Webhook', value: 'antiWebhook', emoji: '🔗' },
                { label: 'Anti-Bot', value: 'antiBot', emoji: '🤖' }
            ]);

        const backBtn = new ButtonBuilder()
            .setCustomId('antinuke_back')
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary);

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(backBtn);
        await interaction.update({ embeds: [protectionEmbed], components: [row1, row2] });
    },

    async handleThresholds(interaction, guildData) {
        const thresholds = guildData.antiNuke.thresholds || {
            bans: 3,
            kicks: 3,
            roles: 3,
            channels: 3
        };

        const thresholdEmbed = createEmbed({
            title: `${config.emojis.configure_settings} Action Thresholds`,
            description: 'Set how many actions trigger punishment (within 10 seconds):',
            color: config.colors.info,
            fields: [
                { name: '🔨 Ban Threshold', value: `${thresholds.bans || 3} bans`, inline: true },
                { name: '👢 Kick Threshold', value: `${thresholds.kicks || 3} kicks`, inline: true },
                { name: '🎭 Role Threshold', value: `${thresholds.roles || 3} role changes`, inline: true },
                { name: '📁 Channel Threshold', value: `${thresholds.channels || 3} channel changes`, inline: true }
            ]
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('antinuke_threshold_select')
            .setPlaceholder('Select a threshold to modify...')
            .addOptions([
                { label: 'Ban Threshold', value: 'bans', emoji: '🔨' },
                { label: 'Kick Threshold', value: 'kicks', emoji: '👢' },
                { label: 'Role Threshold', value: 'roles', emoji: '🎭' },
                { label: 'Channel Threshold', value: 'channels', emoji: '📁' }
            ]);

        const backBtn = new ButtonBuilder()
            .setCustomId('antinuke_back')
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary);

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(backBtn);
        await interaction.update({ embeds: [thresholdEmbed], components: [row1, row2] });
    },

    async handleProtectionToggle(interaction, guildData) {
        if (interaction.customId === 'antinuke_protection_toggle') {
            const protection = interaction.values[0];
            const currentProtections = guildData.antiNuke.protections || {};
            const currentValue = currentProtections[protection] !== false;
            const newValue = !currentValue;

            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { [`antiNuke.protections.${protection}`]: newValue }
            );

            if (!guildData.antiNuke.protections) guildData.antiNuke.protections = {};
            guildData.antiNuke.protections[protection] = newValue;

            await interaction.update({ 
                embeds: [successEmbed(`${protection} has been ${newValue ? '**enabled**' : '**disabled**'}.`)], 
                components: [] 
            });
        }
    },

    async handleThresholdSet(interaction, guildData) {
        if (interaction.customId === 'antinuke_threshold_select') {
            const thresholdType = interaction.values[0];
            
            const thresholdEmbed = createEmbed({
                title: `${config.emojis.configure_settings} Set ${thresholdType} Threshold`,
                description: 'Select the number of actions before punishment:',
                color: config.colors.info
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`antinuke_threshold_set_${thresholdType}`)
                .setPlaceholder('Select threshold value...')
                .addOptions([
                    { label: '1 action', value: '1' },
                    { label: '2 actions', value: '2' },
                    { label: '3 actions', value: '3' },
                    { label: '5 actions', value: '5' },
                    { label: '10 actions', value: '10' }
                ]);

            const backBtn = new ButtonBuilder()
                .setCustomId('antinuke_back')
                .setLabel('Back')
                .setStyle(ButtonStyle.Secondary);

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(backBtn);
            await interaction.update({ embeds: [thresholdEmbed], components: [row1, row2] });
        } else if (interaction.customId.startsWith('antinuke_threshold_set_')) {
            const thresholdType = interaction.customId.replace('antinuke_threshold_set_', '');
            const value = parseInt(interaction.values[0]);

            await Guild.updateOne(
                { guildId: interaction.guild.id },
                { [`antiNuke.thresholds.${thresholdType}`]: value }
            );

            if (!guildData.antiNuke.thresholds) guildData.antiNuke.thresholds = {};
            guildData.antiNuke.thresholds[thresholdType] = value;

            await interaction.update({ 
                embeds: [successEmbed(`${thresholdType} threshold set to **${value}** actions.`)], 
                components: [] 
            });
        }
    },

    async refreshMainMenu(response, guildData, user, interaction = null) {
        const mainEmbed = createEmbed({
            title: `${config.emojis.configure_settings} Anti-Nuke Setup Wizard`,
            description: 'Configure your anti-nuke protection settings. Use the menu below to select what you want to configure.',
            color: config.colors.info,
            fields: [
                { 
                    name: `${config.emojis.turned_on} Status`, 
                    value: guildData.antiNuke.enabled ? 'Enabled' : 'Disabled', 
                    inline: true 
                },
                { 
                    name: `${config.emojis.info} Punishment`, 
                    value: guildData.antiNuke.punishmentType || 'ban', 
                    inline: true 
                },
                { 
                    name: `${config.emojis.notification} Log Channel`, 
                    value: guildData.antiNuke.logChannelId ? `<#${guildData.antiNuke.logChannelId}>` : 'Not set', 
                    inline: true 
                }
            ],
            timestamp: true
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('antinuke_setup_menu')
            .setPlaceholder('Select a setting to configure...')
            .addOptions([
                {
                    label: 'Toggle Anti-Nuke',
                    description: 'Enable or disable anti-nuke protection',
                    value: 'toggle',
                    emoji: guildData.antiNuke.enabled ? '🟢' : '🔴'
                },
                {
                    label: 'Set Punishment',
                    description: 'Choose punishment for detected threats',
                    value: 'punishment',
                    emoji: '⚡'
                },
                {
                    label: 'Set Log Channel',
                    description: 'Set the channel for anti-nuke logs',
                    value: 'logchannel',
                    emoji: '📝'
                },
                {
                    label: 'Protection Settings',
                    description: 'Configure individual protection modules',
                    value: 'protections',
                    emoji: '🛡️'
                },
                {
                    label: 'Thresholds',
                    description: 'Set action limits before punishment',
                    value: 'thresholds',
                    emoji: '📊'
                }
            ]);

        const closeButton = new ButtonBuilder()
            .setCustomId('antinuke_setup_close')
            .setLabel('Close')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(selectMenu);
        const buttonRow = new ActionRowBuilder().addComponents(closeButton);

        if (interaction) {
            await interaction.update({ embeds: [mainEmbed], components: [row, buttonRow] });
        } else {
            await response.edit({ embeds: [mainEmbed], components: [row, buttonRow] }).catch(() => {});
        }
    }
};
