const { EmbedBuilder } = require('discord.js');
const config = require('../config');

function createEmbed(options) {
    const embed = new EmbedBuilder();
    
    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.color) embed.setColor(options.color);
    if (options.fields) embed.addFields(options.fields);
    if (options.footer) embed.setFooter(options.footer);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.timestamp) embed.setTimestamp();
    
    return embed;
}

function successEmbed(description, title = null) {
    return createEmbed({
        title: title ? `${config.emojis.approved} ${title}` : null,
        description: `${config.emojis.approved} ${description}`,
        color: config.colors.success
    });
}

function errorEmbed(description, title = null) {
    return createEmbed({
        title: title ? `${config.emojis.x_} ${title}` : null,
        description: `${config.emojis.x_} ${description}`,
        color: config.colors.error
    });
}

function warningEmbed(description, title = null) {
    return createEmbed({
        title: title ? `${config.emojis.alarm} ${title}` : null,
        description: `${config.emojis.alarm} ${description}`,
        color: config.colors.warning
    });
}

function infoEmbed(description, title = null) {
    return createEmbed({
        title: title ? `${config.emojis.info} ${title}` : null,
        description: `${config.emojis.info} ${description}`,
        color: config.colors.info
    });
}

function modEmbed(options) {
    return createEmbed({
        ...options,
        color: config.colors.mod
    });
}

function antiNukeEmbed(options) {
    return createEmbed({
        ...options,
        color: config.colors.antinuke
    });
}

module.exports = {
    createEmbed,
    successEmbed,
    errorEmbed,
    warningEmbed,
    infoEmbed,
    modEmbed,
    antiNukeEmbed
};
