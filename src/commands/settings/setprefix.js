const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const Guild = require('../../models/Guild');

module.exports = {
    name: 'setprefix',
    description: 'Change the bot prefix for this server',
    usage: '?setprefix <new_prefix>',
    aliases: ['prefix'],
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
    }
};
