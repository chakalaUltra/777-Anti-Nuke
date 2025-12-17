const mongoose = require('mongoose');

const categoryWhitelistSchema = {
    users: [{ type: String }],
    roles: [{ type: String }]
};

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
        logChannelId: { type: String, default: null },
        protections: {
            antiBan: { type: Boolean, default: true },
            antiKick: { type: Boolean, default: true },
            antiRoleCreate: { type: Boolean, default: true },
            antiRoleDelete: { type: Boolean, default: true },
            antiChannelCreate: { type: Boolean, default: true },
            antiChannelDelete: { type: Boolean, default: true },
            antiWebhook: { type: Boolean, default: true },
            antiBot: { type: Boolean, default: true }
        },
        thresholds: {
            bans: { type: Number, default: 3 },
            kicks: { type: Number, default: 3 },
            roles: { type: Number, default: 3 },
            channels: { type: Number, default: 3 }
        },
        categoryWhitelist: {
            bans: categoryWhitelistSchema,
            kicks: categoryWhitelistSchema,
            roles: categoryWhitelistSchema,
            channels: categoryWhitelistSchema,
            webhooks: categoryWhitelistSchema,
            emojis: categoryWhitelistSchema,
            all: categoryWhitelistSchema
        },
        categoryBlacklist: {
            bans: categoryWhitelistSchema,
            kicks: categoryWhitelistSchema,
            roles: categoryWhitelistSchema,
            channels: categoryWhitelistSchema,
            webhooks: categoryWhitelistSchema,
            emojis: categoryWhitelistSchema,
            all: categoryWhitelistSchema
        }
    },
    
    autoMod: {
        enabled: { type: Boolean, default: false },
        blockedWords: [{
            word: String,
            action: { type: String, enum: ['warn', 'mute', 'kick', 'ban'], default: 'warn' },
            muteDuration: { type: String, default: '10m' }
        }],
        whitelistedUsers: [{ type: String }],
        whitelistedRoles: [{ type: String }],
        logChannelId: { type: String, default: null }
    },
    
    blacklistRoleId: { type: String, default: null },
    
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
    
    mutedRoleId: { type: String, default: null },
    
    logChannels: {
        message: { type: String, default: null },
        member: { type: String, default: null },
        moderation: { type: String, default: null },
        antinuke: { type: String, default: null },
        server: { type: String, default: null }
    }
}, { timestamps: true });

module.exports = mongoose.model('Guild', guildSchema);
