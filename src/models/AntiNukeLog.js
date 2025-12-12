const mongoose = require('mongoose');

const antiNukeLogSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    eventType: { type: String, required: true },
    action: { type: String, required: true },
    count: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now, expires: 60 }
});

antiNukeLogSchema.index({ guildId: 1, oderId: 1, eventType: 1 });

module.exports = mongoose.model('AntiNukeLog', antiNukeLogSchema);
