const { errorEmbed, successEmbed, modEmbed } = require('../../utils/embedBuilder');
const { isAboveTarget } = require('../../utils/permissions');
const Guild = require('../../models/Guild');
const Mute = require('../../models/Mute');
const config = require('../../config');
const ms = require('ms');

module.exports = {
    name: 'mute',
    description: 'Mute a member',
    usage: '?mute <user> [duration] [reason]',
    aliases: ['m', 'timeout'],
    async execute(message, args, client, guildData) {
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!target) {
            return message.reply({ embeds: [errorEmbed('Please mention a user or provide a valid user ID.')] });
        }
        
        if (!isAboveTarget(message.member, target)) {
            return message.reply({ embeds: [errorEmbed('You cannot mute this user as they have a higher or equal role.')] });
        }
        
        const durationStr = args[1] || '10m';
        const duration = ms(durationStr);
        
        if (!duration || duration < 1000 || duration > 2419200000) {
            return message.reply({ embeds: [errorEmbed('Please provide a valid duration (e.g., 10m, 1h, 1d). Max: 28 days.')] });
        }
        
        const reason = args.slice(2).join(' ') || 'No reason provided';
        
        try {
            let mutedRole = message.guild.roles.cache.get(guildData.mutedRoleId);
            
            if (!mutedRole) {
                mutedRole = await message.guild.roles.create({
                    name: 'Muted',
                    color: '#808080',
                    permissions: [],
                    reason: 'Created muted role for moderation'
                });
                
                await Guild.updateOne(
                    { guildId: message.guild.id },
                    { mutedRoleId: mutedRole.id }
                );
                
                for (const channel of message.guild.channels.cache.values()) {
                    try {
                        await channel.permissionOverwrites.create(mutedRole, {
                            SendMessages: false,
                            AddReactions: false,
                            Speak: false
                        });
                    } catch (e) {}
                }
            }
            
            await target.roles.add(mutedRole, `${reason} | Muted by ${message.author.tag}`);
            
            const expiresAt = new Date(Date.now() + duration);
            await Mute.findOneAndUpdate(
                { guildId: message.guild.id, oderId: target.id },
                {
                    guildId: message.guild.id,
                    oderId: target.id,
                    moderatorId: message.author.id,
                    reason,
                    expiresAt
                },
                { upsert: true }
            );
            
            const dmEmbed = modEmbed({
                title: `${config.emojis.alarm} You have been muted`,
                description: `**Server:** ${message.guild.name}\n**Duration:** ${durationStr}\n**Reason:** ${reason}\n**Moderator:** ${message.author.tag}`
            });
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            const embed = successEmbed(`${target.user.tag} has been muted for ${durationStr}.\n**Reason:** ${reason}`);
            await message.reply({ embeds: [embed] });
            
            setTimeout(async () => {
                try {
                    const member = await message.guild.members.fetch(target.id);
                    if (member.roles.cache.has(mutedRole.id)) {
                        await member.roles.remove(mutedRole, 'Mute expired');
                    }
                    await Mute.deleteOne({ guildId: message.guild.id, oderId: target.id });
                } catch (e) {}
            }, duration);
            
            if (guildData.logs.moderation) {
                const logChannel = message.guild.channels.cache.get(guildData.logs.moderation);
                if (logChannel) {
                    const logEmbed = modEmbed({
                        title: `${config.emojis.alarm} Member Muted`,
                        description: `**User:** ${target.user.tag} (${target.id})\n**Moderator:** ${message.author.tag}\n**Duration:** ${durationStr}\n**Reason:** ${reason}`,
                        footer: { text: `User ID: ${target.id}` }
                    });
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Error muting user:', error);
            return message.reply({ embeds: [errorEmbed('An error occurred while muting the user.')] });
        }
    }
};
