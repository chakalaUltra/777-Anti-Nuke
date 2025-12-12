const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    prefix: { type: String, default: '?' },
    
    antiNuke: {
        enabled: { type: Boolean, default: false },
        whitelistedUsers: [{ type: String }],
        whitelistedBots: [{ type: String }],
        blacklistedUsers: [{ type: String }],
        blacklistedBots: [{ type: String }],
        punishmentType: { type: String, default: 'ban' },
        logChannelId: { type: String, default: null }
    },
    
    autoMod: {
        enabled: { type: Boolean, default: false },
        blockedWords: [{
            word: String,
            action: { type: String, enum: ['warn', 'mute', 'kick', 'ban'], default: 'warn' },
            muteDuration: { type: String, default: '10m' }
        }],
        logChannelId: { type: String, default: null }
    },
    
    logs: {
        moderation: { type: String, default: null },
        deletedMessages: { type: String, default: null },
        editedMessages: { type: String, default: null },
        antiNuke: { type: String, default: null },
        autoMod: { type: String, default: null }
    },
    
    rolePermissions: [{
        roleId: String,
        commands: [String]
    }],
    
    mutedRoleId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Guild', guildSchema);
