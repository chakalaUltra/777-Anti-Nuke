const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Ticket = require('../../models/Ticket');
const TicketConfig = require('../../models/TicketConfig');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    name: 'remove',
    description: 'Remove a user from the current ticket',
    aliases: [],
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a user from the current ticket')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to remove from the ticket')
                .setRequired(true)),
    
    async execute(message, args, client, guildData) {
        const ticket = await Ticket.findOne({ guildId: message.guild.id, channelId: message.channel.id, status: 'open' });
        if (!ticket) {
            return message.reply({ embeds: [errorEmbed('This command can only be used in a ticket channel.')] });
        }

        const ticketConfig = await TicketConfig.findOne({ guildId: message.guild.id });
        if (!ticketConfig) {
            return message.reply({ embeds: [errorEmbed('Ticket system is not configured.')] });
        }

        const isStaff = ticketConfig.supportRoles.some(roleId => message.member.roles.cache.has(roleId)) ||
                       message.member.permissions.has(PermissionFlagsBits.Administrator);
        
        if (!isStaff) {
            return message.reply({ embeds: [errorEmbed('Only support staff can remove users from tickets.')] });
        }

        const user = message.mentions.users.first() || await message.guild.members.fetch(args[0]).catch(() => null);
        if (!user) {
            return message.reply({ embeds: [errorEmbed('Please mention a valid user or provide their ID.')] });
        }

        const memberId = user.id || user.user?.id;
        
        if (memberId === ticket.openerId) {
            return message.reply({ embeds: [errorEmbed('You cannot remove the ticket creator from the ticket.')] });
        }

        await message.channel.permissionOverwrites.delete(memberId).catch(() => null);

        ticket.addedMembers = ticket.addedMembers.filter(id => id !== memberId);
        await ticket.save();

        await message.reply({ embeds: [successEmbed(`<@${memberId}> has been removed from this ticket.`)] });
    },

    async executeSlash(interaction, client, guildData) {
        const ticket = await Ticket.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id, status: 'open' });
        if (!ticket) {
            return interaction.reply({ embeds: [errorEmbed('This command can only be used in a ticket channel.')], ephemeral: true });
        }

        const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
        if (!ticketConfig) {
            return interaction.reply({ embeds: [errorEmbed('Ticket system is not configured.')], ephemeral: true });
        }

        const isStaff = ticketConfig.supportRoles.some(roleId => interaction.member.roles.cache.has(roleId)) ||
                       interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        
        if (!isStaff) {
            return interaction.reply({ embeds: [errorEmbed('Only support staff can remove users from tickets.')], ephemeral: true });
        }

        const member = interaction.options.getMember('user');
        if (!member) {
            return interaction.reply({ embeds: [errorEmbed('Could not find that user in this server.')], ephemeral: true });
        }

        if (member.id === ticket.openerId) {
            return interaction.reply({ embeds: [errorEmbed('You cannot remove the ticket creator from the ticket.')], ephemeral: true });
        }

        await interaction.channel.permissionOverwrites.delete(member.id).catch(() => null);

        ticket.addedMembers = ticket.addedMembers.filter(id => id !== member.id);
        await ticket.save();

        await interaction.reply({ embeds: [successEmbed(`${member} has been removed from this ticket.`)] });
    }
};
