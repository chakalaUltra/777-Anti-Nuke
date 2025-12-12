const mongoose = require('mongoose');

const muteSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, default: 'No reason provided' },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

muteSchema.index({ guildId: 1, oderId: 1 });
muteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Mute', muteSchema);
