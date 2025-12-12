const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../utils/embedBuilder');
const config = require('../../config');

module.exports = {
    name: 'serverinfo',
    description: 'Get information about the server',
    usage: '?serverinfo',
    aliases: ['si', 'server', 'guildinfo'],
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get information about the server'),

    async execute(message, args, client, guildData) {
        const guild = message.guild;
        
        await guild.members.fetch();
        
        const owner = await guild.fetchOwner();
        const totalMembers = guild.memberCount;
        const humans = guild.members.cache.filter(m => !m.user.bot).size;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const online = guild.members.cache.filter(m => m.presence?.status === 'online').size;
        
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories = guild.channels.cache.filter(c => c.type === 4).size;
        
        const roles = guild.roles.cache.size - 1;
        const emojis = guild.emojis.cache.size;
        
        const verificationLevels = {
            0: 'None',
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Very High'
        };
        
        const embed = createEmbed({
            title: `${config.emojis.info} Server Info: ${guild.name}`,
            color: config.colors.info,
            timestamp: true,
            thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
            fields: [
                { name: 'Server ID', value: guild.id, inline: true },
                { name: 'Owner', value: `${owner.user.tag}`, inline: true },
                { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: `Members [${totalMembers}]`, value: `${config.emojis.user_member} Humans: ${humans}\nBots: ${bots}\nOnline: ${online}`, inline: true },
                { name: `Channels [${textChannels + voiceChannels}]`, value: `Text: ${textChannels}\nVoice: ${voiceChannels}\nCategories: ${categories}`, inline: true },
                { name: 'Other', value: `Roles: ${roles}\nEmojis: ${emojis}\nBoosts: ${guild.premiumSubscriptionCount || 0}`, inline: true },
                { name: 'Verification Level', value: verificationLevels[guild.verificationLevel], inline: true },
                { name: 'Boost Level', value: `Level ${guild.premiumTier}`, inline: true }
            ],
            footer: { text: `Requested by ${message.author.tag}` }
        });
        
        return message.reply({ embeds: [embed] });
    },

    async executeSlash(interaction, client, guildData) {
        await interaction.deferReply();
        
        const guild = interaction.guild;
        
        await guild.members.fetch();
        
        const owner = await guild.fetchOwner();
        const totalMembers = guild.memberCount;
        const humans = guild.members.cache.filter(m => !m.user.bot).size;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const online = guild.members.cache.filter(m => m.presence?.status === 'online').size;
        
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories = guild.channels.cache.filter(c => c.type === 4).size;
        
        const roles = guild.roles.cache.size - 1;
        const emojis = guild.emojis.cache.size;
        
        const verificationLevels = {
            0: 'None',
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Very High'
        };
        
        const embed = createEmbed({
            title: `${config.emojis.info} Server Info: ${guild.name}`,
            color: config.colors.info,
            timestamp: true,
            thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
            fields: [
                { name: 'Server ID', value: guild.id, inline: true },
                { name: 'Owner', value: `${owner.user.tag}`, inline: true },
                { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: `Members [${totalMembers}]`, value: `${config.emojis.user_member} Humans: ${humans}\nBots: ${bots}\nOnline: ${online}`, inline: true },
                { name: `Channels [${textChannels + voiceChannels}]`, value: `Text: ${textChannels}\nVoice: ${voiceChannels}\nCategories: ${categories}`, inline: true },
                { name: 'Other', value: `Roles: ${roles}\nEmojis: ${emojis}\nBoosts: ${guild.premiumSubscriptionCount || 0}`, inline: true },
                { name: 'Verification Level', value: verificationLevels[guild.verificationLevel], inline: true },
                { name: 'Boost Level', value: `Level ${guild.premiumTier}`, inline: true }
            ],
            footer: { text: `Requested by ${interaction.user.tag}` }
        });
        
        return interaction.editReply({ embeds: [embed] });
    }
};
